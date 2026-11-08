"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  GraduationCap,
} from "lucide-react";

export default function HomeLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: "blur(8px)",
          }}
          transition={{
            duration: 0.7,
            ease: "easeInOut",
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050914]/90 backdrop-blur-md"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.08] blur-[110px]" />

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center">

            {/* Animated Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative mb-8"
            >
              {/* Rotating Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -inset-5 rounded-[30px] border border-dashed border-cyan-400/20"
              />

              {/* Pulsing Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.25, 0.5, 0.25],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-2xl"
              />

              {/* Logo Container */}
              <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-[#102b45] to-[#10142c] shadow-[0_0_45px_rgba(0,229,255,0.15)]">
                <BookOpen
                  size={34}
                  strokeWidth={1.6}
                  className="text-cyan-300"
                />

                <motion.div
                  animate={{
                    y: [-3, 3, -3],
                    rotate: [0, 8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                  }}
                  className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-[#0c1b30]"
                >
                  <Sparkles
                    size={15}
                    className="text-cyan-300"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">
                Tutor<span className="text-cyan-300">Sathi</span>
                <span className="ml-1 text-cyan-300">.</span>
              </h1>

              <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-400">
                Learn · Teach · Grow
              </p>
            </motion.div>

            {/* Loading Progress */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "180px" }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-10 h-[3px] overflow-hidden rounded-full bg-white/10 sm:w-[220px]"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 shadow-[0_0_15px_rgba(0,229,255,0.8)]"
              />
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5 flex items-center gap-2"
            >
              <GraduationCap
                size={14}
                className="text-cyan-400"
              />

              <p className="text-xs tracking-wide text-slate-400">
                Preparing your learning experience
              </p>
            </motion.div>

          </div>

          {/* Bottom Branding */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-slate-600">
              A smarter way to connect knowledge
            </p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}