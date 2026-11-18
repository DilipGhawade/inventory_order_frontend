import React, { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { extractApiErrorMessage } from "../api/client";
import { ordersApi } from "../api/orders.api";
import { productsApi } from "../api/products.api";
import { useAuth } from "../context/AuthContext";
import type {
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
} from "../types/api";

interface CartItem {
  product: ProductResponse;
  quantity: number;
}

export const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Catalog state
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Cart / Order placement state
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [shippingAddress, setShippingAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Admin Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(
    null,
  );
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("0.00");
  const [formStock, setFormStock] = useState("0");
  const [formActive, setFormActive] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.listProducts({
        page,
        size: 9,
        search,
        active_only: activeOnly,
        in_stock_only: inStockOnly,
      });
      setProducts(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeOnly, inStockOnly]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormSku("");
    setFormName("");
    setFormDescription("");
    setFormPrice("99.99");
    setFormStock("10");
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductResponse) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormDescription(product.description ?? "");
    setFormPrice(String(product.price));
    setFormStock(String(product.stock_quantity));
    setFormActive(product.is_active);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setError(null);
    try {
      if (editingProduct) {
        const updatePayload: ProductUpdateRequest = {
          name: formName,
          description: formDescription || null,
          price: Number(formPrice),
          stock_quantity: Number(formStock),
          is_active: formActive,
        };
        await productsApi.updateProduct(editingProduct.id, updatePayload);
        setBannerMessage(`Updated product "${formName}" successfully.`);
      } else {
        const createPayload: ProductCreateRequest = {
          sku: formSku,
          name: formName,
          description: formDescription || null,
          price: Number(formPrice),
          stock_quantity: Number(formStock),
          is_active: formActive,
        };
        await productsApi.createProduct(createPayload);
        setBannerMessage(
          `Created product "${formName}" (${formSku.toUpperCase()}).`,
        );
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeactivateProduct = async (product: ProductResponse) => {
    setError(null);
    try {
      await productsApi.deleteProduct(product.id);
      setBannerMessage(`Deactivated "${product.name}" (SKU: ${product.sku}).`);
      await fetchProducts();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  const addToCart = (product: ProductResponse) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const nextQty = existing ? existing.quantity + 1 : 1;
      if (nextQty > product.stock_quantity) {
        setError(
          `Only ${product.stock_quantity} units of "${product.name}" are available.`,
        );
        return prev;
      }
      setError(null);
      return {
        ...prev,
        [product.id]: { product, quantity: nextQty },
      };
    });
  };

  const updateCartQty = (productId: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      const item = prev[productId];
      if (!item) return prev;
      return {
        ...prev,
        [productId]: { ...item, quantity },
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setPlacingOrder(true);
    setError(null);
    setBannerMessage(null);
    try {
      const createdOrder = await ordersApi.createOrder({
        shipping_address: shippingAddress,
        items: cartItems.map((entry) => ({
          product_id: entry.product.id,
          quantity: entry.quantity,
        })),
      });
      setCart({});
      setShippingAddress("");
      setBannerMessage(
        `Order #${createdOrder.id} confirmed! Total charged: $${Number(
          createdOrder.total_amount,
        ).toFixed(2)}.`,
      );
      await fetchProducts();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Browse available catalog ({total} total items) and place atomic
            orders.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      {bannerMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by product name, SKU, or description..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setPage(1);
              setInStockOnly(e.target.checked);
            }}
            className="rounded border-slate-300 text-indigo-600"
          />
          In stock only
        </label>

        {isAdmin && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setPage(1);
                setActiveOnly(e.target.checked);
              }}
              className="rounded border-slate-300 text-indigo-600"
            />
            Active products only
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Cards Grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No products matched your current filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                        {product.sku}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          !product.is_active
                            ? "bg-slate-200 text-slate-600"
                            : product.stock_quantity > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {!product.is_active
                          ? "Inactive"
                          : product.stock_quantity > 0
                            ? `${product.stock_quantity} in stock`
                            : "Out of stock"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-base font-bold text-slate-900">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        ${Number(product.price).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        disabled={
                          !product.is_active || product.stock_quantity <= 0
                        }
                        onClick={() => addToCart(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Order
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {product.is_active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivateProduct(product)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-rose-200 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span className="text-slate-600">
                Page <strong>{page}</strong> of <strong>{pages}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Builder / Cart Sidebar */}
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Current Order ({cartItems.length})
            </h2>
          </div>

          {cartItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Select products from the catalog to build a new order.
            </p>
          ) : (
            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-4">
              <ul className="divide-y divide-slate-100">
                {cartItems.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${Number(product.price).toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={product.stock_quantity}
                        aria-label={`Quantity for ${product.name}`}
                        value={quantity}
                        onChange={(e) =>
                          updateCartQty(product.id, Number(e.target.value))
                        }
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-xs"
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
                <span>Estimated Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <div>
                <label
                  htmlFor="shipping-address"
                  className="block text-xs font-medium text-slate-700"
                >
                  Shipping Address (min 10 chars)
                </label>
                <textarea
                  id="shipping-address"
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="742 Evergreen Terrace, Springfield, IL 62701"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {placingOrder ? "Submitting Order..." : "Confirm & Place Order"}
              </button>
            </form>
          )}
        </aside>
      </div>

      {/* Admin Create / Edit Product Modal */}
      {isAdmin && isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2
                id="product-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="prod-sku"
                  className="block text-xs font-medium text-slate-700"
                >
                  SKU (Alphanumeric, hyphens, underscores)
                </label>
                <input
                  id="prod-sku"
                  type="text"
                  required
                  disabled={Boolean(editingProduct)}
                  pattern="^[A-Za-z0-9\-_]+$"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="MBP-16-M4"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="prod-name"
                  className="block text-xs font-medium text-slate-700"
                >
                  Product Name
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  minLength={2}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="MacBook Pro 16-inch"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="prod-desc"
                  className="block text-xs font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prod-price"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Unit Price ($)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-stock"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Stock Quantity
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                Active in catalog
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingProduct ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
