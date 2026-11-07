"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
  Star,
  BriefcaseBusiness,
  ShieldCheck,
  Monitor,
  IndianRupee,
  RefreshCw,
  UserRound,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImage?: string | null;
  photo?: string | null;
  city: string | null;
  experienceYears: number | null;
  preferredMode: string | null;
  expectedSalary: number | null;
  verificationStatus: string;
  subjects: {
    subject: string;
    classes: string[];
  }[];
  overallScore: number | null;
}

const initialFilters = {
  subject: "",
  class: "",
  city: "",
  mode: "",
};

export default function FindTeachersPage() {
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const fetchTeachers = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/client/search-teachers", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unable to fetch teachers (${response.status})`);
      }

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response received from server.");
      }

      const data = await response.json();

      setAllTeachers(
        Array.isArray(data.teachers) ? data.teachers : []
      );
    } catch (err) {
      console.error("Teacher fetching error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching teachers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeachers();
  }, [fetchTeachers]);

  const teachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allTeachers.filter((teacher) => {
      const fullName =
        `${teacher.firstName || ""} ${teacher.lastName || ""}`.toLowerCase();

      const subjectNames = (teacher.subjects || [])
        .map((item) => item.subject)
        .join(" ")
        .toLowerCase();

      const searchMatch =
        !keyword ||
        fullName.includes(keyword) ||
        subjectNames.includes(keyword) ||
        (teacher.city || "").toLowerCase().includes(keyword);

      const subjectClassMatch =
        !filters.subject && !filters.class
          ? true
          : (teacher.subjects || []).some((item) => {
              const subjectMatch =
                !filters.subject ||
                item.subject
                  .toLowerCase()
                  .includes(filters.subject.toLowerCase());

              const classMatch =
                !filters.class || item.classes.includes(filters.class);

              return subjectMatch && classMatch;
            });

      const cityMatch =
        !filters.city ||
        (teacher.city || "")
          .toLowerCase()
          .includes(filters.city.toLowerCase());

      const teacherMode = (teacher.preferredMode || "").toLowerCase();
      const selectedMode = filters.mode.toLowerCase();

      const modeMatch =
        !selectedMode ||
        teacherMode === selectedMode ||
        teacherMode === "both";

      return (
        searchMatch &&
        subjectClassMatch &&
        cityMatch &&
        modeMatch
      );
    });
  }, [allTeachers, filters, search]);

  const hasFilters =
    Object.values(filters).some(Boolean) || search.trim().length > 0;

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearch("");
  };

  const updateFilter = (
    key: keyof typeof initialFilters,
    value: string
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>TutorSathi</span>
              <span>/</span>
              <span className="text-indigo-600">Find Teachers</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Find the right teacher
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Discover experienced teachers who match your learning needs.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>
                <strong className="font-semibold text-slate-900">
                  {teachers.length}
                </strong>{" "}
                teachers available
              </span>
            </div>
          )}
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="mb-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              Find your teacher
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <X className="h-3.5 w-3.5" />
                Reset filters
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <div className="relative w-full lg:max-w-[340px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, subject or location..."
                className="h-10 border-slate-200 bg-slate-50 pl-9 pr-9 text-sm shadow-none focus-visible:bg-white focus-visible:ring-indigo-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Subject"
                value={filters.subject}
                onChange={(event) =>
                  updateFilter("subject", event.target.value)
                }
                className="h-10 border-slate-200 text-sm shadow-none"
              />

              <Select
                value={filters.class}
                onValueChange={(value) =>
                  updateFilter("class", value ?? "")
                }
              >
                <SelectTrigger className="h-10 border-slate-200 text-sm shadow-none">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>

                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) =>
                    String(index + 1)
                  ).map((className) => (
                    <SelectItem key={className} value={className}>
                      Class {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="City"
                value={filters.city}
                onChange={(event) =>
                  updateFilter("city", event.target.value)
                }
                className="h-10 border-slate-200 text-sm shadow-none"
              />

              <Select
                value={filters.mode}
                onValueChange={(value) =>
                  updateFilter("mode", value ?? "")
                }
              >
                <SelectTrigger className="h-10 border-slate-200 text-sm shadow-none">
                  <SelectValue placeholder="Teaching mode" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* DIRECTORY TITLE */}
        <section className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Available teachers
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Browse profiles and compare teaching experience.
            </p>
          </div>

          {!loading && !error && (
            <span className="text-xs font-medium text-slate-500">
              {teachers.length} results
            </span>
          )}
        </section>

        {/* LOADING */}
        {loading ? (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">
                Finding qualified teachers...
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <TeacherSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : error ? (
          /* ERROR */
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <RefreshCw className="h-6 w-6 text-red-500" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Unable to load teachers
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {error}
            </p>

            <Button
              onClick={() => {
                setLoading(true);
                void fetchTeachers();
              }}
              className="mt-5 h-9 gap-2 bg-indigo-600 px-4 text-xs hover:bg-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : teachers.length === 0 ? (
          /* EMPTY */
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <Search className="h-6 w-6 text-indigo-600" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {allTeachers.length === 0
                ? "No teachers available yet"
                : "No matching teachers found"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {allTeachers.length === 0
                ? "New teacher profiles will appear here once they are approved."
                : "Try changing your search or removing some filters."}
            </p>

            {hasFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-5 h-9 border-indigo-200 text-xs text-indigo-700 hover:bg-indigo-50"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          /* DESKTOP GRID / MOBILE LIST */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================
   TEACHER CARD SKELETON
========================================= */

function TeacherSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-[68px] w-[68px] shrink-0 animate-pulse rounded-xl bg-slate-100" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-md bg-slate-100" />
        <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
        <div className="h-6 w-14 animate-pulse rounded-md bg-slate-100" />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-4 flex justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="h-9 w-full animate-pulse rounded-md bg-indigo-50" />
      </div>
    </div>
  );
}

/* =========================================
   TEACHER PROFILE CARD
========================================= */

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const [imageError, setImageError] = useState(false);

  const fullName =
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
    "Teacher";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const photo = teacher.profileImage || teacher.photo || null;
  const subjects = teacher.subjects || [];
  const verified = teacher.verificationStatus === "APPROVED";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">

      {/* CARD TOP */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* PROFILE PHOTO */}
          <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-indigo-50">
            {photo && !imageError ? (
              <Image
                src={photo}
                alt={fullName}
                fill
                sizes="76px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-indigo-600">
                {initials || <UserRound className="h-7 w-7" />}
              </div>
            )}
          </div>

          {/* NAME AND DETAILS */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="break-words text-[15px] font-semibold text-slate-900">
                {fullName}
              </h3>

              {verified && (
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
            </div>

            {verified && (
              <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Verified teacher
              </span>
            )}

            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {teacher.city || "Location not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* EXPERIENCE AND MODE */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Experience
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {teacher.experienceYears ?? 0} years
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Monitor className="h-3.5 w-3.5" />
              Teaching mode
            </div>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
              {teacher.preferredMode || "Not specified"}
            </p>
          </div>
        </div>

        {/* SUBJECTS */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            Subjects taught
          </div>

          <div className="flex min-h-7 flex-wrap gap-1.5">
            {subjects.length > 0 ? (
              <>
                {subjects.slice(0, 3).map((subject, index) => (
                  <Badge
                    key={`${subject.subject}-${index}`}
                    variant="secondary"
                    className="h-6 border-0 bg-indigo-50 px-2 text-[10px] font-medium text-indigo-700"
                  >
                    {subject.subject}
                  </Badge>
                ))}

                {subjects.length > 3 && (
                  <span className="self-center text-[10px] text-slate-400">
                    +{subjects.length - 3} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400">
                No subjects added
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="mt-auto border-t border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Expected salary
            </p>

            <p className="mt-0.5 flex items-center text-base font-bold text-slate-900">
              {teacher.expectedSalary !== null ? (
                <>
                  <IndianRupee className="h-3.5 w-3.5" />
                  {teacher.expectedSalary.toLocaleString("en-IN")}
                </>
              ) : (
                "Negotiable"
              )}
            </p>
          </div>

          {teacher.overallScore !== null && (
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                AI interview
              </p>

              <p className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {teacher.overallScore.toFixed(1)}/10
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/client/teachers/${teacher.id}`}
          className="block"
        >
          <Button className="h-9 w-full gap-2 bg-indigo-600 text-xs font-medium shadow-none hover:bg-indigo-700">
            View teacher profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}