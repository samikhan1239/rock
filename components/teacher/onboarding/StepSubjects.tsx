"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Plus,
  Trash2,
  BookOpen,
  BriefcaseBusiness,
  MapPin,
  Clock3,
  Languages,
  Info,
} from "lucide-react";

export interface SubjectItem {
  subject: string;
  classes: string;
}

export interface TeachingInfo {
  experienceYears: string;
  preferredMode: string;
  availability: string;
  expectedSalary: string;
  preferredLocation: string;
  languages: string;
}

interface Props {
  subjects: SubjectItem[];
  teachingInfo: TeachingInfo;
  onSubjectsChange: (subjects: SubjectItem[]) => void;
  onTeachingInfoChange: (info: TeachingInfo) => void;
  showValidationErrors?: boolean;
}

const MAX_SUBJECTS = 10;

export default function StepSubjects({
  subjects,
  teachingInfo,
  onSubjectsChange,
  onTeachingInfoChange,
  showValidationErrors = false,
}: Props) {
  const [touchedSubjects, setTouchedSubjects] = useState<number[]>([]);
  const [touchedFields, setTouchedFields] = useState<string[]>([]);

  const addSubject = () => {
    if (subjects.length >= MAX_SUBJECTS) return;

    onSubjectsChange([...subjects, { subject: "", classes: "" }]);
  };

  const removeSubject = (index: number) => {
    onSubjectsChange(subjects.filter((_, i) => i !== index));

    setTouchedSubjects((prev) =>
      prev
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))
    );
  };

  const updateSubject = (
    index: number,
    field: keyof SubjectItem,
    value: string
  ) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };

    onSubjectsChange(updated);
  };

  const handleTeachingChange = (
    field: keyof TeachingInfo,
    value: string
  ) => {
    onTeachingInfoChange({
      ...teachingInfo,
      [field]: value,
    });
  };

  const markSubjectTouched = (index: number) => {
    setTouchedSubjects((prev) =>
      prev.includes(index) ? prev : [...prev, index]
    );
  };

  const markFieldTouched = (field: string) => {
    setTouchedFields((prev) =>
      prev.includes(field) ? prev : [...prev, field]
    );
  };

  const showSubjectError = (index: number) =>
    showValidationErrors || touchedSubjects.includes(index);

  const showFieldError = (field: string) =>
    showValidationErrors || touchedFields.includes(field);

  const getSubjectError = (value: string) => {
    if (!value.trim()) return "Please enter a subject.";
    if (value.trim().length < 2) return "Enter at least 2 characters.";
    return "";
  };

  const getClassesError = (value: string) => {
    if (!value.trim()) return "Please specify the classes you can teach.";
    return "";
  };

  const experienceError = (() => {
    const value = teachingInfo.experienceYears;

    if (!value.trim()) return "";
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0 || number > 50) {
      return "Enter a valid experience between 0 and 50 years.";
    }

    return "";
  })();

  const salaryError = (() => {
    const value = teachingInfo.expectedSalary;

    if (!value.trim()) return "";
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      return "Please enter a valid monthly amount.";
    }

    return "";
  })();

  const locationError =
    teachingInfo.preferredLocation.trim().length === 1
      ? "Enter at least 2 characters."
      : "";

  const languagesError =
    teachingInfo.languages.length > 150
      ? "Languages must be within 150 characters."
      : "";

  const availabilityError =
    teachingInfo.availability.length > 500
      ? "Availability must be within 500 characters."
      : "";

  const fieldClass = (hasError: boolean) =>
    `h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/20 ${
      hasError
        ? "border-red-400 focus-visible:ring-red-200"
        : "hover:border-slate-300"
    }`;

  const sectionHeading = (
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* SUBJECTS */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {sectionHeading(
            <BookOpen className="h-4 w-4" />,
            "Subjects & Classes",
            "Tell students which subjects and academic levels you can teach."
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubject}
            disabled={subjects.length >= MAX_SUBJECTS}
            className="h-9 w-fit shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Subject
          </Button>
        </div>

        <div className="space-y-3">
          {subjects.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-7 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-slate-400" />

              <p className="mt-2 text-sm font-medium text-slate-700">
                No subjects added yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add at least one subject to continue.
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubject}
                className="mt-3 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first subject
              </Button>
            </div>
          )}

          {subjects.map((item, index) => {
            const subjectError = getSubjectError(item.subject);
            const classesError = getClassesError(item.classes);

            const displaySubjectError =
              showSubjectError(index) && subjectError;

            const displayClassesError =
              showSubjectError(index) && classesError;

            return (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject {index + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        aria-label={`Remove subject ${index + 1}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`subject-${index}`}
                      className="text-xs font-medium text-slate-700"
                    >
                      Subject <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      id={`subject-${index}`}
                      value={item.subject}
                      maxLength={80}
                      placeholder="e.g. Mathematics"
                      className={fieldClass(!!displaySubjectError)}
                      aria-invalid={!!displaySubjectError}
                      aria-describedby={
                        displaySubjectError
                          ? `subject-error-${index}`
                          : undefined
                      }
                      onChange={(e) =>
                        updateSubject(index, "subject", e.target.value)
                      }
                      onBlur={() => markSubjectTouched(index)}
                    />

                    {displaySubjectError && (
                      <p
                        id={`subject-error-${index}`}
                        className="text-xs text-red-600"
                        role="alert"
                      >
                        {subjectError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`classes-${index}`}
                      className="text-xs font-medium text-slate-700"
                    >
                      Classes / Grades{" "}
                      <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      id={`classes-${index}`}
                      value={item.classes}
                      maxLength={100}
                      placeholder="e.g. Class 8, 9, 10"
                      className={fieldClass(!!displayClassesError)}
                      aria-invalid={!!displayClassesError}
                      aria-describedby={
                        displayClassesError
                          ? `classes-error-${index}`
                          : undefined
                      }
                      onChange={(e) =>
                        updateSubject(index, "classes", e.target.value)
                      }
                      onBlur={() => markSubjectTouched(index)}
                    />

                    {displayClassesError && (
                      <p
                        id={`classes-error-${index}`}
                        className="text-xs text-red-600"
                        role="alert"
                      >
                        {classesError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Example: Physics — Classes 11 and 12
          </span>

          <span>
            {subjects.length}/{MAX_SUBJECTS} subjects
          </span>
        </div>

        {subjects.length >= MAX_SUBJECTS && (
          <p className="text-xs text-amber-600">
            You have reached the maximum limit of {MAX_SUBJECTS} subjects.
          </p>
        )}
      </section>

      {/* EXPERIENCE & TEACHING MODE */}
      <section className="space-y-4 border-t border-slate-200 pt-6">
        {sectionHeading(
          <BriefcaseBusiness className="h-4 w-4" />,
          "Teaching Experience",
          "Share your experience and how you prefer to conduct classes."
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="experienceYears"
              className="text-xs font-medium text-slate-700"
            >
              Years of Experience
            </Label>

            <Input
              id="experienceYears"
              type="number"
              min="0"
              max="50"
              step="1"
              value={teachingInfo.experienceYears}
              placeholder="e.g. 2"
              className={fieldClass(
                showFieldError("experienceYears") && !!experienceError
              )}
              aria-invalid={
                showFieldError("experienceYears") && !!experienceError
              }
              onChange={(e) =>
                handleTeachingChange(
                  "experienceYears",
                  e.target.value
                )
              }
              onBlur={() => markFieldTouched("experienceYears")}
            />

            {showFieldError("experienceYears") && experienceError && (
              <p className="text-xs text-red-600" role="alert">
                {experienceError}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Enter 0 if you are a fresher.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="preferredMode"
              className="text-xs font-medium text-slate-700"
            >
              Preferred Teaching Mode
            </Label>

            <Select
              value={teachingInfo.preferredMode}
              onValueChange={(value) =>
                handleTeachingChange("preferredMode", value ?? "")
              }
            >
              <SelectTrigger
                id="preferredMode"
                className="h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <SelectValue placeholder="Select teaching mode" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="online">
                  Online — From anywhere
                </SelectItem>

                <SelectItem value="offline">
                  Offline — In person
                </SelectItem>

                <SelectItem value="both">
                  Both — Online & Offline
                </SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-slate-400">
              Choose how you would like to teach students.
            </p>
          </div>
        </div>
      </section>

      {/* LOCATION & EXPECTED SALARY */}
      <section className="space-y-4 border-t border-slate-200 pt-6">
        {sectionHeading(
          <MapPin className="h-4 w-4" />,
          "Location & Expected Earnings",
          "Help us understand your location and monthly teaching expectations."
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="preferredLocation"
              className="text-xs font-medium text-slate-700"
            >
              Preferred Teaching Location
            </Label>

            <Input
              id="preferredLocation"
              value={teachingInfo.preferredLocation}
              maxLength={100}
              placeholder="e.g. Indore, Madhya Pradesh"
              className={fieldClass(
                showFieldError("preferredLocation") && !!locationError
              )}
              aria-invalid={
                showFieldError("preferredLocation") && !!locationError
              }
              onChange={(e) =>
                handleTeachingChange(
                  "preferredLocation",
                  e.target.value
                )
              }
              onBlur={() => markFieldTouched("preferredLocation")}
            />

            {showFieldError("preferredLocation") && locationError && (
              <p className="text-xs text-red-600" role="alert">
                {locationError}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Particularly useful for offline teaching.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="expectedSalary"
              className="text-xs font-medium text-slate-700"
            >
              Expected Monthly Earnings (₹)
            </Label>

            <Input
              id="expectedSalary"
              type="number"
              min="0"
              step="100"
              value={teachingInfo.expectedSalary}
              placeholder="e.g. 10000"
              className={fieldClass(
                showFieldError("expectedSalary") && !!salaryError
              )}
              aria-invalid={
                showFieldError("expectedSalary") && !!salaryError
              }
              onChange={(e) =>
                handleTeachingChange(
                  "expectedSalary",
                  e.target.value
                )
              }
              onBlur={() => markFieldTouched("expectedSalary")}
            />

            {showFieldError("expectedSalary") && salaryError && (
              <p className="text-xs text-red-600" role="alert">
                {salaryError}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Your expected monthly teaching income.
            </p>
          </div>
        </div>
      </section>

      {/* AVAILABILITY */}
      <section className="space-y-4 border-t border-slate-200 pt-6">
        {sectionHeading(
          <Clock3 className="h-4 w-4" />,
          "Teaching Availability",
          "Let students know when you are generally available."
        )}

        <div className="space-y-1.5">
          <Label
            htmlFor="availability"
            className="text-xs font-medium text-slate-700"
          >
            Available Days & Timings
          </Label>

          <Textarea
            id="availability"
            value={teachingInfo.availability}
            maxLength={500}
            rows={3}
            placeholder="e.g. Monday to Friday: 5 PM – 8 PM&#10;Saturday & Sunday: 10 AM – 4 PM"
            className={`min-h-[90px] resize-y rounded-lg border-slate-200 bg-white text-sm shadow-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 ${
              showFieldError("availability") && availabilityError
                ? "border-red-400"
                : ""
            }`}
            aria-invalid={
              showFieldError("availability") && !!availabilityError
            }
            onChange={(e) =>
              handleTeachingChange("availability", e.target.value)
            }
            onBlur={() => markFieldTouched("availability")}
          />

          {showFieldError("availability") && availabilityError && (
            <p className="text-xs text-red-600" role="alert">
              {availabilityError}
            </p>
          )}

          <div className="flex justify-end">
            <span className="text-xs text-slate-400">
              {teachingInfo.availability.length}/500
            </span>
          </div>
        </div>
      </section>

      {/* LANGUAGES */}
      <section className="space-y-4 border-t border-slate-200 pt-6">
        {sectionHeading(
          <Languages className="h-4 w-4" />,
          "Languages",
          "Mention the languages you are comfortable teaching in."
        )}

        <div className="space-y-1.5">
          <Label
            htmlFor="languages"
            className="text-xs font-medium text-slate-700"
          >
            Languages You Speak
          </Label>

          <Input
            id="languages"
            value={teachingInfo.languages}
            maxLength={150}
            placeholder="e.g. English, Hindi, Marathi"
            className={fieldClass(
              showFieldError("languages") && !!languagesError
            )}
            aria-invalid={
              showFieldError("languages") && !!languagesError
            }
            onChange={(e) =>
              handleTeachingChange("languages", e.target.value)
            }
            onBlur={() => markFieldTouched("languages")}
          />

          {showFieldError("languages") && languagesError && (
            <p className="text-xs text-red-600" role="alert">
              {languagesError}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Separate multiple languages with commas.
          </p>
        </div>
      </section>

      {/* INFORMATION NOTE */}
      <div className="flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3.5 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

        <p className="text-xs leading-5 text-indigo-900/80">
          Keep your teaching details accurate and up to date. Students
          will use this information to understand your subjects, teaching
          preferences, and availability.
        </p>
      </div>
    </div>
  );
}