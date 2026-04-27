"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, type Product } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";

function ProductCard({ product }: { product: Product }) {
  const price = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price !== null;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group border border-stone-100">
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
          <p className="text-xs text-stone-500 line-clamp-2 mb-3">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
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
            <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
              View <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const CATEGORY_EMOJIS: Record<string, string> = {
  sarees: "🥻", lehengas: "👗", kurtas: "👘",
  "salwar-suits": "👚", accessories: "💎",
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const allProducts = productsData?.products ?? [];
  const categories = categoriesData?.categories ?? [];

  const filtered = selectedCategory
    ? allProducts.filter((p) => p.category_slug === selectedCategory)
    : allProducts;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Our Collection</h1>
      <p className="text-stone-500 mb-8">
        {filtered.length} {filtered.length === 1 ? "product" : "products"} found
      </p>

      {/* Category Filter */}
      <div className="flex gap-3 flex-wrap mb-10">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            !selectedCategory
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-1 ${
              selectedCategory === cat.slug
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-stone-600 border-stone-200 hover:border-rose-300"
            }`}
          >
            {CATEGORY_EMOJIS[cat.slug]} {cat.name}
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <div className="text-6xl mb-4">🛍️</div>
          <p className="text-lg font-medium">No products found</p>
          <Link href="/products" className="text-rose-600 text-sm mt-2 inline-block">
            View all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-stone-400">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}