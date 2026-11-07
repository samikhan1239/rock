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
  ArrowUpRight,
  Check,
  ShieldCheck,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState<"TEACHER" | "CLIENT" | null>(null);
  const [selectedRole, setSelectedRole] = useState<"TEACHER" | "CLIENT" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    const existingRole = user.publicMetadata?.role as string | undefined;

    if (existingRole === "TEACHER") router.replace("/teacher");
    else if (existingRole === "CLIENT") router.replace("/client");
    else if (existingRole === "ADMIN") router.replace("/admin");
    else if (existingRole === "SUPER_ADMIN") router.replace("/super-admin");
  }, [isLoaded, user, router]);

  const selectRole = async (role: "TEACHER" | "CLIENT") => {
    if (!user) {
      setError("User not loaded. Please refresh the page.");
      return;
    }

    setSelectedRole(role);
    setLoading(role);
    setError("");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("Server returned invalid response. Check API route.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set role");
      }

      await user.reload();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (role === "TEACHER") {
        router.replace("/teacher/onboarding");
      } else {
        router.replace("/client");
      }
    } catch (err: unknown) {
      console.error("Select role error:", err);

      if (err instanceof Error) {
        setError(
          err.name === "AbortError"
            ? "Request timed out. Please try again."
            : err.message
        );
      } else {
        setError("Something went wrong. Please try again.");
      }

      setLoading(null);
      setSelectedRole(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* LEFT BRANDING SECTION */}
      <section className="relative lg:w-[46%] bg-[#101828] text-white overflow-hidden flex flex-col justify-between min-h-[330px] lg:min-h-screen px-7 py-8 sm:px-12 lg:px-16 lg:py-12">

        {/* Background decoration */}
        <div className="absolute -top-40 -right-32 w-[450px] h-[450px] rounded-full border border-white/[0.06]" />
        <div className="absolute -top-24 -right-16 w-[320px] h-[320px] rounded-full border border-white/[0.06]" />
        <div className="absolute bottom-[-180px] left-[-100px] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.08] blur-[100px]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>

          <span className="text-xl font-bold tracking-tight">
            Tutor<span className="text-emerald-400">Sathi</span>
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg py-12 lg:py-0">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Your journey starts here
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-semibold leading-[1.12] tracking-tight">
            Great things
            <br />
            happen when
            <br />
            <span className="text-emerald-400">we learn</span>
            <br />
            together.
          </h1>

          <p className="mt-7 text-base sm:text-lg leading-8 text-slate-400 max-w-md">
            Whether you want to share your knowledge or find someone to guide
            you, there is a place for you at TutorSathi.
          </p>

          {/* Feature indicators */}
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified profiles
            </div>

            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Quality learning
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="relative z-10 hidden lg:flex items-center justify-between text-xs text-slate-500">
          <span>© {new Date().getFullYear()} TutorSathi</span>
          <span>Learn. Teach. Grow.</span>
        </div>
      </section>

      {/* RIGHT ROLE SELECTION */}
      <section className="flex-1 flex items-center justify-center px-6 py-14 sm:px-12 lg:px-16 xl:px-24 bg-[#F8FAFC]">

        <div className="w-full max-w-xl">

          <div className="mb-10">

            <p className="text-sm font-semibold tracking-widest uppercase text-emerald-600 mb-4">
              Account setup · Step 01
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#101828]">
              How will you use
              <br />
              TutorSathi?
            </h2>

            <p className="mt-4 text-slate-500 leading-7">
              Choose the option that best describes you. We will personalize
              your experience accordingly.
            </p>

          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">

            {/* TEACHER OPTION */}
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setSelectedRole("TEACHER")}
              className={`group w-full flex items-center gap-5 text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === "TEACHER"
                  ? "border-emerald-600 bg-emerald-50/70"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === "TEACHER"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
              }`}>
                <GraduationCap className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-[#101828]">
                  I want to teach
                </h3>

                <p className="text-sm text-slate-500 mt-1 leading-6">
                  Share your knowledge and discover teaching opportunities.
                </p>

                <span className="inline-block mt-3 text-xs font-semibold text-emerald-700">
                  FOR TEACHERS & EDUCATORS
                </span>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selectedRole === "TEACHER"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300"
              }`}>
                {selectedRole === "TEACHER" && <Check className="w-4 h-4" />}
              </div>
            </button>

            {/* CLIENT OPTION */}
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setSelectedRole("CLIENT")}
              className={`group w-full flex items-center gap-5 text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === "CLIENT"
                  ? "border-emerald-600 bg-emerald-50/70"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === "CLIENT"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
              }`}>
                <Users className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-[#101828]">
                  I need a tutor
                </h3>

                <p className="text-sm text-slate-500 mt-1 leading-6">
                  Find trusted educators for your learning needs.
                </p>

                <span className="inline-block mt-3 text-xs font-semibold text-emerald-700">
                  FOR STUDENTS & PARENTS
                </span>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selectedRole === "CLIENT"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300"
              }`}>
                {selectedRole === "CLIENT" && <Check className="w-4 h-4" />}
              </div>
            </button>

          </div>

          {/* Continue Button */}
          <Button
            disabled={!selectedRole || loading !== null}
            onClick={() => selectedRole && selectRole(selectedRole)}
            className="mt-7 w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-none transition-all disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            Your information is securely protected.
          </div>

          <p className="mt-12 text-center text-xs text-slate-400 lg:hidden">
            © {new Date().getFullYear()} TutorSathi. Learn. Teach. Grow.
          </p>

        </div>
      </section>

    </main>
  );
}