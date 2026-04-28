# 🌸 Anjali Boutique

> A full-stack e-commerce platform for premium Indian ethnic wear — sarees, lehengas, kurtas, and more.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://anjali-boutique.vercel.app)
[![API](https://img.shields.io/badge/API-Railway-blueviolet?style=for-the-badge)](https://anjali-boutique-production.up.railway.app/docs)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com)

---

## 🚀 Live Demo

- **🛍️ Storefront**: [anjali-boutique.vercel.app](https://anjali-boutique.vercel.app)
- **📡 API Docs**: [anjali-boutique-production.up.railway.app/docs](https://anjali-boutique-production.up.railway.app/docs)

**Test credentials**:
- Email: `saikiran@anjaliboutique.com`
- Password: `SecurePass123`

---

## ✨ Features

### Customer-facing
- 🔍 Browse 5 product categories (sarees, lehengas, kurtas, salwar suits, accessories)
- 🛒 Persistent shopping cart with size + color variants
- 🔐 JWT-secured authentication (register + login)
- 💳 Atomic order placement with real-time stock validation
- 📦 Order history with detailed confirmation pages
- 📱 Fully mobile-responsive UI

### Backend / Admin
- 🏗️ 24 REST endpoints (auth, cart, orders, admin analytics)
- 📊 Admin analytics: sales overview, top products, sales trends, low stock alerts
- 📜 Inventory audit logs for every stock change
- 🔄 Atomic transactions prevent overselling
- 🛡️ bcrypt password hashing + JWT with 7-day expiry

---

## 🏗️ Architecture

┌──────────────────────┐      ┌──────────────────────┐      ┌────────────────────┐
│  Next.js 16 Frontend │ ───▶ │   FastAPI Backend    │ ───▶ │    PostgreSQL      │
│   (Vercel CDN)       │ HTTP │     (Railway)        │ SQL  │    (Supabase)      │
│   TypeScript         │      │     Python 3.12      │      │    Mumbai region   │
└──────────────────────┘      └──────────────────────┘      └────────────────────┘
       (Global)                       (US)                        (Asia)
Data flow: User → Vercel (Next.js SSR/CSR) → Railway (FastAPI + JWT auth) → Supabase (PostgreSQL with row-level transactions)

🛠️ Tech Stack
Frontend (/web)

Framework: Next.js 16 with Turbopack + App Router
Language: TypeScript
Styling: Tailwind CSS v4
State: Zustand (cart, auth) + TanStack Query (server state)
HTTP: Axios with JWT interceptor
Icons: Lucide React
Hosted on: Vercel

Backend (/backend)

Framework: FastAPI
Language: Python 3.12
Database driver: SQLAlchemy + psycopg2
Validation: Pydantic v2
Auth: python-jose (JWT) + passlib (bcrypt)
Hosted on: Railway

Database

Engine: PostgreSQL 15
Hosted on: Supabase (Mumbai, ap-south-1)
Tables: 8 (users, categories, products, cart_items, orders, order_items, inventory_logs, sessions)


🚀 Local Development
Prerequisites

Python 3.12+
Node.js 20+ and pnpm
A Supabase project (or any PostgreSQL database)

Backend Setup
Clone the repo, then:
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Create backend/.env:
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRE_MINUTES=10080
Run the backend:
uvicorn app.main:app --reload
API at http://localhost:8000, Swagger UI at http://localhost:8000/docs.
Frontend Setup
cd web
pnpm install
Create web/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000
Run the frontend:
pnpm dev
Site at http://localhost:3000.

🗄️ Database Schema
8 tables with foreign keys, indexes, and triggers:

users — id (UUID), email, password_hash, full_name, role
categories — id, name, slug, description
products — id, category_id, name, price, discount_price, stock_quantity, sizes, colors, images, sku
cart_items — user_id, product_id, quantity, size, color
orders — id, user_id, order_number, status, total_amount, shipping_address (JSONB)
order_items — order_id, product_id, quantity, price_at_purchase, size, color
inventory_logs — product_id, change_type, quantity_delta, reason, created_at
sessions — user_id, token_hash, expires_at


🛣️ Roadmap

 Razorpay payment integration (currently COD only)
 Real email confirmations via SendGrid/Resend
 React Native mobile app (Expo)
 Admin dashboard UI consuming the 9 analytics endpoints
 Product search + filters
 Reviews & ratings
 Order tracking with delivery status updates
 Real product images (currently emoji placeholders)


👨‍💻 Author
Built by Sai Kiran Konda — Data Analyst transitioning to Full-Stack Engineering.

LinkedIn: https://www.linkedin.com/in/sai-kiran-konda/
GitHub: https://github.com/saikirankonda99


📜 License
MIT — feel free to learn from, fork, or build on this project.


Built in 3 days as a learning sprint. From "I don't know FastAPI" to a deployed e-commerce platform with real orders. 🌸
