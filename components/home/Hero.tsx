"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
ArrowDown,
ArrowRight,
BadgeCheck,
Sparkles,
Users,
} from "lucide-react";

import GlobalGlobe from "@/components/home/GlobalGlobe";
import { SignOutButton } from "@clerk/nextjs";

const words = ["Learn.", "Teach.", "Connect.", "Grow."];

export default function Hero() {
const [wordIndex, setWordIndex] = useState(0);

useEffect(() => {
const interval = setInterval(() => {
setWordIndex((previous) => (previous + 1) % words.length);
}, 2300);


return () => clearInterval(interval);


}, []);

return ( <section
   id="home"
   className="relative flex min-h-[850px] items-center overflow-hidden px-5 pb-20 pt-24 sm:px-8 md:min-h-screen md:px-12 md:pb-24 md:pt-20"
 > <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-4">


    {/* LEFT CONTENT */}
    <div className="relative z-10">
      

      {/* BADGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 sm:mb-8"
      >
        <Sparkles size={14} className="text-cyan-300" />

        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-200">
          The future of connected learning
        </span>
       
      </motion.div>

      {/* HEADLINE */}
      <div className="max-w-[650px]">
        <motion.h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.055em] text-white sm:text-6xl lg:text-[76px]">
          <motion.span
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="block"
          >
            Where knowledge
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-2 block"
          >
            meets{" "}

            <span className="relative inline-block min-w-[210px] sm:min-w-[290px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[wordIndex]}
                  initial={{
                    opacity: 0,
                    y: 25,
                    filter: "blur(8px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: -20,
                    filter: "blur(8px)",
                  }}
                  transition={{ duration: 0.45 }}
                  className="absolute left-0 top-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>

              <span className="invisible">Connect.</span>
            </span>
          </motion.span>
        </motion.h1>
      </div>

      {/* DESCRIPTION */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-6 max-w-lg text-sm leading-7 text-slate-400 sm:mt-8 sm:text-base sm:leading-8 md:text-lg"
      >
        Discover exceptional tutors, share your expertise,
        and build meaningful learning connections through
        an intelligent teaching community.
      </motion.p>

      {/* CTA BUTTONS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4"
      >
        <Link
          href="/sign-up"
          className="group flex items-center gap-3 rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-[#06101d] transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-200 hover:shadow-[0_0_35px_rgba(0,229,255,0.25)] sm:px-7 sm:py-4"
        >
          Get Started

          <ArrowRight
            size={17}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="#find-tutors"
          className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 sm:px-7 sm:py-4"
        >
          Explore Tutors
        </Link>
      </motion.div>

      {/* TRUST POINTS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-slate-400 sm:mt-12 sm:gap-x-7 sm:text-xs"
      >
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="shrink-0 text-cyan-300" />
          AI-assisted verification
        </div>

        <div className="flex items-center gap-2">
          <Users size={16} className="shrink-0 text-cyan-300" />
          Meaningful connections
        </div>
      </motion.div>
    </div>

    {/* RIGHT SIDE — GLOBAL GLOBE */}
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.2 }}
      className="relative flex w-full items-center justify-center overflow-visible"
    >
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.09] blur-[90px] sm:h-[400px] sm:w-[400px] sm:blur-[110px] lg:h-[480px] lg:w-[480px]" />

      {/* GLOBE */}
      <div className="relative z-10 w-full max-w-[360px] -translate-y-2 scale-100 sm:max-w-[560px] sm:-translate-y-12 sm:scale-110 lg:max-w-[720px] lg:-translate-y-20 lg:scale-[1.2]">
        <GlobalGlobe />
      </div>

      {/* AI VERIFIED BADGE */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-0 top-[2%] z-20 rounded-xl border border-cyan-300/15 bg-[#0b1728]/90 p-2.5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl sm:top-[1%] sm:rounded-2xl sm:p-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300 sm:rounded-xl sm:p-3">
            <BadgeCheck size={18} className="sm:h-[22px] sm:w-[22px]" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white sm:text-sm">
              AI Verified
            </p>

            <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
              Quality-focused profiles
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </div>

  {/* SCROLL INDICATOR */}
  <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-500 md:flex">
    <span className="text-[9px] uppercase tracking-[0.3em]">
      Scroll to explore
    </span>

    <ArrowDown size={15} className="animate-bounce" />
  </div>
</section>


);
}
