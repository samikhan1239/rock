"use client";

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Mic,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Volume2,
  Video,
} from "lucide-react";

interface ReadyScreenProps {
  loading: boolean;
  error: string;
  onStart: () => void;
}

export default function ReadyScreen({
  loading,
  error,
  onStart,
}: ReadyScreenProps) {
  const features = [
    {
      icon: Mic,
      title: "Voice-based interview",
      description: "Answer AI-generated questions naturally using your voice.",
      color: "bg-blue-50 text-blue-600 ring-blue-100",
    },
    {
      icon: Video,
      title: "Recorded assessment",
      description: "Your interview is recorded for a comprehensive evaluation.",
      color: "bg-violet-50 text-violet-600 ring-violet-100",
    },
    {
      icon: ShieldCheck,
      title: "AI-powered evaluation",
      description: "Get insights into your subject knowledge and teaching skills.",
      color: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    },
  ];

  const requirements = [
    {
      icon: Camera,
      text: "Allow camera and microphone access when prompted.",
    },
    {
      icon: Volume2,
      text: "Choose a quiet environment with minimal background noise.",
    },
    {
      icon: GraduationCap,
      text: "Be prepared to explain concepts as you would to a student.",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-10 sm:py-14">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-200/70">
            <Sparkles size={29} strokeWidth={1.8} />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-indigo-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            TUTORSATHI AI ASSESSMENT
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
            Your AI Teaching Interview
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Showcase your expertise, communication, and teaching abilities
            through a personalized interview powered by AI.
          </p>
        </div>

        {/* Main content */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_50px_-20px_rgba(15,23,42,0.15)]">
          {/* Card header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Get ready for your interview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A few things to know before you get started.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700">
              <Clock size={15} />
              AI Assessment
            </div>
          </div>

          <div className="p-6 sm:p-9">
            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40"
                  >
                    <div
                      className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${feature.color}`}
                    >
                      <Icon size={21} strokeWidth={1.9} />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Preparation checklist */}
            <div className="mt-7 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Interview preparation
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Make sure everything is ready.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {requirements.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.text}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                        <Icon size={15} />
                      </div>

                      <p className="text-sm leading-6 text-slate-700">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                <p className="text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Start button */}
            <button
              type="button"
              onClick={onStart}
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl hover:shadow-indigo-200/80 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Preparing your interview...
                </>
              ) : (
                <>
                  Start AI Interview
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
              <ShieldCheck size={14} />
              Your interview recording is securely processed for evaluation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-slate-400">
          Powered by TutorSathi AI · Helping great teachers stand out.
        </p>
      </div>
    </main>
  );
}