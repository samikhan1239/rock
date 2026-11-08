"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  GraduationCap,
  MapPin,
  UserRound,
  Phone,
  Globe2,
  Laptop,
  Home,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  UserCheck,
  Clock3,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientForm = {
  fullName: string;
  phone: string;
  location: string;
  studentClass: string;
  requiredSubjects: string;
  teachingMode: string;
  preferredLanguage: string;
};

const initialForm: ClientForm = {
  fullName: "",
  phone: "",
  location: "",
  studentClass: "",
  requiredSubjects: "",
  teachingMode: "",
  preferredLanguage: "",
};

export default function ClientOnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  const [form, setForm] = useState<ClientForm>(initialForm);

  // Retrieve existing client profile.
  useEffect(() => {
    let isMounted = true;

    const fetchExistingProfile = async () => {
      try {
        setFetchingProfile(true);
        setFetchError("");

        const response = await fetch("/api/client/profile", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // No existing profile is a valid new-registration state.
          if (response.status === 404) {
            return;
          }

          throw new Error(
            data?.error || "Unable to retrieve your saved profile."
          );
        }

        if (!isMounted || !data) return;

        const profile =
          data.profile ??
          data.clientProfile ??
          data.data?.profile ??
          data.data ??
          data;

        if (!profile || typeof profile !== "object") {
          return;
        }

        const subjects = Array.isArray(profile.requiredSubjects)
          ? profile.requiredSubjects.join(", ")
          : typeof profile.requiredSubjects === "string"
            ? profile.requiredSubjects
            : "";

        const teachingMode = String(
          profile.teachingMode ?? ""
        ).toLowerCase();

        setForm({
          fullName: profile.fullName ?? "",
          phone: profile.phone ?? "",
          location: profile.location ?? "",
          studentClass:
            profile.studentClass !== null &&
            profile.studentClass !== undefined
              ? String(profile.studentClass)
              : "",
          requiredSubjects: subjects,
          teachingMode: ["online", "offline", "both"].includes(
            teachingMode
          )
            ? teachingMode
            : "",
          preferredLanguage: profile.preferredLanguage ?? "",
        });
      } catch (err) {
        console.error("Client profile retrieval failed:", err);

        if (isMounted) {
          setFetchError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve your saved information."
          );
        }
      } finally {
        if (isMounted) {
          setFetchingProfile(false);
        }
      }
    };

    fetchExistingProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof ClientForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Please enter your full name.";
    } else if (form.fullName.trim().length < 3) {
      errors.fullName = "Name must contain at least 3 characters.";
    }

    const phone = form.phone.replace(/[\s-]/g, "");

    if (!phone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!form.location.trim()) {
      errors.location = "Please enter your city or location.";
    }

    if (!form.studentClass) {
      errors.studentClass = "Please select the student's class.";
    }

    if (!form.teachingMode) {
      errors.teachingMode = "Please select a teaching mode.";
    }

    if (!form.requiredSubjects.trim()) {
      errors.requiredSubjects = "Please enter at least one subject.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Save profile and redirect after successful completion.
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading || fetchingProfile || redirecting) return;

    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/client/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          studentClass: form.studentClass,
          requiredSubjects: form.requiredSubjects.trim(),
          teachingMode: form.teachingMode,
          preferredLanguage: form.preferredLanguage.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            "We couldn't save your information. Please try again."
        );
        return;
      }

      // Show the success loading screen.
      setRedirecting(true);

      // Navigate to the client dashboard.
      router.replace("/client");
      router.refresh();
    } catch (err) {
      console.error("Client profile submission failed:", err);

      setError(
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const completedFields = [
    form.fullName.trim(),
    form.phone.trim(),
    form.location.trim(),
    form.studentClass,
    form.requiredSubjects.trim(),
    form.teachingMode,
  ].filter(Boolean).length;

  const progress = Math.round((completedFields / 6) * 100);

  const subjectsCount = form.requiredSubjects
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean).length;

  const formDisabled = loading || fetchingProfile || redirecting;

  return (
    <>
      {/* SUCCESS / REDIRECT LOADING SCREEN */}
      {redirecting && (
        <div
          className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-white px-5"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-md text-center">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-50" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <Check className="h-3.5 w-3.5" />
                Profile completed successfully
              </div>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                You're all set!
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Your information has been saved successfully.
                We're preparing your personalized learning dashboard.
              </p>
            </div>

            <div className="mx-auto mt-9 flex max-w-xs items-center gap-3 border-y border-slate-100 py-5">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-600" />

              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">
                  Setting up your dashboard
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait, this will only take a moment.
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              Your information is securely saved
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-white text-slate-900">
        {/* Header */}
        <header className="border-b border-slate-200">
          <div className="flex h-[68px] items-center justify-between px-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <GraduationCap size={22} />
              </div>

              <div>
                <p className="text-base font-bold tracking-tight">
                  TutorSathi
                </p>

                <p className="text-[11px] text-slate-500">
                  Your learning partner
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Secure registration
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 xl:gap-24">
            {/* LEFT SIDE - FORM */}
            <section className="min-w-0 lg:pr-4">
              <div className="mb-9">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">
                  <Sparkles size={14} />
                  Client registration
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Tell us about your
                  <span className="block text-indigo-600">
                    learning requirements.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Share a few details about your student and the kind of
                  teaching support you need. We&apos;ll help you discover
                  teachers who match your requirements.
                </p>
              </div>

              {/* Profile retrieval error */}
              {fetchError && (
                <div
                  role="alert"
                  className="mb-7 flex items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Unable to load your saved information
                    </p>

                    <p className="mt-1 text-sm leading-5 text-red-700">
                      {fetchError}
                    </p>

                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-700 hover:text-red-900"
                    >
                      <RefreshCw size={13} />
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Initial loading state */}
              {fetchingProfile && (
                <div
                  className="mb-8 flex items-center gap-3 border-y border-slate-200 py-5"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Retrieving your profile
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Checking for your previously saved information...
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Personal information */}
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <UserRound size={18} />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Personal information
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Basic details about the parent or guardian.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {/* Full name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Full name <Required />
                      </Label>

                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          id="fullName"
                          value={form.fullName}
                          onChange={(e) =>
                            handleChange("fullName", e.target.value)
                          }
                          placeholder="Enter your full name"
                          autoComplete="name"
                          maxLength={100}
                          disabled={formDisabled}
                          aria-invalid={!!fieldErrors.fullName}
                          className={inputClass(!!fieldErrors.fullName)}
                        />
                      </div>

                      {fieldErrors.fullName && (
                        <FieldError message={fieldErrors.fullName} />
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone number <Required />
                      </Label>

                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
                          maxLength={16}
                          disabled={formDisabled}
                          aria-invalid={!!fieldErrors.phone}
                          className={inputClass(!!fieldErrors.phone)}
                        />
                      </div>

                      {fieldErrors.phone && (
                        <FieldError message={fieldErrors.phone} />
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="location">
                        City or location <Required />
                      </Label>

                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          id="location"
                          value={form.location}
                          onChange={(e) =>
                            handleChange("location", e.target.value)
                          }
                          placeholder="e.g. Indore, Vijay Nagar"
                          autoComplete="address-level2"
                          maxLength={150}
                          disabled={formDisabled}
                          aria-invalid={!!fieldErrors.location}
                          className={inputClass(!!fieldErrors.location)}
                        />
                      </div>

                      {fieldErrors.location && (
                        <FieldError message={fieldErrors.location} />
                      )}

                      <p className="text-xs text-slate-400">
                        Enter the area where you need tuition.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="my-9 border-t border-slate-200" />

                {/* Learning requirements */}
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <BookOpen size={18} />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Learning requirements
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Tell us what kind of teacher your student needs.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {/* Student class */}
                    <div className="space-y-2">
                      <Label htmlFor="studentClass">
                        Student&apos;s class <Required />
                      </Label>

                      <Select
                        value={form.studentClass}
                        onValueChange={(value) =>
                          handleChange("studentClass", value ?? "")
                        }
                        disabled={formDisabled}
                      >
                        <SelectTrigger
                          id="studentClass"
                          aria-invalid={!!fieldErrors.studentClass}
                          className={`h-11 ${
                            fieldErrors.studentClass
                              ? "border-red-400 focus:ring-red-100"
                              : "border-slate-200 focus:ring-indigo-100"
                          }`}
                        >
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>

                        <SelectContent>
                          {Array.from({ length: 12 }, (_, index) =>
                            String(index + 1)
                          ).map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              Class {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {fieldErrors.studentClass && (
                        <FieldError message={fieldErrors.studentClass} />
                      )}
                    </div>

                    {/* Teaching mode */}
                    <div className="space-y-2">
                      <Label htmlFor="teachingMode">
                        Preferred teaching mode <Required />
                      </Label>

                      <Select
                        value={form.teachingMode}
                        onValueChange={(value) =>
                          handleChange("teachingMode", value ?? "")
                        }
                        disabled={formDisabled}
                      >
                        <SelectTrigger
                          id="teachingMode"
                          aria-invalid={!!fieldErrors.teachingMode}
                          className={`h-11 ${
                            fieldErrors.teachingMode
                              ? "border-red-400 focus:ring-red-100"
                              : "border-slate-200 focus:ring-indigo-100"
                          }`}
                        >
                          <SelectValue placeholder="Select teaching mode" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="online">
                            <span className="flex items-center gap-2">
                              <Laptop className="h-4 w-4 text-indigo-500" />
                              Online classes
                            </span>
                          </SelectItem>

                          <SelectItem value="offline">
                            <span className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-indigo-500" />
                              Offline / Home tuition
                            </span>
                          </SelectItem>

                          <SelectItem value="both">
                            <span className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-indigo-500" />
                              Both options
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {fieldErrors.teachingMode && (
                        <FieldError message={fieldErrors.teachingMode} />
                      )}
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="requiredSubjects">
                          Subjects required <Required />
                        </Label>

                        {subjectsCount > 0 && (
                          <span className="text-xs font-semibold text-indigo-600">
                            {subjectsCount}{" "}
                            {subjectsCount === 1 ? "subject" : "subjects"} added
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          id="requiredSubjects"
                          value={form.requiredSubjects}
                          onChange={(e) =>
                            handleChange(
                              "requiredSubjects",
                              e.target.value
                            )
                          }
                          placeholder="Mathematics, Science, English"
                          maxLength={300}
                          disabled={formDisabled}
                          aria-invalid={!!fieldErrors.requiredSubjects}
                          className={inputClass(
                            !!fieldErrors.requiredSubjects
                          )}
                        />
                      </div>

                      {fieldErrors.requiredSubjects ? (
                        <FieldError
                          message={fieldErrors.requiredSubjects}
                        />
                      ) : (
                        <p className="text-xs text-slate-400">
                          Enter multiple subjects separated by commas.
                        </p>
                      )}
                    </div>

                    {/* Preferred language */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="preferredLanguage">
                        Preferred language{" "}
                        <span className="font-normal text-slate-400">
                          (Optional)
                        </span>
                      </Label>

                      <div className="relative">
                        <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          id="preferredLanguage"
                          value={form.preferredLanguage}
                          onChange={(e) =>
                            handleChange(
                              "preferredLanguage",
                              e.target.value
                            )
                          }
                          placeholder="e.g. English, Hindi, Marathi"
                          maxLength={150}
                          disabled={formDisabled}
                          className={inputClass(false)}
                        />
                      </div>

                      <p className="text-xs text-slate-400">
                        Which language is the student most comfortable learning in?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission error */}
                {error && (
                  <div
                    role="alert"
                    className="mt-8 flex items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        We couldn&apos;t save your profile
                      </p>

                      <p className="mt-1 text-sm leading-5 text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="mt-9 border-t border-slate-200 pt-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Ready to find your tutor?
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        You can update your requirements later.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={formDisabled}
                      className="h-12 w-full gap-2 rounded-lg bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {fetchingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading your profile...
                        </>
                      ) : loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving your information...
                        </>
                      ) : (
                        <>
                          Save and continue
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {loading && (
                    <div
                      className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Setting up your profile
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Please wait while we securely save your information.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5">
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      Your information is protected
                    </p>

                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Check className="h-3.5 w-3.5 text-indigo-500" />
                      No commitment required
                    </p>
                  </div>
                </div>
              </form>
            </section>

            {/* RIGHT SIDE - INFORMATION */}
            <aside className="lg:sticky lg:top-10 lg:col-start-2 lg:row-start-1 lg:self-start lg:border-l lg:border-slate-200 lg:pl-10 xl:pl-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">
                <Sparkles size={14} />
                Welcome to TutorSathi
              </div>

              <h2 className="mt-5 text-3xl font-bold leading-[1.2] tracking-tight text-slate-950">
                Find the right
                <span className="block text-indigo-600">
                  tutor for your
                </span>
                learning journey.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500">
                Quality education starts with the right guidance. Tell us
                your requirements and we&apos;ll help you connect with teachers
                who understand your student&apos;s needs.
              </p>

              {/* Progress */}
              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Profile completion
                  </span>

                  <span className="text-sm font-bold text-indigo-600">
                    {progress}%
                  </span>
                </div>

                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Profile completion"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {completedFields} of 6 required fields completed
                </p>
              </div>

              {/* Benefits */}
              <div className="mt-10 space-y-7 border-t border-slate-100 pt-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UserCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Personalized recommendations
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Discover teachers based on your student&apos;s academic needs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Verified teacher profiles
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Explore teacher profiles and their verification details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Clock3 size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Quick and simple setup
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Complete your details in approximately two minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust information */}
              <div className="mt-10 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Your information is handled securely.
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Your details help us find suitable teaching options.
                  You can update your preferences later.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 px-5 py-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} TutorSathi. All rights reserved.
            </p>

            <p>Making quality education more accessible.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

function Required() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function inputClass(hasError: boolean) {
  return `h-11 border bg-white pl-10 text-sm shadow-none transition-colors placeholder:text-slate-400 focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    hasError
      ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100"
      : "border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
  }`;
}