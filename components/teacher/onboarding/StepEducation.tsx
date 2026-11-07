"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  GraduationCap,
  AlertCircle,
  Info,
} from "lucide-react";

// ========================================
// TYPES
// ========================================

export interface EducationData {
  college: string;
  degree: string;
  currentYear: string;
  branch: string;
  qualifications: string;
}

interface Props {
  data: EducationData;
  onChange: (data: EducationData) => void;
  showValidationErrors?: boolean;
}

// ========================================
// VALIDATION
// ========================================

type FieldErrors = Partial<
  Record<keyof EducationData, string>
>;

function validateField(
  field: keyof EducationData,
  value: string
): string {
  const trimmed = value.trim();

  switch (field) {
    case "college":
      if (!trimmed) return "College or university is required.";
      if (trimmed.length < 2) return "Enter a valid institution name.";
      return "";

    case "degree":
      if (!trimmed) return "Degree is required.";
      if (trimmed.length < 2) return "Enter a valid degree.";
      return "";

    case "currentYear":
      if (!trimmed) return "Please select your academic year.";
      return "";

    case "branch":
      if (!trimmed) return "Branch or specialization is required.";
      if (trimmed.length < 2) return "Enter a valid specialization.";
      return "";

    case "qualifications":
      if (value.length > 1000) {
        return "Additional qualifications cannot exceed 1000 characters.";
      }
      return "";

    default:
      return "";
  }
}

// ========================================
// COMPONENT
// ========================================

export default function StepEducation({
  data,
  onChange,
  showValidationErrors = false,
}: Props) {
  const [touched, setTouched] = useState<
    Partial<Record<keyof EducationData, boolean>>
  >({});

  const handleChange = (
    field: keyof EducationData,
    value: string
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleBlur = (field: keyof EducationData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const getError = (field: keyof EducationData) => {
    if (!touched[field] && !showValidationErrors) {
      return "";
    }

    return validateField(field, data[field]);
  };

  const errors: FieldErrors = {
    college: getError("college"),
    degree: getError("degree"),
    currentYear: getError("currentYear"),
    branch: getError("branch"),
    qualifications: getError("qualifications"),
  };

  const hasError = (field: keyof EducationData) =>
    Boolean(errors[field]);

  const inputClass = (field: keyof EducationData) =>
    `h-10 rounded-lg border-slate-300 bg-white text-sm shadow-none transition-all placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 ${
      hasError(field)
        ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-100"
        : ""
    }`;

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">

      {/* INTRODUCTION */}

      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">

        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your academic background
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-600">
            Add your educational details so students can understand
            your academic qualifications and expertise.
          </p>
        </div>

      </div>

      {/* INSTITUTION */}

      <section className="space-y-4">

        <div className="border-b border-slate-200 pb-2">
          <h4 className="text-sm font-semibold text-slate-900">
            Institution Details
          </h4>

          <p className="mt-0.5 text-xs text-slate-500">
            Where did you complete or pursue your education?
          </p>
        </div>

        {/* College */}

        <div className="space-y-1.5">

          <Label
            htmlFor="college"
            className="text-sm font-medium text-slate-700"
          >
            College / University <span className="text-red-500">*</span>
          </Label>

          <Input
            id="college"
            value={data.college}
            onChange={(e) =>
              handleChange("college", e.target.value)
            }
            onBlur={() => handleBlur("college")}
            placeholder="e.g. Indian Institute of Technology"
            maxLength={150}
            aria-invalid={hasError("college")}
            aria-describedby={
              hasError("college") ? "college-error" : "college-hint"
            }
            className={inputClass("college")}
          />

          {hasError("college") ? (
            <p
              id="college-error"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-red-600"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.college}
            </p>
          ) : (
            <p id="college-hint" className="text-xs text-slate-400">
              Enter the full name of your institution.
            </p>
          )}

        </div>

      </section>

      {/* DEGREE DETAILS */}

      <section className="space-y-4">

        <div className="border-b border-slate-200 pb-2">
          <h4 className="text-sm font-semibold text-slate-900">
            Degree Details
          </h4>

          <p className="mt-0.5 text-xs text-slate-500">
            Specify your degree and current academic status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Degree */}

          <div className="space-y-1.5">

            <Label
              htmlFor="degree"
              className="text-sm font-medium text-slate-700"
            >
              Degree <span className="text-red-500">*</span>
            </Label>

            <Input
              id="degree"
              value={data.degree}
              onChange={(e) =>
                handleChange("degree", e.target.value)
              }
              onBlur={() => handleBlur("degree")}
              placeholder="e.g. B.Tech, B.Sc, M.Tech"
              maxLength={100}
              aria-invalid={hasError("degree")}
              aria-describedby={
                hasError("degree") ? "degree-error" : undefined
              }
              className={inputClass("degree")}
            />

            {hasError("degree") && (
              <p
                id="degree-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-red-600"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.degree}
              </p>
            )}

          </div>

          {/* Academic Year */}

          <div className="space-y-1.5">

            <Label
              htmlFor="currentYear"
              className="text-sm font-medium text-slate-700"
            >
              Current Academic Year <span className="text-red-500">*</span>
            </Label>

            <Select
              value={data.currentYear}
              onValueChange={(value) => {
                handleChange("currentYear", value ?? "");
                handleBlur("currentYear");
              }}
            >
              <SelectTrigger
                id="currentYear"
                aria-invalid={hasError("currentYear")}
                aria-describedby={
                  hasError("currentYear")
                    ? "currentYear-error"
                    : undefined
                }
                className={`h-10 rounded-lg border-slate-300 bg-white text-sm shadow-none focus:ring-2 focus:ring-indigo-100 ${
                  hasError("currentYear")
                    ? "border-red-400"
                    : ""
                }`}
              >
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
                <SelectItem value="Final Year">Final Year</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>

            {hasError("currentYear") && (
              <p
                id="currentYear-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-red-600"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.currentYear}
              </p>
            )}

          </div>

        </div>

        {/* Branch */}

        <div className="space-y-1.5">

          <Label
            htmlFor="branch"
            className="text-sm font-medium text-slate-700"
          >
            Branch / Specialization <span className="text-red-500">*</span>
          </Label>

          <Input
            id="branch"
            value={data.branch}
            onChange={(e) =>
              handleChange("branch", e.target.value)
            }
            onBlur={() => handleBlur("branch")}
            placeholder="e.g. Computer Science, Mathematics, Electronics"
            maxLength={120}
            aria-invalid={hasError("branch")}
            aria-describedby={
              hasError("branch") ? "branch-error" : "branch-hint"
            }
            className={inputClass("branch")}
          />

          {hasError("branch") ? (
            <p
              id="branch-error"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-red-600"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.branch}
            </p>
          ) : (
            <p id="branch-hint" className="text-xs text-slate-400">
              Mention your major, branch or area of specialization.
            </p>
          )}

        </div>

      </section>

      {/* ADDITIONAL QUALIFICATIONS */}

      <section className="space-y-3">

        <div className="border-b border-slate-200 pb-2">
          <h4 className="text-sm font-semibold text-slate-900">
            Additional Qualifications
            <span className="ml-2 text-xs font-normal text-slate-400">
              Optional
            </span>
          </h4>

          <p className="mt-0.5 text-xs text-slate-500">
            Include certifications, achievements or relevant courses.
          </p>
        </div>

        <div className="space-y-1.5">

          <Label
            htmlFor="qualifications"
            className="text-sm font-medium text-slate-700"
          >
            Certifications & Achievements
          </Label>

          <Textarea
            id="qualifications"
            value={data.qualifications}
            onChange={(e) =>
              handleChange("qualifications", e.target.value)
            }
            onBlur={() => handleBlur("qualifications")}
            placeholder="e.g. Python Certification, CTET, Mathematics Olympiad..."
            rows={3}
            maxLength={1000}
            aria-invalid={hasError("qualifications")}
            aria-describedby="qualifications-hint"
            className={`min-h-[90px] resize-y rounded-lg border-slate-300 bg-white text-sm shadow-none placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 ${
              hasError("qualifications")
                ? "border-red-400"
                : ""
            }`}
          />

          <div className="flex items-center justify-between gap-2">

            <p
              id="qualifications-hint"
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <Info className="h-3.5 w-3.5" />
              Add qualifications relevant to teaching.
            </p>

            <span className="shrink-0 text-xs text-slate-400">
              {data.qualifications.length}/1000
            </span>

          </div>

          {hasError("qualifications") && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-xs text-red-600"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.qualifications}
            </p>
          )}

        </div>

      </section>

    </div>
  );
}