import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

function LoadingScreen() {
  return (
    <main className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFF] px-5">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/50 blur-[100px]" />

      {/* Loader */}
      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-9 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={25} strokeWidth={2.2} />
            </div>

            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              Tutor<span className="text-indigo-600">Sathi</span>
            </span>
          </div>
        </div>

        {/* Main loading panel */}
        <div className="overflow-hidden rounded-[26px] border border-indigo-100/80 bg-white/95 p-8 shadow-[0_20px_80px_-25px_rgba(79,70,229,0.18)] backdrop-blur-xl sm:p-9">
          {/* Animated loader */}
          <div className="mb-7 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[5px] border-indigo-100" />

              <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-transparent border-t-indigo-600 border-r-blue-400" />

              <div className="absolute inset-3 rounded-full bg-indigo-50" />

              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md shadow-indigo-100">
                <Sparkles
                  size={25}
                  className="animate-pulse text-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Preparing your dashboard
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              We&apos;re securely verifying your account and preparing your
              personalized TutorSathi experience.
            </p>
          </div>

          {/* Animated progress */}
          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-500" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <Loader2 size={15} className="animate-spin text-indigo-600" />

            <span className="text-xs font-semibold text-slate-500">
              Authenticating your session...
            </span>
          </div>

          {/* Features */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Your learning ecosystem
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: GraduationCap, label: "Teachers" },
                { icon: Users, label: "Students" },
                { icon: BookOpen, label: "Learning" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-4 transition-colors hover:bg-indigo-50"
                >
                  <Icon size={20} className="text-indigo-500" />

                  <span className="text-xs font-semibold text-slate-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-500" />

            <span className="text-[11px] font-medium text-slate-400">
              Secure authentication powered by TutorSathi
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          Please wait while we get everything ready.
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </main>
  );
}

async function getRedirectPath(): Promise<never> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!user?.role) {
    redirect("/select-role");
  }

  if (user.status !== "ACTIVE") {
    redirect("/login");
  }

  switch (user.role) {
    case "TEACHER":
      redirect("/teacher");

    case "CLIENT":
      redirect("/client");

    case "ADMIN":
      redirect("/admin");

    case "SUPER_ADMIN":
      redirect("/super-admin");

    default:
      redirect("/select-role");
  }
}

async function RedirectHandler() {
  await getRedirectPath();
  return null;
}

export default function AfterLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RedirectHandler />
    </Suspense>
  );
}