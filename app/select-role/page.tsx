"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  Loader2,
  ArrowRight,
  Check,
  ShieldCheck,
  BookOpen,
  Sparkles,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";

type Role = "TEACHER" | "CLIENT";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    const existingRole = user.publicMetadata?.role as string | undefined;

    const routes: Record<string, string> = {
      TEACHER: "/teacher",
      CLIENT: "/client",
      ADMIN: "/admin",
      SUPER_ADMIN: "/super-admin",
    };

    if (existingRole && routes[existingRole]) {
      router.replace(routes[existingRole]);
    }
  }, [isLoaded, user, router]);

  const selectRole = async (role: Role) => {
    if (!user) {
      setError("User not loaded. Please refresh the page.");
      return;
    }

    setSelectedRole(role);
    setLoading(role);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("Invalid server response. Please try again.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set your account role.");
      }

      await user.reload();

      router.replace(
        role === "TEACHER" ? "/teacher/onboarding" : "/client"
      );
      router.refresh();
    } catch (err: unknown) {
      clearTimeout(timeout);

      console.error("Select role error:", err);

      setError(
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Please try again."
            : err.message
          : "Something went wrong. Please try again."
      );

      setLoading(null);
      setSelectedRole(null);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">
            Preparing your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* LEFT BRANDING SECTION */}
      <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#111B3D] px-7 py-7 text-white sm:px-12 lg:min-h-screen lg:w-[43%] lg:px-14 lg:py-10 xl:px-16">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />

        <div className="pointer-events-none absolute right-[-100px] top-24 h-[350px] w-[350px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute right-[-50px] top-36 h-[250px] w-[250px] rounded-full border border-white/[0.06]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-900/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>

          <span className="text-xl font-bold tracking-tight">
            Tutor<span className="text-indigo-400">Sathi</span>
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg py-12 lg:py-0">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3.5 py-2 text-xs font-medium text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Your journey starts here
          </div>

          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl xl:text-[58px]">
            Great things
            <br />
            happen when
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              we learn
            </span>
            <br />
            together.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            Whether you want to share your knowledge or find someone to guide
            you, there is a place for you at TutorSathi.
          </p>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-blue-400" />
              Verified educators
            </div>

            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              Quality learning
            </div>
          </div>

          {/* Trust indicator */}
          <div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-7">
            <div className="flex -space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111B3D] bg-blue-500 text-xs font-semibold">
                T
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111B3D] bg-indigo-500 text-xs font-semibold">
                S
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111B3D] bg-violet-500 text-xs font-semibold">
                P
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-white">
                One platform, two possibilities
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Teach what you know. Learn what you love.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 hidden items-center justify-between text-xs text-slate-400 lg:flex">
          <span>© 2026 TutorSathi. All rights reserved.</span>
          <span>Learn. Teach. Grow.</span>
        </div>
      </section>

      {/* RIGHT ROLE SELECTION */}
      <section className="flex flex-1 items-center justify-center bg-[#F7F8FC] px-5 py-12 sm:px-10 lg:px-12 xl:px-20">
        <div className="w-full max-w-[520px]">
          {/* Heading */}
          <div className="mb-9">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Account setup
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">Step 01</span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[38px]">
              How will you use
              <br />
              TutorSathi?
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
              Choose your account type to get started. You can personalize
              your experience in the next steps.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Role options */}
          <div className="space-y-4">
            {/* Teacher */}
            <button
              type="button"
              disabled={loading !== null}
              aria-pressed={selectedRole === "TEACHER"}
              onClick={() => {
                setSelectedRole("TEACHER");
                setError("");
              }}
              className={`group relative flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 sm:p-6 ${
                selectedRole === "TEACHER"
                  ? "border-indigo-500 bg-indigo-50/70 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-slate-200/50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  selectedRole === "TEACHER"
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                }`}
              >
                <GraduationCap className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    I want to teach
                  </h3>

                  {selectedRole === "TEACHER" && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      SELECTED
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Share your knowledge and discover teaching opportunities.
                </p>

                <span className="mt-3 inline-block text-[10px] font-semibold tracking-wider text-indigo-600">
                  FOR TEACHERS & EDUCATORS
                </span>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                  selectedRole === "TEACHER"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-transparent group-hover:border-indigo-400"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Client */}
            <button
              type="button"
              disabled={loading !== null}
              aria-pressed={selectedRole === "CLIENT"}
              onClick={() => {
                setSelectedRole("CLIENT");
                setError("");
              }}
              className={`group relative flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 sm:p-6 ${
                selectedRole === "CLIENT"
                  ? "border-indigo-500 bg-indigo-50/70 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-slate-200/50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  selectedRole === "CLIENT"
                    ? "bg-indigo-600 text-white"
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                }`}
              >
                <Users className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    I need a tutor
                  </h3>

                  {selectedRole === "CLIENT" && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      SELECTED
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Find trusted educators for your learning needs.
                </p>

                <span className="mt-3 inline-block text-[10px] font-semibold tracking-wider text-blue-600">
                  FOR STUDENTS & PARENTS
                </span>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                  selectedRole === "CLIENT"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-transparent group-hover:border-indigo-400"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Continue */}
          <Button
            disabled={!selectedRole || loading !== null}
            onClick={() => {
              if (selectedRole) {
                void selectRole(selectedRole);
              }
            }}
            className="mt-7 h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            Your information is securely protected.
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-slate-400 lg:hidden">
            © 2026 TutorSathi. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}