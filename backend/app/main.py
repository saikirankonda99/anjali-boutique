from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

app = FastAPI(title="Anjali Boutique API", version="0.1.0")

# Allow our future web/mobile apps to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Anjali Boutique API is alive 🌸"}


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    result = db.execute(
        text(
            """
            SELECT
                p.id, p.name, p.description, p.price, p.discount_price,
                p.stock_quantity, p.images, p.sizes, p.colors, p.sku,
                c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
            ORDER BY p.created_at DESC
            """
        )
    )
    products = [dict(row) for row in result.mappings()]
    return {"count": len(products), "products": products}


@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT id, name, slug FROM categories ORDER BY name")
    )
    return {"categories": [dict(row) for row in result.mappings()]}