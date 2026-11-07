import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Wallet,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  Video,
  Brain,
  User,
  Circle,
  Sparkles,
  Bell,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default async function TeacherOverviewPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      creditWallet: true,
      teacherProfile: {
        include: {
          subjects: true,
          videos: true,
          aiInterviews: {
            where: { status: "completed" },
            take: 1,
          },
        },
      },
    },
  });

  const profile = user?.teacherProfile;
  const wallet = user?.creditWallet;

  const availableCredits =
    (wallet?.freeCredits || 0) +
    (wallet?.purchasedCredits || 0) -
    (wallet?.reservedCredits || 0);

  const teacherId = profile?.id;

  const pendingRequests = teacherId
    ? await prisma.connectionRequest.count({
        where: {
          teacherId,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
      })
    : 0;

  const activeConnections = teacherId
    ? await prisma.connectionRequest.count({
        where: {
          teacherId,
          status: {
            in: ["APPROVED", "CONNECTION_ESTABLISHED", "HIRING_CONFIRMED"],
          },
        },
      })
    : 0;

  const verificationStatus = profile?.verificationStatus || "DRAFT";

  // Profile completion checklist
  const stepsDone = {
    profile: Boolean(profile?.city && profile?.address),
    education: Boolean(profile?.college && profile?.degree),
    subjects: (profile?.subjects?.length || 0) > 0,
    videos: (profile?.videos?.length || 0) > 0,
    interview: (profile?.aiInterviews?.length || 0) > 0,
    submitted: ["PENDING", "UNDER_REVIEW", "APPROVED"].includes(
      verificationStatus
    ),
  };

  const completedCount = Object.values(stepsDone).filter(Boolean).length;
  const progressPct = Math.round((completedCount / 6) * 100);

  const firstName = clerkUser.firstName || "Teacher";

  const stats = [
    {
      title: "Available Credits",
      value: String(availableCredits),
      description: `${wallet?.freeCredits || 0} free · ${wallet?.purchasedCredits || 0} purchased`,
      icon: Wallet,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      link: "/teacher/credits",
      linkText: "Buy / manage credits",
    },
    {
      title: "Pending Requests",
      value: String(pendingRequests),
      description: "Awaiting admin review",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      link: "/teacher/requests",
      linkText: "View requests",
    },
    {
      title: "Active Connections",
      value: String(activeConnections),
      description: "Approved by admin",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/teacher/requests",
      linkText: "View connections",
    },
    {
      title: "Verification",
      value: verificationStatus.replace("_", " "),
      description:
        verificationStatus === "APPROVED"
          ? "Your profile is verified"
          : "Complete onboarding to get verified",
      icon: ShieldCheck,
      color: "text-violet-600",
      bg: "bg-violet-50",
      link: "/teacher/verification",
      linkText: "View status",
    },
  ];

  const onboardingSteps = [
    {
      title: "Complete your profile",
      description: "Add your photo and personal information.",
      href: "/teacher/profile",
      icon: User,
      done: stepsDone.profile,
    },
    {
      title: "Add education details",
      description: "Show students your qualifications.",
      href: "/teacher/education",
      icon: GraduationCap,
      done: stepsDone.education,
    },
    {
      title: "Add your teaching subjects",
      description: "Select the subjects you can teach.",
      href: "/teacher/subjects",
      icon: BookOpen,
      done: stepsDone.subjects,
    },
    {
      title: "Upload introduction video",
      description: "Introduce yourself to potential students.",
      href: "/teacher/videos",
      icon: Video,
      done: stepsDone.videos,
    },
    {
      title: "Complete AI interview",
      description: "Demonstrate your teaching abilities.",
      href: "/teacher/ai-interview",
      icon: Brain,
      done: stepsDone.interview,
    },
    {
      title: "Submit for verification",
      description: "Get your profile reviewed by our team.",
      href: "/teacher/verification",
      icon: ShieldCheck,
      done: stepsDone.submitted,
    },
  ];

  const quickActions = [
    {
      title: "Buy Credits",
      description: "Top up credits for connection requests.",
      href: "/teacher/credits",
      icon: Wallet,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Browse Clients",
      description: "See students looking for tutors.",
      href: "/teacher/clients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "AI Interview",
      description: "Complete your teaching assessment.",
      href: "/teacher/ai-interview",
      icon: Brain,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Verification",
      description: "Check verification status.",
      href: "/teacher/verification",
      icon: ShieldCheck,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      {/* WELCOME */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4338CA] via-[#4F46E5] to-[#2563EB] p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
        <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher Dashboard
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Welcome back, {firstName}!
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">
              You have <strong>{availableCredits}</strong> credits available.
              Complete your profile and connect with students.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/teacher/credits"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                <Wallet className="h-4 w-4" />
                Buy Credits
              </Link>

              <Link
                href="/teacher/clients"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Browse Clients
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
              <GraduationCap className="h-20 w-20 text-white/90" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#172554]">Your Overview</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Live data from your account
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="group rounded-2xl border border-[#E8ECF5] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">
                      {stat.title}
                    </p>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#172554]">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>

                <p className="mt-2 text-xs text-[#94A3B8]">{stat.description}</p>

                <Link
                  href={stat.link}
                  className="mt-5 flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  {stat.linkText}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROFILE COMPLETION + VERIFICATION */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E8ECF5] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#172554]">
                  Profile Completion
                </h2>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  {completedCount}/6
                </span>
              </div>
              <p className="mt-1 text-sm text-[#64748B]">
                Complete these steps to get verified.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[#475569]">
                Progress
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {progressPct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {onboardingSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.title}
                  href={step.href}
                  className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-indigo-100 hover:bg-[#F8FAFF]"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      step.done
                        ? "bg-green-50 text-green-600"
                        : "bg-[#EEF2FF] text-indigo-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#334155]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      {step.description}
                    </p>
                  </div>
                  {step.done ? (
                    <span className="text-xs font-semibold text-green-600">
                      Done
                    </span>
                  ) : (
                    <Circle className="h-4 w-4 text-[#CBD5E1]" />
                  )}
                  <ChevronRight className="h-4 w-4 text-[#CBD5E1]" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#E8ECF5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#172554]">Verification</h2>
            <div className="rounded-xl bg-violet-50 p-2.5">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-[#EEF2FF] px-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#172554]">
              {verificationStatus.replace("_", " ")}
            </h3>
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-[#64748B]">
              {verificationStatus === "APPROVED"
                ? "You are verified and visible to clients."
                : "Complete profile and assessments before submission."}
            </p>
          </div>

          <Link
            href="/teacher/verification"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Go to Verification
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#172554]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-4 rounded-2xl border border-[#E8ECF5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#172554]">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* RECENT ACTIVITY placeholder */}
      <section className="rounded-2xl border border-[#E8ECF5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#172554]">Recent Activity</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Latest updates will appear here
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE3F0] bg-[#FAFBFF] px-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <Bell className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-[#334155]">
            No recent activity
          </h3>
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2.5 shadow-sm">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172554]">
              Need more connection requests?
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Buy credits anytime. Prices are controlled by Super Admin.
            </p>
          </div>
        </div>
        <Link
          href="/teacher/credits"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white"
        >
          Buy Credits
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}