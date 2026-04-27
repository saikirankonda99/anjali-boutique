"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/lib/api";
import { useEffect } from "react";

export default function Header() {
  const { user, logout } = useAuthStore();
  const { itemCount, setItemCount } = useCartStore();

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (cartData) setItemCount(cartData.count);
  }, [cartData, setItemCount]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="text-xl font-bold text-rose-700">Anjali Boutique</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/" className="hover:text-rose-600 transition-colors">Home</Link>
          <Link href="/products" className="hover:text-rose-600 transition-colors">Shop</Link>
          <Link href="/products?category=sarees" className="hover:text-rose-600 transition-colors">Sarees</Link>
          <Link href="/products?category=lehengas" className="hover:text-rose-600 transition-colors">Lehengas</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative text-stone-600 hover:text-rose-600 transition-colors">
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600 hidden md:block">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-full transition-colors"
            >
              <User size={15} />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}