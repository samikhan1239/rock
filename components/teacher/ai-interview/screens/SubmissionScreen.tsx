"use client";

import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Loader2,
  RefreshCw,
  Send,
  Video,
} from "lucide-react";

import type { SubmissionStage } from "@/types/ai-interview";

interface SubmissionScreenProps {
  stage: SubmissionStage;
  progress: number;
  error: string;
  onRetry: () => void;
}

const stages: {
  id: SubmissionStage;
  title: string;
  description: string;
}[] = [
  {
    id: "recording",
    title: "Preparing recording",
    description: "Preparing your interview recording.",
  },
  {
    id: "uploading",
    title: "Uploading recording",
    description: "Securely uploading your recording.",
  },
  {
    id: "submitting",
    title: "Submitting interview",
    description: "Submitting your answers for evaluation.",
  },
  {
    id: "evaluating",
    title: "Starting evaluation",
    description: "Preparing your AI assessment.",
  },
];

export default function SubmissionScreen({
  stage,
  progress,
  error,
  onRetry,
}: SubmissionScreenProps) {
  const currentIndex = stages.findIndex(
    (item) => item.id === stage
  );

  const StageIcon =
    stage === "uploading"
      ? CloudUpload
      : stage === "submitting"
        ? Send
        : Video;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <StageIcon size={30} />
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
          Submitting your interview
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Please keep this page open while we securely process
          your interview.
        </p>

        <div className="mt-9 space-y-6">
          {stages.map((item, index) => {
            const completed = index < currentIndex;
            const active = index === currentIndex;

            return (
              <div key={item.id} className="flex gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    completed
                      ? "bg-blue-100 text-blue-600"
                      : active
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 size={20} />
                  ) : active ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-current" />
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <p
                    className={`text-sm font-semibold ${
                      active || completed
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>

                  {item.id === "uploading" && active && (
                    <div className="mt-3">
                      <div className="mb-2 flex justify-between text-xs text-slate-500">
                        <span>Upload progress</span>
                        <span>{progress}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={onRetry}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800"
            >
              <RefreshCw size={15} />
              Retry submission
            </button>
          </div>
        )}
      </div>
    </main>
  );
}