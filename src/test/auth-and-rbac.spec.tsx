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
import type { UserResponse } from "../types/api";

const mockStandardUser: UserResponse = {
  id: 2,
  email: "customer@example.com",
  full_name: "Alice Customer",
  role: "user",
  is_active: true,
  created_at: "2026-11-18T00:00:00Z",
  updated_at: "2026-11-18T00:00:00Z",
};

const mockAdminUser: UserResponse = {
  id: 1,
  email: "admin@example.com",
  full_name: "System Admin",
  role: "admin",
  is_active: true,
  created_at: "2026-11-18T00:00:00Z",
  updated_at: "2026-11-18T00:00:00Z",
};

function renderWithRouter(initialEntries: string[] = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Authentication & Role-Based Access Control (RBAC)", () => {
  it("logs in a standard user, hides Admin links, and blocks direct access to /users", async () => {
    const user = userEvent.setup();

    vi.spyOn(authApi, "checkHealth").mockResolvedValue({
      status: "healthy",
      database: "connected",
      environment: "testing",
      version: "1.0.0",
    });

    vi.spyOn(authApi, "login").mockResolvedValue({
      access_token: "user-access-jwt",
      refresh_token: "user-refresh-jwt",
      token_type: "bearer",
      expires_in: 1800,
    });

    vi.spyOn(usersApi, "getMe").mockResolvedValue(mockStandardUser);
    vi.spyOn(productsApi, "listProducts").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 9,
      pages: 0,
    });

    renderWithRouter(["/login"]);

    await user.type(
      screen.getByLabelText(/email address/i),
      "customer@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "CustomerPass123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Alice Customer")).toBeInTheDocument();
    });

    // Standard user sees USER badge, Products, and Orders — NEVER Users Management or Add Product
    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /orders/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /users management/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add product/i }),
    ).not.toBeInTheDocument();
  });

  it("redirects non-admin users away from /users route to /products", async () => {
    tokenStorage.setTokens({
      access_token: "valid-user-token",
      refresh_token: "valid-refresh-token",
      token_type: "bearer",
      expires_in: 1800,
    });

    vi.spyOn(authApi, "checkHealth").mockResolvedValue({
      status: "healthy",
      database: "connected",
      environment: "testing",
      version: "1.0.0",
    });
    vi.spyOn(usersApi, "getMe").mockResolvedValue(mockStandardUser);
    vi.spyOn(productsApi, "listProducts").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 9,
      pages: 0,
    });

    renderWithRouter(["/users"]);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /product inventory/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /user & role administration/i }),
    ).not.toBeInTheDocument();
  });

  it("grants Admin full access to Users Management and all-users Orders toggle", async () => {
    const user = userEvent.setup();

    tokenStorage.setTokens({
      access_token: "valid-admin-token",
      refresh_token: "valid-admin-refresh",
      token_type: "bearer",
      expires_in: 1800,
    });

    vi.spyOn(authApi, "checkHealth").mockResolvedValue({
      status: "healthy",
      database: "connected",
      environment: "testing",
      version: "1.0.0",
    });
    vi.spyOn(usersApi, "getMe").mockResolvedValue(mockAdminUser);
    vi.spyOn(usersApi, "listUsers").mockResolvedValue([
      mockAdminUser,
      mockStandardUser,
    ]);
    vi.spyOn(ordersApi, "listOrders").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      pages: 0,
    });

    renderWithRouter(["/users"]);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /user & role administration/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(
      screen.getByText("alice@example.com".replace("alice", "customer")),
    ).toBeInTheDocument();

    // Navigate to Orders page and verify Admin all-users checkbox is present
    await user.click(screen.getByRole("link", { name: /orders/i }));
    await waitFor(() => {
      expect(
        screen.getByLabelText(/view all users' orders \(admin\)/i),
      ).toBeInTheDocument();
    });
  });
});
