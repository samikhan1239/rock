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
  AudioLines,
  Brain,
  CheckCircle2,
  Check,
  Clock3,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  Volume2,
  XCircle,
  Award,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Activity,
  CloudUpload,
  FileVideo,
  Timer,
  UserRound,
  Waves,
} from "lucide-react";

import { uploadAIInterviewRecording } from "@/lib/cloudinary-upload";

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


type LocalSpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal?: boolean }
        >;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => LocalSpeechRecognitionInstance;


const EVALUATION_POLL_INTERVAL = 5000;
const MAX_EVALUATION_ATTEMPTS = 60;
const ANSWER_SILENCE_DELAY = 2200;
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
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState("Ready to begin");

  const [error, setError] = useState("");

  const [recSeconds, setRecSeconds] = useState(0);

  const [evaluation, setEvaluation] =
    useState<InterviewResult | null>(null);

  const [evaluationAttempts, setEvaluationAttempts] = useState(0);
  const [evaluationElapsed, setEvaluationElapsed] = useState(0);

  const [evaluationMessageIndex, setEvaluationMessageIndex] =
    useState(0);

  const [submissionStage, setSubmissionStage] =
    useState<SubmissionStage>("recording");

  const [uploadProgress, setUploadProgress] = useState(0);

  const [evaluationTimedOut, setEvaluationTimedOut] =
    useState(false);

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

const recognitionRef =
  useRef<LocalSpeechRecognitionInstance | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const evaluationTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const evaluationClockRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);

  const evaluationStartRef = useRef<number | null>(null);

  const recStartRef = useRef(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");

  const processingAnswerRef = useRef(false);
  const finishingRef = useRef(false);
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const addMessage = useCallback(
    (role: Message["role"], content: string) => {
      setMessages((previous) => [
        ...previous,
        {
          role,
          content,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  const clearAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) {
      clearTimeout(answerTimerRef.current);
      answerTimerRef.current = null;
    }
  }, []);

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
  // CHAT SCROLL
  // --------------------------------------------------

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, transcript, loading]);

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
        Math.floor(
          (Date.now() - evaluationStartRef.current) / 1000
        )
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
    clearAnswerTimer();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    recognitionRef.current?.abort();
    recognitionRef.current = null;

    window.speechSynthesis?.cancel();

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    setCameraOn(false);
    setListening(false);
    setSpeaking(false);
    setRecording(false);
  }, [clearAnswerTimer]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearEvaluationTimers();
      cleanupMedia();
    };
  }, [cleanupMedia, clearEvaluationTimers]);

  // --------------------------------------------------
  // AI VOICE
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
        voices.find((voice) => voice.lang === "en-IN") ||
        voices.find((voice) => voice.lang.startsWith("en-IN")) ||
        voices.find((voice) => voice.lang.startsWith("en"));

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        if (!mountedRef.current) return;

        setSpeaking(true);
        setListening(false);
        setStatusText("AI interviewer is speaking");
      };

      utterance.onend = () => {
        if (mountedRef.current) {
          setSpeaking(false);
        }

        resolve();
      };

      utterance.onerror = () => {
        if (mountedRef.current) {
          setSpeaking(false);
        }

        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // --------------------------------------------------
  // STOP MICROPHONE
  // --------------------------------------------------

  const stopMic = useCallback(() => {
    clearAnswerTimer();

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }

    setListening(false);
  }, [clearAnswerTimer]);

  // --------------------------------------------------
  // SEND VOICE ANSWER AUTOMATICALLY
  // --------------------------------------------------

  const submitVoiceAnswer = useCallback(async () => {
    if (
      processingAnswerRef.current ||
      finishingRef.current ||
      redirectingRef.current
    ) {
      return;
    }

    const answer = finalTranscriptRef.current.trim();

    if (!answer) return;

    processingAnswerRef.current = true;

    clearAnswerTimer();

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors.
    }

    setListening(false);
    setLoading(true);
    setStatusText("Analyzing your answer...");
    setTranscript("");

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";

    addMessage("user", answer);

    try {
      const response = await fetch("/api/teacher/ai-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      setLoading(false);

      await speak(data.message);

      if (
        !finishingRef.current &&
        !redirectingRef.current &&
        mountedRef.current
      ) {
        setStatusText("Your turn — speak naturally");
        startMicRef.current?.();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while processing your answer.";

      setError(message);
      setLoading(false);

      setStatusText("Please try answering again");

      if (mountedRef.current && !finishingRef.current) {
        startMicRef.current?.();
      }
    } finally {
      processingAnswerRef.current = false;
    }
  }, [
    addMessage,
    clearAnswerTimer,
    interviewId,
    speak,
  ]);

  const submitAnswerRef = useRef(submitVoiceAnswer);

  useEffect(() => {
    submitAnswerRef.current = submitVoiceAnswer;
  }, [submitVoiceAnswer]);

  // --------------------------------------------------
  // START MICROPHONE
  // --------------------------------------------------

  const startMic = useCallback(() => {
    if (
      finishingRef.current ||
      redirectingRef.current ||
      processingAnswerRef.current ||
      speaking ||
      loading ||
      step !== "live"
    ) {
      return;
    }

 const speechWindow = window as unknown as {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const RecognitionAPI =
  speechWindow.SpeechRecognition ||
  speechWindow.webkitSpeechRecognition;

    if (!RecognitionAPI) {
      setError(
        "Voice recognition is not supported in this browser. Please use the latest version of Google Chrome or Microsoft Edge."
      );
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore previous recognition errors.
    }

    const recognition = new RecognitionAPI();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let updated = false;

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        const text = result[0]?.transcript?.trim();

        if (!text) continue;

        if (result.isFinal) {
          finalTranscriptRef.current += `${text} `;
          updated = true;
        } else {
          interimTranscriptRef.current = text;
          updated = true;
        }
      }

      if (updated) {
        const combined = [
          finalTranscriptRef.current.trim(),
          interimTranscriptRef.current.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        setTranscript(combined);

        if (finalTranscriptRef.current.trim()) {
          clearAnswerTimer();

          answerTimerRef.current = setTimeout(() => {
            submitAnswerRef.current?.();
          }, ANSWER_SILENCE_DELAY);
        }
      }
    };

    recognition.onerror = (event) => {
      if (
        event.error === "no-speech" ||
        event.error === "aborted"
      ) {
        return;
      }

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Allow microphone access in your browser settings."
        );
      } else {
        setError(`Microphone error: ${event.error}`);
      }

      setListening(false);
    };

    recognition.onend = () => {
      if (
        !mountedRef.current ||
        finishingRef.current ||
        redirectingRef.current ||
        processingAnswerRef.current
      ) {
        setListening(false);
        return;
      }

      if (step === "live" && !speaking && !loading) {
        if (finalTranscriptRef.current.trim()) {
          clearAnswerTimer();

          answerTimerRef.current = setTimeout(() => {
            submitAnswerRef.current?.();
          }, 500);

          return;
        }

        try {
          recognition.start();
          setListening(true);
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    try {
      recognition.start();

      setListening(true);
      setError("");
      setStatusText("Listening to your answer...");
    } catch {
      setListening(false);
      setError("Unable to start voice recognition. Please try again.");
    }
  }, [
    clearAnswerTimer,
    loading,
    speaking,
    step,
  ]);

  const startMicRef = useRef(startMic);

  useEffect(() => {
    startMicRef.current = startMic;
  }, [startMic]);

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

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
        }),
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

      if (mountedRef.current) {
        startMicRef.current?.();
      }
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
  // START EVALUATION POLLING
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

  // --------------------------------------------------
  // EVALUATION POLLING
  // --------------------------------------------------

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
            data.error || "Unable to retrieve interview evaluation."
          );
        }

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
  // FINISH / RETRY SUBMISSION
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

      // --------------------------------------------------
      // SIGNED CLOUDINARY UPLOAD
      // --------------------------------------------------

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

      // --------------------------------------------------
      // FINISH INTERVIEW
      // --------------------------------------------------

      if (!interviewSubmittedRef.current) {
        setSubmissionStage("submitting");

        setStatusText(
          "Recording uploaded successfully. Submitting your interview..."
        );

        const response = await fetch(
          "/api/teacher/ai-interview",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "finish",
              interviewId,
            }),
          }
        );

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

      // --------------------------------------------------
      // CLEANUP
      // --------------------------------------------------

      cleanupMedia();

      setLoading(false);
      finishingRef.current = false;

      // --------------------------------------------------
      // START GEMINI EVALUATION
      // --------------------------------------------------

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
      processingAnswerRef.current ||
      redirectingRef.current
    ) {
      return;
    }

    finishingRef.current = true;

    stopMic();

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

  // --------------------------------------------------
  // RETRY EVALUATION
  // --------------------------------------------------

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
            onClick={() => router.push("/teacher/onboarding?step=5")}
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
                Have a natural voice conversation with our AI
                interviewer. Answer questions just like you would
                in a real teaching interview.
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
                    I&apos;ll ask you a few questions about your
                    teaching approach, subject knowledge, and
                    classroom experience.
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
                recordingUploadedRef.current && index === 0
                  ? true
                  : interviewSubmittedRef.current && index === 1
                    ? true
                    : false;

              const active =
                !completed &&
                activeIndex === index &&
                !error;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${
                    completed
                      ? "border-indigo-200 bg-indigo-50/60"
                      : active
                        ? "border-indigo-200 bg-indigo-50/60"
                        : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      completed
                        ? "bg-indigo-100 text-indigo-600"
                        : active
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
                onClick={() => router.replace("/teacher/onboarding")}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Return to onboarding
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-xs text-slate-400">
              Please keep this page open while your interview is being submitted.
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
      : Math.min(
          90,
          Math.max(12, evaluationAttempts * 2)
        );

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
                      completed
                        ? "bg-indigo-100 text-indigo-600"
                        : active
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
                redirectingRef.current = true;
                router.replace("/teacher/onboarding");
                router.refresh();
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
  // LIVE INTERVIEW ROOM
  // --------------------------------------------------

  const interviewerState = speaking
    ? "speaking"
    : loading
      ? "thinking"
      : listening
        ? "listening"
        : "waiting";

  const interviewerStatus = {
    speaking: {
      label: "AI interviewer is speaking",
      description: "Listen carefully to the question.",
      badge: "Speaking",
      color: "bg-indigo-50 text-indigo-700 border-indigo-100",
      iconColor: "text-indigo-600",
    },
    thinking: {
      label: "Gemini is thinking",
      description: "Preparing your next personalized question.",
      badge: "Thinking",
      color: "bg-amber-50 text-amber-700 border-amber-100",
      iconColor: "text-amber-600",
    },
    listening: {
      label: "Listening to your answer",
      description: "Speak naturally. Your answer will be detected automatically.",
      badge: "Listening",
      color: "bg-blue-50 text-blue-700 border-blue-100",
      iconColor: "text-blue-600",
    },
    waiting: {
      label: "AI interviewer is ready",
      description: statusText,
      badge: "Ready",
      color: "bg-slate-50 text-slate-600 border-slate-200",
      iconColor: "text-slate-500",
    },
  }[interviewerState];

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#F5F7FC]">
      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <header className="z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/20">
            <Brain className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900">
              TutorSathi AI Interview
            </h1>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Live teaching assessment
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {recording && (
            <div className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="hidden sm:inline">REC</span>
              {formatTime(recSeconds)}
            </div>
          )}

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            Secure session
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserRound className="h-4 w-4" />
          </div>
        </div>
      </header>

      {/* --------------------------------------------------
          INTERVIEW WORKSPACE
      -------------------------------------------------- */}

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px]">
        {/* --------------------------------------------------
            MAIN AI INTERVIEWER STAGE
        -------------------------------------------------- */}

        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          {/* AI STAGE */}

          <div className="relative flex min-h-[340px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-indigo-100 bg-white px-4 py-7 shadow-sm sm:min-h-[420px] sm:px-8">
            {/* Background decoration */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

              <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.035)_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            {/* Stage header */}

            <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between sm:left-7 sm:right-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Your interviewer
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  TutorSathi AI
                </p>
              </div>

              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${interviewerStatus.color}`}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : speaking ? (
                  <AudioLines className="h-3.5 w-3.5" />
                ) : listening ? (
                  <Mic className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}

                {interviewerStatus.badge}
              </div>
            </div>

            {/* AI AVATAR */}

            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`relative flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56 ${
                  speaking ? "scale-[1.02]" : "scale-100"
                } transition-transform duration-500`}
              >
                {/* Outer animated ring */}

                <div
                  className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                    speaking
                      ? "animate-pulse border-indigo-300"
                      : listening
                        ? "border-blue-200"
                        : loading
                          ? "animate-pulse border-amber-200"
                          : "border-indigo-100"
                  }`}
                />

                <div
                  className={`absolute inset-3 rounded-full border transition-all duration-500 ${
                    speaking
                      ? "border-indigo-300/80"
                      : listening
                        ? "border-blue-200/80"
                        : "border-slate-200"
                  }`}
                />

                {/* Glow */}

                <div
                  className={`absolute inset-7 rounded-full blur-2xl transition-all duration-500 ${
                    speaking
                      ? "bg-indigo-300/50"
                      : listening
                        ? "bg-blue-300/40"
                        : loading
                          ? "bg-amber-200/40"
                          : "bg-indigo-200/40"
                  }`}
                />

                {/* Avatar circle */}

                <div
                  className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full shadow-xl transition-all duration-500 sm:h-36 sm:w-36 ${
                    speaking
                      ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-indigo-500/30"
                      : listening
                        ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 shadow-blue-500/30"
                        : loading
                          ? "bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-600 shadow-amber-500/20"
                          : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-indigo-500/20"
                  }`}
                >
                  {speaking ? (
                    <AudioLines className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  ) : listening ? (
                    <Mic className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  ) : loading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-white sm:h-16 sm:w-16" />
                  ) : (
                    <Brain className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  )}
                </div>

                {/* Sound wave rings */}

                {(speaking || listening) && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full border border-indigo-300/40 [animation-duration:2.5s]" />

                    <div className="absolute -inset-3 animate-pulse rounded-full border border-indigo-200/50" />
                  </>
                )}
              </div>

              {/* AI name */}

              <div className="mt-5 text-center">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  AI Interviewer
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Your teaching assessment assistant
                </p>
              </div>

              {/* Voice visualizer */}

              <div className="mt-5 flex h-8 items-center justify-center gap-1.5">
                {Array.from({ length: 19 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      speaking
                        ? "animate-pulse bg-indigo-500"
                        : listening
                          ? "animate-pulse bg-blue-500"
                          : loading
                            ? "animate-pulse bg-amber-400"
                            : "bg-slate-200"
                    }`}
                    style={{
                      height:
                        speaking || listening
                          ? `${10 + ((index * 7) % 17)}px`
                          : loading
                            ? `${8 + ((index * 3) % 10)}px`
                            : "5px",
                      animationDelay: `${index * 65}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Current state */}

              <div className="mt-3 max-w-md text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {interviewerStatus.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {interviewerStatus.description}
                </p>
              </div>
            </div>

            {/* USER CAMERA FLOATING PREVIEW */}

            <div className="absolute bottom-5 right-5 z-20 w-32 overflow-hidden rounded-2xl border-2 border-white bg-slate-950 shadow-xl sm:bottom-7 sm:right-7 sm:w-44">
              <div className="relative aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
                />

                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-[10px] text-white/70">
                      Camera
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  You
                </div>

                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                  <Video className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-2">
                <span className="text-[10px] font-semibold text-slate-700">
                  Camera preview
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cameraOn ? "bg-blue-500" : "bg-slate-300"
                  }`}
                />
              </div>
            </div>

            {/* Recording badge */}

            {recording && (
              <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 rounded-full border border-red-100 bg-white/90 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm backdrop-blur sm:bottom-7 sm:left-7">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                REC {formatTime(recSeconds)}
              </div>
            )}
          </div>

          {/* LIVE TRANSCRIPT */}

          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  listening
                    ? "bg-blue-50 text-blue-600"
                    : speaking
                      ? "bg-indigo-50 text-indigo-600"
                      : loading
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-100 text-slate-500"
                }`}
              >
                {listening ? (
                  <Mic className="h-5 w-5" />
                ) : speaking ? (
                  <Volume2 className="h-5 w-5" />
                ) : loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Waves className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {listening
                      ? "Your answer"
                      : speaking
                        ? "AI interviewer"
                        : loading
                          ? "Processing"
                          : "Interview status"}
                  </p>

                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {listening
                      ? "Live transcription"
                      : speaking
                        ? "Voice output"
                        : loading
                          ? "Generating"
                          : "Live session"}
                  </span>
                </div>

                <p className="mt-1 min-h-6 text-sm leading-6 text-slate-600">
                  {transcript ||
                    (listening
                      ? "I'm listening. Start speaking when you're ready..."
                      : speaking
                        ? "Please listen to the question."
                        : loading
                          ? "Gemini is preparing your next question..."
                          : "Your interview is ready.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------
            CONVERSATION PANEL
        -------------------------------------------------- */}

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Conversation header */}

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Interview conversation
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Questions and your responses
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>

          {/* Messages */}

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                  <Brain className="h-7 w-7 text-indigo-600" />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  Preparing your interview
                </p>

                <p className="mt-2 max-w-[230px] text-xs leading-5 text-slate-500">
                  Gemini is preparing your first personalized teaching interview question.
                </p>

                <Loader2 className="mt-5 h-5 w-5 animate-spin text-indigo-500" />
              </div>
            )}

            {messages.map((message, index) => {
              const isAI = message.role === "assistant";

              return (
                <div
                  key={`${index}-${message.role}`}
                  className={`flex gap-2.5 ${
                    isAI ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAI && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      <Brain className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 ${
                      isAI
                        ? "rounded-tl-sm bg-slate-100 text-slate-800"
                        : "rounded-tr-sm bg-indigo-600 text-white"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                      {isAI ? "AI interviewer" : "You"}
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                    <p className="mt-2 text-right text-[10px] opacity-50">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {!isAI && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Mic className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Gemini thinking indicator */}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Brain className="h-4 w-4" />
                </div>

                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" />
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      Gemini is preparing the next question...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Conversation footer */}

          <div className="shrink-0 border-t border-slate-100 p-4">
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                listening
                  ? "border-blue-200 bg-blue-50"
                  : speaking
                    ? "border-indigo-100 bg-indigo-50"
                    : loading
                      ? "border-amber-100 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  listening
                    ? "bg-blue-100 text-blue-600"
                    : speaking
                      ? "bg-indigo-100 text-indigo-600"
                      : loading
                        ? "bg-amber-100 text-amber-600"
                        : "bg-slate-200 text-slate-500"
                }`}
              >
                {listening ? (
                  <Mic className="h-5 w-5" />
                ) : speaking ? (
                  <Volume2 className="h-5 w-5" />
                ) : loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">
                  {listening
                    ? "Microphone is active"
                    : speaking
                      ? "AI is asking a question"
                      : loading
                        ? "Gemini is processing"
                        : "Waiting for your turn"}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {listening
                    ? "Your answer will be submitted automatically."
                    : speaking
                      ? "Listen carefully to the question."
                      : loading
                        ? "Please wait for the next question."
                        : "Speak naturally when the interviewer finishes."}
                </p>
              </div>

              {listening && (
                <AudioLines className="h-5 w-5 shrink-0 animate-pulse text-blue-600" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              Voice-only interview · Automatic answer detection
            </div>
          </div>
        </section>
      </div>

      {/* --------------------------------------------------
          BOTTOM CONTROL BAR
      -------------------------------------------------- */}

      <footer className="z-20 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />

          <span className="hidden sm:inline">
            Your interview is being recorded securely.
          </span>

          <span className="sm:hidden">Recording active</span>
        </div>

        <button
          type="button"
          onClick={finishInterview}
          disabled={
            loading ||
            finishingRef.current ||
            !interviewId
          }
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PhoneOff className="h-4 w-4" />
          )}

          End interview
        </button>
      </footer>

      {/* --------------------------------------------------
          ERROR NOTIFICATION
      -------------------------------------------------- */}

      {error && step === "live" && (
        <div
          role="alert"
          className="absolute bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-start gap-2 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700 shadow-xl"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="text-red-400 transition hover:text-red-700"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}