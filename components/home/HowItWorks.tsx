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
  ArrowRight,
  ArrowUpRight,
  Search,
  UserCheck,
  BookOpen,
} from "lucide-react";

const steps = [
  {
    number: "01",
    label: "DISCOVER",
    title: "Find your perfect mentor.",
    description:
      "Explore educators who understand your goals, match your interests, and make learning exciting.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=2000&q=90",
    icon: Search,
    accent: "#22D3EE",
    position: "center",
  },
  {
    number: "02",
    label: "CONNECT",
    title: "Meet the right educator.",
    description:
      "Discover experienced teachers, explore their profiles, and let our platform help bring the right connection together.",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=2000&q=90",
    icon: UserCheck,
    accent: "#A78BFA",
    position: "center",
  },
  {
    number: "03",
    label: "GROW",
    title: "Turn potential into progress.",
    description:
      "Start your learning journey with guidance, confidence, and the support you need to achieve more.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=2000&q=90",
    icon: BookOpen,
    accent: "#34D399",
    position: "center",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Move all three scenes horizontally as the user scrolls.
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", "-200vw"]
  );

  const progressWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative z-30 h-[210vh] bg-[#050914]"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-[85svh] min-h-[520px] overflow-hidden">

        {/* Horizontal track */}
        <motion.div
          style={{ x }}
          className="absolute inset-0 flex h-full w-[300vw]"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative h-full w-screen shrink-0 overflow-hidden"
              >
                {/* Full-screen photograph */}
                <div className="absolute inset-0">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: step.position }}
                  />
                </div>

                {/* Cinematic overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#030812]/95 via-[#030812]/65 to-[#030812]/15" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030812]/90 via-transparent to-[#030812]/30" />

                {/* Accent glow */}
                <div
                  className="absolute -right-32 top-1/4 h-96 w-96 rounded-full opacity-20 blur-[130px]"
                  style={{ backgroundColor: step.accent }}
                />

                {/* Scene content */}
                <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-16 pt-32 sm:px-12 lg:px-20">

                  {/* Top label */}
                  <div className="absolute left-6 right-6 top-28 flex items-center justify-between sm:left-12 sm:right-12 lg:left-20 lg:right-20">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-px w-8"
                        style={{ backgroundColor: step.accent }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
                        How TeachMate works
                      </span>
                    </div>

                    <span className="text-xs tracking-widest text-white/50">
                      {step.number} / 03
                    </span>
                  </div>

                  {/* Main content */}
                  <div className="max-w-[700px]">
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 25 }
                      }
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="mb-7 flex items-center gap-3"
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full border"
                        style={{
                          borderColor: `${step.accent}55`,
                          backgroundColor: `${step.accent}15`,
                          color: step.accent,
                        }}
                      >
                        <Icon size={19} />
                      </div>

                      <span
                        className="text-xs font-semibold tracking-[0.25em]"
                        style={{ color: step.accent }}
                      >
                        {step.label}
                      </span>
                    </motion.div>

                    <motion.h2
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 55, filter: "blur(10px)" }
                      }
                      whileInView={{
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                      }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.9,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-white sm:text-6xl lg:text-[82px]"
                    >
                      {step.title}
                    </motion.h2>

                    <motion.p
                      initial={
                        reduceMotion ? false : { opacity: 0, y: 20 }
                      }
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="mt-7 max-w-[440px] text-sm leading-7 text-white/70 sm:text-base sm:leading-8"
                    >
                      {step.description}
                    </motion.p>

                    {index === 0 && (
                      <Link
                        href="#find-tutors"
                        className="group mt-9 inline-flex items-center gap-3 text-sm font-semibold text-white transition hover:text-cyan-300"
                      >
                        Explore educators
                        <ArrowUpRight
                          size={18}
                          className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      </Link>
                    )}

                    {index === 2 && (
                      <Link
                        href="/sign-up"
                        className="group mt-9 inline-flex items-center gap-3 rounded-full bg-cyan-400 px-7 py-4 text-sm font-semibold text-[#04101C] transition hover:bg-white"
                      >
                        Start your journey
                        <ArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                    )}
                  </div>

                  {/* Large decorative number */}
                  <div className="pointer-events-none absolute bottom-20 right-10 hidden select-none lg:block">
                    <span
                      className="text-[230px] font-bold leading-none tracking-tighter"
                      style={{ color: `${step.accent}12` }}
                    >
                      {step.number}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </motion.div>

        {/* Fixed top progress indicator */}
        <div className="absolute left-0 right-0 top-0 z-30 h-[2px] bg-white/10">
          <motion.div
            style={{ width: progressWidth }}
            className="h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
          />
        </div>

        {/* Bottom navigation */}
        <div className="absolute bottom-7 left-6 right-6 z-30 mx-auto flex max-w-7xl items-center justify-between sm:left-12 sm:right-12 lg:left-20 lg:right-20">
          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex items-center gap-2"
              >
                <span className="text-[10px] font-semibold tracking-widest text-white/60">
                  {step.number}
                </span>

                {index !== 2 && (
                  <span className="h-px w-5 bg-white/20" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            Scroll to explore
            <ArrowDown size={14} className="text-cyan-300" />
          </div>
        </div>
      </div>
    </section>
  );
}