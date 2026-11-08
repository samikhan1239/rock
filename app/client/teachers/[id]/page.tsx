"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  IndianRupee,
  Loader2,
  MapPin,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";

interface Subject {
  subject: string;
  classes: string[];
}

interface TeacherVideo {
  id: string;
  title: string | null;
  type: string;
  url: string;
  duration: number | null;
}

interface Evaluation {
  subjectKnowledge: number | null;
  communication: number | null;
  explanationSkills: number | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
}

interface AIInterview {
  id: string;
  status: string;
  recordingUrl: string | null;
  recordingDuration: number | null;
  completedAt: string | null;
  evaluation: Evaluation | null;
}

interface Teacher {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
  experienceYears: number | null;
  preferredMode: string | null;
  expectedSalary: number | null;
  qualifications: string | null;
  verificationStatus: string;
  isVerified: boolean;
  subjects: Subject[];
  videos: TeacherVideo[];
  aiInterview: AIInterview | null;
  overallScore: number | null;
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatMode(mode: string | null) {
  if (!mode) return "Not specified";

  return mode
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatSalary(salary: number | null) {
  if (salary === null || salary === undefined) {
    return "Not specified";
  }

  return `₹${salary.toLocaleString("en-IN")}`;
}

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {icon && (
        <div className="mt-0.5 text-indigo-600">
          {icon}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* Horizontal performance chart */
function PerformanceChart({
  evaluation,
}: {
  evaluation: Evaluation;
}) {
  const metrics = [
    {
      label: "Subject knowledge",
      score: evaluation.subjectKnowledge,
    },
    {
      label: "Communication",
      score: evaluation.communication,
    },
    {
      label: "Explanation skills",
      score: evaluation.explanationSkills,
    },
  ];

  return (
    <div className="space-y-5">
      {metrics.map((metric) => {
        const value =
          metric.score === null
            ? 0
            : Math.min(100, Math.max(0, metric.score));

        return (
          <div key={metric.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-600">
                {metric.label}
              </span>

              <span className="text-xs font-bold tabular-nums text-slate-900">
                {metric.score !== null
                  ? `${metric.score}/100`
                  : "N/A"}
              </span>
            </div>

            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="absolute inset-0 grid grid-cols-4 divide-x divide-white/90" />

              {metric.score !== null && (
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                  style={{ width: `${value}%` }}
                />
              )}
            </div>
          </div>
        );
      })}

      <div className="ml-[1px] flex justify-between pt-0.5 text-[10px] font-medium text-slate-400">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>

      <span className="max-w-[55%] text-right text-sm font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();

  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const fetchTeacher = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);

      setError(null);

      try {
        const response = await fetch("/api/client/teachers", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load teacher profile."
          );
        }

        const teachers: Teacher[] = Array.isArray(data)
          ? data
          : data.teachers || [];

        const selectedTeacher = teachers.find(
          (item) => item.id === teacherId
        );

        if (!selectedTeacher) {
          setTeacher(null);
          setError("This teacher profile could not be found.");
          return;
        }

        setTeacher(selectedTeacher);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the profile."
        );
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTeacher();
  }, [fetchTeacher]);

  const sendConnectionRequest = async () => {
    if (!teacher || sending || requestSent) return;

    setSending(true);

    try {
      const response = await fetch("/api/client/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send connection request."
        );
      }

      setRequestSent(true);

      toast.success("Connection request submitted", {
        description:
          "Your request has been sent to the admin for review.",
      });
    } catch (err) {
      toast.error("Request failed", {
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-32 rounded bg-slate-200" />

          <div className="mt-8 flex gap-5">
            <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-200" />

            <div className="flex-1 space-y-3 py-2">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="h-4 w-64 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200" />
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-8">
              <div className="h-36 rounded bg-slate-100" />
              <div className="h-40 rounded bg-slate-100" />
              <div className="h-48 rounded bg-slate-100" />
            </div>

            <div className="h-72 rounded bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <XCircle
            size={36}
            className="mx-auto mb-4 text-red-500"
          />

          <h2 className="text-xl font-semibold text-slate-900">
            Unable to load profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "The requested teacher profile is unavailable."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/client/find-teacher")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Go back
            </Button>

            <Button
              onClick={() => void fetchTeacher(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw size={15} className="mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    teacher.name ||
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
    "Teacher";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const evaluation = teacher.aiInterview?.evaluation;

  const hasEvaluation =
    evaluation?.overallScore !== null &&
    evaluation?.overallScore !== undefined;

  return (
    <main className="min-h-screen bg-white pb-12">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Navigation */}
        <button
          onClick={() => router.push("/client/find-teacher")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to teachers
        </button>

        {/* Profile header */}
        <section className="border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-indigo-50 ring-4 ring-indigo-50/70">
              {teacher.profilePhotoUrl ? (
                <Image
                  src={teacher.profilePhotoUrl}
                  alt={displayName}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-indigo-600">
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {displayName}
                </h1>

                {teacher.isVerified && (
                  <Badge className="border-0 bg-blue-50 text-blue-700 hover:bg-blue-50">
                    <BadgeCheck size={13} className="mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                {teacher.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} />
                    {teacher.city}
                  </span>
                )}

                {teacher.experienceYears !== null && (
                  <span className="flex items-center gap-1.5">
                    <BriefcaseBusiness size={15} />
                    {teacher.experienceYears} years experience
                  </span>
                )}

                {teacher.preferredMode && (
                  <span className="flex items-center gap-1.5">
                    <Monitor size={15} />
                    {formatMode(teacher.preferredMode)}
                  </span>
                )}
              </div>

              {teacher.qualifications && (
                <p className="mt-3 text-sm text-slate-600">
                  {teacher.qualifications}
                </p>
              )}
            </div>

            {/* AI score at the top-right */}
            {teacher.aiInterview && (
              <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 sm:w-auto sm:min-w-[220px] sm:justify-start sm:gap-4 sm:px-5 sm:py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
                    AI interview score
                  </p>

                  {hasEvaluation ? (
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-slate-900">
                        {evaluation?.overallScore}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        /100
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Evaluation pending
                    </p>
                  )}

                  <p className="mt-1 text-xs text-slate-500">
                    {hasEvaluation
                      ? "AI assessment completed"
                      : "Interview completed"}
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[5px] border-indigo-200 bg-white text-indigo-700">
                  {hasEvaluation ? (
                    <span className="text-sm font-bold">
                      {Math.round(evaluation?.overallScore ?? 0)}%
                    </span>
                  ) : (
                    <ShieldCheck size={22} />
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main layout */}
        <div className="mt-9 grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">

          {/* Main content */}
          <div className="min-w-0 space-y-9">

            {/* About */}
            <section>
              <SectionHeading
                title="About the teacher"
                description="Professional background and teaching profile"
                icon={<UserRound size={19} />}
              />

              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Qualification
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {teacher.qualifications || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Experience
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {teacher.experienceYears !== null
                      ? `${teacher.experienceYears} years`
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Location
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {teacher.city || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Teaching mode
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {formatMode(teacher.preferredMode)}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-200" />

            {/* Subjects */}
            <section>
              <SectionHeading
                title="Subjects & classes"
                description="Subjects and academic levels covered"
                icon={<BookOpen size={19} />}
              />

              {teacher.subjects?.length ? (
                <div className="space-y-4">
                  {teacher.subjects.map((subject, index) => (
                    <div
                      key={`${subject.subject}-${index}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {subject.subject}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {subject.classes?.length ? (
                          subject.classes.map((className) => (
                            <Badge
                              key={className}
                              variant="secondary"
                              className="border-0 bg-slate-100 font-normal text-slate-600"
                            >
                              {className}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            Classes not specified
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No subjects have been added yet.
                </p>
              )}
            </section>

            <div className="border-t border-slate-200" />

            {/* Teaching videos */}
            <section>
              <SectionHeading
                title="Teaching videos"
                description="Introduction and teaching demonstrations"
                icon={<Video size={19} />}
              />

              {teacher.videos?.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {teacher.videos.map((video) => (
                    <div key={video.id} className="min-w-0">
                      <div className="overflow-hidden rounded-lg bg-slate-950">
                        <video
                          src={video.url}
                          controls
                          preload="metadata"
                          playsInline
                          className="aspect-video max-h-[180px] w-full object-contain"
                        />
                      </div>

                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {video.title ||
                              (video.type === "INTRODUCTION"
                                ? "Introduction video"
                                : "Teaching demonstration")}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {video.type === "INTRODUCTION"
                              ? "Teacher introduction"
                              : "Teaching demonstration"}
                          </p>
                        </div>

                        {video.duration !== null && (
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No teaching videos available.
                </p>
              )}
            </section>

            <div className="border-t border-slate-200" />

            {/* AI Interview */}
            <section>
              <SectionHeading
                title="Interview assessment"
                description="AI-powered evaluation of teaching and communication skills."
                icon={<ShieldCheck size={19} />}
              />

              {teacher.aiInterview ? (
                <div className="space-y-7">

                  {/* Interview video and performance chart */}
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(250px,0.85fr)] lg:items-start">

                    {/* Interview recording */}
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Interview recording
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Recorded AI teaching assessment
                          </p>
                        </div>

                        {teacher.aiInterview.recordingDuration !== null && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {formatDuration(
                              teacher.aiInterview.recordingDuration
                            )}
                          </span>
                        )}
                      </div>

                      {teacher.aiInterview.recordingUrl ? (
                        <>
                          <video
                            src={teacher.aiInterview.recordingUrl}
                            controls
                            preload="metadata"
                            playsInline
                            className="aspect-video w-full rounded-xl bg-slate-950 object-contain shadow-sm"
                          />

                          {teacher.aiInterview.completedAt && (
                            <p className="mt-2 text-xs text-slate-400">
                              Completed on{" "}
                              {new Date(
                                teacher.aiInterview.completedAt
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                          <div className="text-center">
                            <Video
                              size={24}
                              className="mx-auto mb-2 text-slate-300"
                            />
                            <p className="text-sm text-slate-500">
                              Interview recording unavailable.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Performance chart */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Performance breakdown
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Skill-wise AI assessment
                          </p>
                        </div>

                        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                          <Star size={16} />
                        </span>
                      </div>

                      {evaluation ? (
                        <div>
                          <PerformanceChart evaluation={evaluation} />

                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                              <BadgeCheck size={15} />
                              AI evaluation completed
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                          <div className="mb-3 rounded-full bg-indigo-50 p-3 text-indigo-600">
                            <ShieldCheck size={22} />
                          </div>

                          <p className="text-sm font-semibold text-slate-800">
                            Evaluation pending
                          </p>

                          <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-500">
                            Skill-wise scores will appear here once the AI assessment is available.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interview summary and feedback */}
                  {evaluation && (
                    <>
                      {evaluation.summary && (
                        <div className="rounded-xl bg-slate-50 p-5">
                          <h3 className="mb-2 text-sm font-semibold text-slate-900">
                            Interview summary
                          </h3>

                          <p className="text-sm leading-6 text-slate-600">
                            {evaluation.summary}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Strengths */}
                        <div className="rounded-xl border border-slate-200 p-5">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-600"
                            />
                            Strengths
                          </h3>

                          {evaluation.strengths?.length ? (
                            <ul className="space-y-2.5">
                              {evaluation.strengths.map((item, index) => (
                                <li
                                  key={index}
                                  className="flex gap-2 text-sm leading-5 text-slate-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">
                              No strengths listed.
                            </p>
                          )}
                        </div>

                        {/* Areas to improve */}
                        <div className="rounded-xl border border-slate-200 p-5">
                          <h3 className="mb-3 text-sm font-semibold text-slate-800">
                            Areas to improve
                          </h3>

                          {evaluation.weaknesses?.length ? (
                            <ul className="space-y-2.5">
                              {evaluation.weaknesses.map((item, index) => (
                                <li
                                  key={index}
                                  className="flex gap-2 text-sm leading-5 text-slate-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">
                              No improvement areas listed.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  This teacher has not completed an AI interview.
                </p>
              )}
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="lg:sticky lg:top-6">
            <div className="border-t border-slate-200 pt-5 lg:border-t-0 lg:pt-0">
              <h2 className="text-base font-semibold text-slate-900">
                Teaching details
              </h2>

              <div className="mt-3 divide-y divide-slate-100">
                <DetailRow
                  icon={<IndianRupee size={16} />}
                  label="Expected salary"
                  value={formatSalary(teacher.expectedSalary)}
                />

                <DetailRow
                  icon={<Monitor size={16} />}
                  label="Teaching mode"
                  value={formatMode(teacher.preferredMode)}
                />

                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Location"
                  value={teacher.city || "Not specified"}
                />

                <DetailRow
                  icon={<BriefcaseBusiness size={16} />}
                  label="Experience"
                  value={
                    teacher.experienceYears !== null
                      ? `${teacher.experienceYears} years`
                      : "Not specified"
                  }
                />
              </div>

              {/* Verification status */}
              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ShieldCheck
                      size={17}
                      className="text-indigo-600"
                    />
                    Verification
                  </div>

                  <Badge
                    className={
                      teacher.verificationStatus === "APPROVED"
                        ? "border-0 bg-blue-50 text-blue-700 hover:bg-blue-50"
                        : "border-0 bg-amber-50 text-amber-700 hover:bg-amber-50"
                    }
                  >
                    {teacher.verificationStatus.replaceAll("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Connection request */}
              <div className="mt-6">
                <Button
                  onClick={sendConnectionRequest}
                  disabled={sending || requestSent}
                  className="h-11 w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {sending ? (
                    <Loader2
                      size={16}
                      className="mr-2 animate-spin"
                    />
                  ) : requestSent ? (
                    <CheckCircle2 size={16} className="mr-2" />
                  ) : (
                    <Send size={16} className="mr-2" />
                  )}

                  {sending
                    ? "Sending request..."
                    : requestSent
                      ? "Request submitted"
                      : "Send connection request"}
                </Button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  Your request will be reviewed by the TutorSathi admin team.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}