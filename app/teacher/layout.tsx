"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

import {
  LayoutDashboard,
  Users,
  Wallet,
  GraduationCap,
  Menu,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

const teacherNav = [
  {
    label: "Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
  },
  {
    label: "All Clients",
    href: "/teacher/clients",
    icon: Users,
  },
  {
    label: "Credits",
    href: "/teacher/credits",
    icon: Wallet,
  },
];

export default function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const { user, isLoaded } = useUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);

  // Clerk user information
  const teacherName =
    user?.fullName ||
    user?.firstName ||
    "Teacher";

  const teacherEmail =
    user?.primaryEmailAddress?.emailAddress ||
    "TutorSathi Member";

  const teacherImage = user?.imageUrl;

  // Current page title
  const currentPage =
    teacherNav.find((item) => {
      if (item.href === "/teacher") {
        return pathname === "/teacher";
      }

      return pathname.startsWith(item.href);
    })?.label || "Teacher Portal";

  // Navigation handler
  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setPendingPath(href);
    }

    setSidebarOpen(false);
  };

  // Check active navigation
  const isActive = (href: string) => {
    if (href === "/teacher") {
      return pathname === "/teacher";
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#E8ECF8] bg-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#EEF2F8] px-6">
          <Link
            href="/teacher"
            onClick={() => handleNavigation("/teacher")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
              <GraduationCap size={23} />
            </div>

            <div>
              <h1 className="text-[19px] font-extrabold tracking-tight text-[#172554]">
                TutorSathi
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                Teacher Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {teacherNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const loading = pendingPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                      : "text-[#64748B] hover:bg-[#F1F5FF] hover:text-blue-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={19}
                      strokeWidth={active ? 2.4 : 2}
                      className={
                        active
                          ? "text-white"
                          : "text-[#94A3B8] group-hover:text-blue-600"
                      }
                    />

                    <span className="text-[13px] font-semibold">
                      {item.label}
                    </span>
                  </div>

                  {loading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : active ? (
                    <ChevronRight size={16} />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* TEACHER ACCOUNT */}
        <div className="shrink-0 border-t border-[#EEF2F8] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#E8ECFF] bg-gradient-to-r from-[#F8FAFF] to-[#F1F5FF] p-3">
            {/* PROFILE IMAGE */}
            <div className="shrink-0">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10",
                    userButtonPopoverCard: "shadow-xl",
                  },
                }}
              />
            </div>

            {/* USER DETAILS */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#172554]">
                {isLoaded ? teacherName : "Loading..."}
              </p>

              <p className="truncate text-[11px] text-[#64748B]">
                {isLoaded ? teacherEmail : "Please wait"}
              </p>
            </div>

            {/* ONLINE INDICATOR */}
            <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
          </div>

          <p className="mt-4 text-center text-[10px] text-[#94A3B8]">
            © {year ?? "TutorSathi"} TutorSathi. All rights reserved.
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E8ECF8] bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-xl border border-[#E8ECF8] p-2.5 text-[#475569] transition hover:bg-[#F1F5FF] lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* PAGE TITLE */}
            <div>
              <h2 className="text-[16px] font-bold text-[#172554] sm:text-lg">
                {currentPage}
              </h2>

              <p className="hidden text-[11px] text-[#94A3B8] sm:block">
                Welcome to your TutorSathi workspace
              </p>
            </div>
          </div>

          {/* HEADER RIGHT */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#E0E7FF] bg-[#F5F7FF] px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />

              <span className="text-[11px] font-semibold text-indigo-700">
                Teacher Portal
              </span>
            </div>

            <div className="lg:hidden">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-76px)]">
          {children}
        </main>
      </div>
    </div>
  );
}