import logging
from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.schemas import ProductCreate, ProductUpdate, StockAdjustment
from app.services.email_service import send_low_stock_alert

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)


# =====================================================
# ANALYTICS ENDPOINTS
# =====================================================

@router.get("/analytics/overview")
def overview(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """High-level dashboard numbers: today, this week, this month."""
    result = db.execute(
        text(
            """
            SELECT
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS orders_today,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS revenue_today,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS orders_week,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) AS revenue_week,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS orders_month,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) AS revenue_month,
                COUNT(*) AS orders_all_time,
                COALESCE(SUM(total_amount), 0) AS revenue_all_time
            FROM orders
            WHERE status != 'cancelled'
            """
        )
    ).mappings().first()

    customer_count = db.execute(
        text("SELECT COUNT(*) FROM users WHERE role = 'customer'")
    ).scalar_one()

    product_count = db.execute(
        text("SELECT COUNT(*) FROM products WHERE is_active = true")
    ).scalar_one()

    return {
        "orders": {
            "today": result["orders_today"],
            "this_week": result["orders_week"],
            "this_month": result["orders_month"],
            "all_time": result["orders_all_time"],
        },
        "revenue": {
            "today": float(result["revenue_today"]),
            "this_week": float(result["revenue_week"]),
            "this_month": float(result["revenue_month"]),
            "all_time": float(result["revenue_all_time"]),
        },
        "customer_count": customer_count,
        "active_products": product_count,
    }


@router.get("/analytics/top-products")
def top_products(
    limit: int = Query(default=10, ge=1, le=50),
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Best-selling products by revenue and quantity."""
    result = db.execute(
        text(
            """
            SELECT
                p.id, p.name, p.sku,
                SUM(oi.quantity) AS units_sold,
                SUM(oi.quantity * oi.price_at_purchase) AS total_revenue,
                COUNT(DISTINCT o.id) AS order_count
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= CURRENT_DATE - make_interval(days => :days)
              AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.sku
            ORDER BY total_revenue DESC
            LIMIT :limit
            """
        ),
        {"days": days, "limit": limit},
    )
    products = []
    for row in result.mappings():
        d = dict(row)
        d["total_revenue"] = float(d["total_revenue"])
        products.append(d)

    return {"window_days": days, "count": len(products), "products": products}


@router.get("/analytics/sales-by-category")
def sales_by_category(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Revenue and units sold per category."""
    result = db.execute(
        text(
            """
            SELECT
                COALESCE(c.name, 'Uncategorized') AS category_name,
                COALESCE(c.slug, 'uncategorized') AS category_slug,
                SUM(oi.quantity) AS units_sold,
                SUM(oi.quantity * oi.price_at_purchase) AS revenue,
                COUNT(DISTINCT o.id) AS order_count
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= CURRENT_DATE - make_interval(days => :days)
              AND o.status != 'cancelled'
            GROUP BY c.id, c.name, c.slug
            ORDER BY revenue DESC
            """
        ),
        {"days": days},
    )
    categories = []
    for row in result.mappings():
        d = dict(row)
        d["revenue"] = float(d["revenue"])
        categories.append(d)

    return {"window_days": days, "categories": categories}


@router.get("/analytics/sales-trend")
def sales_trend(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Daily revenue for the past N days."""
    result = db.execute(
        text(
            """
            SELECT
                DATE(created_at) AS day,
                COUNT(*) AS order_count,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            WHERE created_at >= CURRENT_DATE - make_interval(days => :days)
              AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY day ASC
            """
        ),
        {"days": days},
    )
    trend = []
    for row in result.mappings():
        d = dict(row)
        d["day"] = d["day"].isoformat()
        d["revenue"] = float(d["revenue"])
        trend.append(d)

    return {"window_days": days, "data": trend}


@router.get("/analytics/low-stock")
def low_stock(
    threshold: int = Query(default=5, ge=0),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Products at or below the stock threshold."""
    result = db.execute(
        text(
            """
            SELECT id, name, sku, stock_quantity, price
            FROM products
            WHERE is_active = true AND stock_quantity <= :threshold
            ORDER BY stock_quantity ASC, name ASC
            """
        ),
        {"threshold": threshold},
    )
    items = []
    for row in result.mappings():
        d = dict(row)
        d["price"] = float(d["price"])
        items.append(d)

    return {"threshold": threshold, "count": len(items), "items": items}


@router.get("/analytics/inventory-movement")
def inventory_movement(
    days: int = Query(default=7, ge=1, le=365),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Recent inventory log entries."""
    result = db.execute(
        text(
            """
            SELECT
                il.id, il.change_type, il.quantity_change, il.new_quantity,
                il.notes, il.created_at,
                p.name AS product_name, p.sku
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            WHERE il.created_at >= CURRENT_DATE - make_interval(days => :days)
            ORDER BY il.created_at DESC
            LIMIT 200
            """
        ),
        {"days": days},
    )
    movements = []
    for row in result.mappings():
        d = dict(row)
        d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
        movements.append(d)

    return {"window_days": days, "count": len(movements), "movements": movements}


# =====================================================
# PRODUCT MANAGEMENT
# =====================================================

@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Create a new product."""
    result = db.execute(
        text(
            """
            INSERT INTO products
                (name, description, price, discount_price, category_id, sku,
                 stock_quantity, sizes, colors, images, is_active)
            VALUES
                (:name, :desc, :price, :dprice, :cat, :sku,
                 :stock, :sizes, :colors, :images, true)
            RETURNING id, name, price, stock_quantity, sku
            """
        ),
        {
            "name": payload.name, "desc": payload.description,
            "price": payload.price, "dprice": payload.discount_price,
            "cat": payload.category_id, "sku": payload.sku,
            "stock": payload.stock_quantity, "sizes": payload.sizes,
            "colors": payload.colors, "images": payload.images,
        },
    )
    new_product = result.mappings().first()

    if payload.stock_quantity > 0:
        db.execute(
            text(
                """
                INSERT INTO inventory_logs
                    (product_id, change_type, quantity_change, new_quantity, notes, created_by)
                VALUES (:pid, 'restock', :delta, :new_qty, 'Initial stock on product creation', :uid)
                """
            ),
            {
                "pid": new_product["id"], "delta": payload.stock_quantity,
                "new_qty": payload.stock_quantity, "uid": admin["id"],
            },
        )

    db.commit()
    product_dict = dict(new_product)
    product_dict["price"] = float(product_dict["price"])
    return {"message": "Product created", "product": product_dict}


@router.put("/products/{product_id}")
def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Update product fields."""
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_parts = []
    params = {"pid": str(product_id)}
    for key, val in update_data.items():
        set_parts.append(f"{key} = :{key}")
        params[key] = val
    set_parts.append("updated_at = NOW()")

    sql = f"UPDATE products SET {', '.join(set_parts)} WHERE id = :pid RETURNING id, name, price, stock_quantity"
    result = db.execute(text(sql), params)
    updated = result.mappings().first()
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")

    db.commit()
    d = dict(updated)
    d["price"] = float(d["price"])
    return {"message": "Product updated", "product": d}


@router.post("/products/{product_id}/adjust-stock")
def adjust_stock(
    product_id: UUID,
    payload: StockAdjustment,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """Manually adjust stock. Logs the change."""
    product = db.execute(
        text("SELECT id, name, stock_quantity FROM products WHERE id = :pid"),
        {"pid": str(product_id)},
    ).mappings().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_quantity = product["stock_quantity"] + payload.quantity_change
    if new_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce below zero. Current stock: {product['stock_quantity']}",
        )

    db.execute(
        text("UPDATE products SET stock_quantity = :s WHERE id = :pid"),
        {"s": new_quantity, "pid": str(product_id)},
    )

    change_type = "restock" if payload.quantity_change > 0 else "adjustment"
    db.execute(
        text(
            """
            INSERT INTO inventory_logs
                (product_id, change_type, quantity_change, new_quantity, notes, created_by)
            VALUES (:pid, :ctype, :delta, :new_qty, :notes, :uid)
            """
        ),
        {
            "pid": str(product_id), "ctype": change_type,
            "delta": payload.quantity_change, "new_qty": new_quantity,
            "notes": payload.notes or "Manual stock adjustment", "uid": admin["id"],
        },
    )
    db.commit()

    if new_quantity <= 5 and new_quantity > 0:
        try:
            send_low_stock_alert(
                admin_email=admin["email"],
                product_name=product["name"],
                current_stock=new_quantity,
            )
        except Exception:
            logger.exception("Low stock alert failed (non-fatal)")

    return {
        "message": "Stock adjusted",
        "product_name": product["name"],
        "previous_quantity": product["stock_quantity"],
        "new_quantity": new_quantity,
        "change": payload.quantity_change,
    }