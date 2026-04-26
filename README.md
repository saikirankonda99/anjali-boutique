# 🌸 Anjali Boutique - E-Commerce Platform

End-to-end e-commerce platform for an Indian ethnic wear boutique, featuring a customer storefront, Android app, and staff inventory dashboard.

## 🛠️ Tech Stack

**Backend**
- FastAPI (Python 3.12) — REST API
- SQLAlchemy — ORM and database queries  
- PostgreSQL (Supabase) — Production database hosted on AWS Mumbai
- Pydantic — Data validation and settings

**Frontend** *(in progress)*
- Next.js 14 — Customer-facing website + staff dashboard
- React Native (Expo) — Android mobile app
- Tailwind CSS — Styling
- TanStack Query — Data fetching and caching

**Infrastructure** *(in progress)*
- Railway — Backend hosting
- Vercel — Web hosting
- Cloudinary — Image hosting and CDN
- Razorpay — Payment integration

## 📁 Project Structure

\\\
anjali-boutique/
├── backend/          # FastAPI Python backend
│   └── app/
│       ├── main.py       # API entry point and routes
│       ├── database.py   # Database connection
│       └── config.py     # Environment configuration
├── web/              # Next.js website (in progress)
└── mobile/           # React Native Android app (in progress)
\\\

## 🚀 API Endpoints

- \GET /\ - Health check
- \GET /products\ - List all active products with categories
- \GET /categories\ - List all product categories

More endpoints coming: auth, cart, orders, admin analytics.

## 🏃 Local Development

\\\ash
cd backend
python -m venv venv
.\\venv\\Scripts\\Activate.ps1   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
\\\

API runs on \http://localhost:8000\. Interactive docs at \http://localhost:8000/docs\.

## 📊 Database Schema

8 tables covering: users, products, categories, cart_items, orders, order_items, inventory_logs.

## 👤 Author

**Sai Kiran Konda**  
Data Analyst | Full-Stack Developer  
[LinkedIn](https://linkedin.com/in/sai-kiran-konda) · [GitHub](https://github.com/saikirankonda99)

---

🚧 *This project is in active development. Star the repo to follow progress!*
