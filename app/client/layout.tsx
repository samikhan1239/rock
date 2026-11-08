"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Wallet,
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const clientNav = [
  {
    name: "Overview",
    href: "/client",
    icon: LayoutDashboard,
  },
  {
    name: "Find Teachers",
    href: "/client/find-teacher",
    icon: Search,
  },
  {
    name: "My Requests",
    href: "/client/requests",
    icon: MessageSquare,
  },
  {
    name: "Credits",
    href: "/client/credits",
    icon: Wallet,
  },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <Link href="/client" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-bold text-white">TS</span>
            </div>

            <span className="font-semibold text-slate-900">
              Client Panel
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-md p-1 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {clientNav.map((item) => {
            const isActive =
              item.href === "/client"
                ? pathname === "/client"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <UserButton />

            <div className="text-sm">
              <p className="font-medium text-slate-900">
                Client Account
              </p>

              <p className="text-xs text-slate-500">
                Find verified tutors
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              className="rounded-md p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-semibold text-slate-900">
              Client Dashboard
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}