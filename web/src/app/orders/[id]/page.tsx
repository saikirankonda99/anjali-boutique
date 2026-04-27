"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, MapPin, ArrowRight } from "lucide-react";

interface OrderItem {
  id?: string;
  name?: string;
  quantity: number;
  price_at_purchase?: number;
  size?: string | null;
  color?: string | null;
  sku?: string;
  images?: string[] | null;
}

interface ShippingAddress {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface OrderObj {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address?: ShippingAddress;
}

interface OrderResponse {
  order: OrderObj;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<OrderResponse>(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return <div className="text-center py-20 text-stone-400">Loading order...</div>;
  }

  if (error || !data?.order) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-stone-700 mb-2">Order not found</h2>
        <Link href="/products" className="text-rose-600 hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const order = data.order;
  const items = data.items ?? [];
  const shipping = order.shipping_address ?? {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Success Hero */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-8 text-center mb-8">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Order Placed! 🎉</h1>
        <p className="text-stone-600 mb-1">Thank you for shopping with Anjali Boutique</p>
        <p className="text-sm text-stone-500">
          Order Number: <span className="font-mono font-bold text-stone-700">{order.order_number}</span>
        </p>
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-rose-600" />
            <h2 className="font-bold text-stone-800">Items Ordered</h2>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => {
              const price = item.price_at_purchase ?? 0;
              const lineTotal = price * item.quantity;
              return (
                <div key={item.id ?? idx} className="flex justify-between items-start text-sm border-b border-stone-50 pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800">{item.name ?? "Product"}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && " · "}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Qty: {item.quantity} × ₹{price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="font-bold text-stone-900">₹{lineTotal.toLocaleString("en-IN")}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone-100 mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total Paid</span>
            <span className="text-rose-600">₹{(order.total_amount ?? 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      {/* Shipping */}
      <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-rose-600" />
          <h2 className="font-bold text-stone-800">Shipping To</h2>
        </div>
        <p className="text-stone-700 font-medium">{shipping.full_name ?? "—"}</p>
        <p className="text-sm text-stone-600">{shipping.phone ?? ""}</p>
        <p className="text-sm text-stone-600 mt-1">
          {shipping.address_line1 ?? ""}
          {shipping.address_line2 ? `, ${shipping.address_line2}` : ""}
        </p>
        <p className="text-sm text-stone-600">
          {shipping.city ?? ""}, {shipping.state ?? ""} - {shipping.pincode ?? ""}
        </p>
        {shipping.country && shipping.country !== "India" && (
          <p className="text-sm text-stone-600">{shipping.country}</p>
        )}
      </div>

      {/* Status */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-center">
        <p className="text-sm font-medium text-amber-800">
          Status: <span className="capitalize">{order.status}</span>
        </p>
        <p className="text-xs text-amber-700 mt-1">
          You&apos;ll receive a confirmation email shortly
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/products"
        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
      >
        Continue Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );
}