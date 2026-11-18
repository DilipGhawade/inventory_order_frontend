### File: README.md

```markdown
# Enterprise Inventory & Order Management Frontend (InventoryOS)

A production-ready Single-Page Application (SPA) built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. Designed as the client interface for the FastAPI + PostgreSQL Inventory & Order Management API, featuring Role-Based Access Control (RBAC), automatic JWT silent refresh, real-time stock validation, and a complete **Vitest + React Testing Library** test suite.

---

## Core Features & Architecture

- **Axios Interceptor with Silent Token Refresh**: Automatically attaches Bearer access tokens to outgoing requests and transparently intercepts `401 Unauthorized` responses to exchange the refresh token at `/api/v1/auth/refresh` and replay queued requests without interrupting the user.
- **Role-Based Access Control (RBAC)**:
  - **Standard User (`user`)**: Browse and search products, filter by availability, build multi-item orders with stock validation, and view personal order history and receipts.
  - **Administrator (`admin`)**: Full inventory CRUD (create products, edit pricing and stock, soft-delete/deactivate items), global order visibility across all customers, and a dedicated User & Role Management console (`/users`).
- **Route & Component Guards**: Protected routes verify authentication state and allowed roles (`allowedRoles={["admin"]}`), automatically redirecting unauthorized users.
- **Live Backend Readiness Indicator**: Polls the backend `/health` probe to display real-time API and PostgreSQL connection status in the top navigation bar.
- **Automated Integration Specs**: Pre-configured with Vitest, JSDOM, and React Testing Library covering authentication flows, RBAC route guards, product creation modals, and cart-to-order submission.

---

## Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| UI Library | React | 19.0.0 | Component-based UI rendering |
| Language | TypeScript | 5.7.2 | Static type checking and API contracts |
| Build Tool | Vite | 6.0.7 | Fast HMR dev server and bundler |
| Styling | Tailwind CSS | 4.0.0 | Utility-first responsive styling |
| Routing | React Router | 7.1.1 | Client-side routing and RBAC guards |
| HTTP Client | Axios | 1.7.9 | API requests and JWT refresh interceptors |
| Icons | Lucide React | 0.469.0 | Clean, consistent SVG iconography |
| Testing | Vitest & RTL | 3.0.0 / 16.1.0 | Unit and integration component testing |

---

## Project Directory Structure

```text
inventory_order_frontend/
├── .env.example                      # Environment variable template
├── index.html                        # HTML entry point
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # Root TypeScript configuration
├── tsconfig.app.json                 # Application TypeScript settings
├── tsconfig.node.json                # Vite node environment settings
├── vite.config.ts                    # Vite server (port 3000) & Vitest config
└── src/
    ├── main.tsx                      # React DOM root mount
    ├── index.css                     # Tailwind CSS v4 import
    ├── App.tsx                       # Application router and route guards
    ├── vite-env.d.ts                 # Vite environment variable types
    ├── types/
    │   └── api.ts                    # TypeScript interfaces mirroring FastAPI schemas
    ├── api/
    │   ├── client.ts                 # Axios instance, token storage & 401 refresh queue
    │   ├── auth.api.ts               # /health, /auth/login, /auth/register, /auth/refresh
    │   ├── users.api.ts              # /users/me and Admin user management API calls
    │   ├── products.api.ts           # Paginated product catalog and CRUD API calls
    │   └── orders.api.ts             # Order creation and paginated history API calls
    ├── context/
    │   └── AuthContext.tsx           # Global auth state, profile hydration & helpers
    ├── components/
    │   ├── Navbar.tsx                # Role-aware navigation bar & DB health badge
    │   └── ProtectedRoute.tsx        # Authentication and role-checking wrapper
    ├── pages/
    │   ├── LoginPage.tsx             # OAuth2 password login form
    │   ├── RegisterPage.tsx          # Customer account registration form
    │   ├── ProductsPage.tsx          # Catalog grid, search/filters, cart & Admin modal
    │   ├── OrdersPage.tsx            # Paginated orders table, Admin toggle & receipt modal
    │   └── UsersAdminPage.tsx        # Admin user provisioning, role & status controls
    └── test/
        ├── setup.ts                  # Vitest + jest-dom setup and localStorage cleanup
        ├── auth-and-rbac.spec.tsx    # Login, navigation hiding & route guard tests
        └── products-and-orders.spec.tsx # Admin product modal & order checkout tests

```

---

## Role-Based Capabilities Matrix

| Feature / Route | Guest | Standard User | Administrator |
| --- | --- | --- | --- |
| Sign In & Register (`/login`, `/register`) | Yes | Yes | Yes |
| Browse, Search & Filter Products (`/products`) | Redirects | Yes | Yes |
| Build Cart & Place Atomic Orders (`/products`) | No | Yes | Yes |
| Create, Edit & Deactivate Products (`/products`) | No | Hidden | Yes |
| View Own Order History & Receipts (`/orders`) | No | Yes | Yes |
| View All Customers' Orders Toggle (`/orders`) | No | Hidden | Yes |
| User & Role Management Console (`/users`) | Redirects | Redirects | Yes |

---

## Local Development Setup

### Prerequisites

* **Node.js 20+** and **npm**
* **FastAPI Backend** running locally on `http://127.0.0.1:8000`

### 1. Install Dependencies

```bash
cd inventory_order_frontend
npm install

```

### 2. Configure Environment Variables

Copy the example environment file to `.env`:

```bash
cp .env.example .env

```

Default `.env` configuration:

```ini
VITE_API_BASE_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
VITE_API_V1_PREFIX=/api/v1

```

### 3. Start the Development Server

```bash
npm run dev

```

* **Frontend URL**: `http://localhost:3000`
* Note: Port `3000` is pre-configured in `vite.config.ts` to match the `CORS_ORIGINS` whitelist in the FastAPI backend.

---

## Running Automated Tests

The project uses **Vitest** and **React Testing Library** to test user workflows, API payload formatting, and role-based UI restrictions without requiring a live backend server.

### Run All Tests Once (CI Mode)

```bash
npm test

```

### Run Tests in Interactive Watch Mode

```bash
npm run test:watch

```

### What the Test Suite Covers

1. **`src/test/auth-and-rbac.spec.tsx`**:
* Verifies standard user login flow, profile hydration, and hiding of Admin-only controls (`Users Management` link and `Add Product` button).
* Verifies that non-admin users attempting to navigate directly to `/users` are automatically redirected to `/products`.
* Verifies that Administrator accounts can access `/users` and view the `View all users' orders (Admin)` toggle on `/orders`.


2. **`src/test/products-and-orders.spec.tsx`**:
* Verifies that Admins can open the product modal, submit a new SKU/price/stock payload, and trigger a catalog refresh.
* Verifies adding multiple quantities to the order builder, calculating subtotals, submitting the shipping address, and rendering the order confirmation receipt banner.



---

## Building for Production

### 1. Type-Check and Bundle

```bash
npm run build

```

This runs the TypeScript compiler (`tsc -b`) to verify zero type errors across the codebase and outputs optimized static assets to the `dist/` folder.

### 2. Preview Production Build Locally

```bash
npm run preview

```

---

## Environment Variables Reference

| Variable | Default | Description |
| --- | --- | --- |
| VITE_API_BASE_URL | http://127.0.0.1:8000 | Root URL of the FastAPI backend server |
| VITE_API_V1_PREFIX | /api/v1 | Versioned API route prefix mounted by FastAPI |

```

```
