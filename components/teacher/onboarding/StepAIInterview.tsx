"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  Brain,
  Video,
  CheckCircle2,
  Loader2,
  PlayCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Mic,
  ShieldCheck,
  Clock3,
  ClipboardCheck,
  FileVideo,
} from "lucide-react";

type InterviewData = {
  interviewId: string;
  status: string;
  recordingAvailable: boolean;
  recordingUrl: string | null;
};

type Props = {
  onCompleted: () => void;
};

export default function StepAIInterview({
  onCompleted,
}: Props) {
  const [interview, setInterview] =
    useState<InterviewData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchInterview = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          "/api/teacher/ai-interview",
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to check your interview status."
          );
        }

        if (controller.signal.aborted) return;

        const interviewId =
          data.interviewId || data.interview?.id;

        const recordingUrl =
          data.recordingUrl ||
          data.interview?.recordingUrl ||
          null;

        const recordingAvailable =
          Boolean(recordingUrl) ||
          Boolean(data.recordingAvailable);

        if (interviewId && recordingAvailable) {
          setInterview({
            interviewId,
            status:
              data.status ||
              data.interview?.status ||
              "completed",
            recordingAvailable: true,
            recordingUrl,
          });

          onCompleted();
        } else {
          setInterview(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error(
          "Interview status error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your interview status. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInterview();

    return () => {
      controller.abort();
    };
  }, [retryCount, onCompleted]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setVideoError(false);
  };

  // -----------------------------------------
  // LOADING STATE
  // -----------------------------------------

  if (loading) {
    return (
      <div
        className="space-y-5 py-6"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Checking interview status
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Please wait while we retrieve your interview recording.
            </p>
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-600" />
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // COMPLETED INTERVIEW
  // -----------------------------------------

  if (interview?.recordingAvailable) {
    const videoSrc =
      interview.recordingUrl ||
      `/api/teacher/ai-interview/recording?interviewId=${encodeURIComponent(
        interview.interviewId
      )}`;

    return (
      <div className="space-y-6">
        {/* Completion Header */}

        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Interview Successfully Completed
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Submitted
              </span>
            </div>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Your AI interview has been recorded and
              submitted successfully. You can review your
              recording below.
            </p>
          </div>
        </div>

        {/* Interview Details */}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileVideo className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Recording
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-800">
                Available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Submission status
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-800">
                Successfully submitted
              </p>
            </div>
          </div>
        </div>

        {/* Recording Preview */}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Your Interview Recording
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Review your recorded camera and microphone
                interview.
              </p>
            </div>

            <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
              <Video className="mr-1 inline h-3 w-3" />
              Video
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            {!videoError ? (
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                playsInline
                preload="metadata"
                onError={() => setVideoError(true)}
                className="aspect-video w-full bg-black"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div
                className="flex aspect-video flex-col items-center justify-center px-5 text-center"
                role="alert"
              >
                <AlertCircle className="mb-3 h-8 w-8 text-slate-400" />

                <p className="text-sm font-medium text-white">
                  Unable to play your recording
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  The recording may be temporarily unavailable.
                  Please try loading it again.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVideoError(false)}
                  className="mt-4 border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Retry Playback
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Your interview recording is securely stored
            with your TutorSathi teacher application and
            will be available for review.
          </p>
        </section>

        {/* Next Step */}

        <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

          <div>
            <p className="text-sm font-semibold text-indigo-900">
              You&apos;re ready for the next step!
            </p>

            <p className="mt-1 text-xs leading-5 text-indigo-800/80">
              Your interview has been submitted. Continue
              with your registration to complete your
              teacher profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // INTERVIEW NOT COMPLETED
  // -----------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Brain className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">
            AI-Powered Teaching Interview
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Showcase your teaching skills through a
            conversation with our AI interviewer. Your
            camera and microphone will be used to record
            your responses.
          </p>
        </div>
      </div>

      {/* Error Message */}

      {error && (
        <div
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-800">
              Unable to verify interview status
            </p>

            <p className="mt-1 text-xs leading-5 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Interview Information */}

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            What to expect
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            A simple interview designed to understand your
            teaching abilities and communication skills.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Brain className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">
                AI Conversation
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Answer questions about your teaching
                experience and subjects.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Video className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">
                Video Recording
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your interview will be recorded for
                application review.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Mic className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">
                Microphone Access
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Allow microphone access to communicate
                with the interviewer.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock3 className="h-4 w-4 text-amber-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">
                Take Your Time
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Speak clearly and complete the interview
                at your own pace.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preparation Tips */}

      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-indigo-600" />

          <h4 className="text-sm font-semibold text-slate-900">
            Before you begin
          </h4>
        </div>

        <ul className="mt-3 space-y-2.5">
          {[
            "Sit in a quiet and well-lit environment.",
            "Check your camera and microphone permissions.",
            "Keep your face clearly visible throughout the interview.",
            "Be prepared to explain a subject you are comfortable teaching.",
            "Use a stable internet connection.",
          ].map((tip, index) => (
            <li
              key={index}
              className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Start Interview */}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">
            Ready to get started?
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Make sure your camera and microphone are working.
          </p>
        </div>

        <Link
          href="/teacher/ai-interview"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
        >
          <PlayCircle className="h-4 w-4" />
          Start AI Interview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Privacy Note */}

      <div className="flex items-start gap-2 border-t border-slate-100 pt-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

        <p className="text-[11px] leading-5 text-slate-500">
          Your interview recording will be associated with
          your teacher application. Please ensure that you
          are comfortable with the recording before starting.
        </p>
      </div>
    </div>
  );
}