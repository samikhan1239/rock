"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import {
  ShieldCheck,
  Fingerprint,
  BrainCircuit,
  Video,
  BadgeCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowDown,
  Award,
} from "lucide-react";

const stages = [
  {
    number: "01",
    title: "Identity Verification",
    subtitle: "AUTHENTICITY STARTS HERE",
    description:
      "Every educator begins with an identity review. We check submitted details to establish a reliable foundation for our learning community.",
    icon: Fingerprint,
    color: "#22D3EE",
    tag: "IDENTITY CHECK",
  },
  {
    number: "02",
    title: "AI Skill Assessment",
    subtitle: "KNOWLEDGE MEETS INTELLIGENCE",
    description:
      "Our AI-powered interview evaluates subject knowledge, teaching abilities and the educator's understanding of their chosen subject.",
    icon: BrainCircuit,
    color: "#A78BFA",
    tag: "AI ASSESSMENT",
  },
  {
    number: "03",
    title: "Video Evaluation",
    subtitle: "LET YOUR TEACHING SPEAK",
    description:
      "Educators complete a recorded video evaluation to demonstrate their communication, confidence and teaching approach.",
    icon: Video,
    color: "#34D399",
    tag: "VIDEO REVIEW",
  },
];

const particles = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: (i % 5) * 0.6,
  duration: 3 + (i % 4),
}));

// ============================================
// VERIFICATION SEAL
// ============================================

function VerificationSeal() {
  return (
    <div className="relative flex aspect-square w-full max-w-[480px] items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 rounded-full border border-dashed border-cyan-300/25"
      >
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee]" />
        <span className="absolute bottom-12 right-5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_20px_#a78bfa]" />
      </motion.div>

      {/* Inner rotating ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-9 rounded-full border border-cyan-300/15"
      >
        <span className="absolute left-10 top-2 h-2 w-2 rounded-full bg-violet-400" />
      </motion.div>

      <div className="absolute inset-20 rounded-full bg-cyan-400/10 blur-[70px]" />

      {/* Main seal */}
      <motion.div
        animate={{ scale: [1, 1.035, 1] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex h-56 w-56 flex-col items-center justify-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-[#12354a] via-[#0b1c30] to-[#080d1b] shadow-[0_0_90px_rgba(34,211,238,0.15),inset_0_0_45px_rgba(34,211,238,0.08)] sm:h-64 sm:w-64"
      >
        <div className="absolute inset-3 rounded-full border border-cyan-300/20" />
        <div className="absolute inset-6 rounded-full border border-dashed border-cyan-300/15" />

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <ShieldCheck
            size={75}
            strokeWidth={1.2}
            className="mb-3 text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          />
        </motion.div>

        <p className="text-[10px] font-medium tracking-[0.4em] text-cyan-300">
          TutorSathi
        </p>

        <h3 className="mt-1 text-2xl font-bold tracking-widest text-white">
          VERIFIED
        </h3>

        <p className="mt-2 text-[9px] tracking-[0.3em] text-slate-500">
          EDUCATOR STANDARD
        </p>

        <div className="absolute -right-3 top-12 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-[#10283a] text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
          <BadgeCheck size={24} />
        </div>
      </motion.div>

      {/* Floating information */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -left-2 top-14 rounded-xl border border-white/10 bg-[#0c1829]/90 px-4 py-3 backdrop-blur-xl sm:left-0"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span className="text-xs text-slate-300">
            Identity reviewed
          </span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity }}
        className="absolute -bottom-1 right-0 rounded-xl border border-white/10 bg-[#0c1829]/90 px-4 py-3 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-400" />
          <span className="text-xs text-slate-300">
            Skills evaluated
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// HERO SECTION
// ============================================

function VerificationHero() {
  return (
    <section className="relative flex min-h-[90svh] items-center overflow-hidden px-5 py-24 sm:px-8">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute left-[55%] top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.06] blur-[150px]" />

      {/* Floating particles */}
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            opacity: [0.15, 0.8, 0.15],
            scale: [0.7, 1.3, 0.7],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
          }}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-cyan-300"
        />
      ))}

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-xs font-medium tracking-wider text-cyan-300">
            <ShieldCheck size={15} />
            THE TutorSathi TRUST SYSTEM
          </div>

          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[76px]">
            Trust isn't
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              assumed.
            </span>
            <br />
            It's verified.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
            Great learning starts with the right educator. Our
            structured verification process helps build a
            community where trust comes first.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="#verification-journey"
              className="group flex items-center gap-3 rounded-full bg-cyan-400 px-7 py-4 text-sm font-semibold text-[#050914] transition-all hover:bg-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)]"
            >
              Explore Our Process
              <ArrowDown
                size={17}
                className="transition-transform group-hover:translate-y-1"
              />
            </a>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BadgeCheck size={17} className="text-cyan-300" />
              Quality-focused evaluation
            </div>
          </div>
        </motion.div>

        {/* Right seal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="flex justify-center"
        >
          <VerificationSeal />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="text-[9px] tracking-[0.35em] text-slate-600">
          SCROLL TO EXPLORE
        </span>

        <motion.div
          animate={{
            scaleY: [0.4, 1, 0.4],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-9 w-px origin-top bg-gradient-to-b from-cyan-300 to-transparent"
        />
      </div>
    </section>
  );
}

// ============================================
// JOURNEY STEP
// ============================================

function JourneyStep({
  step,
  index,
  progress,
}: {
  step: (typeof stages)[number];
  index: number;
  progress: ReturnType<typeof useSpring>;
}) {
  const Icon = step.icon;

  const opacity = useTransform(progress, (value) => {
    const distance = Math.abs(value * 3 - index - 0.5);
    return Math.max(0.35, 1 - distance * 0.5);
  });

  const scale = useTransform(progress, (value) => {
    const distance = Math.abs(value * 3 - index - 0.5);
    return Math.max(0.96, 1 - distance * 0.025);
  });

  return (
    <motion.div
      style={{ opacity, scale }}
      className="relative flex gap-5 rounded-2xl border border-white/[0.08] bg-[#0b1525]/90 p-5 backdrop-blur-xl transition-colors hover:border-cyan-300/25 sm:gap-6 sm:p-7"
    >
      <div className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#102238] text-cyan-300">
        <Icon size={23} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-300">
            STAGE {step.number}
          </span>

          <span className="flex items-center gap-2 text-[9px] tracking-wider text-slate-500">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: step.color }}
            />
            {step.tag}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-white sm:text-2xl">
          {step.title}
        </h3>

        <p className="mt-1 text-[9px] tracking-[0.2em] text-slate-500">
          {step.subtitle}
        </p>

        <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// VERIFICATION JOURNEY
// ============================================

function VerificationJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [percentage, setPercentage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  const progressHeight = useTransform(
    progress,
    [0, 1],
    ["0%", "100%"]
  );

  // Convert MotionValue into normal React state.
  // This prevents the "Objects are not valid as a React child" error.
  useMotionValueEvent(progress, "change", (latest) => {
    setPercentage(Math.round(latest * 100));
  });

  return (
    <section
      ref={sectionRef}
      id="verification-journey"
      className="relative h-[250vh] border-t border-white/[0.06]"
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[650px] items-center overflow-hidden px-5 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,rgba(34,211,238,0.055),transparent_55%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          {/* Left side */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-9 bg-cyan-400" />
              <span className="text-xs font-semibold tracking-[0.3em] text-cyan-300">
                OUR PROCESS
              </span>
            </div>

            <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Three stages.
              <br />
              <span className="text-slate-500">
                One standard.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-8 text-slate-400 sm:text-base">
              Every educator goes through a structured journey
              designed to evaluate identity, knowledge and
              communication.
            </p>

            {/* Progress indicator */}
            <div className="mt-12 hidden lg:block">
              <div className="mb-3 flex items-center justify-between text-[10px] tracking-widest text-slate-500">
                <span>VERIFICATION PROGRESS</span>

                {/* Fixed: render normal React state, not MotionValue */}
                <span>{percentage}%</span>
              </div>

              <div className="h-1 w-52 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  style={{ width: progressHeight }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                />
              </div>
            </div>
          </div>

          {/* Right side timeline */}
          <div className="relative">
            <div className="absolute bottom-10 left-[24px] top-10 w-px bg-white/10" />

            <motion.div
              style={{ height: progressHeight }}
              className="absolute left-[24px] top-10 z-10 w-px bg-gradient-to-b from-cyan-300 via-blue-400 to-violet-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
            />

            <div className="space-y-5">
              {stages.map((step, index) => (
                <JourneyStep
                  key={step.number}
                  step={step}
                  index={index}
                  progress={progress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FINAL TRUST STATEMENT
// ============================================

function TrustStatement() {
  return (
    <section className="relative overflow-hidden px-5 py-28 sm:px-8 lg:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.07] blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative mx-auto max-w-5xl text-center"
      >
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300">
          <Award size={30} />
        </div>

        <p className="mb-6 text-xs font-semibold tracking-[0.3em] text-cyan-300">
          THE TutorSathi PROMISE
        </p>

        <h2 className="text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
          Better educators.
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Better learning.
          </span>
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400">
          We believe every student deserves an educator they
          can trust. Thats why we put verification at the
          heart of the TutorSathi experience.
        </p>

        <a
          href="/login?role=TEACHER"
          className="group mt-10 inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-8 py-4 text-sm font-semibold text-cyan-200 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-300 hover:text-[#050914] hover:shadow-[0_0_35px_rgba(34,211,238,0.2)]"
        >
          Become a Verified Educator

          <GraduationCap
            size={19}
            className="transition-transform group-hover:rotate-12"
          />
        </a>
      </motion.div>
    </section>
  );
}

// ============================================
// MAIN VERIFICATION COMPONENT
// ============================================

export default function Verification() {
  return (
    <div className="relative overflow-x-clip bg-[#050914] text-white">
      <VerificationHero />
      <VerificationJourney />
    
    </div>
  );
}