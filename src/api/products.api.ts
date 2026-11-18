import { apiClient } from "./client";
import type {
  PaginatedResponse,
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
} from "../types/api";

export interface ProductListParams {
  page?: number;
  size?: number;
  search?: string;
  active_only?: boolean;
  in_stock_only?: boolean;
}

export const productsApi = {
  listProducts: async (
    params: ProductListParams = {},
  ): Promise<PaginatedResponse<ProductResponse>> => {
    const cleanParams: Record<string, string | number | boolean> = {
      page: params.page ?? 1,
      size: params.size ?? 12,
      active_only: params.active_only ?? true,
      in_stock_only: params.in_stock_only ?? false,
    };
    if (params.search && params.search.trim().length > 0) {
      cleanParams.search = params.search.trim();
    }

    const response = await apiClient.get<PaginatedResponse<ProductResponse>>(
      "/products",
      { params: cleanParams },
    );
    return response.data;
  },

  getProduct: async (productId: number): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(
      `/products/${productId}`,
    );
    return response.data;
  },

  createProduct: async (
    payload: ProductCreateRequest,
  ): Promise<ProductResponse> => {
    const response = await apiClient.post<ProductResponse>(
      "/products",
      payload,
    );
    return response.data;
  },

  updateProduct: async (
    productId: number,
    payload: ProductUpdateRequest,
  ): Promise<ProductResponse> => {
    const response = await apiClient.patch<ProductResponse>(
      `/products/${productId}`,
      payload,
    );
    return response.data;
  },

  deleteProduct: async (productId: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
  },
};
