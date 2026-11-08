"use client";

import { useEffect, useRef } from "react";
import {
  AlertCircle,
  Bot,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

import type { Message } from "@/types/ai-interview";

interface LiveInterviewRoomProps {
  messages: Message[];
  transcript: string;
  statusText: string;
  listening: boolean;
  speaking: boolean;
  loading: boolean;
  recording: boolean;
  cameraOn: boolean;
  recSeconds: number;
  error: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onFinish: () => void;
  onDismissError: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function LiveInterviewRoom({
  messages,
  transcript,
  statusText,
  listening,
  speaking,
  loading,
  recording,
  cameraOn,
  recSeconds,
  error,
  videoRef,
  onFinish,
  onDismissError,
}: LiveInterviewRoomProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, transcript]);

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      {/* HEADER */}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Sparkles size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold">
              TutorSathi Interview
            </p>

            <p className="text-xs text-slate-400">
              AI Teaching Assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {recording && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              REC
              <span>{formatTime(recSeconds)}</span>
            </div>
          )}

          <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300 sm:flex">
            <CheckCircle2 size={14} className="text-blue-400" />
            Interview in progress
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_350px]">
        {/* INTERVIEWER */}

        <section className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 px-5 py-10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/20" />

            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/20" />

            <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/20" />
          </div>

          {/* AI AVATAR */}

          <div
            className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full border border-indigo-300/30 bg-gradient-to-br from-indigo-500 to-blue-700 shadow-[0_0_100px_rgba(99,102,241,0.35)] transition-all duration-500 sm:h-44 sm:w-44 ${
              speaking
                ? "scale-105 shadow-[0_0_130px_rgba(99,102,241,0.6)]"
                : ""
            }`}
          >
            <div className="absolute inset-3 rounded-full border border-white/20" />

            <Bot size={65} className="text-white sm:h-20 sm:w-20" />

            {speaking && (
              <div className="absolute -inset-5 animate-ping rounded-full border border-indigo-400/20" />
            )}
          </div>

          <div className="relative z-10 mt-8 text-center">
            <h2 className="text-xl font-semibold">
              AI Interviewer
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {statusText}
            </p>
          </div>

          {/* STATUS */}

          <div className="relative z-10 mt-7 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
            {speaking ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                Speaking
              </>
            ) : listening ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Listening
              </>
            ) : loading ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                Thinking
              </>
            ) : (
              <>
                <Clock size={13} />
                Waiting
              </>
            )}
          </div>

          {/* CAMERA PREVIEW */}

          <div className="absolute bottom-5 right-5 z-20 w-32 overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl sm:bottom-7 sm:right-7 sm:w-48">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover ${
                  cameraOn ? "" : "hidden"
                }`}
              />

              {!cameraOn && (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <CameraOff size={25} />
                </div>
              )}

              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px]">
                <User size={11} />
                You
              </div>
            </div>
          </div>
        </section>

        {/* CONVERSATION PANEL */}

        <aside className="flex min-h-0 flex-col border-l border-white/10 bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="font-semibold">Conversation</h3>

            <p className="mt-1 text-xs text-slate-400">
              Your interview transcript
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "flex-row-reverse"
                    : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "assistant"
                      ? "bg-indigo-600"
                      : "bg-slate-700"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Bot size={16} />
                  ) : (
                    <User size={16} />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-white/5 text-slate-200"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {transcript && (
              <div className="flex flex-row-reverse gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700">
                  <User size={16} />
                </div>

                <div className="max-w-[85%] rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100">
                  {transcript}
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                  <Bot size={16} />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-white/5 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT STATUS */}

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  listening
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {listening ? (
                  <Mic size={18} />
                ) : (
                  <MicOff size={18} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200">
                  {listening
                    ? "Microphone is active"
                    : loading
                      ? "Processing your answer"
                      : "Waiting for your response"}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Speak naturally to answer.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ERROR */}

      {error && (
        <div className="absolute bottom-24 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-xl border border-red-400/20 bg-slate-900 p-4 shadow-2xl">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="flex-1 text-sm text-slate-200">
            {error}
          </p>

          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="text-slate-400 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* FOOTER */}

      <footer className="flex h-20 shrink-0 items-center justify-center border-t border-white/10 bg-slate-950 px-5">
        <button
          type="button"
          onClick={onFinish}
          disabled={loading}
          className="flex items-center gap-3 rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PhoneOff size={17} />
          End Interview
        </button>
      </footer>
    </main>
  );
}