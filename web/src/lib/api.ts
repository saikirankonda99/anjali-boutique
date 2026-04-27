import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  sku: string;
  category_name: string;
  category_slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product_id: string;
  name: string;
  price: number;
  discount_price: number | null;
  unit_price: number;
  line_total: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export const getProducts = () =>
  api.get<{ count: number; products: Product[] }>("/products").then((r) => r.data);

export const getCategories = () =>
  api.get<{ categories: Category[] }>("/categories").then((r) => r.data);

export const getCart = () =>
  api.get<{ count: number; items: CartItem[]; subtotal: number }>("/cart").then((r) => r.data);

export const addToCart = (product_id: string, quantity: number, size?: string, color?: string) =>
  api.post("/cart/items", { product_id, quantity, size, color }).then((r) => r.data);

export const removeFromCart = (item_id: string) =>
  api.delete(`/cart/items/${item_id}`).then((r) => r.data);

export const login = (email: string, password: string) =>
  api.post<{ access_token: string; user: User }>("/auth/login", { email, password }).then((r) => r.data);

export const register = (email: string, password: string, name: string, phone?: string) =>
  api.post<{ access_token: string; user: User }>("/auth/register", { email, password, name, phone }).then((r) => r.data);

export default api;