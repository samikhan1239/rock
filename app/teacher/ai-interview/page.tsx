"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Check,
  Clock3,
  Loader2,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  Award,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Activity,
  CloudUpload,
  FileVideo,
  Timer,
} from "lucide-react";

import { uploadAIInterviewRecording } from "@/lib/cloudinary-upload";
import AIInterviewRoom from "@/components/AIInterviewRoom";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Step =
  | "ready"
  | "live"
  | "submitting"
  | "evaluating"
  | "results";

type SubmissionStage =
  | "recording"
  | "uploading"
  | "submitting"
  | "evaluating"
  | "completed";

type InterviewResult = {
  subjectKnowledge: number | null;
  communication: number | null;
  explanationSkills: number | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  fullReport?: unknown;
};

const EVALUATION_POLL_INTERVAL = 5000;
const MAX_EVALUATION_ATTEMPTS = 60;
const MAX_RECORDING_SIZE = 45 * 1024 * 1024;

const evaluationMessages = [
  "Reviewing your interview answers...",
  "Checking your subject knowledge...",
  "Analyzing your communication skills...",
  "Evaluating your teaching approach...",
  "Preparing your performance report...",
];

export default function AIInterviewPage() {
  const router = useRouter();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [step, setStep] = useState<Step>("ready");
  const [messages, setMessages] = useState<Message[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const [statusText, setStatusText] = useState("Ready to begin");
  const [error, setError] = useState("");
  const [recSeconds, setRecSeconds] = useState(0);

  const [evaluation, setEvaluation] =
    useState<InterviewResult | null>(null);

  const [evaluationAttempts, setEvaluationAttempts] = useState(0);
  const [evaluationElapsed, setEvaluationElapsed] = useState(0);
  const [evaluationMessageIndex, setEvaluationMessageIndex] = useState(0);

  const [submissionStage, setSubmissionStage] =
    useState<SubmissionStage>("recording");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [evaluationTimedOut, setEvaluationTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingBlobRef = useRef<Blob | null>(null);

  const recordingUploadedRef = useRef(false);
  const interviewSubmittedRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const evaluationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const evaluationClockRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const evaluationStartRef = useRef<number | null>(null);
  const recStartRef = useRef(0);

  const finishingRef = useRef(false);
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const addMessage = useCallback(
    (role: Message["role"], content: string) => {
      setMessages((previous) => [
        ...previous,
        { role, content, timestamp: new Date() },
      ]);
    },
    []
  );

  const clearEvaluationTimers = useCallback(() => {
    if (evaluationTimerRef.current) {
      clearTimeout(evaluationTimerRef.current);
      evaluationTimerRef.current = null;
    }

    if (evaluationClockRef.current) {
      clearInterval(evaluationClockRef.current);
      evaluationClockRef.current = null;
    }
  }, []);

  // --------------------------------------------------
  // CAMERA PREVIEW
  // --------------------------------------------------

  useEffect(() => {
    if (step !== "live") return;

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => undefined);
  }, [step]);

  // --------------------------------------------------
  // RECORDING TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (!recording) return;

    timerRef.current = setInterval(() => {
      setRecSeconds(
        Math.floor((Date.now() - recStartRef.current) / 1000)
      );
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recording]);

  // --------------------------------------------------
  // EVALUATION CLOCK
  // --------------------------------------------------

  useEffect(() => {
    if (step !== "evaluating") return;

    evaluationClockRef.current = setInterval(() => {
      if (!evaluationStartRef.current) return;

      setEvaluationElapsed(
        Math.floor((Date.now() - evaluationStartRef.current) / 1000)
      );

      setEvaluationMessageIndex((previous) => {
        return (previous + 1) % evaluationMessages.length;
      });
    }, 8000);

    return () => {
      if (evaluationClockRef.current) {
        clearInterval(evaluationClockRef.current);
        evaluationClockRef.current = null;
      }
    };
  }, [step]);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  const cleanupMedia = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    window.speechSynthesis?.cancel();

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    setCameraOn(false);
    setSpeaking(false);
    setRecording(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearEvaluationTimers();
      cleanupMedia();
    };
  }, [cleanupMedia, clearEvaluationTimers]);

  // --------------------------------------------------
  // AI VOICE (TTS)
  // --------------------------------------------------

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = "en-IN";
      utterance.rate = 0.94;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();

      const selectedVoice =
        voices.find((v) => v.lang === "en-IN") ||
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => {
        if (!mountedRef.current) return;

        setSpeaking(true);
        setStatusText("AI interviewer is speaking");
      };

      utterance.onend = () => {
        if (mountedRef.current) setSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        if (mountedRef.current) setSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // --------------------------------------------------
  // VIDEO RECORDING
  // --------------------------------------------------

  const startRecorder = (stream: MediaStream) => {
    chunksRef.current = [];
    recordingBlobRef.current = null;

    const supportedMimeType = [
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type));

    const options: MediaRecorderOptions = {
      videoBitsPerSecond: 600_000,
      audioBitsPerSecond: 48_000,
    };

    if (supportedMimeType) {
      options.mimeType = supportedMimeType;
    }

    const recorder = new MediaRecorder(stream, options);

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start(1000);

    recStartRef.current = Date.now();
    setRecSeconds(0);
    setRecording(true);
  };

  const stopRecorder = () => {
    return new Promise<Blob>((resolve, reject) => {
      if (recordingBlobRef.current) {
        resolve(recordingBlobRef.current);
        return;
      }

      const recorder = recorderRef.current;

      if (!recorder) {
        reject(new Error("Interview recorder was not initialized."));
        return;
      }

      if (recorder.state === "inactive") {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        recordingBlobRef.current = blob;
        resolve(blob);
        return;
      }

      recorder.onstop = () => {
        setRecording(false);

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        recordingBlobRef.current = blob;
        resolve(blob);
      };

      recorder.onerror = () => {
        reject(
          new Error("Failed to finalize the interview recording.")
        );
      };

      recorder.stop();
    });
  };

  // --------------------------------------------------
  // START INTERVIEW
  // --------------------------------------------------

  const beginInterview = async () => {
    setLoading(true);
    setError("");
    setMessages([]);
    setStatusText("Checking your camera and microphone...");

    recordingUploadedRef.current = false;
    interviewSubmittedRef.current = false;
    recordingBlobRef.current = null;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported. Please use HTTPS and a supported browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 24 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      setStep("live");

      await new Promise((resolve) => setTimeout(resolve, 200));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;

        await videoRef.current.play().catch(() => undefined);

        setCameraOn(true);
      }

      setStatusText(
        "Gemini is preparing your first interview question..."
      );

      startRecorder(stream);

      const response = await fetch("/api/teacher/ai-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start your interview."
        );
      }

      if (!data.interviewId || !data.message) {
        throw new Error(
          "The interview service returned an incomplete response."
        );
      }

      setInterviewId(data.interviewId);

      addMessage("assistant", data.message);

      setLoading(false);

      await speak(data.message);

      setStatusText("Your turn — speak naturally");
    } catch (err) {
      const name = (err as { name?: string })?.name;

      let message =
        err instanceof Error
          ? err.message
          : "Unable to start the interview.";

      if (name === "NotAllowedError") {
        message =
          "Camera or microphone permission was denied. Please allow both permissions and try again.";
      }

      if (name === "NotFoundError") {
        message =
          "No camera or microphone was detected. Connect a device and try again.";
      }

      cleanupMedia();

      setStep("ready");
      setLoading(false);
      setError(message);
      setStatusText("Ready to begin");
    }
  };

  // --------------------------------------------------
  // SUBMIT ANSWER (used by AIInterviewRoom)
  // --------------------------------------------------

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      const response = await fetch("/api/teacher/ai-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          interviewId,
          message: answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to process your answer."
        );
      }

      if (!data.message || typeof data.message !== "string") {
        throw new Error(
          "The AI interviewer returned an empty response."
        );
      }

      addMessage("assistant", data.message);

      await speak(data.message);

      setStatusText("Your turn — speak naturally");
    },
    [addMessage, interviewId, speak]
  );

  // --------------------------------------------------
  // EVALUATION
  // --------------------------------------------------

  const startEvaluation = useCallback(() => {
    clearEvaluationTimers();

    evaluationStartRef.current = Date.now();

    setEvaluationElapsed(0);
    setEvaluationAttempts(0);
    setEvaluationTimedOut(false);
    setEvaluationMessageIndex(0);
    setError("");

    setStep("evaluating");
    setSubmissionStage("evaluating");

    setStatusText(
      "Your interview has been submitted. Gemini is evaluating your answers."
    );
  }, [clearEvaluationTimers]);

  const checkEvaluation = useCallback(
    async (attempt = 0) => {
      if (!interviewId || !mountedRef.current) return;

      setEvaluationAttempts(attempt + 1);
      setError("");

      try {
        const response = await fetch(
          `/api/teacher/ai-interview?action=evaluation&interviewId=${encodeURIComponent(
            interviewId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to retrieve interview evaluation."
          );
        }

        // IMPORTANT:
        // Show results only after the backend returns the AI evaluation.
        // Do not redirect to onboarding automatically.
        if (data.result) {
          clearEvaluationTimers();

          setEvaluation(data.result);
          setStep("results");
          setSubmissionStage("completed");

          setStatusText("Your interview evaluation is ready.");

          return;
        }

        if (data.evaluationPending) {
          setStatusText(
            data.message ||
              "Gemini is carefully analyzing your interview answers..."
          );

          if (attempt + 1 >= MAX_EVALUATION_ATTEMPTS) {
            setEvaluationTimedOut(true);

            setStatusText(
              "Your interview is safely submitted. The evaluation is taking longer than expected."
            );

            return;
          }

          evaluationTimerRef.current = setTimeout(() => {
            checkEvaluation(attempt + 1);
          }, EVALUATION_POLL_INTERVAL);

          return;
        }

        throw new Error("Evaluation response was incomplete.");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load evaluation.";

        if (attempt + 1 >= MAX_EVALUATION_ATTEMPTS) {
          setError(message);
          setEvaluationTimedOut(true);
          return;
        }

        setStatusText(
          "Temporarily unable to check the evaluation. Retrying automatically..."
        );

        evaluationTimerRef.current = setTimeout(() => {
          checkEvaluation(attempt + 1);
        }, EVALUATION_POLL_INTERVAL);
      }
    },
    [clearEvaluationTimers, interviewId]
  );

  // --------------------------------------------------
  // FINISH / SUBMIT INTERVIEW
  // --------------------------------------------------

  const submitInterview = async () => {
    if (
      !interviewId ||
      finishingRef.current ||
      redirectingRef.current
    ) {
      return;
    }

    finishingRef.current = true;

    setLoading(true);
    setError("");
    setStep("submitting");

    try {
      let blob = recordingBlobRef.current;

      if (!blob) {
        setStatusText("Finalizing your interview recording...");

        blob = await stopRecorder();

        recordingBlobRef.current = blob;
      }

      if (!blob || blob.size === 0) {
        throw new Error("Your interview recording is empty.");
      }

      if (blob.size > MAX_RECORDING_SIZE) {
        throw new Error(
          "Your recording exceeds the 45 MB upload limit. Please contact support."
        );
      }

      // Upload to Cloudinary
      if (!recordingUploadedRef.current) {
        setSubmissionStage("uploading");
        setUploadProgress(0);

        setStatusText(
          "Uploading your interview recording securely to Cloudinary..."
        );

        const recordingFile = new File(
          [blob],
          `interview-${interviewId}.webm`,
          {
            type: blob.type || "video/webm",
          }
        );

        await uploadAIInterviewRecording({
          file: recordingFile,
          interviewId,
          onProgress: (progress) => {
            if (!mountedRef.current) return;

            setUploadProgress(progress);
          },
        });

        recordingUploadedRef.current = true;

        setUploadProgress(100);
      }

      // Finish interview
      if (!interviewSubmittedRef.current) {
        setSubmissionStage("submitting");

        setStatusText(
          "Recording uploaded successfully. Submitting your interview..."
        );

        const response = await fetch("/api/teacher/ai-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            interviewId,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
              data.error ||
              "Interview submission failed."
          );
        }

        interviewSubmittedRef.current = true;
      }

      cleanupMedia();

      setLoading(false);

      finishingRef.current = false;

      // Start AI evaluation after successful submission.
      // The results screen appears only when evaluation is available.
      startEvaluation();

      await checkEvaluation(0);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to submit your interview.";

      setError(message);
      setLoading(false);
      setStatusText("Submission needs attention");

      finishingRef.current = false;

      setStep("submitting");
    }
  };

  const finishInterview = async () => {
    if (
      !interviewId ||
      finishingRef.current ||
      redirectingRef.current
    ) {
      return;
    }

    finishingRef.current = true;

    window.speechSynthesis?.cancel();

    setSpeaking(false);

    finishingRef.current = false;

    await submitInterview();
  };

  const retrySubmission = async () => {
    if (isRetrying || finishingRef.current) return;

    setIsRetrying(true);

    try {
      await submitInterview();
    } finally {
      setIsRetrying(false);
    }
  };

  const retryEvaluation = () => {
    if (!interviewId) return;

    clearEvaluationTimers();

    setError("");
    setEvaluationTimedOut(false);
    setEvaluationAttempts(0);

    if (!evaluationStartRef.current) {
      evaluationStartRef.current = Date.now();
    }

    setStatusText("Checking your interview evaluation...");

    checkEvaluation(0);
  };

  // --------------------------------------------------
  // READY SCREEN
  // --------------------------------------------------

  if (step === "ready") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() =>
              router.push("/teacher/onboarding?step=5")
            }
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to onboarding
          </button>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <section>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                TutorSathi AI Interview
              </div>

              <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Let&apos;s get to know your{" "}
                <span className="text-indigo-600">
                  teaching skills.
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                Have a natural voice conversation with our AI interviewer.
                Answer questions just like you would in a real teaching
                interview.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Mic,
                    title: "Speak naturally",
                    description:
                      "Answer questions using your microphone. No typing required.",
                  },
                  {
                    icon: Brain,
                    title: "AI-powered questions",
                    description:
                      "Questions are designed to understand your teaching knowledge and communication.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Fair evaluation",
                    description:
                      "Your answers are evaluated across multiple teaching-related skills.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={beginInterview}
                disabled={loading}
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing interview...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Start AI Interview
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-3 text-xs text-slate-400">
                Camera and microphone permissions are required.
              </p>
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Your interview assistant
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Powered by AI
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Ready
                  </span>
                </div>

                <div className="mt-10 flex flex-col items-center">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-indigo-50">
                    <div className="absolute inset-3 animate-pulse rounded-full border border-indigo-200" />

                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 shadow-xl shadow-indigo-600/20">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                  </div>

                  <h2 className="mt-6 text-lg font-bold text-slate-900">
                    Hello, future educator!
                  </h2>

                  <p className="mt-2 max-w-xs text-center text-sm leading-6 text-slate-500">
                    I&apos;ll ask you a few questions about your teaching
                    approach, subject knowledge, and classroom experience.
                  </p>
                </div>

                <div className="mt-9 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                  <div className="text-center">
                    <Clock3 className="mx-auto h-5 w-5 text-indigo-500" />

                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Flexible
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      At your pace
                    </p>
                  </div>

                  <div className="text-center">
                    <Mic className="mx-auto h-5 w-5 text-indigo-500" />

                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Voice
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Hands-free
                    </p>
                  </div>

                  <div className="text-center">
                    <Award className="mx-auto h-5 w-5 text-indigo-500" />

                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Evaluation
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Skill-based
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // LIVE INTERVIEW ROOM
  // --------------------------------------------------

  if (step === "live") {
    return (
      <AIInterviewRoom
        interviewId={interviewId}
        messages={messages}
        onAddMessage={addMessage}
        onFinishInterview={finishInterview}
        loading={loading}
        setLoading={setLoading}
        speaking={speaking}
        setSpeaking={setSpeaking}
        statusText={statusText}
        setStatusText={setStatusText}
        error={error}
        setError={setError}
        recording={recording}
        recSeconds={recSeconds}
        cameraOn={cameraOn}
        videoRef={videoRef}
        onSubmitAnswer={handleSubmitAnswer}
        speak={speak}
      />
    );
  }

  // --------------------------------------------------
  // SUBMITTING SCREEN
  // --------------------------------------------------

  if (step === "submitting") {
    const stages = [
      {
        id: "uploading",
        title: "Saving interview recording",
        description: "Uploading your video securely to Cloudinary.",
        icon: CloudUpload,
      },
      {
        id: "submitting",
        title: "Submitting interview",
        description: "Saving your completed interview responses.",
        icon: FileVideo,
      },
    ];

    const stageOrder = ["uploading", "submitting"];
    const activeIndex = stageOrder.indexOf(submissionStage);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            {error ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            )}
          </div>

          <h2 className="mt-5 text-center text-xl font-bold text-slate-900">
            {error
              ? "Submission needs attention"
              : "Submitting your interview"}
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            {statusText}
          </p>

          <div className="mt-8 space-y-4">
            {stages.map((item, index) => {
              const Icon = item.icon;

              const completed =
                (recordingUploadedRef.current && index === 0) ||
                (interviewSubmittedRef.current && index === 1);

              const active =
                !completed && activeIndex === index && !error;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${
                    completed || active
                      ? "border-indigo-200 bg-indigo-50/60"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      completed || active
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : active ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {submissionStage === "uploading" && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                <span>Upload progress</span>
                <span>{uploadProgress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={retrySubmission}
                disabled={isRetrying}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Retry submission
              </button>

              <button
                type="button"
                onClick={() =>
                  router.replace("/teacher/onboarding")
                }
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Return to onboarding
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-xs text-slate-400">
              Please keep this page open while your interview is being
              submitted.
            </p>
          )}
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // EVALUATION SCREEN
  // --------------------------------------------------

  if (step === "evaluating") {
    const elapsedMinutes = Math.floor(evaluationElapsed / 60);
    const elapsedSeconds = evaluationElapsed % 60;

    const elapsedText = `${String(elapsedMinutes).padStart(
      2,
      "0"
    )}:${String(elapsedSeconds).padStart(2, "0")}`;

    const progress = evaluationTimedOut
      ? 92
      : Math.min(90, Math.max(12, evaluationAttempts * 2));

    const evaluationSteps = [
      "Reviewing your answers",
      "Evaluating subject knowledge",
      "Analyzing communication skills",
      "Preparing your final report",
    ];

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50">
            {!evaluationTimedOut && (
              <div className="absolute inset-0 animate-ping rounded-full border border-indigo-200 opacity-40" />
            )}

            <Brain className="h-11 w-11 text-indigo-600" />
          </div>

          <div className="mt-7 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI evaluation
            </span>
          </div>

          <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
            {evaluationTimedOut
              ? "Your evaluation is taking longer"
              : "Analyzing your interview"}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">
            {evaluationTimedOut
              ? "Your recording and interview answers have been submitted successfully. Gemini is taking longer than expected to prepare your report. You can safely check again."
              : "Gemini is reviewing your answers and preparing a detailed teaching performance report. This may take a few minutes."}
          </p>

          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                <Timer className="h-4 w-4 text-indigo-600" />
                Evaluation time
              </div>

              <span className="text-sm font-bold tabular-nums text-indigo-700">
                {elapsedText}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-indigo-700">
              {evaluationTimedOut
                ? "Your interview is saved. Checking again will not upload your recording again."
                : evaluationMessages[evaluationMessageIndex]}
            </p>
          </div>

          <div className="mt-7 space-y-4">
            {evaluationSteps.map((item, index) => {
              const activeIndex = Math.min(
                evaluationSteps.length - 1,
                Math.floor(evaluationAttempts / 5)
              );

              const completed =
                !evaluationTimedOut && index < activeIndex;

              const active =
                !evaluationTimedOut && index === activeIndex;

              return (
                <div key={item} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      completed || active
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-sm ${
                      completed || active
                        ? "font-medium text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {error}
            </div>
          )}

          {evaluationTimedOut && (
            <button
              type="button"
              onClick={retryEvaluation}
              className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              Check evaluation again
            </button>
          )}

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Please don&apos;t close this page until your result appears.
            Your submitted interview recording is already saved.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // RESULTS SCREEN
  // --------------------------------------------------

  if (step === "results" && evaluation) {
    const score = evaluation.overallScore ?? 0;

    const scoreLabel =
      score >= 8
        ? "Excellent performance"
        : score >= 6
          ? "Good performance"
          : score >= 4
            ? "Needs improvement"
            : "Keep practicing";

    const scoreColor =
      score >= 8
        ? "text-indigo-600"
        : score >= 6
          ? "text-indigo-600"
          : score >= 4
            ? "text-amber-600"
            : "text-red-600";

    const metrics = [
      {
        title: "Subject Knowledge",
        score: evaluation.subjectKnowledge,
        icon: BookOpen,
      },
      {
        title: "Communication",
        score: evaluation.communication,
        icon: MessageSquare,
      },
      {
        title: "Explanation Skills",
        score: evaluation.explanationSkills,
        icon: Lightbulb,
      },
    ];

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
            <CheckCircle2 className="h-4 w-4" />
            Interview completed
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Your interview results
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s the evaluation of your teaching interview.
          </p>

          <section className="mt-8 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-7 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <Award className="h-7 w-7 text-indigo-600" />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                Overall score
              </p>

              <div className={`mt-2 text-6xl font-bold ${scoreColor}`}>
                {evaluation.overallScore !== null
                  ? evaluation.overallScore.toFixed(1)
                  : "—"}

                <span className="text-xl text-slate-400">/10</span>
              </div>

              <span className="mt-3 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {scoreLabel}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-bold text-slate-900">
                Performance breakdown
              </h2>

              <div className="mt-6 space-y-6">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  const value = metric.score ?? 0;

                  return (
                    <div key={metric.title}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-indigo-500" />

                          <span className="text-sm font-medium text-slate-700">
                            {metric.title}
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {metric.score !== null
                            ? `${metric.score.toFixed(1)}/10`
                            : "—"}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, value * 10)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {evaluation.summary && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />

                <h2 className="font-bold text-slate-900">
                  AI interviewer&apos;s feedback
                </h2>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {evaluation.summary}
              </p>
            </section>
          )}

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-white p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />

                <h2 className="font-bold text-slate-900">
                  Your strengths
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {evaluation.strengths?.length ? (
                  evaluation.strengths.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-2"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                      <p className="text-sm leading-6 text-slate-600">
                        {item}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No strengths were returned in this evaluation.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-600" />

                <h2 className="font-bold text-slate-900">
                  Areas to improve
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {evaluation.weaknesses?.length ? (
                  evaluation.weaknesses.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-2"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                      <p className="text-sm leading-6 text-slate-600">
                        {item}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No specific improvement areas were returned.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Continue only after the teacher has viewed the AI result. */}
          <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">
                Interview successfully completed
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Continue to complete your teacher registration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                // Navigate to onboarding step 5 only after
                // the user explicitly clicks Continue.
                redirectingRef.current = true;

                router.push("/teacher/onboarding?step=5");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue onboarding
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // FALLBACK
  // --------------------------------------------------

  return null;
}