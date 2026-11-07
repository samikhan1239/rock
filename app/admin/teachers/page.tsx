"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Video,
  X,
  XCircle,
  Loader2,
  UserRound,
  BriefcaseBusiness,
  ImageOff,
} from "lucide-react";

interface TeacherVideo {
  id: string;
  type: string;
  title: string | null;
  url: string;
}

interface TeacherEvaluation {
  overallScore: number | null;
  subjectKnowledge: number | null;
  communication: number | null;
  explanationSkills: number | null;
  summary: string | null;
  strengths?: string[];
  weaknesses?: string[];
}

interface TeacherItem {
  id: string;
  verificationStatus: string;
  profilePhotoUrl: string | null;
  city: string | null;
  address: string | null;
  college: string | null;
  degree: string | null;
  currentYear: string | null;
  branch: string | null;
  qualifications: string | null;
  experienceYears: number | null;
  preferredMode: string | null;
  expectedSalary: number | null;
  languages: string[];

  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };

  subjects: {
    subject: string;
    classes: string[];
  }[];

  videos: TeacherVideo[];

  aiInterviews: {
    recordingUrl?: string | null;
    recordingDuration?: number | null;
    evaluation: TeacherEvaluation | null;
  }[];
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type ActionType = "approve" | "reject";

const tabs: {
  label: string;
  value: FilterStatus;
}[] = [
  { label: "All Teachers", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const statusStyles: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getTeacherName(teacher: TeacherItem) {
  return (
    `${teacher.user.firstName || ""} ${teacher.user.lastName || ""}`.trim() ||
    "Unnamed Teacher"
  );
}

function getInitials(teacher: TeacherItem) {
  const first = teacher.user.firstName?.[0] || "";
  const last = teacher.user.lastName?.[0] || "";

  return (first + last).toUpperCase() || "T";
}

function TeacherAvatar({
  teacher,
  size = "normal",
}: {
  teacher: TeacherItem;
  size?: "normal" | "large";
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses =
    size === "large"
      ? "h-20 w-20 text-xl"
      : "h-12 w-12 text-sm";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 font-bold text-indigo-700 ${sizeClasses}`}
    >
      {teacher.profilePhotoUrl && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={teacher.profilePhotoUrl}
          alt={`${getTeacherName(teacher)} profile`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(teacher)}</span>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const valid = score !== null && Number.isFinite(score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-bold text-slate-900">
          {valid ? score.toFixed(1) : "—"}
        </span>

        {valid && <span className="mb-1 text-xs text-slate-400">/ 10</span>}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${valid ? Math.min(Math.max(score, 0), 10) * 10 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-200" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>

            <div className="hidden gap-2 sm:flex">
              <div className="h-9 w-20 rounded-lg bg-slate-100" />
              <div className="h-9 w-20 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [confirmation, setConfirmation] = useState<{
    teacherId: string;
    action: ActionType;
    teacherName: string;
  } | null>(null);

  const [error, setError] = useState("");

  // Initial loading.
  useEffect(() => {
    const controller = new AbortController();

    async function loadTeachers() {
      try {
        const response = await fetch("/api/admin/teachers", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load teachers");
        }

        if (!controller.signal.aborted) {
          setTeachers(data.teachers || []);
          setError("");
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load teacher profiles";

        setError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      controller.abort();
    };
  }, []);

  // Refresh data.
  const fetchTeachers = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh teachers");
      }

      setTeachers(data.teachers || []);
      setError("");
      toast.success("Teacher list updated");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to refresh teachers";

      setError(message);
      toast.error(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Tab counts.
  const counts = useMemo(() => {
    return {
      ALL: teachers.length,
      PENDING: teachers.filter(
        (teacher) => teacher.verificationStatus === "PENDING"
      ).length,
      APPROVED: teachers.filter(
        (teacher) => teacher.verificationStatus === "APPROVED"
      ).length,
      REJECTED: teachers.filter(
        (teacher) => teacher.verificationStatus === "REJECTED"
      ).length,
    };
  }, [teachers]);

  // Search and filter.
  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesStatus =
        activeTab === "ALL" || teacher.verificationStatus === activeTab;

      const searchableText = [
        getTeacherName(teacher),
        teacher.user.email,
        teacher.user.phone,
        teacher.city,
        teacher.college,
        teacher.degree,
        ...(teacher.subjects || []).map((subject) => subject.subject),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [teachers, activeTab, search]);

  // Approve / Reject teacher.
  const handleVerification = async () => {
    if (!confirmation) return;

    const { teacherId, action } = confirmation;

    setActionLoading(teacherId);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification action failed");
      }

      toast.success(
        action === "approve"
          ? "Teacher approved successfully"
          : "Teacher rejected successfully"
      );

      setConfirmation(null);
      setExpandedId(null);

      setTeachers((previous) =>
        previous.map((teacher) =>
          teacher.id === teacherId
            ? {
                ...teacher,
                verificationStatus:
                  action === "approve" ? "APPROVED" : "REJECTED",
              }
            : teacher
        )
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((previous) => (previous === id ? null : id));
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#F8FAFF] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-600">
            <ShieldCheck className="h-4 w-4" />
            ADMIN / TEACHERS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher Verification
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review teacher applications and manage verification.
          </p>
        </div>

        <button
          onClick={() => void fetchTeachers()}
          disabled={loading || refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Teachers</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? "—" : counts.ALL}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs font-medium text-amber-700">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {loading ? "—" : counts.PENDING}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-xs font-medium text-emerald-700">Verified</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {loading ? "—" : counts.APPROVED}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              Teacher Applications
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Find and review registered teachers.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, subject..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max items-center gap-5">
            {tabs.map((tab) => {
              const active = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition ${
                    active
                      ? "text-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}

                  {!loading && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        active
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counts[tab.value]}
                    </span>
                  )}

                  {active && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Teacher List */}
      <section className="space-y-3">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white px-5 py-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

            <h3 className="mt-3 font-semibold text-slate-900">
              Unable to load teachers
            </h3>

            <p className="mt-1 text-sm text-slate-500">{error}</p>

            <button
              onClick={() => void fetchTeachers()}
              disabled={refreshing}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Try Again
            </button>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              {search ? (
                <Search className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-6 w-6" />
              )}
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search
                ? "No matching teachers"
                : activeTab === "ALL"
                  ? "No teachers registered yet"
                  : `No ${formatStatus(activeTab).toLowerCase()} teachers`}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try searching with another name, email or subject."
                : "Teacher applications will appear here when available."}
            </p>

            {(search || activeTab !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTab("ALL");
                }}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {filteredTeachers.length} of {teachers.length} teachers
              </span>
            </div>

            {filteredTeachers.map((teacher) => {
              const isExpanded = expandedId === teacher.id;
              const interview = teacher.aiInterviews?.[0];
              const evaluation = interview?.evaluation;
              const status = teacher.verificationStatus;

              const canVerify = ["PENDING", "REJECTED"].includes(status);

              return (
                <div
                  key={teacher.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-100"
                >
                  {/* Main Teacher Row */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <TeacherAvatar teacher={teacher} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {getTeacherName(teacher)}
                            </h3>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                                statusStyles[status] || statusStyles.DRAFT
                              }`}
                            >
                              {formatStatus(status)}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {teacher.user.email}
                            </span>

                            {teacher.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {teacher.city}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {teacher.subjects.slice(0, 4).map((subject, i) => (
                              <span
                                key={`${subject.subject}-${i}`}
                                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                              >
                                {subject.subject}
                              </span>
                            ))}

                            {teacher.subjects.length > 4 && (
                              <span className="text-[11px] text-slate-400">
                                +{teacher.subjects.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {evaluation?.overallScore != null && (
                          <div className="mr-1 flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {evaluation.overallScore.toFixed(1)}/10
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(teacher.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          {isExpanded ? (
                            <>
                              Hide Details
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              View Profile
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>

                        {canVerify && (
                          <>
                            <button
                              disabled={actionLoading === teacher.id}
                              onClick={() =>
                                setConfirmation({
                                  teacherId: teacher.id,
                                  action: "approve",
                                  teacherName: getTeacherName(teacher),
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>

                            <button
                              disabled={actionLoading === teacher.id}
                              onClick={() =>
                                setConfirmation({
                                  teacherId: teacher.id,
                                  action: "reject",
                                  teacherName: getTeacherName(teacher),
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {actionLoading === teacher.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Profile */}
                  {isExpanded && (
                    <div className="space-y-6 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6">
                      {/* Profile Photo and Personal Details */}
                      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                        <TeacherAvatar teacher={teacher} size="large" />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-bold text-slate-900">
                            {getTeacherName(teacher)}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {teacher.user.email}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {teacher.profilePhotoUrl ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Profile photo uploaded
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                <ImageOff className="h-3.5 w-3.5" />
                                No profile photo
                              </span>
                            )}

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                statusStyles[status] || statusStyles.DRAFT
                              }`}
                            >
                              {formatStatus(status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Personal and Education */}
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <UserRound className="h-4 w-4 text-indigo-600" />
                            Personal Information
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="break-all">
                                {teacher.user.email}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {teacher.user.phone || "Phone not provided"}
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {teacher.city || "City not provided"}
                            </div>

                            <div className="border-t border-slate-100 pt-3 text-slate-600">
                              <p className="text-xs text-slate-400">Address</p>
                              <p className="mt-1">
                                {teacher.address || "Not provided"}
                              </p>
                            </div>

                            <div className="border-t border-slate-100 pt-3 text-slate-600">
                              <p className="text-xs text-slate-400">
                                Languages
                              </p>
                              <p className="mt-1">
                                {teacher.languages?.join(", ") || "Not provided"}
                              </p>
                            </div>

                            <div className="text-slate-600">
                              <p className="text-xs text-slate-400">
                                Teaching Mode
                              </p>
                              <p className="mt-1">
                                {teacher.preferredMode || "Not specified"}
                              </p>
                            </div>

                            <div className="text-slate-600">
                              <p className="text-xs text-slate-400">
                                Expected Salary
                              </p>
                              <p className="mt-1">
                                {teacher.expectedSalary
                                  ? `₹${teacher.expectedSalary.toLocaleString("en-IN")}`
                                  : "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <GraduationCap className="h-4 w-4 text-indigo-600" />
                            Education & Experience
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-400">College</p>
                              <p className="mt-1 font-medium text-slate-700">
                                {teacher.college || "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">Degree</p>
                              <p className="mt-1 font-medium text-slate-700">
                                {teacher.degree || "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">Branch</p>
                              <p className="mt-1 font-medium text-slate-700">
                                {teacher.branch || "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Current Year
                              </p>
                              <p className="mt-1 font-medium text-slate-700">
                                {teacher.currentYear || "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Qualifications
                              </p>
                              <p className="mt-1 text-slate-700">
                                {teacher.qualifications || "Not provided"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                              <BriefcaseBusiness className="h-4 w-4 text-indigo-500" />
                              <span className="font-semibold text-slate-800">
                                {teacher.experienceYears ?? 0} years
                              </span>
                              <span className="text-slate-500">
                                Teaching Experience
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <BookOpen className="h-4 w-4 text-indigo-600" />
                          Teaching Subjects
                        </h4>

                        {teacher.subjects.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No subjects added.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {teacher.subjects.map((subject, index) => (
                              <div
                                key={`${subject.subject}-${index}`}
                                className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2"
                              >
                                <p className="text-sm font-semibold text-indigo-700">
                                  {subject.subject}
                                </p>

                                {subject.classes?.length > 0 && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Classes: {subject.classes.join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Evaluation */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Star className="h-4 w-4 text-amber-500" />
                            AI Interview Evaluation
                          </h4>

                          {evaluation && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Score: {evaluation.overallScore?.toFixed(1) ?? "—"}
                              /10
                            </span>
                          )}
                        </div>

                        {!evaluation ? (
                          <div className="rounded-lg bg-slate-50 py-7 text-center">
                            <Clock3 className="mx-auto h-7 w-7 text-slate-300" />
                            <p className="mt-2 text-sm font-medium text-slate-600">
                              Evaluation not available
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              The AI interview may still be processing or has
                              not been completed.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                              <ScoreCard
                                label="Overall Score"
                                score={evaluation.overallScore}
                              />
                              <ScoreCard
                                label="Subject Knowledge"
                                score={evaluation.subjectKnowledge}
                              />
                              <ScoreCard
                                label="Communication"
                                score={evaluation.communication}
                              />
                              <ScoreCard
                                label="Explanation"
                                score={evaluation.explanationSkills}
                              />
                            </div>

                            {evaluation.summary && (
                              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Interview Summary
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                  {evaluation.summary}
                                </p>
                              </div>
                            )}

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Strengths
                                </p>

                                {evaluation.strengths?.length ? (
                                  <ul className="mt-3 space-y-2">
                                    {evaluation.strengths.map((item, index) => (
                                      <li
                                        key={index}
                                        className="flex gap-2 text-xs text-slate-600"
                                      >
                                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-400">
                                    No strengths provided.
                                  </p>
                                )}
                              </div>

                              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                                <p className="flex items-center gap-2 text-xs font-semibold text-red-700">
                                  <AlertCircle className="h-4 w-4" />
                                  Areas to Improve
                                </p>

                                {evaluation.weaknesses?.length ? (
                                  <ul className="mt-3 space-y-2">
                                    {evaluation.weaknesses.map((item, index) => (
                                      <li
                                        key={index}
                                        className="flex gap-2 text-xs text-slate-600"
                                      >
                                        <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-400">
                                    No improvement areas provided.
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Profile Videos */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Video className="h-4 w-4 text-indigo-600" />
                          Profile Videos
                        </h4>

                        {teacher.videos.length === 0 ? (
                          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
                            No profile videos uploaded.
                          </p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {teacher.videos.map((video) => (
                              <div
                                key={video.id}
                                className="overflow-hidden rounded-xl border border-slate-200"
                              >
                                <div className="flex items-center justify-between gap-2 p-3">
                                  <div>
                                    <p className="text-sm font-semibold capitalize text-slate-800">
                                      {video.title || video.type}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {formatStatus(video.type)}
                                    </p>
                                  </div>

                                  <BadgeCheck className="h-4 w-4 text-indigo-500" />
                                </div>

                                <video
                                  src={video.url}
                                  controls
                                  preload="metadata"
                                  className="max-h-72 w-full bg-black"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Interview Recording */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Video className="h-4 w-4 text-indigo-600" />
                          AI Interview Recording
                        </h4>

                        {interview?.recordingUrl ? (
                          <div className="max-w-2xl space-y-2">
                            <video
                              src={interview.recordingUrl}
                              controls
                              preload="metadata"
                              className="max-h-80 w-full rounded-xl bg-black"
                            />

                            {interview.recordingDuration != null && (
                              <p className="text-xs text-slate-500">
                                Duration:{" "}
                                {Math.floor(interview.recordingDuration / 60)}{" "}
                                min {interview.recordingDuration % 60} sec
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
                            No interview recording available.
                          </p>
                        )}
                      </div>

                      {/* Expanded Actions */}
                      {canVerify && (
                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                          <button
                            onClick={() =>
                              setConfirmation({
                                teacherId: teacher.id,
                                action: "reject",
                                teacherName: getTeacherName(teacher),
                              })
                            }
                            disabled={actionLoading === teacher.id}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject Application
                          </button>

                          <button
                            onClick={() =>
                              setConfirmation({
                                teacherId: teacher.id,
                                action: "approve",
                                teacherName: getTeacherName(teacher),
                              })
                            }
                            disabled={actionLoading === teacher.id}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve Teacher
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </section>

      {/* Confirmation Dialog */}
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                confirmation.action === "approve"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {confirmation.action === "approve" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>

            <h3
              id="confirmation-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              {confirmation.action === "approve"
                ? "Approve Teacher?"
                : "Reject Teacher?"}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Are you sure you want to{" "}
              {confirmation.action === "approve" ? "approve" : "reject"}{" "}
              <span className="font-semibold text-slate-800">
                {confirmation.teacherName}
              </span>
              ?{" "}
              {confirmation.action === "approve"
                ? "This teacher will be marked as verified."
                : "This application will be marked as rejected."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={actionLoading !== null}
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading !== null}
                onClick={() => void handleVerification()}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmation.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Confirm{" "}
                {confirmation.action === "approve" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}