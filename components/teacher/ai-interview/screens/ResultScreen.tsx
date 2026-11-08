"use client";

import {
  Award,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";

import type { InterviewResult } from "@/types/ai-interview";

interface ResultsScreenProps {
  evaluation: InterviewResult | null;
}

function ScoreCard({
  title,
  score,
  icon: Icon,
}: {
  title: string;
  score: number | null;
  icon: React.ElementType;
}) {
  const value = score ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={20} />
        </div>

        <span className="text-xs font-medium text-slate-400">
          Score
        </span>
      </div>

      <h3 className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </h3>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">
          {score ?? "—"}
        </span>

        <span className="text-sm text-slate-400">/100</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function ResultsScreen({
  evaluation,
}: ResultsScreenProps) {
  if (!evaluation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Evaluation results are unavailable.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Award size={32} />
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Interview completed
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Your AI Interview Results
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Here is your teaching assessment report.
          </p>
        </div>

        {/* OVERALL SCORE */}

        <div className="mt-10 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white shadow-xl shadow-indigo-200">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="text-sm font-medium text-indigo-100">
                Overall performance
              </p>

              <h2 className="mt-2 text-5xl font-bold">
                {evaluation.overallScore ?? "—"}
                <span className="text-xl text-indigo-200">
                  /100
                </span>
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-indigo-100">
                {evaluation.summary ||
                  "Your interview evaluation has been completed."}
              </p>
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/30 bg-white/10">
              <Star size={45} />
            </div>
          </div>
        </div>

        {/* SCORE CARDS */}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <ScoreCard
            title="Subject Knowledge"
            score={evaluation.subjectKnowledge}
            icon={Award}
          />

          <ScoreCard
            title="Communication"
            score={evaluation.communication}
            icon={MessageSquare}
          />

          <ScoreCard
            title="Explanation Skills"
            score={evaluation.explanationSkills}
            icon={TrendingUp}
          />
        </div>

        {/* FEEDBACK */}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CheckCircle2 size={20} />
              </div>

              <h3 className="font-semibold text-slate-900">
                Your strengths
              </h3>
            </div>

            <div className="mt-5 space-y-3">
              {evaluation.strengths?.length ? (
                evaluation.strengths.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl bg-blue-50/70 p-3"
                  >
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No strengths were provided.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp size={20} />
              </div>

              <h3 className="font-semibold text-slate-900">
                Areas to improve
              </h3>
            </div>

            <div className="mt-5 space-y-3">
              {evaluation.weaknesses?.length ? (
                evaluation.weaknesses.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl bg-amber-50/70 p-3"
                  >
                    <XCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No improvement areas were provided.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* FULL REPORT */}

        {evaluation.fullReport != null && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">
              Detailed interview report
            </h3>

            <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
              {typeof evaluation.fullReport === "string"
                ? evaluation.fullReport
                : JSON.stringify(
                    evaluation.fullReport,
                    null,
                    2
                  )}
            </pre>
          </section>
        )}

        {/* FOOTER */}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <CheckCircle2 size={17} />
            Interview evaluation completed
          </div>

          <p className="text-xs text-slate-400">
            Your assessment results have been generated by TutorSathi AI.
          </p>
        </div>
      </div>
    </main>
  );
}