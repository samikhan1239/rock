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
  GraduationCap,
  BookOpen,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Clock3,
  UserRound,
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

function ClientCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-slate-100" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>

        <div className="h-6 w-16 rounded-full bg-slate-100" />
      </div>

      <div className="mt-6 space-y-2">
        <div className="h-3 w-28 rounded bg-slate-100" />

        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-6 w-14 rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
      </div>

      <div className="mt-5 h-10 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

export default function TeacherClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<string[]>([]);

  // Build search parameters.
  const buildSearchParams = (activeFilters: Filters) => {
    const params = new URLSearchParams();

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    });

    return params.toString();
  };

  // Fetch clients.
  const fetchClients = useCallback(
    async (
      activeFilters: Filters,
      signal?: AbortSignal
    ) => {
      setLoading(true);
      setLoadFailed(false);

      try {
        const query = buildSearchParams(activeFilters);

        const res = await fetch(
          `/api/teacher/clients${query ? `?${query}` : ""}`,
          {
            cache: "no-store",
            signal,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Unable to load students."
          );
        }

        setClients(
          Array.isArray(data.clients) ? data.clients : []
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setClients([]);
        setLoadFailed(true);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load students."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Automatic search with debounce.
  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      void fetchClients(filters, controller.signal);
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, fetchClients]);

  // Update individual filters.
  const updateFilter = (
    key: keyof Filters,
    value: string
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Reset filters.
  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
  };

  // Check whether any filters are active.
  const hasActiveFilters = Object.values(filters).some(
    (value) => value.trim() !== ""
  );

  // Send connection request.
  const sendRequest = async (clientId: string) => {
    if (sendingId || sentIds.includes(clientId)) return;

    setSendingId(clientId);

    const toastId = toast.loading(
      "Sending connection request..."
    );

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
        throw new Error(
          data.error || "Unable to send connection request."
        );
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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
        { id: toastId }
      );
    } finally {
      setSendingId(null);
    }
  };

  // Manual refresh.
  const handleRefresh = () => {
    void fetchClients(filters);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#F8FAFF]">
      <div className="mx-auto w-full max-w-[1440px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* PAGE HEADER */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />

              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                Student Marketplace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Find your next student
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Discover students looking for qualified teachers.
              Explore their learning requirements and send a
              connection request.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 gap-2 self-start rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh results
          </Button>
        </section>

        {/* SEARCH SECTION */}
        <section className="overflow-hidden rounded-2xl border border-[#E3E9F8] bg-white shadow-sm">
          {/* Search heading */}
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <SlidersHorizontal size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Find matching students
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Results update automatically as you change
                  your filters.
                </p>
              </div>
            </div>
          </div>

          {/* Search fields */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* SUBJECT */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Subject
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    placeholder="e.g. Mathematics"
                    value={filters.subject}
                    onChange={(e) =>
                      updateFilter("subject", e.target.value)
                    }
                    className="h-11 rounded-xl border-slate-200 pl-9 pr-9 text-sm focus-visible:ring-indigo-500"
                  />

                  {filters.subject && (
                    <button
                      type="button"
                      onClick={() =>
                        updateFilter("subject", "")
                      }
                      aria-label="Clear subject"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* CLASS */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Student class
                </label>

                <Select
                  value={filters.class}
                  onValueChange={(value) =>
                    updateFilter("class", value ?? "")
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm focus:ring-indigo-500">
                    <SelectValue placeholder="All classes" />
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
              </div>

              {/* CITY */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  City or location
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    placeholder="e.g. Indore"
                    value={filters.city}
                    onChange={(e) =>
                      updateFilter("city", e.target.value)
                    }
                    className="h-11 rounded-xl border-slate-200 pl-9 pr-9 text-sm focus-visible:ring-indigo-500"
                  />

                  {filters.city && (
                    <button
                      type="button"
                      onClick={() => updateFilter("city", "")}
                      aria-label="Clear city"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* TEACHING MODE */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Teaching mode
                </label>

                <Select
                  value={filters.mode}
                  onValueChange={(value) =>
                    updateFilter("mode", value ?? "")
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm focus:ring-indigo-500">
                    <SelectValue placeholder="Any mode" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="online">
                      Online
                    </SelectItem>

                    <SelectItem value="offline">
                      Offline
                    </SelectItem>

                    <SelectItem value="both">
                      Both
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* FILTER FOOTER */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles size={14} className="text-indigo-500" />

                <span>
                  Smart search updates as you type
                </span>

                {loading && (
                  <Loader2
                    size={13}
                    className="animate-spin text-indigo-600"
                  />
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  <RotateCcw size={13} />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RESULTS HEADER */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Available students
                </h2>

                {!loading && !loadFailed && (
                  <Badge className="border-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                    {clients.length} found
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Explore student requirements and connect with
                potential learners.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock3 size={13} />
              <span>Recently updated results</span>
            </div>
          </div>
        </section>

        {/* LOADING SKELETONS */}
        {loading && (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading students"
            aria-busy="true"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <ClientCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && loadFailed && (
          <div className="rounded-2xl border border-red-100 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={23} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              Unable to load students
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Something went wrong while retrieving student
              information. Please check your connection and try
              again.
            </p>

            <Button
              onClick={handleRefresh}
              className="mt-5 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw size={15} />
              Try again
            </Button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !loadFailed && clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Users size={26} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No students found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {hasActiveFilters
                ? "We couldn't find students matching these filters. Try a different subject, city, class, or teaching mode."
                : "There are no student requests available right now. Check back later for new opportunities."}
            </p>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="mt-5 gap-2 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <RotateCcw size={14} />
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* CLIENT CARDS */}
        {!loading && !loadFailed && clients.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => {
              const name =
                [client.firstName, client.lastName]
                  .filter(Boolean)
                  .join(" ") || "Student / Parent";

              const isSending = sendingId === client.id;
              const isSent = sentIds.includes(client.id);

              return (
                <article
                  key={client.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40"
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-600">
                        <UserRound size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {name}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin
                            size={12}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {client.location ||
                              "Location not specified"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <Badge className="shrink-0 border-0 bg-blue-50 text-blue-700 hover:bg-blue-50">
                      {client.studentClass
                        ? `Class ${client.studentClass}`
                        : "Student"}
                    </Badge>
                  </div>

                  {/* DIVIDER */}
                  <div className="my-5 border-t border-slate-100" />

                  {/* SUBJECTS */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen
                        size={14}
                        className="text-indigo-500"
                      />

                      <p className="text-xs font-bold text-slate-700">
                        Learning requirements
                      </p>
                    </div>

                    <div className="flex min-h-7 flex-wrap gap-1.5">
                      {client.requiredSubjects?.length ? (
                        client.requiredSubjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          >
                            {subject}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Subjects not specified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TEACHING PREFERENCES */}
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <Globe
                          size={14}
                          className="text-slate-400"
                        />
                        Teaching preference
                      </span>

                      <span className="text-xs font-semibold capitalize text-slate-700">
                        {client.teachingMode || "Not specified"}
                      </span>
                    </div>

                    {client.preferredLanguage && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          <Languages
                            size={14}
                            className="text-slate-400"
                          />
                          Preferred language
                        </span>

                        <span className="max-w-[55%] truncate text-right text-xs font-semibold text-slate-700">
                          {client.preferredLanguage}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONNECTION BUTTON */}
                  <div className="mt-auto pt-5">
                    <Button
                      className={`h-10 w-full gap-2 rounded-xl text-xs font-semibold transition-all ${
                        isSent
                          ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50"
                          : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15 hover:bg-indigo-700"
                      }`}
                      disabled={
                        isSending ||
                        isSent ||
                        Boolean(sendingId)
                      }
                      onClick={() => void sendRequest(client.id)}
                    >
                      {isSending ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          Sending request...
                        </>
                      ) : isSent ? (
                        <>
                          <CheckCircle2 size={15} />
                          Request sent
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Send connection request
                          <ArrowUpRight
                            size={14}
                            className="ml-auto"
                          />
                        </>
                      )}
                    </Button>

                    {isSent && (
                      <p className="mt-2 text-center text-[10px] font-medium text-indigo-600">
                        Your request has been submitted successfully.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BOTTOM INFORMATION */}
        {!loading && !loadFailed && clients.length > 0 && (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#E3E9F8] bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <GraduationCap size={18} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Build meaningful learning connections
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Send a request to express your interest in
                  teaching a student.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <CheckCircle2 size={14} className="text-indigo-500" />
              Secure connection requests
            </div>
          </div>
        )}
      </div>
    </div>
  );
}