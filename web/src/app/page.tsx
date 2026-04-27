"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, type Product } from "@/lib/api";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

function ProductCard({ product }: { product: Product }) {
  const price = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price !== null;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-stone-100">
        <div className="h-52 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 relative flex items-center justify-center">
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPct}%
            </span>
          )}
          <span className="text-6xl opacity-40">
            {product.category_slug === "sarees" ? "🥻" :
             product.category_slug === "lehengas" ? "👗" :
             product.category_slug === "kurtas" ? "👘" :
             product.category_slug === "accessories" ? "💎" : "👚"}
          </span>
          <span className="absolute bottom-3 right-3 text-xs bg-white/80 px-2 py-1 rounded-full text-stone-500">
            {product.stock_quantity} left
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-rose-500 font-medium uppercase tracking-wide mb-1">
            {product.category_name}
          </p>
          <h3 className="font-semibold text-stone-800 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-rose-700 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-stone-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-sm text-stone-400 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const CATEGORY_EMOJIS: Record<string, string> = {
  sarees: "🥻",
  lehengas: "👗",
  kurtas: "👘",
  "salwar-suits": "👚",
  accessories: "💎",
};

export default function HomePage() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const products = productsData?.products ?? [];
  const categories = categoriesData?.categories ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-rose-900 via-rose-800 to-orange-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">🌸</div>
          <div className="absolute bottom-10 right-10 text-9xl">🌺</div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <p className="text-rose-300 text-sm font-medium uppercase tracking-widest mb-4">
            Premium Indian Ethnic Wear
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Tradition meets <span className="text-amber-400">Style</span>
          </h1>
          <p className="text-rose-100 text-lg max-w-xl mx-auto mb-10">
            Handcrafted sarees, elegant lehengas, and timeless kurtas —
            celebrating the beauty of Indian heritage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105"
            >
              <ShoppingBag size={18} />
              Shop Now
            </Link>
            <Link
              href="/products?category=sarees"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 rounded-full border border-white/20 transition-all"
            >
              Explore Sarees
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-stone-800 mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl hover:bg-rose-50 border border-stone-100 hover:border-rose-200 transition-all hover:shadow-sm group"
            >
              <span className="text-4xl">{CATEGORY_EMOJIS[cat.slug] ?? "🛍️"}</span>
              <span className="text-sm font-medium text-stone-700 group-hover:text-rose-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Featured Collection</h2>
            <p className="text-stone-500 text-sm mt-1">Handpicked pieces just for you</p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-stone-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="bg-rose-50 border-y border-rose-100 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🚚", title: "Free Delivery", sub: "On orders above ₹999" },
            { icon: "🔄", title: "Easy Returns", sub: "7-day hassle-free returns" },
            { icon: "🔒", title: "Secure Payments", sub: "Razorpay protected" },
            { icon: "🌸", title: "Authentic Products", sub: "Direct from weavers" },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-semibold text-stone-800 text-sm">{item.title}</div>
              <div className="text-stone-500 text-xs mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}