export type UserRole = "admin" | "user";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected";
  environment: string;
  version: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface UserAdminCreateRequest extends UserCreateRequest {
  role: UserRole;
  is_active: boolean;
}

export interface UserUpdateRequest {
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ProductResponse {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string | null;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface OrderItemCreateRequest {
  product_id: number;
  quantity: number;
}

export interface OrderCreateRequest {
  shipping_address: string;
  items: OrderItemCreateRequest[];
}

export interface OrderItemProductSummary {
  id: number;
  sku: string;
  name: string;
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  product: OrderItemProductSummary | null;
}

export interface OrderResponse {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_amount: string | number;
  shipping_address: string;
  items: OrderItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface BackendErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

export interface BackendErrorPayload {
  error?: {
    code: string;
    message: string;
    path?: string;
    details?: BackendErrorDetail[];
  };
  detail?: string;
}
