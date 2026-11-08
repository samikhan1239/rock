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
  AudioLines,
  Brain,
  CameraOff,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Mic,
  PhoneOff,
  ShieldCheck,
  UserRound,
  Video,
  Volume2,
  Waves,
  XCircle,
} from "lucide-react";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResult = ArrayLike<SpeechRecognitionResultItem> & {
  isFinal: boolean;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type LocalSpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;

  onend: (() => void) | null;

  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => LocalSpeechRecognitionInstance;

type InterviewQuestion = {
  id: string;
  title: string;
  message: string;
};

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const ANSWER_SILENCE_DELAY = 2500;

const MIC_RESTART_DELAY = 400;
const MIC_START_DELAY = 500;

const THINKING_DELAY = 900;

// Fixed questions. No Gemini request is made to generate questions.

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "introduction",
    title: "Self Introduction",
    message:
      "Hello! Welcome to your TutorSathi teaching assessment. Please introduce yourself, tell us about your educational background, and explain why you want to become a teacher.",
  },
  {
    id: "subjects",
    title: "Subjects & Classes",
    message:
      "Which subjects can you teach confidently, and which school classes are you comfortable teaching?",
  },
  {
    id: "experience",
    title: "Teaching Approach",
    message:
      "Have you taught anyone before? If not, how would you make a difficult topic easy for a school student to understand?",
  },
  {
    id: "demonstration",
    title: "Teaching Demonstration",
    message:
      "Now choose one topic from your preferred subject and teach it as if you are teaching a school student. Use simple explanations and practical examples. Explain it naturally, just as you would in a real classroom.",
  },
  {
    id: "engagement",
    title: "Student Engagement",
    message:
      "Finally, how would you help a student who is struggling to understand your explanation or repeatedly making mistakes?",
  },
];

// --------------------------------------------------
// PROPS
// --------------------------------------------------

interface AIInterviewRoomProps {
  interviewId: string | null;

  messages: Message[];

  onAddMessage: (
    role: "user" | "assistant",
    content: string
  ) => void;

  onFinishInterview: (
    transcript?: string
  ) => void | Promise<void>;

  loading: boolean;
  setLoading: (v: boolean) => void;

  speaking: boolean;
  setSpeaking: (v: boolean) => void;

  statusText: string;
  setStatusText: (text: string) => void;

  error: string;
  setError: (msg: string) => void;

  recording: boolean;
  recSeconds: number;

  cameraOn: boolean;

  videoRef: React.RefObject<HTMLVideoElement | null>;

  onSubmitAnswer?: (answer: string) => Promise<void>;

  speak: (text: string) => Promise<void>;
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function AIInterviewRoom({
  interviewId,
  messages,
  onAddMessage,
  onFinishInterview,
  loading,
  setLoading,
  speaking,
  setSpeaking,
  statusText,
  setStatusText,
  error,
  setError,
  recording,
  recSeconds,
  cameraOn,
  videoRef,
  speak,
}: AIInterviewRoomProps) {
  const router = useRouter();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [listening, setListening] = useState(false);

  const [transcript, setTranscript] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(-1);

  const [finishing, setFinishing] = useState(false);

  const [cameraPreviewReady, setCameraPreviewReady] =
    useState(false);

  const [cameraPreviewError, setCameraPreviewError] =
    useState("");

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const recognitionRef =
    useRef<LocalSpeechRecognitionInstance | null>(null);

  const recognitionActiveRef = useRef(false);

  const shouldListenRef = useRef(false);

  const mountedRef = useRef(false);

  const finishTriggeredRef = useRef(false);

  const advancingRef = useRef(false);

  const speakingRef = useRef(speaking);

  const loadingRef = useRef(loading);

  const finalTranscriptRef = useRef("");

  const interimTranscriptRef = useRef("");

  const completeTranscriptRef = useRef("");

  const currentQuestionIndexRef = useRef(-1);

  const micRestartTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const micStartTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const answerSilenceTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const thinkingTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const startMicRef = useRef<() => void>(() => {});

  const playQuestionRef = useRef<
    (index: number) => Promise<void>
  >(async () => {});

  const advanceAnswerRef = useRef<() => void>(() => {});

  const finishInterviewRef = useRef<
    (finalAnswer?: boolean) => Promise<void>
  >(async () => {});

  const finishCallbackRef = useRef(onFinishInterview);

  const addMessageRef = useRef(onAddMessage);

  const speakRef = useRef(speak);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const localCameraStreamRef = useRef<MediaStream | null>(null);

  // --------------------------------------------------
  // SYNC PROPS
  // --------------------------------------------------

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    finishCallbackRef.current = onFinishInterview;
  }, [onFinishInterview]);

  useEffect(() => {
    addMessageRef.current = onAddMessage;
  }, [onAddMessage]);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatTime = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, seconds);

    const minutes = Math.floor(safeSeconds / 60);

    const remaining = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }, []);

  const clearMicTimers = useCallback(() => {
    if (micRestartTimerRef.current) {
      clearTimeout(micRestartTimerRef.current);
      micRestartTimerRef.current = null;
    }

    if (micStartTimerRef.current) {
      clearTimeout(micStartTimerRef.current);
      micStartTimerRef.current = null;
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (answerSilenceTimerRef.current) {
      clearTimeout(answerSilenceTimerRef.current);
      answerSilenceTimerRef.current = null;
    }
  }, []);

  const clearThinkingTimer = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  const getCurrentAnswer = useCallback(() => {
    return [
      finalTranscriptRef.current.trim(),
      interimTranscriptRef.current.trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  }, []);

  // --------------------------------------------------
  // STOP MICROPHONE
  // --------------------------------------------------

  const stopMic = useCallback(() => {
    shouldListenRef.current = false;

    clearMicTimers();

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }

    recognitionActiveRef.current = false;

    setListening(false);
  }, [clearMicTimers]);

  // --------------------------------------------------
  // FINALIZE CURRENT ANSWER
  // --------------------------------------------------

  const finalizeCurrentAnswer = useCallback(() => {
    clearSilenceTimer();

    const answer = getCurrentAnswer();

    if (!answer) {
      return "";
    }

    const question =
      INTERVIEW_QUESTIONS[currentQuestionIndexRef.current];

    const formattedAnswer = question
      ? `${question.title}: ${answer}`
      : answer;

    completeTranscriptRef.current +=
      `${formattedAnswer}\n\n`;

    addMessageRef.current("user", answer);

    finalTranscriptRef.current = "";

    interimTranscriptRef.current = "";

    setTranscript("");

    return answer;
  }, [clearSilenceTimer, getCurrentAnswer]);

  // --------------------------------------------------
  // FINISH INTERVIEW
  // --------------------------------------------------

  const finishInterview = useCallback(
    async (finalAnswer = true) => {
      if (finishTriggeredRef.current) return;

      finishTriggeredRef.current = true;

      advancingRef.current = true;

      setFinishing(true);

      stopMic();

      clearSilenceTimer();

      clearThinkingTimer();

      if (finalAnswer) {
        finalizeCurrentAnswer();
      }

      const finalTranscript =
        completeTranscriptRef.current.trim();

      setSpeaking(false);

      speakingRef.current = false;

      setLoading(false);

      loadingRef.current = false;

      setStatusText("Completing your teaching assessment...");

      try {
        // Submit the completed interview.
        await finishCallbackRef.current(finalTranscript);

        // Stop the local camera stream before leaving.
        if (localCameraStreamRef.current) {
          localCameraStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          localCameraStreamRef.current = null;
        }

        // Redirect only after successful completion.
        router.replace("/teacher/onboarding?step=5");

        router.refresh();
      } catch (err) {
        console.error("Interview finish failed:", err);

        finishTriggeredRef.current = false;

        advancingRef.current = false;

        setFinishing(false);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to finish your interview. Please try again."
        );

        setStatusText("Unable to finish interview.");
      }
    },
    [
      router,
      stopMic,
      clearSilenceTimer,
      clearThinkingTimer,
      finalizeCurrentAnswer,
      setSpeaking,
      setLoading,
      setStatusText,
      setError,
    ]
  );

  useEffect(() => {
    finishInterviewRef.current = finishInterview;
  }, [finishInterview]);

  // --------------------------------------------------
  // ADVANCE TO NEXT QUESTION
  // --------------------------------------------------

  const advanceAnswer = useCallback(() => {
    if (
      !mountedRef.current ||
      finishTriggeredRef.current ||
      advancingRef.current
    ) {
      return;
    }

    const answer = getCurrentAnswer();

    if (!answer) return;

    advancingRef.current = true;

    clearSilenceTimer();

    finalizeCurrentAnswer();

    const nextIndex = currentQuestionIndexRef.current + 1;

    // All predefined questions have been answered.
    if (nextIndex >= INTERVIEW_QUESTIONS.length) {
      void finishInterviewRef.current(false);

      return;
    }

    // Ask the next predefined question.
    void playQuestionRef.current(nextIndex);
  }, [
    getCurrentAnswer,
    clearSilenceTimer,
    finalizeCurrentAnswer,
  ]);

  useEffect(() => {
    advanceAnswerRef.current = advanceAnswer;
  }, [advanceAnswer]);

  // --------------------------------------------------
  // START MICROPHONE
  // --------------------------------------------------

  const startMic = useCallback(() => {
    if (
      !mountedRef.current ||
      finishTriggeredRef.current ||
      !interviewId ||
      speakingRef.current ||
      loadingRef.current ||
      recognitionActiveRef.current
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
        "Voice recognition is not supported. Please use the latest Google Chrome or Microsoft Edge."
      );

      return;
    }

    clearMicTimers();

    const recognition = new RecognitionAPI();

    recognition.lang = "en-IN";

    recognition.continuous = true;

    recognition.interimResults = true;

    recognitionRef.current = recognition;

    shouldListenRef.current = true;

    // SPEECH RESULT

    recognition.onresult = (event) => {
      if (
        !mountedRef.current ||
        finishTriggeredRef.current ||
        advancingRef.current ||
        !shouldListenRef.current ||
        speakingRef.current
      ) {
        return;
      }

      let currentInterim = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];

        const spokenText =
          result[0]?.transcript?.trim();

        if (!spokenText) continue;

        if (result.isFinal) {
          finalTranscriptRef.current += `${spokenText} `;
        } else {
          currentInterim += `${spokenText} `;
        }
      }

      interimTranscriptRef.current =
        currentInterim.trim();

      const combinedTranscript = getCurrentAnswer();

      if (!combinedTranscript) return;

      setTranscript(combinedTranscript);

      clearSilenceTimer();

      answerSilenceTimerRef.current = setTimeout(() => {
        if (
          mountedRef.current &&
          !finishTriggeredRef.current &&
          !advancingRef.current &&
          !speakingRef.current
        ) {
          advanceAnswerRef.current();
        }
      }, ANSWER_SILENCE_DELAY);
    };

    // SPEECH ERROR

    recognition.onerror = (event) => {
      if (
        event.error === "no-speech" ||
        event.error === "aborted"
      ) {
        return;
      }

      if (event.error === "not-allowed") {
        shouldListenRef.current = false;

        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (event.error === "audio-capture") {
        shouldListenRef.current = false;

        setError(
          "No microphone was detected. Please connect a microphone."
        );
      } else if (event.error === "network") {
        setError(
          "Speech recognition encountered a network error. Your video recording can still continue."
        );
      }

      setListening(false);
    };

    // RECOGNITION ENDED

    recognition.onend = () => {
      recognitionActiveRef.current = false;

      if (
        !mountedRef.current ||
        finishTriggeredRef.current ||
        !shouldListenRef.current
      ) {
        setListening(false);

        return;
      }

      if (
        speakingRef.current ||
        advancingRef.current
      ) {
        setListening(false);

        return;
      }

      micRestartTimerRef.current = setTimeout(() => {
        if (
          mountedRef.current &&
          !finishTriggeredRef.current &&
          !advancingRef.current &&
          shouldListenRef.current &&
          !speakingRef.current
        ) {
          startMicRef.current();
        }
      }, MIC_RESTART_DELAY);
    };

    // START RECOGNITION

    try {
      recognition.start();

      recognitionActiveRef.current = true;

      setListening(true);

      setError("");

      setStatusText("Listening to your teaching response...");
    } catch {
      recognitionActiveRef.current = false;

      setListening(false);
    }
  }, [
    interviewId,
    clearMicTimers,
    clearSilenceTimer,
    getCurrentAnswer,
    setError,
    setStatusText,
  ]);

  useEffect(() => {
    startMicRef.current = startMic;
  }, [startMic]);

  // --------------------------------------------------
  // PLAY PREDEFINED QUESTION
  // --------------------------------------------------

  const playQuestion = useCallback(
    async (index: number) => {
      if (
        !mountedRef.current ||
        finishTriggeredRef.current
      ) {
        return;
      }

      const question = INTERVIEW_QUESTIONS[index];

      if (!question) return;

      // Prevent duplicate playback.
      if (currentQuestionIndexRef.current >= index) {
        return;
      }

      currentQuestionIndexRef.current = index;

      setCurrentQuestionIndex(index);

      advancingRef.current = false;

      stopMic();

      clearSilenceTimer();

      clearMicTimers();

      // THINKING TRANSITION

      setSpeaking(false);

      speakingRef.current = false;

      setLoading(true);

      loadingRef.current = true;

      setError("");

      setStatusText("Preparing the next question...");

      // Visual transition only. No Gemini request.
      await new Promise<void>((resolve) => {
        thinkingTimerRef.current = setTimeout(
          resolve,
          THINKING_DELAY
        );
      });

      thinkingTimerRef.current = null;

      if (
        !mountedRef.current ||
        finishTriggeredRef.current
      ) {
        return;
      }

      setLoading(false);

      loadingRef.current = false;

      setSpeaking(true);

      speakingRef.current = true;

      setStatusText(`Asking: ${question.title}`);

      // Add the current question to the conversation.
      addMessageRef.current("assistant", question.message);

      // SPEAK QUESTION

      try {
        await speakRef.current(question.message);
      } catch (err) {
        console.error("Question speech failed:", err);

        setError(
          "Voice playback failed. Please read the displayed question and continue."
        );
      } finally {
        if (
          mountedRef.current &&
          !finishTriggeredRef.current
        ) {
          setSpeaking(false);

          speakingRef.current = false;

          setStatusText(
            "Please answer naturally. I'm listening."
          );

          micStartTimerRef.current = setTimeout(() => {
            if (
              mountedRef.current &&
              !finishTriggeredRef.current &&
              !speakingRef.current &&
              !loadingRef.current
            ) {
              startMicRef.current();
            }
          }, MIC_START_DELAY);
        }
      }
    },
    [
      stopMic,
      clearSilenceTimer,
      clearMicTimers,
      setSpeaking,
      setLoading,
      setError,
      setStatusText,
    ]
  );

  useEffect(() => {
    playQuestionRef.current = playQuestion;
  }, [playQuestion]);

  // --------------------------------------------------
  // START INTERVIEW
  // --------------------------------------------------

  useEffect(() => {
    if (!interviewId) return;

    mountedRef.current = true;

    finishTriggeredRef.current = false;

    advancingRef.current = false;

    setFinishing(false);

    currentQuestionIndexRef.current = -1;

    setCurrentQuestionIndex(-1);

    finalTranscriptRef.current = "";

    interimTranscriptRef.current = "";

    completeTranscriptRef.current = "";

    setTranscript("");

    setError("");

    setLoading(false);

    setSpeaking(false);

    setStatusText("Preparing your teaching assessment...");

    // Start the first predefined question.
    void playQuestionRef.current(0);

    return () => {
      clearSilenceTimer();

      clearThinkingTimer();

      clearMicTimers();
    };
  }, [
    interviewId,
    clearSilenceTimer,
    clearThinkingTimer,
    clearMicTimers,
    setError,
    setLoading,
    setSpeaking,
    setStatusText,
  ]);

  // --------------------------------------------------
  // CAMERA PREVIEW
  // --------------------------------------------------

  useEffect(() => {
    if (!cameraOn) {
      setCameraPreviewReady(false);

      setCameraPreviewError("");

      return;
    }

    let cancelled = false;

    let ownedStream: MediaStream | null = null;

    const attachCamera = async () => {
      const video = videoRef.current;

      if (!video) return;

      try {
        setCameraPreviewError("");

        setCameraPreviewReady(false);

        let stream = video.srcObject as MediaStream | null;

        const hasActiveVideoTrack =
          stream?.getVideoTracks().some(
            (track) => track.readyState === "live"
          ) ?? false;

        if (!hasActiveVideoTrack) {
          if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error(
              "Camera access is unavailable. Please use HTTPS or localhost."
            );
          }

          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });

          ownedStream = stream;

          localCameraStreamRef.current = stream;

          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());

            return;
          }

          video.srcObject = stream;
        }

        if (cancelled) return;

        await video.play();

        if (!cancelled) {
          setCameraPreviewReady(true);

          setCameraPreviewError("");
        }
      } catch (err) {
        if (!cancelled) {
          setCameraPreviewReady(false);

          setCameraPreviewError(
            err instanceof Error
              ? err.message
              : "Unable to access your camera."
          );
        }
      }
    };

    void attachCamera();

    return () => {
      cancelled = true;

      if (ownedStream) {
        ownedStream.getTracks().forEach((track) => {
          track.stop();
        });

        if (videoRef.current?.srcObject === ownedStream) {
          videoRef.current.srcObject = null;
        }

        if (localCameraStreamRef.current === ownedStream) {
          localCameraStreamRef.current = null;
        }
      }
    };
  }, [cameraOn, videoRef]);

  // --------------------------------------------------
  // AI SPEAKING / LISTENING SYNC
  // --------------------------------------------------

  useEffect(() => {
    if (
      !interviewId ||
      finishTriggeredRef.current ||
      speaking ||
      loading
    ) {
      stopMic();

      return;
    }

    if (currentQuestionIndexRef.current < 0) {
      return;
    }

    clearMicTimers();

    micStartTimerRef.current = setTimeout(() => {
      if (
        mountedRef.current &&
        !finishTriggeredRef.current &&
        !advancingRef.current &&
        !speakingRef.current &&
        !loadingRef.current
      ) {
        startMicRef.current();
      }
    }, MIC_START_DELAY);

    return clearMicTimers;
  }, [
    interviewId,
    speaking,
    loading,
    stopMic,
    clearMicTimers,
  ]);

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, transcript]);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      shouldListenRef.current = false;

      clearMicTimers();

      clearSilenceTimer();

      clearThinkingTimer();

      try {
        recognitionRef.current?.abort();
      } catch {
        // Already stopped.
      }

      recognitionRef.current = null;

      recognitionActiveRef.current = false;

      if (localCameraStreamRef.current) {
        localCameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        localCameraStreamRef.current = null;
      }
    };
  }, [
    clearMicTimers,
    clearSilenceTimer,
    clearThinkingTimer,
  ]);

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------

  const currentQuestion =
    currentQuestionIndex >= 0 &&
    currentQuestionIndex < INTERVIEW_QUESTIONS.length
      ? INTERVIEW_QUESTIONS[currentQuestionIndex]
      : null;

  const completedQuestionCount = Math.min(
    currentQuestionIndex,
    INTERVIEW_QUESTIONS.length
  );

  const interviewerState = loading
    ? "thinking"
    : speaking
      ? "speaking"
      : listening
        ? "listening"
        : "waiting";

  const interviewerStatus = {
    speaking: {
      label: "AI interviewer is speaking",
      description: "Listen carefully to the question.",
      badge: "Speaking",
      color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },

    thinking: {
      label: "Preparing the next question",
      description: "Preparing the next part of your assessment.",
      badge: "Thinking",
      color: "bg-violet-50 text-violet-700 border-violet-100",
    },

    listening: {
      label: "Listening to your response",
      description: "Speak naturally. Your response is being recorded.",
      badge: "Listening",
      color: "bg-blue-50 text-blue-700 border-blue-100",
    },

    waiting: {
      label: "Your interviewer is ready",
      description: statusText,
      badge: "Ready",
      color: "bg-slate-50 text-slate-600 border-slate-200",
    },
  }[interviewerState];

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#F5F7FC]">
      {/* HEADER */}

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
              Interactive teaching assessment
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

      {/* WORKSPACE */}

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px]">
        {/* MAIN STAGE */}

        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="relative flex min-h-[340px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-indigo-100 bg-white px-4 py-7 shadow-sm sm:min-h-[420px] sm:px-8">
            {/* BACKGROUND */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

              <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.035)_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            {/* STAGE HEADER */}

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
                  <Brain className="h-3.5 w-3.5 animate-pulse" />
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
                className={`relative flex h-44 w-44 items-center justify-center transition-transform duration-500 sm:h-56 sm:w-56 ${
                  speaking ? "scale-[1.02]" : "scale-100"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                    loading
                      ? "animate-pulse border-violet-300"
                      : speaking
                        ? "animate-pulse border-indigo-300"
                        : listening
                          ? "border-blue-200"
                          : "border-indigo-100"
                  }`}
                />

                <div className="absolute inset-3 rounded-full border border-indigo-100" />

                <div
                  className={`absolute inset-7 rounded-full blur-2xl transition-all duration-500 ${
                    loading
                      ? "bg-violet-300/50"
                      : speaking
                        ? "bg-indigo-300/50"
                        : listening
                          ? "bg-blue-300/40"
                          : "bg-indigo-200/40"
                  }`}
                />

                <div
                  className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full shadow-xl transition-all duration-500 sm:h-36 sm:w-36 ${
                    loading
                      ? "bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-700 shadow-violet-500/30"
                      : speaking
                        ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-indigo-500/30"
                        : listening
                          ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 shadow-blue-500/30"
                          : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-indigo-500/20"
                  }`}
                >
                  {loading ? (
                    <Brain className="h-12 w-12 animate-pulse text-white sm:h-16 sm:w-16" />
                  ) : speaking ? (
                    <AudioLines className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  ) : listening ? (
                    <Mic className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  ) : (
                    <Brain className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                  )}
                </div>

                {(speaking || listening || loading) && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full border border-indigo-300/40 [animation-duration:2.5s]" />

                    <div className="absolute -inset-3 animate-pulse rounded-full border border-indigo-200/50" />
                  </>
                )}
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  AI Interviewer
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Your teaching assessment assistant
                </p>
              </div>

              {/* VOICE VISUALIZER */}

              <div className="mt-5 flex h-8 items-center justify-center gap-1.5">
                {Array.from({ length: 19 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      loading
                        ? "animate-pulse bg-violet-500"
                        : speaking
                          ? "animate-pulse bg-indigo-500"
                          : listening
                            ? "animate-pulse bg-blue-500"
                            : "bg-slate-200"
                    }`}
                    style={{
                      height:
                        speaking || listening || loading
                          ? `${10 + ((index * 7) % 17)}px`
                          : "5px",
                      animationDelay: `${index * 65}ms`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 max-w-md text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {interviewerStatus.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {interviewerStatus.description}
                </p>
              </div>
            </div>

            {/* CAMERA PREVIEW */}

            <div className="absolute bottom-5 right-5 z-20 w-32 overflow-hidden rounded-2xl border-2 border-white bg-slate-950 shadow-xl sm:bottom-7 sm:right-7 sm:w-44">
              <div className="relative aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={() => {
                    setCameraPreviewReady(true);
                  }}
                  className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
                />

                {(!cameraOn || !cameraPreviewReady) && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900 px-2 text-center text-white">
                    {cameraOn && !cameraPreviewError ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CameraOff className="h-5 w-5" />
                    )}

                    <span className="text-[10px] leading-4 text-white/80">
                      {!cameraOn
                        ? "Camera is off"
                        : cameraPreviewError
                          ? "Camera unavailable"
                          : "Connecting camera..."}
                    </span>
                  </div>
                )}

                {cameraPreviewError && cameraOn && (
                  <div className="absolute inset-x-1 bottom-1 z-20 rounded-md bg-red-950/90 px-2 py-1 text-center text-[9px] leading-3 text-red-100">
                    {cameraPreviewError}
                  </div>
                )}

                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      cameraOn && cameraPreviewReady
                        ? "bg-blue-400"
                        : "bg-slate-400"
                    }`}
                  />

                  You
                </div>

                <div className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                  <Video className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-2">
                <span className="text-[10px] font-semibold text-slate-700">
                  Camera preview
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cameraOn && cameraPreviewReady
                      ? "bg-blue-500"
                      : "bg-slate-300"
                  }`}
                />
              </div>
            </div>

            {/* RECORDING BADGE */}

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
                        ? "bg-violet-50 text-violet-600"
                        : "bg-slate-100 text-slate-500"
                }`}
              >
                {loading ? (
                  <Brain className="h-5 w-5 animate-pulse" />
                ) : listening ? (
                  <Mic className="h-5 w-5" />
                ) : speaking ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <Waves className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {loading
                      ? "Preparing next question"
                      : listening
                        ? "Your answer"
                        : speaking
                          ? "AI interviewer"
                          : "Interview status"}
                  </p>

                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {loading
                      ? "Thinking"
                      : listening
                        ? "Live transcription"
                        : speaking
                          ? "Voice output"
                          : "Live session"}
                  </span>
                </div>

                <p className="mt-1 min-h-6 text-sm leading-6 text-slate-600">
                  {loading
                    ? "Preparing the next question..."
                    : transcript ||
                      (listening
                        ? "I'm listening. Start speaking when you're ready..."
                        : speaking
                          ? "Please listen to the question."
                          : "Your interview is ready.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONVERSATION PANEL */}

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* PANEL HEADER */}

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Interview conversation
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your responses and the current question
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>

          {/* CURRENT QUESTION PROGRESS */}

          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">
                Assessment progress
              </span>

              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                {Math.max(0, completedQuestionCount)}/
                {INTERVIEW_QUESTIONS.length}
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${
                    (Math.max(0, completedQuestionCount) /
                      INTERVIEW_QUESTIONS.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* CONVERSATION HISTORY */}

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Your interview will begin shortly
                </p>

                <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-500">
                  The interviewer will ask one question at a time.
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={`${index}-${message.role}`}
                  className={`flex gap-2.5 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <Brain className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-3 ${
                      isAssistant
                        ? "rounded-tl-sm border border-indigo-100 bg-indigo-50/70"
                        : "rounded-tr-sm border border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                    }`}
                  >
                    <p
                      className={`mb-1 text-[10px] font-bold ${
                        isAssistant
                          ? "text-indigo-700"
                          : "text-indigo-100"
                      }`}
                    >
                      {isAssistant ? "TutorSathi AI" : "You"}
                    </p>

                    <p
                      className={`whitespace-pre-wrap text-xs leading-5 ${
                        isAssistant
                          ? "text-slate-700"
                          : "text-white"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>

                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <UserRound className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* THINKING INDICATOR */}

            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Brain className="h-4 w-4 animate-pulse" />
                </div>

                <div className="rounded-2xl rounded-tl-sm border border-violet-100 bg-violet-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-violet-800">
                      Preparing question
                    </span>

                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((item) => (
                        <span
                          key={item}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500"
                          style={{
                            animationDelay: `${item * 150}ms`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* CURRENT QUESTION ONLY */}

          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  {loading ? (
                    <Brain className="h-4 w-4 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>

                <p className="text-xs font-bold text-indigo-900">
                  {loading
                    ? "Preparing next question"
                    : currentQuestion?.title ?? "Assessment"}
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-indigo-800">
                {loading
                  ? "Please wait while the interviewer prepares the next question."
                  : currentQuestion
                    ? currentQuestion.message
                    : "Your interview questions will appear here."}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              One question at a time · Automatic progression
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM CONTROL BAR */}

      <footer className="z-20 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />

          <span className="hidden sm:inline">
            Your interview is being recorded securely.
          </span>

          <span className="sm:hidden">
            Recording active
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            void finishInterviewRef.current(true);
          }}
          disabled={!interviewId || finishing}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {finishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finishing...
            </>
          ) : (
            <>
              <PhoneOff className="h-4 w-4" />
              End interview
            </>
          )}
        </button>
      </footer>

      {/* ERROR TOAST */}

      {error && (
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