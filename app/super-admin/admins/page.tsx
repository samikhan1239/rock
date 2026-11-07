"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Users,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  createdAt: string;
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch admins");
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error("Fetch admins error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching admins."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial API request
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAdmins();
  }, [fetchAdmins]);

  // Add admin
  const addAdmin = async () => {
    setSuccess("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter an email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setAdding(true);

    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add admin.");
      }

      setEmail("");
      setSuccess("Admin added successfully.");

      await fetchAdmins();
    } catch (err) {
      console.error("Add admin error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding admin."
      );
    } finally {
      setAdding(false);
    }
  };

  // Remove admin
  const removeAdmin = async (adminId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this admin? Their admin access will be revoked."
    );

    if (!confirmed) return;

    setSuccess("");
    setError("");
    setRemovingId(adminId);

    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove admin.");
      }

      setSuccess("Admin removed successfully.");

      await fetchAdmins();
    } catch (err) {
      console.error("Remove admin error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while removing admin."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const getAdminName = (admin: AdminUser) => {
    const name = [admin.firstName, admin.lastName]
      .filter(Boolean)
      .join(" ");

    return name || "Unnamed Admin";
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Manage Admins
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage administrator access and permissions.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchAdmins()}
          disabled={loading}
          className="h-9 gap-2 border-slate-200 bg-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Administrators
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? (
                  <span className="text-lg text-slate-400">...</span>
                ) : (
                  admins.length
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registered platform admins
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Platform Access
              </p>

              <p className="mt-2 text-2xl font-bold text-indigo-600">
                Controlled
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Managed by Super Admin
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-sm text-red-700">{error}</p>
          </div>

          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />

            <p className="text-sm text-blue-700">{success}</p>
          </div>

          <button
            onClick={() => setSuccess("")}
            className="text-blue-500 hover:text-blue-700"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Admin */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Plus className="h-4 w-4 text-indigo-600" />
            Add New Administrator
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-full max-w-lg">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  type="email"
                  placeholder="Enter admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !adding) {
                      void addAdmin();
                    }
                  }}
                  disabled={adding}
                  className="h-10 pl-10"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                The user must already have an account. Their platform role
                will be changed to ADMIN.
              </p>
            </div>

            <Button
              onClick={() => void addAdmin()}
              disabled={adding || !email.trim()}
              className="h-10 gap-2 bg-indigo-600 px-5 text-white hover:bg-indigo-700"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Admin
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Current Administrators
            </CardTitle>

            <p className="mt-1 text-xs text-slate-500">
              Users who currently have administrator access.
            </p>
          </div>

          <Badge
            variant="secondary"
            className="border border-indigo-100 bg-indigo-50 text-indigo-700"
          >
            {admins.length} Admins
          </Badge>
        </CardHeader>

        <CardContent className="p-0">

          {/* Loading */}
          {loading && admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                Loading administrators...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while we fetch the latest data.
              </p>
            </div>
          ) : admins.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No administrators found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                There are currently no administrators registered. Add an
                administrator to help manage TutorSathi.
              </p>
            </div>
          ) : (
            /* Admin Rows */
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                      {getAdminName(admin)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {getAdminName(admin)}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {admin.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Added{" "}
                        {new Date(admin.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Badge
                      variant="secondary"
                      className="border border-blue-100 bg-blue-50 text-blue-700"
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {admin.status}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={removingId === admin.id}
                      onClick={() => void removeAdmin(admin.id)}
                      className="h-9 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {removingId === admin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      <span className="hidden sm:inline">
                        Remove
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refreshing indicator */}
          {loading && admins.length > 0 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-3 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating administrators...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}