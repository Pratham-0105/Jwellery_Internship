// src/lib/api.ts
// Centralized API utility — all calls to the backend go through here

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  sizeLabel: string;
  sizeMm: number;
  priceInr: number;
  description: string | null;
  isActive: boolean;
}

export interface GalleryItem {
  id: number;
  index: number;
  name: string;
  subtitle: string;
  bgColor: string;
  darkPendant: boolean;
  isActive: boolean;
}

export interface FaqItem {
  id: number;
  index: number;
  question: string;
  answer: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  engraving: string | null;
  productId: number;
  product: Pick<Product, 'name' | 'sizeLabel' | 'priceInr'>;
  status: OrderStatus;
  totalInr: number;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  engraving?: string;
  productId: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(`Cannot connect to backend server. Make sure it is running on ${API_URL}`);
  }

  let json: {
    success?: boolean;
    data?: T;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
  };

  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned HTTP ${res.status}`);
  }

  if (!res.ok || !json.success) {
    const errorMsg =
      json.error ||
      (json.errors && Array.isArray(json.errors)
        ? json.errors.map((e) => e.message).join('. ')
        : `API error: ${res.status}`);
    throw new Error(errorMsg);
  }

  return json.data as T;
}

// Products
export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/api/products');
}

// Gallery
export async function getGallery(): Promise<GalleryItem[]> {
  return apiFetch<GalleryItem[]>('/api/gallery');
}

// FAQ
export async function getFaqs(): Promise<FaqItem[]> {
  return apiFetch<FaqItem[]>('/api/faq');
}

// Create order
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Get single order
export async function getOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`);
}

// Format INR price
export function formatPrice(priceInr: number): string {
  return '₹' + priceInr.toLocaleString('en-IN');
}
