import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  Users,
} from "lucide-react";
import { authApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import type { HealthResponse } from "../types/api";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const pollHealth = async () => {
      try {
        const res = await authApi.checkHealth();
        if (active) {
          setHealth(res);
          setHealthError(false);
        }
      } catch {
        if (active) {
          setHealthError(true);
        }
      }
    };
    void pollHealth();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/products"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
          >
            <Package className="h-6 w-6 text-indigo-600" />
            <span>InventoryOS</span>
          </Link>

          {isAuthenticated && (
            <nav
              className="flex items-center gap-1"
              aria-label="Main Navigation"
            >
              <NavLink to="/products" className={navLinkClass}>
                <Package className="h-4 w-4" />
                Products
              </NavLink>
              <NavLink to="/orders" className={navLinkClass}>
                <ShoppingBag className="h-4 w-4" />
                Orders
              </NavLink>
              {isAdmin && (
                <NavLink to="/users" className={navLinkClass}>
                  <Users className="h-4 w-4" />
                  Users Management
                </NavLink>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              healthError
                ? "bg-rose-50 text-rose-700"
                : health?.status === "healthy"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
            }`}
            title="Backend & PostgreSQL Readiness Status"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>
              {healthError
                ? "API Offline"
                : health
                  ? `DB: ${health.database}`
                  : "Checking API..."}
            </span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2 text-sm">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <UserIcon className="h-3.5 w-3.5" />
                    USER
                  </span>
                )}
                <span className="hidden font-medium text-slate-700 sm:inline">
                  {user.full_name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
