"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock3,
  Users,
  GraduationCap,
  MapPin,
  CalendarDays,
  ArrowRight,
  Loader2,
  AlertCircle,
  UserRound,
  Filter,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  status: string;
  createdAt: string;
  adminNotes?: string | null;
  initiatedBy?: "TEACHER" | "CLIENT";

  client: {
    user: {
      firstName: string | null;
      lastName: string | null;
    };
    location: string | null;
    studentClass: string | null;
  };

  teacher: {
    id?: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
    city: string | null;
  };
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

type DirectionFilter =
  | "ALL"
  | "TEACHER"
  | "CLIENT";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  CONNECTION_ESTABLISHED:
    "bg-indigo-50 text-indigo-700 border-indigo-200",
  HIRING_CONFIRMED:
    "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
};

const getFullName = (
  firstName: string | null,
  lastName: string | null
) => {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unnamed User";
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getInitiator = (request: RequestItem) => {
  if (request.initiatedBy) {
    return request.initiatedBy;
  }

  return request.adminNotes
    ?.toLowerCase()
    .includes("requested by client")
    ? "CLIENT"
    : "TEACHER";
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>("ALL");

  const [error, setError] = useState<string | null>(null);

const fetchRequests = useCallback(async (showRefresh = false) => {
  if (showRefresh) {
    setRefreshing(true);
  }

  setError(null);

  try {
    const response = await fetch("/api/admin/requests", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch requests");
    }

    setRequests(data.requests || []);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Something went wrong";

    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    const confirmed = window.confirm(
      action === "approve"
        ? "Are you sure you want to approve this connection request?"
        : "Are you sure you want to reject this connection request?"
    );

    if (!confirmed) return;

    setActionLoading(requestId);

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action failed");
      }

      toast.success(
        action === "approve"
          ? "Connection request approved"
          : "Connection request rejected"
      );

      await fetchRequests(true);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (request) => request.status === "PENDING"
      ).length,
      approved: requests.filter(
        (request) => request.status === "APPROVED"
      ).length,
      rejected: requests.filter(
        (request) => request.status === "REJECTED"
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim();

    return requests.filter((request) => {
      const clientName = getFullName(
        request.client.user.firstName,
        request.client.user.lastName
      );

      const teacherName = getFullName(
        request.teacher.user.firstName,
        request.teacher.user.lastName
      );

      const matchesSearch =
        !query ||
        clientName.toLowerCase().includes(query) ||
        teacherName.toLowerCase().includes(query) ||
        (request.client.location || "").toLowerCase().includes(query) ||
        (request.teacher.city || "").toLowerCase().includes(query) ||
        (request.client.studentClass || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      const initiator = getInitiator(request);

      const matchesDirection =
        directionFilter === "ALL" ||
        initiator === directionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDirection
      );
    });
  }, [requests, search, statusFilter, directionFilter]);

  const statusTabs: {
    label: string;
    value: StatusFilter;
    count: number;
  }[] = [
    { label: "All Requests", value: "ALL", count: counts.total },
    { label: "Pending", value: "PENDING", count: counts.pending },
    { label: "Approved", value: "APPROVED", count: counts.approved },
    { label: "Rejected", value: "REJECTED", count: counts.rejected },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Connection Requests
            </h1>

            <Badge className="border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
              Admin
            </Badge>
          </div>

          <p className="text-sm text-slate-500">
            Review and manage connection requests between teachers and clients.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchRequests(true)}
          disabled={loading || refreshing}
          className="border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={counts.total}
          icon={<Users className="h-5 w-5" />}
          color="indigo"
        />

        <StatCard
          title="Pending Review"
          value={counts.pending}
          icon={<Clock3 className="h-5 w-5" />}
          color="amber"
        />

        <StatCard
          title="Approved"
          value={counts.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
        />

        <StatCard
          title="Rejected"
          value={counts.rejected}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Main content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3 sm:px-5">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  statusFilter === tab.value
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search teacher, client, city or class..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Direction filter */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />

              <button
                onClick={() => setDirectionFilter("ALL")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  directionFilter === "ALL"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Directions
              </button>

              <button
                onClick={() => setDirectionFilter("TEACHER")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  directionFilter === "TEACHER"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Teacher → Client
              </button>

              <button
                onClick={() => setDirectionFilter("CLIENT")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  directionFilter === "CLIENT"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Client → Teacher
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
        </div>

        {/* Request list */}
        <div className="divide-y divide-slate-100">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-3 h-7 w-7 animate-spin text-indigo-600" />
              <p className="text-sm text-slate-500">
                Loading connection requests...
              </p>
            </div>
          ) : error && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <AlertCircle className="mb-3 h-9 w-9 text-red-400" />

              <h3 className="font-semibold text-slate-800">
                Unable to load requests
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {error}
              </p>

              <Button
                onClick={() => fetchRequests()}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Try Again
              </Button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="font-semibold text-slate-800">
                {requests.length === 0
                  ? "No connection requests yet"
                  : "No matching requests"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {requests.length === 0
                  ? "New requests from teachers and clients will appear here."
                  : "Try changing your search or filters."}
              </p>

              {(search ||
                statusFilter !== "ALL" ||
                directionFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setDirectionFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            filteredRequests.map((request) => {
              const clientName = getFullName(
                request.client.user.firstName,
                request.client.user.lastName
              );

              const teacherName = getFullName(
                request.teacher.user.firstName,
                request.teacher.user.lastName
              );

              const initiator = getInitiator(request);

              const isPending = request.status === "PENDING";

              const isActionLoading =
                actionLoading === request.id;

              return (
                <div
                  key={request.id}
                  className="p-4 transition hover:bg-slate-50/70 sm:p-5"
                >
                  {/* Top row */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          initiator === "TEACHER"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-violet-200 bg-violet-50 text-violet-700"
                        }
                      >
                        {initiator === "TEACHER"
                          ? "Teacher initiated"
                          : "Client initiated"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          statusStyles[request.status] ||
                          "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {request.status.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />

                      {new Date(request.createdAt).toLocaleString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>

                  {/* Teacher and client */}
                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">

                    {/* Teacher */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {getInitials(teacherName)}
                      </div>

                      <div className="min-w-0">
                        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Teacher
                        </p>

                        <h3 className="truncate font-semibold text-slate-900">
                          {teacherName}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {request.teacher.city || "Location not provided"}
                        </div>
                      </div>
                    </div>

                    {/* Direction */}
                    <div className="hidden items-center justify-center md:flex">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white">
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Client */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-semibold text-violet-700">
                        {getInitials(clientName)}
                      </div>

                      <div className="min-w-0">
                        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Client
                        </p>

                        <h3 className="truncate font-semibold text-slate-900">
                          {clientName}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {request.client.location || "Location not provided"}
                          </span>

                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {request.client.studentClass || "Class not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <UserRound className="h-3.5 w-3.5" />

                      Request initiated by{" "}
                      <span className="font-semibold text-slate-700">
                        {initiator === "TEACHER"
                          ? teacherName
                          : clientName}
                      </span>
                    </div>

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleAction(request.id, "approve")
                          }
                          className="h-9 bg-indigo-600 px-4 text-white hover:bg-indigo-700"
                        >
                          {isActionLoading ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          )}
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleAction(request.id, "reject")
                          }
                          className="h-9 border-red-200 px-4 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {isActionLoading ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-1.5 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        No action available
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && filteredRequests.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-500">
              Showing {filteredRequests.length} requests
            </p>

            <button
              onClick={() => fetchRequests(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Update list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "indigo" | "amber" | "emerald" | "red";
}) {
  const styles = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-700",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-700",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-700",
    },
    red: {
      icon: "bg-red-50 text-red-600",
      value: "text-red-700",
    },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">
          {title}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles[color].icon}`}
        >
          {icon}
        </div>
      </div>

      <p className={`mt-3 text-2xl font-bold ${styles[color].value}`}>
        {value}
      </p>
    </div>
  );
}