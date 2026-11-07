"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Users,
  UserCheck,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface Stats {
  totalTeachers: number;
  totalClients: number;
  totalAdmins: number;
  pendingTeachers: number;
  totalRequests: number;
  approvedRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const INITIAL_STATS: Stats = {
  totalTeachers: 0,
  totalClients: 0,
  totalAdmins: 0,
  pendingTeachers: 0,
  totalRequests: 0,
  approvedRequests: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
};

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/super-admin/stats", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to load platform statistics."
        );
      }

      if (!data.stats) {
        throw new Error("Invalid statistics response from server.");
      }

      setStats({
        totalTeachers: data.stats.totalTeachers ?? 0,
        totalClients: data.stats.totalClients ?? 0,
        totalAdmins: data.stats.totalAdmins ?? 0,
        pendingTeachers: data.stats.pendingTeachers ?? 0,
        totalRequests: data.stats.totalRequests ?? 0,
        approvedRequests: data.stats.approvedRequests ?? 0,
        totalRevenue: data.stats.totalRevenue ?? 0,
        monthlyRevenue: data.stats.monthlyRevenue ?? 0,
      });
    } catch (err) {
      console.error("Super admin dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading statistics."
      );
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Fetch statistics after the component mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const statCards = [
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      subtitle: `${stats.pendingTeachers} pending verification`,
      icon: UserCheck,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      subtitle: "Registered platform clients",
      icon: Users,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Connection Requests",
      value: stats.totalRequests,
      subtitle: `${stats.approvedRequests} approved`,
      icon: TrendingUp,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: `${formatCurrency(stats.monthlyRevenue)} this month`,
      icon: CreditCard,
      iconClass: "bg-sky-50 text-sky-600",
    },
  ];

  if (loading && !hasLoaded) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>

        <p className="text-sm font-medium text-slate-700">
          Loading platform overview...
        </p>

        <p className="text-xs text-slate-400">
          Fetching your latest platform statistics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Super Admin
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your TutorSathi platform, users, requests and revenue.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchStats()}
          disabled={loading}
          className="h-9 border-slate-200 bg-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load dashboard statistics
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void fetchStats()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Main Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="border-slate-200 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>

                    <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                      {item.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {item.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Information */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Platform Health */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">
                Platform Health
              </CardTitle>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Overview of your platform activity
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Total Administrators
              </span>

              <span className="font-semibold text-slate-900">
                {stats.totalAdmins}
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Pending Teacher Approvals
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  stats.pendingTeachers > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {stats.pendingTeachers} Pending
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Successful Connections
              </span>

              <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
                {stats.approvedRequests}
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Total Connection Requests
              </span>

              <span className="font-semibold text-slate-900">
                {stats.totalRequests}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">
                Revenue Summary
              </CardTitle>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Platform earnings at a glance
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Total Revenue
              </span>

              <span className="font-semibold text-slate-900">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Revenue This Month
              </span>

              <span className="font-semibold text-blue-600">
                {formatCurrency(stats.monthlyRevenue)}
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Registration Fees
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Coming soon
              </span>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="rounded-lg bg-indigo-50 p-3">
              <p className="text-xs font-medium text-indigo-700">
                Total platform earnings
              </p>

              <p className="mt-1 text-xl font-bold text-indigo-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated / Loading Indicator */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          {error
            ? "Showing previously loaded statistics, if available."
            : "Platform statistics"}
        </p>

        {loading && hasLoaded && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating...
          </div>
        )}
      </div>
    </div>
  );
}