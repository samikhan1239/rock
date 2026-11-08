"use client";

import Link from "next/link";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

function LoginLoader() {
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600" />
        <p className="text-sm text-slate-500">
          Preparing your login...
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT: BRANDING */}
        <section className="relative hidden overflow-hidden bg-[#111B46] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16">

          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-[350px] w-[350px] rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 inline-flex w-fit items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-950/30">
              <GraduationCap size={25} className="text-white" />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight">
                Tutor<span className="text-indigo-400">Sathi</span>
              </p>
              <p className="text-[10px] font-medium tracking-[0.18em] text-indigo-200/70">
                LEARN. TEACH. GROW.
              </p>
            </div>
          </Link>

          {/* Main content */}
          <div className="relative z-10 my-auto max-w-xl py-16">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-medium text-indigo-200">
              <Sparkles size={14} />
              A smarter way to find the right tutor
            </div>

            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
              Better learning
              <br />
              starts with the
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                right connection.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              TutorSathi brings students, parents and passionate
              educators together through a trusted learning
              marketplace.
            </p>

            {/* Benefits */}
            <div className="mt-12 space-y-6">

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                  <BadgeCheck size={21} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Verified teacher profiles
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Explore teacher qualifications, experience
                    and teaching demonstrations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                  <Sparkles size={21} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    AI-powered assessments
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Discover teacher profiles with structured
                    AI interview assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                  <Users size={21} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    A connected learning community
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Bring parents, students and educators
                    together in one place.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom stats strip */}
            <div className="mt-14 flex items-center gap-8 border-t border-white/10 pt-7">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck size={16} className="text-blue-300" />
                  Trusted platform
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Designed around trust
                </p>
              </div>

              <div className="h-9 w-px bg-white/10" />

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen size={16} className="text-blue-300" />
                  Personalized learning
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Learn at your own pace
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} TutorSathi</p>
            <p>Made for better learning.</p>
          </div>
        </section>

        {/* RIGHT: LOGIN */}
        <section className="relative flex min-h-screen flex-col bg-[#F8FAFF] px-5 py-6 sm:px-10 lg:bg-white lg:px-12 xl:px-20">

          {/* Mobile logo */}
          <div className="mx-auto flex w-full max-w-md items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                <GraduationCap size={23} className="text-white" />
              </div>

              <span className="text-xl font-bold tracking-tight text-slate-900">
                Tutor<span className="text-indigo-600">Sathi</span>
              </span>
            </Link>

            <Link
              href="/"
              className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              Home
            </Link>
          </div>

          {/* Login container */}
          <div className="flex flex-1 items-center justify-center py-12 lg:py-8">
            <div className="w-full max-w-[420px]">

              {/* Heading */}
              <div className="mb-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 lg:hidden">
                  <GraduationCap size={25} />
                </div>

                <div className="mb-3 hidden h-1 w-12 rounded-full bg-indigo-600 lg:block" />

                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to your TutorSathi account and
                  continue your learning journey.
                </p>
              </div>

              {/* Clerk Sign In */}
              <Suspense fallback={<LoginLoader />}>
                <SignIn
                  forceRedirectUrl="/after-login"
                  signUpUrl="/register"
                  appearance={{
                    variables: {
                      colorPrimary: "#4F46E5",
                      colorBackground: "#FFFFFF",
                      borderRadius: "0.75rem",
                      fontFamily: "Inter, sans-serif",
                    },

                    elements: {
                      rootBox: "w-full mx-auto",

                      card: "w-full shadow-none border-0 p-0 bg-transparent",

                      headerTitle:
                        "text-2xl font-bold tracking-tight text-slate-900",

                      headerSubtitle:
                        "text-sm text-slate-500",

                      socialButtonsBlockButton:
                        "h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-none transition hover:bg-slate-50 hover:border-indigo-200",

                      socialButtonsBlockButtonText:
                        "font-medium text-slate-700",

                      dividerLine: "bg-slate-200",

                      dividerText:
                        "text-xs font-medium text-slate-400",

                      formFieldLabel:
                        "mb-1.5 text-sm font-medium text-slate-700",

                      formFieldInput:
                        "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",

                      formButtonPrimary:
                        "h-11 rounded-xl bg-indigo-600 text-sm font-semibold shadow-sm transition hover:bg-indigo-700",

                      footerActionLink:
                        "font-semibold text-indigo-600 hover:text-indigo-700",

                      identityPreview:
                        "rounded-xl border border-slate-200 bg-slate-50",

                      formFieldAction:
                        "text-sm font-medium text-indigo-600 hover:text-indigo-700",

                      footer:
                        "bg-transparent shadow-none",

                      footerAction:
                        "text-sm text-slate-500",

                      alert:
                        "rounded-xl text-sm",
                    },
                  }}
                />
              </Suspense>

              {/* Security note */}
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Your account, your learning journey
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sign in securely to access your profile,
                    requests and personalized dashboard.
                  </p>
                </div>
              </div>

              {/* Home link */}
              <div className="mt-7 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                >
                  Back to homepage
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mx-auto w-full max-w-md border-t border-slate-100 py-5 text-center text-xs text-slate-400">
            TutorSathi. All rights reserved.
          </div>
        </section>
      </div>
    </main>
  );
}