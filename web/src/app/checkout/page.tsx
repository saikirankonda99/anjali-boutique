"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCart, placeOrder } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { ArrowLeft, Lock, Truck, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [form, setForm] = useState({
    shipping_name: user?.name || "",
    shipping_phone: user?.phone || "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_pincode: "",
    payment_method: "cod",
    notes: "",
  });
  const [error, setError] = useState("");

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });

  const orderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: (data: unknown) => {
      const response = data as {
        order?: { id?: string };
        order_id?: string;
        id?: string;
      };
      const orderId = response?.order?.id || response?.order_id || response?.id;
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        console.warn("No order ID in response:", data);
        router.push("/products");
      }
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: unknown } } };
      const detail = error?.response?.data?.detail;

      let message = "Failed to place order. Please try again.";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const firstError = detail[0] as { msg?: string; loc?: string[] };
        const field = firstError?.loc?.[firstError.loc.length - 1] || "field";
        message = `${field}: ${firstError?.msg || "invalid value"}`;
      }
      setError(message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Match backend OrderCreate schema exactly
    const orderPayload = {
      shipping_address: {
        full_name: form.shipping_name,
        phone: form.shipping_phone,
        address_line1: form.shipping_address,
        city: form.shipping_city,
        state: form.shipping_state,
        pincode: form.shipping_pincode,
        country: "India",
      },
      notes: form.notes || undefined,
    };

    orderMutation.mutate(orderPayload as never);
  };

  if (!user) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Please login to checkout</h2>
        <Link href="/login" className="text-rose-600 hover:underline">
          Sign in →
        </Link>
      </div>
    );
  }

  if (cartLoading) {
    return <div className="text-center py-20 text-stone-400">Loading...</div>;
  }

  const items = cartData?.items ?? [];
  const subtotal = cartData?.subtotal ?? 0;

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🛍️</div>
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
        <p className="text-stone-500 mb-6">Add some items before checking out</p>
        <Link href="/products" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-full">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-rose-600 mb-8">
        <ArrowLeft size={15} /> Back to Cart
      </Link>

      <h1 className="text-3xl font-bold text-stone-800 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Truck size={20} className="text-rose-600" />
              <h2 className="font-bold text-lg text-stone-800">Shipping Address</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                <input
                  name="shipping_name"
                  value={form.shipping_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone</label>
                <input
                  name="shipping_phone"
                  type="tel"
                  value={form.shipping_phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Address</label>
                <textarea
                  name="shipping_address"
                  value={form.shipping_address}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="House no, Street, Landmark"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
                <input
                  name="shipping_city"
                  value={form.shipping_city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">State</label>
                <input
                  name="shipping_state"
                  value={form.shipping_state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Pincode</label>
                <input
                  name="shipping_pincode"
                  value={form.shipping_pincode}
                  onChange={handleChange}
                  required
                  placeholder="500001"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={20} className="text-rose-600" />
              <h2 className="font-bold text-lg text-stone-800">Payment Method</h2>
            </div>

            <label className="flex items-center gap-3 p-4 border-2 border-rose-300 rounded-xl bg-rose-50 cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value="cod"
                checked={form.payment_method === "cod"}
                onChange={handleChange}
                className="accent-rose-600"
              />
              <div>
                <p className="font-semibold text-stone-800">Cash on Delivery</p>
                <p className="text-xs text-stone-500">Pay when you receive your order</p>
              </div>
            </label>

            <p className="text-xs text-stone-400 mt-3">
              💳 Online payments (Razorpay) coming soon
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Order Notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any special delivery instructions?"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
        </form>

        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm sticky top-24">
            <h2 className="font-bold text-stone-800 text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 pr-2 min-w-0">
                    <p className="text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-stone-700 font-medium whitespace-nowrap">
                    ₹{item.line_total.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t border-stone-100 pt-2 flex justify-between font-bold text-stone-900 text-base">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={orderMutation.isPending}
              className="mt-6 w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Lock size={16} />
              {orderMutation.isPending ? "Placing Order..." : "Place Order"}
            </button>

            <p className="text-xs text-stone-400 mt-3 text-center">
              By placing this order, you agree to our terms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}