import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

import {
  Search,
  MessageSquare,
  Wallet,
  ArrowUpRight,
  MapPin,
  GraduationCap,
  BookOpen,
  UserRound,
  Settings2,
  Clock3,
  Users,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientOverviewPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      clientProfile: true,
      creditWallet: true,
    },
  });

  if (!dbUser?.clientProfile) {
    redirect("/client/onboarding");
  }

  const profile = dbUser.clientProfile;

  if (
    !profile.location ||
    !profile.studentClass ||
    !profile.requiredSubjects?.length ||
    !profile.teachingMode
  ) {
    redirect("/client/onboarding");
  }

  const availableCredits =
    (dbUser.creditWallet?.freeCredits || 0) +
    (dbUser.creditWallet?.purchasedCredits || 0) -
    (dbUser.creditWallet?.reservedCredits || 0);

  const [pendingRequests, activeConnections, totalRequests] =
    await Promise.all([
      prisma.connectionRequest.count({
        where: {
          clientId: profile.id,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      }),

      prisma.connectionRequest.count({
        where: {
          clientId: profile.id,
          status: {
            in: [
              "APPROVED",
              "CONNECTION_ESTABLISHED",
              "HIRING_CONFIRMED",
            ],
          },
        },
      }),

      prisma.connectionRequest.count({
        where: {
          clientId: profile.id,
        },
      }),
    ]);

  const firstName = clerkUser.firstName || "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      {/* Welcome */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Client Dashboard
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your tutor search and learning requests.
          </p>
        </div>

        <Link href="/client/find-teacher">
          <Button className="h-10 gap-2 rounded-lg bg-indigo-600 px-4 shadow-sm hover:bg-indigo-700">
            <Search className="h-4 w-4" />
            Find a Teacher
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Account Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Available Credits"
            value={availableCredits}
            description="Ready to use"
            icon={<Wallet className="h-4 w-4" />}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            description="Awaiting review"
            icon={<Clock3 className="h-4 w-4" />}
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Active Connections"
            value={activeConnections}
            description="Approved requests"
            icon={<Users className="h-4 w-4" />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total Requests"
            value={totalRequests}
            description="All submitted requests"
            icon={<MessageSquare className="h-4 w-4" />}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>
      </section>

      {/* Learning Requirements */}
      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">
                  Learning Requirements
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your preferences used to find suitable teachers.
                </p>
              </div>
            </div>

            <Link href="/client/onboarding">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <RequirementItem
              icon={<GraduationCap className="h-4 w-4" />}
              label="Class / Grade"
              value={profile.studentClass}
            />

            <RequirementItem
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={profile.location}
            />

            <RequirementItem
              icon={<BookOpen className="h-4 w-4" />}
              label="Teaching Mode"
              value={profile.teachingMode}
            />
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Required Subjects
            </p>

            <div className="flex flex-wrap gap-2">
              {profile.requiredSubjects.map((subject) => (
                <Badge
                  key={subject}
                  variant="secondary"
                  className="rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick Access
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Everything you need to manage your tutoring experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionLink
            href="/client/find-teacher"
            icon={<Search className="h-5 w-5" />}
            title="Find Teachers"
            description="Browse verified tutor profiles"
          />

          <ActionLink
            href="/client/requests"
            icon={<MessageSquare className="h-5 w-5" />}
            title="My Requests"
            description="View and track your requests"
          />

          <ActionLink
            href="/client/credits"
            icon={<Wallet className="h-5 w-5" />}
            title="Manage Credits"
            description="Check your available credits"
          />
        </div>
      </section>

      {/* Empty / Activity Prompt */}
      {totalRequests === 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Start finding your ideal teacher
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Explore verified tutors based on your learning requirements.
            </p>
          </div>

          <Link href="/client/find-teacher">
            <Button
              size="sm"
              className="h-9 gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Explore Teachers
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          <div className={`rounded-lg p-2 ${iconClass}`}>
            {icon}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- REQUIREMENT ITEM ---------------- */

function RequirementItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-indigo-500">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-1 truncate text-sm font-medium text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ---------------- QUICK ACTION ---------------- */

function ActionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-600" />
    </Link>
  );
}