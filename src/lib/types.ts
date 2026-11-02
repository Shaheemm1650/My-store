export type OrderStatus = "pending" | "slip_uploaded" | "approved" | "delivered" | "rejected";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "slip_uploaded", "approved", "delivered", "rejected"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending payment",
  slip_uploaded: "Slip uploaded",
  approved: "Approved",
  delivered: "Delivered",
  rejected: "Rejected",
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  position: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  min_price: number | null;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

/** Shape returned by the search_products RPC. */
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  min_price: number | null;
  compare_at_price: number | null;
  total_stock: number;
  category_name: string | null;
  category_slug: string | null;
  image_path: string | null;
  is_featured: boolean;
}

export interface Order {
  id: string;
  order_number: number;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  payment_slip_path: string | null;
  slip_uploaded_at: string | null;
  admin_note: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string;
  image_path: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: number;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
