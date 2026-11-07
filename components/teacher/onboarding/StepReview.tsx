"use client";

import { PersonalData } from "./StepPersonal";
import { EducationData } from "./StepEducation";
import { SubjectItem } from "./StepSubjects";
import {
  UserRound,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ClipboardCheck,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Award,
  AlertCircle,
} from "lucide-react";

interface Props {
  personal: PersonalData;
  education: EducationData;
  subjects: SubjectItem[];
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ReviewField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ElementType;
}) {
  const displayValue =
    value !== undefined && value !== null && String(value).trim()
      ? String(value)
      : "Not provided";

  const isMissing = displayValue === "Not provided";

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>

      <div className="flex items-start gap-2">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        )}

        <p
          className={`break-words text-sm font-medium ${
            isMissing ? "text-slate-400" : "text-slate-800"
          }`}
        >
          {displayValue}
        </p>
      </div>
    </div>
  );
}

export default function StepReview({
  personal,
  education,
  subjects,
}: Props) {
  const fullName = [personal.firstName, personal.lastName]
    .filter(Boolean)
    .join(" ");

  const selectedSubjects = subjects
    .map((item) => item.subject?.trim())
    .filter((subject): subject is string => Boolean(subject));

  const uniqueSubjects = [...new Set(selectedSubjects)];

  const missingItems = [
    !personal.firstName?.trim() && "First name",
    !personal.lastName?.trim() && "Last name",
    !personal.phone?.trim() && "Phone number",
    !personal.city?.trim() && "City",
    !education.college?.trim() && "College",
    !education.degree?.trim() && "Degree",
    uniqueSubjects.length === 0 && "At least one subject",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Page heading */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Final Step · Profile Review
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Review your teacher profile
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          You&apos;re almost done! Check your information carefully before
          submitting your profile for verification.
        </p>
      </div>

      {/* Profile overview */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-5 sm:p-6">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-indigo-100/50 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <UserRound className="h-7 w-7" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {fullName || "Your Teacher Profile"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {education.degree || "Education details pending"}
              {education.college ? ` · ${education.college}` : ""}
            </p>

            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Profile ready for review
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <ReviewSection title="Personal Information" icon={UserRound}>
        <ReviewField
          label="Full Name"
          value={fullName}
          icon={UserRound}
        />

        <ReviewField
          label="Phone Number"
          value={personal.phone}
          icon={Phone}
        />

        <ReviewField
          label="City"
          value={personal.city}
          icon={MapPin}
        />

        {"email" in personal && (
          <ReviewField
            label="Email Address"
            value={personal.email as string}
            icon={Mail}
          />
        )}
      </ReviewSection>

      {/* Education */}
      <ReviewSection title="Education & Qualification" icon={GraduationCap}>
        <ReviewField
          label="College / University"
          value={education.college}
          icon={GraduationCap}
        />

        <ReviewField
          label="Degree"
          value={education.degree}
          icon={Award}
        />

        <ReviewField
          label="Current Year"
          value={education.currentYear}
          icon={CalendarDays}
        />
      </ReviewSection>

      {/* Subjects */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4.5 w-4.5" />
            </div>

            <h3 className="text-sm font-semibold text-slate-900">
              Teaching Subjects
            </h3>
          </div>

          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {uniqueSubjects.length}{" "}
            {uniqueSubjects.length === 1 ? "Subject" : "Subjects"}
          </span>
        </div>

        <div className="p-5">
          {uniqueSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uniqueSubjects.map((subject) => (
                <div
                  key={subject}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-sm font-medium text-indigo-800"
                >
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  {subject}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No teaching subjects added yet.
            </p>
          )}
        </div>
      </section>

      {/* Missing information warning */}
      {missingItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Some information is missing
              </h4>

              <p className="mt-1 text-sm leading-5 text-amber-800">
                Please review these details before submitting:
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {missingItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission information */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-emerald-900">
              What happens next?
            </h4>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Once you submit your profile, our admin team will review your
              personal details, qualifications, teaching subjects, and AI
              interview. You&apos;ll be notified when your profile verification
              is complete.
            </p>
          </div>
        </div>
      </div>

      {/* Final reminder */}
      <div className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" />
        Your profile details will be submitted securely.
      </div>
    </div>
  );
}