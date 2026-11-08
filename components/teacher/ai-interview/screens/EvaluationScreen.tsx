"use client";

import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface EvaluationScreenProps {
  timedOut: boolean;
  error: string;
  onRetry: () => void;
}

export default function EvaluationScreen({
  timedOut,
  error,
  onRetry,
}: EvaluationScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50">
          <div className="absolute inset-0 animate-ping rounded-full border border-indigo-200 opacity-50" />

          <BrainCircuit
            size={43}
            className="relative text-indigo-600"
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600">
          <Sparkles size={16} />
          AI Assessment
        </div>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {timedOut
            ? "Evaluation is taking longer than expected"
            : "Analyzing your interview"}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
          {timedOut
            ? "Your interview has been submitted, but the evaluation has not finished yet. You can retry checking its status."
            : "Our AI system is reviewing your subject knowledge, communication, and teaching explanation skills."}
        </p>

        {!timedOut && (
          <div className="mt-9 space-y-4 rounded-2xl bg-slate-50 p-5 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={19}
                className="text-blue-600"
              />
              <span className="text-sm text-slate-700">
                Interview submitted successfully
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Loader2
                size={19}
                className="animate-spin text-indigo-600"
              />
              <span className="text-sm text-slate-700">
                Gemini is analyzing your answers
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={19} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                Preparing your evaluation report
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            {error}
          </div>
        )}

        {timedOut && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={16} />
            Check evaluation again
          </button>
        )}
      </div>
    </main>
  );
}