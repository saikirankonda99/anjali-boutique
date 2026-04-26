from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.schemas import CartItemAdd, CartItemUpdate

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("")
def get_cart(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return all items in the user's cart with product details and totals."""
    result = db.execute(
        text(
            """
            SELECT
                ci.id, ci.quantity, ci.size, ci.color, ci.added_at,
                p.id AS product_id, p.name, p.price, p.discount_price,
                p.images, p.stock_quantity, p.sku
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = :user_id
            ORDER BY ci.added_at DESC
            """
        ),
        {"user_id": current_user["id"]},
    )
    items = [dict(row) for row in result.mappings()]

    # Calculate totals
    subtotal = 0
    for item in items:
        unit_price = item["discount_price"] or item["price"]
        item["unit_price"] = unit_price
        item["line_total"] = unit_price * item["quantity"]
        subtotal += item["line_total"]

    return {
        "count": len(items),
        "items": items,
        "subtotal": subtotal,
    }


@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Add product to cart. If product already in cart with same size/color, increment quantity."""
    # Verify product exists and is active
    product = db.execute(
        text(
            "SELECT id, stock_quantity, is_active FROM products WHERE id = :pid"
        ),
        {"pid": str(payload.product_id)},
    ).mappings().first()

    if not product or not product["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if product["stock_quantity"] < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product['stock_quantity']} in stock",
        )

    # Check if same product+size+color already in cart
    existing = db.execute(
        text(
            """
            SELECT id, quantity FROM cart_items
            WHERE user_id = :uid AND product_id = :pid
              AND COALESCE(size, '') = COALESCE(:size, '')
              AND COALESCE(color, '') = COALESCE(:color, '')
            """
        ),
        {
            "uid": current_user["id"],
            "pid": str(payload.product_id),
            "size": payload.size,
            "color": payload.color,
        },
    ).mappings().first()

    if existing:
        new_qty = existing["quantity"] + payload.quantity
        if new_qty > product["stock_quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot exceed stock of {product['stock_quantity']}",
            )
        db.execute(
            text(
                "UPDATE cart_items SET quantity = :q WHERE id = :id"
            ),
            {"q": new_qty, "id": existing["id"]},
        )
        db.commit()
        return {"message": "Cart updated", "cart_item_id": existing["id"]}

    # Insert new cart item
    result = db.execute(
        text(
            """
            INSERT INTO cart_items (user_id, product_id, quantity, size, color)
            VALUES (:uid, :pid, :q, :size, :color)
            RETURNING id
            """
        ),
        {
            "uid": current_user["id"],
            "pid": str(payload.product_id),
            "q": payload.quantity,
            "size": payload.size,
            "color": payload.color,
        },
    )
    cart_item_id = result.scalar_one()
    db.commit()
    return {"message": "Added to cart", "cart_item_id": cart_item_id}


@router.patch("/items/{item_id}")
def update_cart_item(
    item_id: UUID,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update quantity of a cart item."""
    item = db.execute(
        text(
            """
            SELECT ci.id, p.stock_quantity
            FROM cart_items ci JOIN products p ON ci.product_id = p.id
            WHERE ci.id = :id AND ci.user_id = :uid
            """
        ),
        {"id": str(item_id), "uid": current_user["id"]},
    ).mappings().first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if payload.quantity > item["stock_quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Only {item['stock_quantity']} in stock",
        )

    db.execute(
        text("UPDATE cart_items SET quantity = :q WHERE id = :id"),
        {"q": payload.quantity, "id": str(item_id)},
    )
    db.commit()
    return {"message": "Quantity updated"}


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Remove an item from cart."""
    result = db.execute(
        text(
            "DELETE FROM cart_items WHERE id = :id AND user_id = :uid"
        ),
        {"id": str(item_id), "uid": current_user["id"]},
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Empty the entire cart for the current user."""
    db.execute(
        text("DELETE FROM cart_items WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )
    db.commit()