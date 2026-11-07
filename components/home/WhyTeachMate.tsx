"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

import {
  ShieldCheck,
  BrainCircuit,
  Handshake,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    number: "01",
    label: "TRUST",
    title: "Learn with confidence.",
    description:
      "Every educator goes through a verification process designed to help students connect with genuine, qualified teachers.",
    highlight: "Verified educators",
    icon: ShieldCheck,
    color: "#38BDF8",
    background: "#101F35",
    detail: "SAFETY FIRST",
  },
  {
    number: "02",
    label: "INTELLIGENCE",
    title: "Technology that understands you.",
    description:
      "Our AI-powered assessment helps evaluate teaching abilities and creates a more informed experience for everyone.",
    highlight: "AI-powered assessment",
    icon: BrainCircuit,
    color: "#A78BFA",
    background: "#211B38",
    detail: "SMARTER CONNECTIONS",
  },
  {
    number: "03",
    label: "CONNECTION",
    title: "The right people. The right opportunity.",
    description:
      "We bring students and educators together through a structured platform built around meaningful learning relationships.",
    highlight: "Meaningful connections",
    icon: Handshake,
    color: "#34D399",
    background: "#142B2A",
    detail: "GROW TOGETHER",
  },
];

function StackingPanel({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const feature = features[index];
  const Icon = feature.icon;

  const start = index * 0.3;
  const end = start + 0.3;

  const y = useTransform(
    progress,
    index === 0 ? [0, 0.45] : [start, end],
    index === 0 ? ["0%", "-4%"] : ["105%", "0%"]
  );

  const scale = useTransform(
    progress,
    index === 0 ? [0, 0.45] : [start, end],
    index === 0 ? [1, 0.94] : [1, 1]
  );

  const opacity = useTransform(
    progress,
    index === 0 ? [0.42, 0.5] : [start, end],
    index === 0 ? [1, 0.5] : [1, 1]
  );

  return (
    <motion.article
      style={{
        y,
        scale,
        opacity,
        zIndex: index + 1,
        backgroundColor: feature.background,
      }}
      className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 p-7 sm:p-10 lg:rounded-[36px] lg:p-16"
    >
      {/* Top information */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: feature.color }}
          />

          <span className="text-xs font-semibold tracking-[0.25em] text-white/60">
            {feature.label}
          </span>
        </div>

        <span className="font-mono text-sm text-white/40">
          {feature.number} / 03
        </span>
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div className="max-w-3xl">
          <p
            className="mb-6 text-xs font-semibold tracking-[0.25em]"
            style={{ color: feature.color }}
          >
            {feature.detail}
          </p>

          <h3 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
            {feature.title}
          </h3>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
            {feature.description}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span
              className="h-px w-10"
              style={{ backgroundColor: feature.color }}
            />

            <span className="text-sm font-medium text-white/90">
              {feature.highlight}
            </span>
          </div>
        </div>

        {/* Feature icon */}
        <div className="flex items-end justify-start lg:justify-end">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-2xl border sm:h-32 sm:w-32"
            style={{
              borderColor: `${feature.color}45`,
              color: feature.color,
            }}
          >
            <Icon
              strokeWidth={1.2}
              className="h-12 w-12 sm:h-16 sm:w-16"
            />
          </div>
        </div>
      </div>

      {/* Bottom information */}
      <div className="flex items-center justify-between border-t border-white/10 pt-5">
        <span className="text-xs tracking-wider text-white/40">
          WHY TEACHMATE
        </span>

        <span className="flex items-center gap-2 text-xs text-white/50">
          DISCOVER MORE
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </motion.article>
  );
}

function ProgressIndicator({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  return (
    <div className="mx-auto mt-7 flex w-full max-w-7xl items-center justify-between">
      <span className="text-xs tracking-wider text-white/35">
        BUILT AROUND PEOPLE
      </span>

      <div className="flex items-center gap-2">
        {features.map((feature, index) => (
          <div
            key={feature.number}
            className="h-1 w-8 overflow-hidden rounded-full bg-white/15 sm:w-12"
          >
            <ProgressFill
              index={index}
              progress={progress}
              color={feature.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressFill({
  index,
  progress,
  color,
}: {
  index: number;
  progress: MotionValue<number>;
  color: string;
}) {
  const width = useTransform(
    progress,
    [index * 0.3, index * 0.3 + 0.3],
    ["0%", "100%"]
  );

  return (
    <motion.div
      className="h-full rounded-full"
      style={{
        width,
        backgroundColor: color,
      }}
    />
  );
}

export default function WhyTeachMate() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.12],
    [1, 0]
  );

  const headingY = useTransform(
    scrollYProgress,
    [0, 0.12],
    [0, -35]
  );

  return (
    <section
      ref={sectionRef}
      id="why-teachmate"
      className="relative h-[270vh] bg-[#050914]"
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[600px] flex-col justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-16">

        {/* Heading */}
        <motion.div
          style={{
            opacity: headingOpacity,
            y: headingY,
          }}
          className="mx-auto mb-8 w-full max-w-7xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-400" />

            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
              THE TEACHMATE DIFFERENCE
            </span>
          </div>

          <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            More than learning.
            <span className="text-white/40">
              {" "}A connection that matters.
            </span>
          </h2>
        </motion.div>

        {/* Stacking panels */}
        <div className="relative mx-auto h-[65svh] min-h-[420px] max-h-[620px] w-full max-w-7xl">
          {features.map((feature, index) => (
            <StackingPanel
              key={feature.number}
              index={index}
              progress={scrollYProgress}
            />
          ))}
        </div>

        {/* Progress */}
        <ProgressIndicator progress={scrollYProgress} />
      </div>
    </section>
  );
}