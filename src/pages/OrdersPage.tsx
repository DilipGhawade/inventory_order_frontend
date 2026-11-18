import React, { useCallback, useEffect, useState } from "react";
import { Eye, ShoppingBag, X } from "lucide-react";
import { extractApiErrorMessage } from "../api/client";
import { ordersApi } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";
import type { OrderResponse } from "../types/api";

export const OrdersPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [allUsers, setAllUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.listOrders({
        page,
        size: 10,
        all_users: isAdmin ? allUsers : false,
      });
      setOrders(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, allUsers, isAdmin]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleInspectOrder = async (orderId: number) => {
    try {
      const freshOrder = await ordersApi.getOrder(orderId);
      setSelectedOrder(freshOrder);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin && allUsers ? "All System Orders" : "My Orders"}
          </h1>
          <p className="text-sm text-slate-500">
            Showing {total} confirmed order records.
          </p>
        </div>

        {isAdmin && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900">
            <input
              type="checkbox"
              checked={allUsers}
              onChange={(e) => {
                setPage(1);
                setAllUsers(e.target.checked);
              }}
              className="rounded border-amber-400 text-amber-600"
            />
            View all users&apos; orders (Admin)
          </label>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            No orders found yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                {isAdmin && allUsers && <th className="px-4 py-3">User ID</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Line Items</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    #{order.id}
                  </td>
                  {isAdmin && allUsers && (
                    <td className="px-4 py-3 text-slate-600">
                      User #{order.user_id}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-emerald-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.items.length} item(s)
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    ${Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleInspectOrder(order.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span>
            Page <strong>{page}</strong> of <strong>{pages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Receipt Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Order #{selectedOrder.id} Receipt
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close receipt"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-600">
                <strong>Shipping Address:</strong>{" "}
                {selectedOrder.shipping_address}
              </p>

              <div className="rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {item.product?.name ?? `Product #${item.product_id}`}
                          {item.product?.sku && (
                            <span className="ml-1.5 font-mono text-slate-400">
                              ({item.product.sku})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ${Number(item.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2 text-base font-bold text-slate-900">
                <span>Total Paid</span>
                <span>${Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
