"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, addToCart } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Check } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const product = productsData?.products.find((p) => p.id === id);

  const addMutation = useMutation({
    mutationFn: () => addToCart(id, quantity, selectedSize || undefined, selectedColor || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    },
  });

  const handleAddToCart = () => {
    if (!user) { router.push("/login"); return; }
    addMutation.mutate();
  };

  if (isLoading) return <div className="text-center py-20 text-stone-400">Loading...</div>;

  if (!product) return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-bold text-stone-700 mb-2">Product not found</h2>
      <Link href="/products" className="text-rose-600 hover:underline">Back to shop</Link>
    </div>
  );

  const price = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price !== null;
  const discountPct = hasDiscount ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;
  const emoji = product.category_slug === "sarees" ? "🥻" : product.category_slug === "lehengas" ? "👗" : product.category_slug === "kurtas" ? "👘" : product.category_slug === "accessories" ? "💎" : "👚";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-rose-600 mb-8 transition-colors">
        <ArrowLeft size={15} /> Back to Shop
      </Link>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="h-96 md:h-[500px] bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-3xl flex items-center justify-center relative border border-stone-100">
          {hasDiscount && <span className="absolute top-5 left-5 bg-rose-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">-{discountPct}% OFF</span>}
          <span className="text-[120px] opacity-30">{emoji}</span>
          <span className="absolute bottom-5 right-5 text-sm bg-white/80 px-3 py-1.5 rounded-full text-stone-500">{product.stock_quantity} in stock</span>
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-rose-500 font-medium uppercase tracking-wide mb-2">{product.category_name}</p>
          <h1 className="text-3xl font-bold text-stone-900 mb-4">{product.name}</h1>
          <p className="text-stone-600 leading-relaxed mb-6">{product.description}</p>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-4xl font-bold text-stone-900">₹{price.toLocaleString("en-IN")}</span>
            {hasDiscount && <>
              <span className="text-xl text-stone-400 line-through">₹{product.price.toLocaleString("en-IN")}</span>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Save ₹{(product.price - product.discount_price!).toLocaleString("en-IN")}</span>
            </>}
          </div>{product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-stone-700 mb-3">Size: <span className="text-rose-600">{selectedSize || "Select"}</span></p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedSize === size ? "border-rose-600 bg-rose-50 text-rose-700" : "border-stone-200 text-stone-600 hover:border-rose-300"}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-stone-700 mb-3">Color: <span className="text-rose-600">{selectedColor || "Select"}</span></p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color) => (
                  <button key={color} onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedColor === color ? "border-rose-600 bg-rose-50 text-rose-700" : "border-stone-200 text-stone-600 hover:border-rose-300"}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-8">
            <p className="text-sm font-semibold text-stone-700 mb-3">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full border-2 border-stone-200 hover:border-rose-300 font-bold text-lg">−</button>
              <span className="w-10 text-center font-bold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="w-10 h-10 rounded-full border-2 border-stone-200 hover:border-rose-300 font-bold text-lg">+</button>
            </div>
          </div>
          <button onClick={handleAddToCart} disabled={addMutation.isPending || product.stock_quantity === 0}
            className={`flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-bold text-lg transition-all ${added ? "bg-green-500 text-white" : product.stock_quantity === 0 ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700 text-white"}`}>
            {added ? <><Check size={20} /> Added!</> : addMutation.isPending ? "Adding..." : product.stock_quantity === 0 ? "Out of Stock" : <><ShoppingCart size={20} /> Add to Cart</>}
          </button>
          {!user && <p className="text-center text-sm text-stone-500 mt-3"><Link href="/login" className="text-rose-600 font-medium">Login</Link> to add items</p>}
          <p className="text-xs text-stone-400 mt-6">SKU: {product.sku}</p>
        </div>
      </div>
    </div>
  );
}