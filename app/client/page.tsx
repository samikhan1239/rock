import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Users,
  Wallet,
  ArrowUpRight,
  MapPin,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock3,
  UserRound,
  Settings2,
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

  const [pendingRequests, hiredCount, totalRequests] = await Promise.all([
    prisma.connectionRequest.count({
      where: {
        clientId: profile.id,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    }),

    prisma.connectionRequest.count({
      where: {
        clientId: profile.id,
        status: {
          in: ["APPROVED", "CONNECTION_ESTABLISHED", "HIRING_CONFIRMED"],
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
    <div className="min-h-full space-y-7 pb-8">
      {/* Welcome Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
              Client Dashboard
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Find the right tutor and manage your teaching requests.
          </p>
        </div>

        <Link href="/client/find-teachers">
          <Button className="gap-2 bg-indigo-600 shadow-sm hover:bg-indigo-700">
            <Search className="h-4 w-4" />
            Find a Teacher
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Profile Summary */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Your Learning Requirements
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your profile helps us find suitable tutors.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1 border-slate-200 bg-slate-50 text-slate-600"
                  >
                    <GraduationCap className="h-3 w-3" />
                    {profile.studentClass}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="gap-1 border-slate-200 bg-slate-50 text-slate-600"
                  >
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="gap-1 border-slate-200 bg-slate-50 text-slate-600"
                  >
                    <BookOpen className="h-3 w-3" />
                    {profile.requiredSubjects.length} Subjects
                  </Badge>
                </div>
              </div>
            </div>

            <Link href="/client/onboarding">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Settings2 className="h-4 w-4" />
                Edit Requirements
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Overview
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Your account activity at a glance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Credits */}
          <StatCard
            title="Available Credits"
            value={availableCredits}
            description="Ready to use"
            icon={<Wallet className="h-5 w-5" />}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          {/* Pending */}
          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            description="Waiting for admin review"
            icon={<Clock3 className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
          />

          {/* Hired */}
          <StatCard
            title="Approved Connections"
            value={hiredCount}
            description="Approved teacher requests"
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          {/* Total */}
          <StatCard
            title="Total Requests"
            value={totalRequests}
            description="Requests submitted"
            icon={<MessageSquare className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage your tutor search and account.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ActionLink
                href="/client/find-teachers"
                icon={<Search className="h-5 w-5" />}
                title="Find Teachers"
                description="Explore verified tutors"
              />

              <ActionLink
                href="/client/requests"
                icon={<MessageSquare className="h-5 w-5" />}
                title="My Requests"
                description="Track your connections"
              />

              <ActionLink
                href="/client/onboarding"
                icon={<Settings2 className="h-5 w-5" />}
                title="Edit Requirements"
                description="Update your preferences"
              />

              <ActionLink
                href="/client/credits"
                icon={<Wallet className="h-5 w-5" />}
                title="Manage Credits"
                description="View or purchase credits"
              />
            </div>
          </CardContent>
        </Card>

        {/* Request Process */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-semibold text-slate-900">
              How it works
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Get connected with the right tutor.
            </p>

            <div className="mt-5 space-y-5">
              <ProcessStep
                number="01"
                title="Find a tutor"
                description="Browse verified teacher profiles."
                completed
              />

              <ProcessStep
                number="02"
                title="Send a request"
                description="Submit your connection request."
                completed={totalRequests > 0}
              />

              <ProcessStep
                number="03"
                title="Admin review"
                description="Our admin reviews your request."
                completed={hiredCount > 0}
              />

              <ProcessStep
                number="04"
                title="Get connected"
                description="Connect after approval."
                completed={hiredCount > 0}
                last
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bottom CTA */}
      <div className="flex flex-col gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            Ready to find your next tutor?
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Explore verified teachers based on your learning requirements.
          </p>
        </div>

        <Link href="/client/find-teachers">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            Explore Teachers
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
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
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <div className={`rounded-lg p-2 ${iconClass}`}>
            {icon}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
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
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div className="group flex h-full items-center gap-3 rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
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
      </div>
    </Link>
  );
}

/* ---------------- PROCESS STEP ---------------- */

function ProcessStep({
  number,
  title,
  description,
  completed,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  completed: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div className="absolute left-[15px] top-8 h-9 w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          completed
            ? "bg-indigo-100 text-indigo-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <div className="min-w-0 pb-1">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}