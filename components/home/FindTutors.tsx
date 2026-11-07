"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function FindYourTutor() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Photograph slowly zooms out
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [1.15, 1]
  );

  // Content moves upward
  const contentY = useTransform(
    scrollYProgress,
    [0, 0.65],
    [0, -90]
  );

  // Content fades as the next section approaches
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.65, 0.85],
    [1, 1, 0]
  );

  // Image gradually darkens
  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [0.2, 0.5]
  );

  // Scroll progress line
  const lineWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  return (
    <section
      ref={sectionRef}
      id="find-tutors"
      className="relative z-20 h-[115vh] bg-[#050914]"
    >
      {/* Sticky cinematic scene */}
      <div className="sticky top-0 h-[85svh] min-h-[520px] overflow-hidden">

        {/* Full-screen photograph */}
        <motion.div
          style={{ scale: imageScale }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=2400&q=90"
            alt="Students learning together"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030812]/95 via-[#030812]/60 to-[#030812]/10" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#030812]/90 via-transparent to-[#030812]/30" />

        {/* Scroll-controlled darkening */}
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="pointer-events-none absolute inset-0 bg-[#030812]"
        />

        {/* Animated cyan lighting */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: ["-20%", "120%"],
                  opacity: [0, 0.6, 0],
                }
          }
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute -top-20 h-[120%] w-[25%] rotate-[18deg] bg-gradient-to-r from-transparent via-cyan-300/[0.08] to-transparent blur-3xl"
        />

        {/* Top label */}
        <div className="absolute left-6 right-6 top-8 z-10 mx-auto flex max-w-7xl items-center justify-between sm:left-10 sm:right-10 lg:left-16 lg:right-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300 sm:text-xs">
              Discover the difference
            </span>
          </div>

          <span className="hidden text-xs tracking-widest text-white/50 sm:block">
            02 — THE CONNECTION
          </span>
        </div>

        {/* Main content */}
        <motion.div
          style={{
            y: contentY,
            opacity: contentOpacity,
          }}
          className="absolute inset-0 z-10 mx-auto flex max-w-7xl flex-col justify-center px-6 pb-6 pt-20 sm:px-10 lg:px-16"
        >
          <div className="max-w-[850px]">

            {/* Animated badge */}
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 20 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-5 inline-flex items-center gap-2"
            >
              <Sparkles size={15} className="text-cyan-300" />

              <span className="text-[10px] font-medium tracking-[0.18em] text-white/80 sm:text-xs">
                LEARNING IS BETTER TOGETHER
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, y: 50, filter: "blur(12px)" }
              }
              whileInView={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              viewport={{ once: true }}
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-[38px] font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-6xl lg:text-[76px]"
            >
              One connection.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                Endless possibilities.
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 20 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-5 max-w-[450px] text-sm leading-7 text-white/75 sm:text-base sm:leading-8"
            >
              Behind every confident student is someone who helped
              them believe. Find the right mentor and discover what
              youre capable of.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 20 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-7 flex flex-wrap items-center gap-5"
            >
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 rounded-full bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-[#04101C] transition-all duration-300 hover:bg-white hover:shadow-[0_0_35px_rgba(34,211,238,0.3)]"
              >
                Find your mentor

                <ArrowUpRight
                  size={17}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#how-it-works"
                className="group flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-cyan-300"
              >
                Explore TeachMate

                <ArrowDown
                  size={15}
                  className="transition-transform group-hover:translate-y-1"
                />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating information element */}
        <motion.div
          initial={
            shouldReduceMotion ? false : { opacity: 0, x: 30 }
          }
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-24 right-[8%] z-10 hidden lg:block"
        >
          <motion.div
            animate={
              shouldReduceMotion ? {} : { y: [0, -8, 0] }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-3 border-l border-cyan-300/70 bg-black/20 py-3 pl-4 pr-5 backdrop-blur-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10">
              <GraduationCap
                size={19}
                className="text-cyan-300"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Learn from the best
              </p>

              <p className="mt-1 text-[10px] text-white/50">
                Your journey, your pace
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-5 left-6 right-6 z-10 mx-auto flex max-w-7xl items-center justify-between sm:left-10 sm:right-10 lg:left-16 lg:right-16">
          <div className="flex items-center gap-3">
            <BookOpen size={14} className="text-cyan-300" />

            <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 sm:text-[10px]">
              Your next chapter starts here
            </span>
          </div>

          <div className="flex w-20 flex-col gap-2">
            <motion.div
              style={{ width: lineWidth }}
              className="h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
            />

            <span className="text-right text-[9px] tracking-widest text-white/40">
              SCROLL
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}