import { apiClient } from "./client";
import type {
  OrderCreateRequest,
  OrderResponse,
  PaginatedResponse,
} from "../types/api";

export interface OrderListParams {
  page?: number;
  size?: number;
  all_users?: boolean;
}

export const ordersApi = {
  createOrder: async (payload: OrderCreateRequest): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>("/orders", payload);
    return response.data;
  },

  listOrders: async (
    params: OrderListParams = {},
  ): Promise<PaginatedResponse<OrderResponse>> => {
    const response = await apiClient.get<PaginatedResponse<OrderResponse>>(
      "/orders",
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 10,
          all_users: params.all_users ?? false,
        },
      },
    );
    return response.data;
  },

  getOrder: async (orderId: number): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
    return response.data;
  },
};
