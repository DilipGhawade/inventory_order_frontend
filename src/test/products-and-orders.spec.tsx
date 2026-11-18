import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import { ordersApi } from "../api/orders.api";
import { productsApi } from "../api/products.api";
import { usersApi } from "../api/users.api";
import { AuthProvider } from "../context/AuthContext";
import type { ProductResponse, UserResponse } from "../types/api";

const adminUser: UserResponse = {
  id: 1,
  email: "admin@example.com",
  full_name: "System Admin",
  role: "admin",
  is_active: true,
  created_at: "2026-11-18T00:00:00Z",
  updated_at: "2026-11-18T00:00:00Z",
};

const sampleProduct: ProductResponse = {
  id: 10,
  sku: "MBP-16-M4",
  name: "MacBook Pro 16-inch M4",
  description: "Enterprise workstation laptop",
  price: "2500.00",
  stock_quantity: 5,
  is_active: true,
  created_at: "2026-11-18T00:00:00Z",
  updated_at: "2026-11-18T00:00:00Z",
};

function setupAuthenticatedApp() {
  tokenStorage.setTokens({
    access_token: "admin-jwt",
    refresh_token: "admin-refresh",
    token_type: "bearer",
    expires_in: 1800,
  });

  vi.spyOn(authApi, "checkHealth").mockResolvedValue({
    status: "healthy",
    database: "connected",
    environment: "testing",
    version: "1.0.0",
  });
  vi.spyOn(usersApi, "getMe").mockResolvedValue(adminUser);

  return render(
    <MemoryRouter initialEntries={["/products"]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Product Inventory CRUD & Atomic Order Placement", () => {
  it("allows Admin to create a new product via modal and refreshes catalog", async () => {
    const user = userEvent.setup();

    const listSpy = vi
      .spyOn(productsApi, "listProducts")
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        size: 9,
        pages: 0,
      })
      .mockResolvedValueOnce({
        items: [sampleProduct],
        total: 1,
        page: 1,
        size: 9,
        pages: 1,
      });

    const createSpy = vi
      .spyOn(productsApi, "createProduct")
      .mockResolvedValue(sampleProduct);

    setupAuthenticatedApp();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add product/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add product/i }));

    await user.type(screen.getByLabelText(/sku/i), "mbp-16-m4");
    await user.type(
      screen.getByLabelText(/product name/i),
      "MacBook Pro 16-inch M4",
    );
    const priceInput = screen.getByLabelText(/unit price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "2500.00");

    const stockInput = screen.getByLabelText(/stock quantity/i);
    await user.clear(stockInput);
    await user.type(stockInput, "5");

    await user.click(screen.getByRole("button", { name: /save product/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        sku: "mbp-16-m4",
        name: "MacBook Pro 16-inch M4",
        description: null,
        price: 2500,
        stock_quantity: 5,
        is_active: true,
      });
    });

    expect(listSpy).toHaveBeenCalledTimes(2);
    expect(
      await screen.findByText("MacBook Pro 16-inch M4"),
    ).toBeInTheDocument();
  });

  it("adds products to cart, submits order payload, and displays confirmation banner", async () => {
    const user = userEvent.setup();

    vi.spyOn(productsApi, "listProducts").mockResolvedValue({
      items: [sampleProduct],
      total: 1,
      page: 1,
      size: 9,
      pages: 1,
    });

    const createOrderSpy = vi
      .spyOn(ordersApi, "createOrder")
      .mockResolvedValue({
        id: 42,
        user_id: 1,
        status: "confirmed",
        total_amount: "5000.00",
        shipping_address: "Flat 403, Purple Bloom, Dighi, Pune 411015",
        items: [
          {
            id: 1,
            product_id: 10,
            quantity: 2,
            unit_price: "2500.00",
            subtotal: "5000.00",
            product: {
              id: 10,
              sku: "MBP-16-M4",
              name: "MacBook Pro 16-inch M4",
            },
          },
        ],
        created_at: "2026-11-18T00:00:00Z",
        updated_at: "2026-11-18T00:00:00Z",
      });

    setupAuthenticatedApp();

    const addButton = await screen.findByRole("button", {
      name: /add to order/i,
    });
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByText("$5000.00")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/shipping address/i),
      "Flat 403, Purple Bloom, Dighi, Pune 411015",
    );
    await user.click(
      screen.getByRole("button", { name: /confirm & place order/i }),
    );

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith({
        shipping_address: "Flat 403, Purple Bloom, Dighi, Pune 411015",
        items: [{ product_id: 10, quantity: 2 }],
      });
    });

    expect(
      await screen.findByText(
        /Order #42 confirmed! Total charged: \$5000\.00\./i,
      ),
    ).toBeInTheDocument();
  });
});
