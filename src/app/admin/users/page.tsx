"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  email: string;
  name: string;
  addedAt: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string): string {
  if (!iso) return "---";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Add form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);

  const [removing, setRemoving] = useState<string | null>(null);

  const myEmail = user?.email?.toLowerCase() || null;

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => null);
        setMessage(`Error: ${err?.error || "Failed to load admins"}`);
      }
    } catch {
      setMessage("Error: Failed to load admins");
    }
    setLoading(false);
  }

  async function addAdmin() {
    const email = newEmail.trim().toLowerCase();
    setFormError("");

    if (!email || !EMAIL_REGEX.test(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: newName.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setNewEmail("");
        setNewName("");
        setMessage(`${email} added as admin`);
        setTimeout(() => setMessage(""), 3000);
        await fetchAdmins();
      } else {
        setFormError(data?.error || "Failed to add admin");
      }
    } catch {
      setFormError("Failed to add admin");
    }
    setAdding(false);
  }

  async function removeAdmin(email: string) {
    if (
      !confirm(
        `Remove admin access for ${email}? They will no longer be able to manage TrailTap content.`
      )
    ) {
      return;
    }

    setRemoving(email);
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/users?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.email !== email));
        setMessage("Admin removed");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const err = await res.json().catch(() => null);
        setMessage(`Error: ${err?.error || "Failed to remove admin"}`);
      }
    } catch {
      setMessage("Error: Failed to remove admin");
    }
    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <title>TrailTap | Admin Users</title>
      <header className="sticky top-0 z-10 bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Admin Users</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              message.startsWith("Error")
                ? "bg-error-container text-on-error-container"
                : "bg-tertiary-container text-on-tertiary-container"
            }`}
          >
            {message}
          </div>
        )}

        {/* Info note */}
        <div className="bg-primary-container text-on-primary-container rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined shrink-0">info</span>
          <p className="text-sm font-semibold">
            The person must first create an account on the site (Sign up) using
            this exact email address — Google sign-in with that address also
            works. Admin access starts working the next time they sign in.
          </p>
        </div>

        {/* Add admin form */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Add Admin
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setFormError("");
                }}
                placeholder="Email address"
                className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (optional)"
                className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {formError && (
              <p className="text-xs font-bold text-error">{formError}</p>
            )}
            <button
              onClick={addAdmin}
              disabled={adding || !newEmail.trim()}
              className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                person_add
              </span>
              {adding ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </section>

        {/* Admin table */}
        <section className="bg-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container">
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs hidden sm:table-cell">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs hidden sm:table-cell">
                    Added
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-on-surface-variant text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = myEmail === admin.email.toLowerCase();
                  return (
                    <tr
                      key={admin.email}
                      className="border-t border-outline-variant/10 hover:bg-surface-container-low/50"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {admin.email}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">
                        {admin.name || "---"}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant hidden sm:table-cell">
                        {formatDate(admin.addedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeAdmin(admin.email)}
                          disabled={isSelf || removing === admin.email}
                          title={
                            isSelf
                              ? "You can't remove your own admin access"
                              : "Remove admin access"
                          }
                          className={`p-1.5 rounded-full ${
                            isSelf
                              ? "text-on-surface-variant opacity-40 cursor-not-allowed"
                              : "hover:bg-error-container text-error"
                          } disabled:opacity-40`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            person_remove
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {admins.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-on-surface-variant italic"
                    >
                      No admins found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-on-surface-variant text-center">
          {admins.length} admin{admins.length === 1 ? "" : "s"}
        </p>
      </main>
    </div>
  );
}
