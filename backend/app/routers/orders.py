import logging
import secrets
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.schemas import OrderCreate
from app.services.email_service import send_order_confirmation

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger(__name__)


def _generate_order_number() -> str:
    """Generate human-readable order number like ORD-2026-A4F2B6."""
    year = datetime.now().year
    suffix = secrets.token_hex(3).upper()
    return f"ORD-{year}-{suffix}"


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Place an order from the user's current cart."""
    user_id = current_user["id"]

    try:
        # 1. Lock cart items + product rows
        cart_rows = db.execute(
            text(
                """
                SELECT
                    ci.id AS cart_item_id, ci.quantity, ci.size, ci.color,
                    p.id AS product_id, p.name, p.price, p.discount_price,
                    p.stock_quantity
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = :uid
                FOR UPDATE OF p
                """
            ),
            {"uid": user_id},
        ).mappings().all()

        if not cart_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # 2. Validate stock
        for row in cart_rows:
            if row["stock_quantity"] < row["quantity"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Not enough stock for '{row['name']}': "
                        f"requested {row['quantity']}, only {row['stock_quantity']} available"
                    ),
                )

        # 3. Calculate totals
        items_for_email = []
        total_amount = 0
        order_lines = []
        for row in cart_rows:
            unit_price = float(row["discount_price"] or row["price"])
            line_total = unit_price * row["quantity"]
            total_amount += line_total
            order_lines.append({
                "product_id": row["product_id"],
                "quantity": row["quantity"],
                "price_at_purchase": unit_price,
                "size": row["size"],
                "color": row["color"],
                "name": row["name"],
                "stock_before": row["stock_quantity"],
            })
            items_for_email.append({
                "name": row["name"],
                "quantity": row["quantity"],
                "line_total": line_total,
            })

        # 4. Create order
        order_number = _generate_order_number()
        order_result = db.execute(
            text(
                """
                INSERT INTO orders
                    (user_id, order_number, total_amount, status, shipping_address)
                VALUES
                    (:uid, :ono, :total, 'pending', CAST(:addr AS JSONB))
                RETURNING id
                """
            ),
            {
                "uid": user_id,
                "ono": order_number,
                "total": total_amount,
                "addr": payload.shipping_address.model_dump_json(),
            },
        )
        order_id = order_result.scalar_one()

        # 5. Insert order_items + decrement stock + log
        for line in order_lines:
            db.execute(
                text(
                    """
                    INSERT INTO order_items
                        (order_id, product_id, quantity, price_at_purchase, size, color)
                    VALUES (:oid, :pid, :q, :price, :size, :color)
                    """
                ),
                {
                    "oid": order_id,
                    "pid": line["product_id"],
                    "q": line["quantity"],
                    "price": line["price_at_purchase"],
                    "size": line["size"],
                    "color": line["color"],
                },
            )

            new_stock = line["stock_before"] - line["quantity"]
            db.execute(
                text(
                    "UPDATE products SET stock_quantity = :s WHERE id = :pid"
                ),
                {"s": new_stock, "pid": line["product_id"]},
            )

            db.execute(
                text(
                    """
                    INSERT INTO inventory_logs
                        (product_id, change_type, quantity_change, new_quantity, notes, created_by)
                    VALUES (:pid, 'sale', :delta, :new_qty, :notes, :uid)
                    """
                ),
                {
                    "pid": line["product_id"],
                    "delta": -line["quantity"],
                    "new_qty": new_stock,
                    "notes": f"Order {order_number}",
                    "uid": user_id,
                },
            )

        # 6. Empty cart
        db.execute(
            text("DELETE FROM cart_items WHERE user_id = :uid"),
            {"uid": user_id},
        )

        # 7. Commit
        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Order creation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order failed: {str(e)}",
        )

    # 8. Send email (outside transaction)
    try:
        send_order_confirmation(
            to_email=current_user["email"],
            customer_name=current_user["name"],
            order_number=order_number,
            total_amount=total_amount,
            items=items_for_email,
        )
    except Exception:
        logger.exception("Email send failed (non-fatal)")

    return {
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total_amount,
        "status": "pending",
        "message": "Order placed successfully",
    }


@router.get("")
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all orders for the current user."""
    result = db.execute(
        text(
            """
            SELECT id, order_number, total_amount, status, created_at, shipping_address
            FROM orders
            WHERE user_id = :uid
            ORDER BY created_at DESC
            """
        ),
        {"uid": current_user["id"]},
    )
    return {"orders": [dict(row) for row in result.mappings()]}


@router.get("/{order_id}")
def get_order_detail(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return one order with its line items."""
    order = db.execute(
        text(
            """
            SELECT id, order_number, total_amount, status, created_at, shipping_address
            FROM orders
            WHERE id = :id AND user_id = :uid
            """
        ),
        {"id": str(order_id), "uid": current_user["id"]},
    ).mappings().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.execute(
        text(
            """
            SELECT
                oi.id, oi.quantity, oi.price_at_purchase, oi.size, oi.color,
                p.name, p.images, p.sku
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = :oid
            """
        ),
        {"oid": str(order_id)},
    )

    return {
        "order": dict(order),
        "items": [dict(row) for row in items.mappings()],
    }