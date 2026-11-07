"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
  UserRound,
  ClipboardList,
  RefreshCw,
  LayoutDashboard,
  AlertCircle,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type DashboardStats = {
  totalTeachers: number;
  pendingTeachers: number;
  approvedTeachers: number;
  totalClients: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
};

const initialStats: DashboardStats = {
  totalTeachers: 0,
  pendingTeachers: 0,
  approvedTeachers: 0,
  totalClients: 0,
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
};

const overviewCards = [
  {
    key: "totalTeachers",
    label: "Total Teachers",
    icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    key: "approvedTeachers",
    label: "Approved Teachers",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "totalClients",
    label: "Total Clients",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "totalRequests",
    label: "Total Requests",
    icon: ClipboardList,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
] as const;

const managementItems = [
  {
    title: "Teacher Management",
    description: "Review teacher profiles, AI evaluations and verification.",
    href: "/admin/teachers",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Connection Requests",
    description: "Approve or reject requests between teachers and clients.",
    href: "/admin/requests",
    icon: ClipboardList,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Client Management",
    description: "View registered clients and their profile information.",
    href: "/admin/clients",
    icon: UserRound,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Payment Management",
    description: "Monitor registration payments and transactions.",
    href: "/admin/payments",
    icon: Activity,
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

const fetchStats = useCallback(async (refresh = false) => {
  if (refresh) {
    setRefreshing(true);
  }

  try {
    const response = await fetch("/api/admin/stats", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch dashboard statistics");
    }

    setStats({
      ...initialStats,
      ...data.stats,
    });

    setError("");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";

    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void fetchStats();
}, [fetchStats]);

  const statValue = (key: keyof DashboardStats) =>
    stats[key].toLocaleString("en-IN");

  return (
    <div className="min-h-screen space-y-7 bg-[#F8FAFF] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-600">
            <LayoutDashboard className="h-4 w-4" />
            ADMIN PANEL
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor TutorSathi activities and manage approvals.
          </p>
        </div>

        <button
          onClick={() => void fetchStats(true)}
          disabled={loading || refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>

          <button
            onClick={() => void fetchStats(true)}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending Approval Cards */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Requires Your Attention
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Items waiting for administrative approval.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Pending Teachers */}
          <Link
            href="/admin/teachers"
            className="group flex items-center justify-between rounded-xl border border-amber-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-md hover:shadow-amber-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <GraduationCap className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">
                  Pending Teacher Approvals
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                  ) : (
                    statValue("pendingTeachers")
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Teachers waiting for verification
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-amber-600" />
          </Link>

          {/* Pending Requests */}
          <Link
            href="/admin/requests"
            className="group flex items-center justify-between rounded-xl border border-indigo-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ClipboardList className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">
                  Pending Connection Requests
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                  ) : (
                    statValue("pendingRequests")
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Requests waiting for admin approval
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-indigo-600" />
          </Link>
        </div>
      </section>

      {/* Platform Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Platform Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Overall TutorSathi registration and activity statistics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  ) : (
                    statValue(item.key)
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Request Statistics */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Connection Request Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current status of all client connection requests.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900">
                {loading ? "—" : statValue("pendingRequests")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Approved</p>
              <p className="text-xl font-bold text-slate-900">
                {loading ? "—" : statValue("approvedRequests")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Rejected</p>
              <p className="text-xl font-bold text-slate-900">
                {loading ? "—" : statValue("rejectedRequests")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Management */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Access your administrative management sections.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {managementItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-slate-200 pt-5 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          TutorSathi Admin Dashboard
        </span>

        <span>Administrative Workspace</span>
      </footer>
    </div>
  );
}