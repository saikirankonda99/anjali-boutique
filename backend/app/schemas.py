from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ===== USER SCHEMAS =====

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str


# ===== CART SCHEMAS =====

class CartItemAdd(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=100, default=1)
    size: Optional[str] = None
    color: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=100)


# ===== ORDER SCHEMAS =====

class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    notes: Optional[str] = None


# ===== ADMIN SCHEMAS =====

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(gt=0)
    discount_price: Optional[Decimal] = None
    category_id: Optional[int] = None
    sku: Optional[str] = None
    stock_quantity: int = Field(ge=0, default=0)
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    discount_price: Optional[Decimal] = None
    category_id: Optional[int] = None
    stock_quantity: Optional[int] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None


class StockAdjustment(BaseModel):
    quantity_change: int = Field(description="Positive to add stock, negative to subtract")
    notes: Optional[str] = None