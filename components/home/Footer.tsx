"use client";

import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Find Tutors", href: "#find-tutors" },
  { label: "Become a Tutor", href: "#become-tutor" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-transparent px-5 sm:px-8">
      <div className="mx-auto max-w-7xl py-7">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-300 transition-colors group-hover:bg-cyan-300/20">
              <GraduationCap size={20} />
            </div>

            <span className="text-lg font-bold tracking-tight text-white">
              Teach<span className="text-cyan-300">Mate</span>
              <span className="text-cyan-400">.</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-400 transition-colors hover:text-cyan-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Back to top */}
          <Link
            href="#home"
            className="group flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-cyan-300"
          >
            Back to top
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Bottom line */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-500 sm:flex-row">
          <p>
            TeachMate. All rights reserved.
          </p>

          <p>
            Built for better learning{" "}
            <span className="text-cyan-400">✦</span>
          </p>
        </div>
      </div>
    </footer>
  );
}