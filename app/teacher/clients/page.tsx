"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  MapPin,
  Loader2,
  RefreshCw,
  Send,
  CheckCircle2,
  Globe,
  Languages,
  Users,
} from "lucide-react";

interface ClientItem {
  id: string;
  location: string | null;
  studentClass: string | null;
  requiredSubjects: string[];
  teachingMode: string | null;
  preferredLanguage: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface Filters {
  subject: string;
  class: string;
  city: string;
  mode: string;
}

const EMPTY_FILTERS: Filters = {
  subject: "",
  class: "",
  city: "",
  mode: "",
};

export default function TeacherClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<string[]>([]);

  // Fetch students
  const fetchClients = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setLoadFailed(false);

    try {
      const params = new URLSearchParams();

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value.trim()) {
          params.set(key, value.trim());
        }
      });

      const res = await fetch(
        `/api/teacher/clients?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to load students.");
      }

      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (err) {
      setClients([]);
      setLoadFailed(true);

      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchClients(EMPTY_FILTERS);
  }, [fetchClients]);

  // Search
  const handleSearch = () => {
    void fetchClients(filters);
  };

  // Reset filters
  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    void fetchClients(EMPTY_FILTERS);
  };

  // Send connection request
  const sendRequest = async (clientId: string) => {
    if (sendingId || sentIds.includes(clientId)) return;

    setSendingId(clientId);

    const toastId = toast.loading("Sending connection request...");

    try {
      const res = await fetch("/api/teacher/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to send connection request.");
      }

      setSentIds((previous) =>
        previous.includes(clientId)
          ? previous
          : [...previous, clientId]
      );

      toast.success(
        data.message || "Connection request sent successfully.",
        { id: toastId }
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
        { id: toastId }
      );
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Find Students
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Browse students looking for teachers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchClients(filters)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Filter students
          </h2>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search subject"
            value={filters.subject}
            onChange={(e) =>
              setFilters({
                ...filters,
                subject: e.target.value,
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="h-10"
          />

          <Select
            value={filters.class}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                class: value ?? "",
              })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>

            <SelectContent>
              {Array.from({ length: 12 }, (_, i) =>
                String(i + 1)
              ).map((value) => (
                <SelectItem key={value} value={value}>
                  Class {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search city"
            value={filters.city}
            onChange={(e) =>
              setFilters({
                ...filters,
                city: e.target.value,
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="h-10"
          />

          <Select
            value={filters.mode}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                mode: value ?? "",
              })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Teaching mode" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading}
            className="h-9 gap-2 bg-indigo-600 px-5 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>
      </div>

      {/* Results heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />

          <h2 className="text-sm font-semibold text-slate-800">
            Available students
          </h2>

          {!loading && !loadFailed && (
            <Badge variant="secondary" className="text-xs">
              {clients.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading students...
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadFailed && clients.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
          <Users className="mx-auto h-9 w-9 text-slate-300" />

          <h3 className="mt-3 font-semibold text-slate-800">
            No students found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try changing your filters or check again later.
          </p>
        </div>
      )}

      {/* Client cards */}
      {!loading && !loadFailed && clients.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const name =
              [client.firstName, client.lastName]
                .filter(Boolean)
                .join(" ") || "Student / Parent";

            const isSending = sendingId === client.id;
            const isSent = sentIds.includes(client.id);

            return (
              <div
                key={client.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200"
              >
                {/* Name and location */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {name}
                    </h3>

                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />

                      <span className="truncate">
                        {client.location || "Location not specified"}
                      </span>
                    </p>
                  </div>

                  <Badge className="shrink-0 border-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                    {client.studentClass
                      ? `Class ${client.studentClass}`
                      : "Student"}
                  </Badge>
                </div>

                {/* Subjects */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Required subjects
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {client.requiredSubjects?.length ? (
                      client.requiredSubjects.map((subject) => (
                        <Badge
                          key={subject}
                          variant="secondary"
                          className="border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />

                    <span className="capitalize">
                      {client.teachingMode || "Mode not specified"}
                    </span>
                  </span>

                  {client.preferredLanguage && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Languages className="h-3.5 w-3.5 text-slate-400" />
                      {client.preferredLanguage}
                    </span>
                  )}
                </div>

                {/* Connection request */}
                <Button
                  size="sm"
                  className={`mt-4 h-9 w-full gap-2 ${
                    isSent
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                  disabled={isSending || isSent || Boolean(sendingId)}
                  onClick={() => void sendRequest(client.id)}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : isSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Request sent
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Request connection
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}