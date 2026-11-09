"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const reveal = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function FinalCTA() {
  return (
    <section
      id="become-tutor"
      className="relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-24"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[450px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.055] blur-[130px]" />

      {/* CONTENT - Always above the animated background */}
      <div className="relative z-[100] mx-auto flex max-w-5xl flex-col items-center text-center -translate-y-12">

        {/* Badge */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#071321]/80 px-4 py-2 shadow-[0_0_25px_rgba(34,211,238,0.08)] backdrop-blur-md"
        >
          <Sparkles size={13} className="text-cyan-300" />
          <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-200">
            YOUR FUTURE, YOUR MOVE
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="text-4xl font-semibold leading-[1.13] tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Your next chapter
          <br className="sm:hidden" /> starts{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            here.
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base"
        >
          Find the right tutor. Share your knowledge.
          Build something meaningful. Your journey starts
          with one connection.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <motion.div variants={reveal}>
            <Link
              href="/login?role=CLIENT"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3 text-sm font-semibold text-[#04111d] shadow-[0_0_25px_rgba(34,211,238,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            >
              <BookOpen size={17} />
              Find Your Tutor
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <motion.div variants={reveal}>
            <Link
              href="/login?role=TEACHER"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/20 bg-[#071321]/75 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-[#10243a]/90"
            >
              <GraduationCap size={19} className="text-cyan-300" />
              Become a Tutor
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-slate-400/60" />

          <span className="text-[10px] tracking-[0.18em] text-slate-300 sm:text-xs">
            ONE PLATFORM. TWO POSSIBILITIES. ENDLESS GROWTH.
          </span>

          <span className="h-px w-8 bg-gradient-to-l from-transparent to-slate-400/60" />
        </motion.div>
      </div>
    </section>
  );
}