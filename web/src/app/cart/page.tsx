"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, removeFromCart } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (!user) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Your cart is waiting</h2>
        <p className="text-stone-500 mb-6">Please login to view your cart</p>
        <Link href="/login" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-full transition-all">
          Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-100 rounded-2xl mb-4 animate-pulse" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  const subtotal = data?.subtotal ?? 0;

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🛍️</div>
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
        <p className="text-stone-500 mb-6">Add some beautiful pieces to get started</p>
        <Link href="/products" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-full transition-all inline-flex items-center gap-2">
          <ShoppingBag size={18} /> Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">
        Your Cart{" "}
        <span className="text-stone-400 text-xl font-normal">({items.length} items)</span>
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => {
            const emoji =
              item.name?.toLowerCase().includes("saree") ? "🥻" :
              item.name?.toLowerCase().includes("lehenga") ? "👗" :
              item.name?.toLowerCase().includes("kurta") ? "👘" :
              item.name?.toLowerCase().includes("necklace") || item.name?.toLowerCase().includes("kundan") ? "💎" : "👚";
            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 items-center border border-stone-100 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && " · "}
                    {item.color && `Color: ${item.color}`}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-stone-900">₹{item.line_total.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-stone-400">₹{item.unit_price.toLocaleString("en-IN")} each</p>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="mt-2 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm sticky top-24">
            <h2 className="font-bold text-stone-800 text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Checkout <ArrowRight size={16} />
            </Link>
            <Link href="/products" className="mt-3 w-full text-center text-sm text-stone-500 hover:text-rose-600 block">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}