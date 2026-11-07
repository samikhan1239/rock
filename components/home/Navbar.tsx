"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";

const navLinks = [
{ label: "Home", href: "#home" },
{ label: "How It Works", href: "#how-it-works" },
{ label: "Find Tutors", href: "#find-tutors" },
{ label: "Become a Tutor", href: "#become-tutor" },
];

export default function Navbar() {
const [scrolled, setScrolled] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);

const { isSignedIn, isLoaded } = useUser();
const { signOut } = useClerk();

useEffect(() => {
const handleScroll = () => {
setScrolled(window.scrollY > 30);
};


window.addEventListener("scroll", handleScroll);

return () => {
  window.removeEventListener("scroll", handleScroll);
};


}, []);

const handleSignOut = async () => {
setMenuOpen(false);
await signOut({ redirectUrl: "/" });
};

return ( <header className="relative z-50 mx-auto w-full max-w-7xl px-4">
<nav
className={`flex items-center justify-between rounded-2xl border px-5 py-3 transition-all duration-500 md:px-7 ${
          scrolled
            ? "border-white/10 bg-[#080f20]/90 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
            : "border-white/10 bg-white/[0.04] backdrop-blur-xl"
        }`}
>
{/* LOGO */}
<Link
href="/"
className="group flex items-center gap-3"
onClick={() => setMenuOpen(false)}
> <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/20"> <span className="text-xl font-bold text-cyan-300">T</span> </div>

      <span className="text-xl font-bold tracking-tight text-white">
        Teach<span className="text-cyan-400">Mate</span>
        <span className="ml-1 text-cyan-400">.</span>
      </span>
    </Link>

    {/* DESKTOP NAVIGATION */}
    <div className="hidden items-center gap-8 lg:flex">
      {navLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="group relative text-sm font-medium text-white/65 transition-colors duration-300 hover:text-cyan-300"
        >
          {link.label}
          <span className="absolute -bottom-2 left-0 h-[2px] w-0 rounded-full bg-cyan-400 transition-all duration-300 group-hover:w-full" />
        </a>
      ))}
    </div>

    {/* DESKTOP ACTIONS */}
    <div className="hidden items-center gap-3 lg:flex">
      {!isLoaded ? (
        <div className="h-10 w-28 animate-pulse rounded-xl bg-white/10" />
      ) : isSignedIn ? (
        <button
          onClick={handleSignOut}
          className="rounded-xl border border-red-400/20 px-5 py-2.5 text-sm font-medium text-red-400 transition-all hover:border-red-400/40 hover:bg-red-400/10"
        >
          Log out
        </button>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-cyan-300"
          >
            Log in
          </Link>
          <div> sami</div>

          <Link
            href="/sign-up"
            className="group rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-[#04111c] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]"
          >
            Get Started →
          </Link>
        </>
      )}
    </div>

    {/* MOBILE MENU BUTTON */}
    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 lg:hidden"
    >
      <span
        className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
          menuOpen ? "translate-y-2 rotate-45" : ""
        }`}
      />
      <span
        className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
          menuOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
          menuOpen ? "-translate-y-2 -rotate-45" : ""
        }`}
      />
    </button>
  </nav>

  {/* MOBILE MENU */}
  <div
    className={`mx-auto mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#080f20]/95 backdrop-blur-2xl transition-all duration-300 lg:hidden ${
      menuOpen
        ? "max-h-[420px] translate-y-0 opacity-100"
        : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
    }`}
  >
    <div className="flex flex-col gap-1 p-4">
      {navLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onClick={() => setMenuOpen(false)}
          className="rounded-xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-cyan-400/10 hover:text-cyan-300"
        >
          {link.label}
        </a>
      ))}

      <div className="my-2 h-px bg-white/10" />

      {!isLoaded ? (
        <div className="h-10 animate-pulse rounded-xl bg-white/10" />
      ) : isSignedIn ? (
        <button
          onClick={handleSignOut}
          className="rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10"
        >
          Log out →
        </button>
      ) : (
        <>
          <Link
            href="/sign-in"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            Log in
          </Link>

          <Link
            href="/sign-up"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-semibold text-[#04111c] transition-colors hover:bg-cyan-300"
          >
            Get Started →
          </Link>
        </>
      )}
    </div>
  </div>
</header>


);
}
