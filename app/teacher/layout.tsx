"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import {
  LayoutDashboard,
  User,
  GraduationCap,
  BookOpen,
  Video,
  Brain,
  ShieldCheck,
  Briefcase,
  MessageSquare,
  Wallet,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

const teacherNav = [
  { name: "Overview", href: "/teacher", icon: LayoutDashboard },
  { name: "Profile", href: "/teacher/profile", icon: User },
  { name: "Education", href: "/teacher/education", icon: GraduationCap },
  { name: "Subjects", href: "/teacher/subjects", icon: BookOpen },
  { name: "Videos", href: "/teacher/videos", icon: Video },
  { name: "AI Interview", href: "/teacher/ai-interview", icon: Brain },
  { name: "Verification", href: "/teacher/verification", icon: ShieldCheck },
  { name: "Opportunities", href: "/teacher/opportunities", icon: Briefcase },
  { name: "Requests", href: "/teacher/requests", icon: MessageSquare },
  { name: "Credits", href: "/teacher/credits", icon: Wallet },
  { name: "Subscriptions", href: "/teacher/subscriptions", icon: CreditCard },
  { name: "Notifications", href: "/teacher/notifications", icon: Bell },
  { name: "Support", href: "/teacher/support", icon: HelpCircle },
  { name: "Settings", href: "/teacher/settings", icon: Settings },
];

export default function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const currentPage =
    teacherNav.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/teacher" && pathname.startsWith(item.href))
    )?.name || "Teacher Dashboard";

  // Close mobile sidebar using Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const isActive = (href: string) => {
    if (href === "/teacher") {
      return pathname === "/teacher";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavigation = (href: string) => {
    if (href === pathname) {
      setSidebarOpen(false);
      return;
    }

    setPendingPath(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 z-40 bg-[#172554]/40 backdrop-blur-[3px] transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#E2E8F0] bg-white shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EEF2F7] px-5">
          <Link
            href="/teacher"
            onClick={() => handleNavigation("/teacher")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#2563EB] shadow-md shadow-indigo-200">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#172554]">
                Tutor<span className="text-[#4F46E5]">Sathi</span>
              </h2>

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
                Teacher Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#EEF2FF] hover:text-[#4F46E5] lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
            Workspace
          </p>

          {teacherNav.map((item) => {
            const active = isActive(item.href);

            const navigating =
              pendingPath === item.href && pathname !== item.href;

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavigation(item.href)}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#EEF2FF] text-[#4F46E5]"
                    : "text-[#64748B] hover:bg-[#F8FAFF] hover:text-[#172554]"
                }`}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#4F46E5]" />
                )}

                <Icon
                  className={`h-[19px] w-[19px] shrink-0 transition-colors ${
                    active
                      ? "text-[#4F46E5]"
                      : "text-[#94A3B8] group-hover:text-[#4F46E5]"
                  }`}
                />

                <span className="flex-1">{item.name}</span>

                {navigating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#4F46E5]" />
                ) : active ? (
                  <ChevronRight className="h-4 w-4 text-[#4F46E5]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="shrink-0 border-t border-[#EEF2F7] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#E8ECFF] bg-[#F8FAFF] p-3">
            <UserButton
             
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#172554]">
                Teacher Account
              </p>

              <p className="truncate text-xs text-[#64748B]">
                Manage your profile
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-[#94A3B8]">
            © {new Date().getFullYear()} TutorSathi
          </p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="min-h-screen lg:pl-[280px]">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition-colors hover:border-[#C7D2FE] hover:bg-[#EEF2FF] hover:text-[#4F46E5] lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[#172554] sm:text-lg">
                {currentPage}
              </h1>

              <p className="hidden text-xs text-[#94A3B8] sm:block">
                Welcome to your TutorSathi workspace
              </p>
            </div>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/teacher/notifications"
              onClick={() => handleNavigation("/teacher/notifications")}
              aria-label="View notifications"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isActive("/teacher/notifications")
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#4F46E5]"
              }`}
            >
              <Bell className="h-5 w-5" />

              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-[#EF4444]" />
            </Link>

            <div className="hidden h-8 w-px bg-[#E2E8F0] sm:block" />

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs font-medium text-[#64748B]">
                Teacher Portal
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}