import React, { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { extractApiErrorMessage } from "../api/client";
import { usersApi } from "../api/users.api";
import type { UserResponse, UserRole } from "../types/api";

export const UsersAdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await usersApi.listUsers(0, 100);
      setUsers(list);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await usersApi.createUserByAdmin({
        email: newEmail,
        full_name: newName,
        password: newPassword,
        role: newRole,
        is_active: true,
      });
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
      setSuccess(`Created account ${created.email} (${created.role}).`);
      await loadUsers();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (user: UserResponse, role: UserRole) => {
    setError(null);
    try {
      await usersApi.updateUserByAdmin(user.id, { role });
      setSuccess(`Updated ${user.email} role to ${role}.`);
      await loadUsers();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  const handleToggleActive = async (user: UserResponse) => {
    setError(null);
    try {
      await usersApi.updateUserByAdmin(user.id, { is_active: !user.is_active });
      setSuccess(
        `${user.is_active ? "Deactivated" : "Activated"} account ${user.email}.`,
      );
      await loadUsers();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          User &amp; Role Administration
        </h1>
        <p className="text-sm text-slate-500">
          Provision new accounts and manage RBAC roles and active status.
        </p>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
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

      {/* Admin Create User Form */}
      <form
        onSubmit={handleCreateUser}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5"
      >
        <input
          type="text"
          required
          minLength={2}
          placeholder="Full Name"
          aria-label="New user full name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          required
          placeholder="Email Address"
          aria-label="New user email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ chars)"
          aria-label="New user password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          aria-label="New user role"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as UserRole)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="user">Standard User</option>
          <option value="admin">Administrator</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {creating ? "Creating..." : "Create User"}
        </button>
      </form>

      {/* Users Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading user directory...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    #{u.id}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Role for ${u.email}`}
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u, e.target.value as UserRole)
                      }
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
