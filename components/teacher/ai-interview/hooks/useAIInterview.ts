"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  InterviewResult,
  Message,
  Step,
  SubmissionStage,
} from "@/types/ai-interview";

const MAX_RECORDING_SIZE = 45 * 1024 * 1024;
const MAX_EVALUATION_ATTEMPTS = 60;
const EVALUATION_POLL_INTERVAL = 5000;
const ANSWER_SILENCE_DELAY = 2200;

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
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
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useAIInterview() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [step, setStep] = useState<Step>("ready");

  const [messages, setMessages] = useState<Message[]>([]);

  const [interviewId, setInterviewId] = useState<string | null>(
    null
  );

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

  const [submissionStage, setSubmissionStage] =
    useState<SubmissionStage>("recording");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [evaluationTimedOut, setEvaluationTimedOut] =
    useState(false);

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const videoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);

  const chunksRef = useRef<Blob[]>([]);

  const recordingBlobRef = useRef<Blob | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const answerTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const evaluationTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");

  const processingAnswerRef = useRef(false);
  const finishingRef = useRef(false);
  const mountedRef = useRef(true);

  const evaluationAttemptsRef = useRef(0);

  // --------------------------------------------------
  // API HELPER
  // --------------------------------------------------

  const interviewAPI = useCallback(
    async (body: Record<string, unknown>) => {
      const response = await fetch(
        "/api/teacher/ai-interview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Something went wrong."
        );
      }

      return data;
    },
    []
  );

  // --------------------------------------------------
  // ADD MESSAGE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // SPEECH SYNTHESIS
  // --------------------------------------------------

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (
          typeof window === "undefined" ||
          !window.speechSynthesis
        ) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "en-IN";
        utterance.rate = 0.94;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();

        const voice =
          voices.find((item) => item.lang === "en-IN") ||
          voices.find((item) => item.lang.startsWith("en"));

        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          if (mountedRef.current) {
            setSpeaking(true);
            setStatusText("AI interviewer is speaking");
          }
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
    },
    []
  );

  // --------------------------------------------------
  // STOP SPEECH RECOGNITION
  // --------------------------------------------------

  const stopMic = useCallback(() => {
    if (answerTimerRef.current) {
      clearTimeout(answerTimerRef.current);
      answerTimerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;

      try {
        recognitionRef.current.abort();
      } catch {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
    }

    setListening(false);
  }, []);

  // --------------------------------------------------
  // SUBMIT VOICE ANSWER
  // --------------------------------------------------

  const submitVoiceAnswer = useCallback(
    async (answer: string) => {
      const cleanAnswer = answer.trim();

      if (
        !cleanAnswer ||
        !interviewId ||
        processingAnswerRef.current ||
        finishingRef.current
      ) {
        return;
      }

      processingAnswerRef.current = true;

      stopMic();

      setTranscript("");
      setLoading(true);
      setStatusText("AI interviewer is thinking");

      addMessage("user", cleanAnswer);

      try {
        const data = await interviewAPI({
          action: "chat",
          interviewId,
          message: cleanAnswer,
        });

        const nextMessage = data.message;

        if (!nextMessage) {
          throw new Error(
            "The interviewer did not return a response."
          );
        }

        addMessage("assistant", nextMessage);

        await speak(nextMessage);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to submit your answer."
        );

        // Preserve the answer so the user can retry.
        setTranscript(cleanAnswer);
      } finally {
        processingAnswerRef.current = false;
        setLoading(false);
      }
    },
    [
      interviewId,
      stopMic,
      addMessage,
      interviewAPI,
      speak,
    ]
  );

  // --------------------------------------------------
  // START SPEECH RECOGNITION
  // --------------------------------------------------

  const startMic = useCallback(() => {
    if (
      typeof window === "undefined" ||
      recognitionRef.current ||
      processingAnswerRef.current ||
      finishingRef.current ||
      step !== "live"
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalText = finalTranscriptRef.current;
      let interimText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += `${text} `;
        } else {
          interimText += text;
        }
      }

      finalTranscriptRef.current = finalText;
      interimTranscriptRef.current = interimText;

      const completeTranscript =
        `${finalText} ${interimText}`.trim();

      setTranscript(completeTranscript);

      if (answerTimerRef.current) {
        clearTimeout(answerTimerRef.current);
      }

      if (completeTranscript.trim()) {
        answerTimerRef.current = setTimeout(() => {
          const answer = finalTranscriptRef.current.trim();

          if (answer) {
            finalTranscriptRef.current = "";
            interimTranscriptRef.current = "";

            void submitVoiceAnswer(answer);
          }
        }, ANSWER_SILENCE_DELAY);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Please enable microphone access."
        );
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      setListening(false);

      // Do not restart automatically here. The interview
      // workflow decides when recognition should resume.
    };

    try {
      recognition.start();
      setListening(true);
      setStatusText("Listening to your answer");
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }, [step, submitVoiceAnswer]);

  // --------------------------------------------------
  // START RECORDER
  // --------------------------------------------------

  const startRecorder = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    recordingBlobRef.current = null;

    const preferredMimeTypes = [
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ];

    const mimeType = preferredMimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type)
    );

    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 600000,
      audioBitsPerSecond: 48000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      recordingBlobRef.current = new Blob(
        chunksRef.current,
        {
          type: recorder.mimeType || "video/webm",
        }
      );
    };

    recorderRef.current = recorder;

    recorder.start(1000);

    setRecording(true);
    setRecSeconds(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setRecSeconds((previous) => previous + 1);
    }, 1000);
  }, []);

  // --------------------------------------------------
  // STOP RECORDER
  // --------------------------------------------------

  const stopRecorder = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;

    if (!recorder) {
      return recordingBlobRef.current;
    }

    if (recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), {
          once: true,
        });

        recorder.stop();
      });
    }

    setRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return recordingBlobRef.current;
  }, []);

  // --------------------------------------------------
  // CAMERA PREVIEW
  // --------------------------------------------------

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      void videoRef.current.play().catch(() => {
        // Browser may require user interaction.
      });
    }
  }, [cameraOn, step]);

  // --------------------------------------------------
  // BEGIN INTERVIEW
  // --------------------------------------------------

  const beginInterview = useCallback(async () => {
    setError("");
    setLoading(true);
    setStatusText("Preparing your interview room");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera and microphone access is unavailable in this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
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

      setCameraOn(true);

      const data = await interviewAPI({
        action: "start",
      });

      if (!data.interviewId || !data.message) {
        throw new Error(
          "Unable to initialize the interview."
        );
      }

      setInterviewId(data.interviewId);

      setMessages([
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);

      setStep("live");

      startRecorder(stream);

      setLoading(false);

      await speak(data.message);

      startMic();
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      setCameraOn(false);
      setStep("ready");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start your interview."
      );

      setLoading(false);
    }
  }, [
    interviewAPI,
    startRecorder,
    speak,
    startMic,
  ]);

  // --------------------------------------------------
  // CLEANUP MEDIA
  // --------------------------------------------------

  const cleanupMedia = useCallback(() => {
    stopMic();

    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    setCameraOn(false);
    setRecording(false);
    setSpeaking(false);
    setListening(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (evaluationTimerRef.current) {
      clearTimeout(evaluationTimerRef.current);
      evaluationTimerRef.current = null;
    }

    if (answerTimerRef.current) {
      clearTimeout(answerTimerRef.current);
      answerTimerRef.current = null;
    }
  }, [stopMic]);

  // --------------------------------------------------
  // UPLOAD RECORDING
  // --------------------------------------------------

  const uploadRecording = useCallback(
    async (blob: Blob) => {
      if (!interviewId) {
        throw new Error("Interview ID is missing.");
      }

      if (blob.size > MAX_RECORDING_SIZE) {
        throw new Error(
          "Recording is larger than the 45 MB limit."
        );
      }

      const formData = new FormData();

      formData.append("video", blob, "interview.webm");
      formData.append("interviewId", interviewId);
      formData.append(
        "recordingDuration",
        String(recSeconds)
      );

      setSubmissionStage("uploading");
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<void>(
        (resolve, reject) => {
          xhr.open(
            "POST",
            "/api/teacher/ai-interview/upload"
          );

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(
                Math.round(
                  (event.loaded / event.total) * 100
                )
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let message = "Recording upload failed.";

              try {
                const response = JSON.parse(xhr.responseText);
                message = response.error || message;
              } catch {
                // Keep fallback message.
              }

              reject(new Error(message));
            }
          };

          xhr.onerror = () => {
            reject(
              new Error("Network error while uploading recording.")
            );
          };

          xhr.onabort = () => {
            reject(new Error("Recording upload was cancelled."));
          };

          xhr.send(formData);
        }
      );

      await uploadPromise;
    },
    [interviewId, recSeconds]
  );

  // --------------------------------------------------
  // EVALUATION POLLING
  // --------------------------------------------------

  const checkEvaluation = useCallback(
    async (attempt = 0) => {
      if (!interviewId || !mountedRef.current) {
        return;
      }

      evaluationAttemptsRef.current = attempt;

      try {
        const response = await fetch(
          `/api/teacher/ai-interview?action=evaluation&interviewId=${encodeURIComponent(
            interviewId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to check evaluation."
          );
        }

        if (data.result) {
          setEvaluation(data.result);
          setSubmissionStage("completed");
          setStep("results");
          return;
        }

        if (attempt >= MAX_EVALUATION_ATTEMPTS - 1) {
          setEvaluationTimedOut(true);
          return;
        }

        evaluationTimerRef.current = setTimeout(() => {
          // eslint-disable-next-line react-hooks/immutability
          void checkEvaluation(attempt + 1);
        }, EVALUATION_POLL_INTERVAL);
      } catch (err) {
        if (attempt >= MAX_EVALUATION_ATTEMPTS - 1) {
          setEvaluationTimedOut(true);
          return;
        }

        evaluationTimerRef.current = setTimeout(() => {
          void checkEvaluation(attempt + 1);
        }, EVALUATION_POLL_INTERVAL);
      }
    },
    [interviewId]
  );

  // --------------------------------------------------
  // SUBMIT INTERVIEW
  // --------------------------------------------------

  const submitInterview = useCallback(async () => {
    if (!interviewId || finishingRef.current) {
      return;
    }

    finishingRef.current = true;

    setError("");
    setStep("submitting");
    setSubmissionStage("recording");

    try {
      stopMic();

      const blob = await stopRecorder();

      if (!blob || blob.size === 0) {
        throw new Error(
          "No interview recording was found. Please try again."
        );
      }

      await uploadRecording(blob);

      setSubmissionStage("submitting");

      await interviewAPI({
        action: "finish",
        interviewId,
      });

      cleanupMedia();

      setSubmissionStage("evaluating");
      setStep("evaluating");

      evaluationAttemptsRef.current = 0;
      setEvaluationTimedOut(false);

      void checkEvaluation(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your interview."
      );

      setStep("submitting");
    } finally {
      finishingRef.current = false;
    }
  }, [
    interviewId,
    stopMic,
    stopRecorder,
    uploadRecording,
    interviewAPI,
    cleanupMedia,
    checkEvaluation,
  ]);

  // --------------------------------------------------
  // FINISH INTERVIEW
  // --------------------------------------------------

  const finishInterview = useCallback(async () => {
    if (finishingRef.current) return;

    finishingRef.current = true;

    stopMic();

    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    setSpeaking(false);

    // Allow submitInterview to acquire its own guard.
    finishingRef.current = false;

    await submitInterview();
  }, [stopMic, submitInterview]);

  // --------------------------------------------------
  // RETRY SUBMISSION
  // --------------------------------------------------

  const retrySubmission = useCallback(async () => {
    if (!interviewId) return;

    setError("");

    try {
      setStep("submitting");

      // If the recording is already available, retry upload.
      if (recordingBlobRef.current) {
        await uploadRecording(recordingBlobRef.current);
      }

      setSubmissionStage("submitting");

      await interviewAPI({
        action: "finish",
        interviewId,
      });

      cleanupMedia();

      setSubmissionStage("evaluating");
      setStep("evaluating");

      setEvaluationTimedOut(false);

      void checkEvaluation(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your interview."
      );
    }
  }, [
    interviewId,
    uploadRecording,
    interviewAPI,
    cleanupMedia,
    checkEvaluation,
  ]);

  // --------------------------------------------------
  // RETRY EVALUATION
  // --------------------------------------------------

  const retryEvaluation = useCallback(() => {
    setError("");
    setEvaluationTimedOut(false);

    if (evaluationTimerRef.current) {
      clearTimeout(evaluationTimerRef.current);
    }

    setStep("evaluating");
    void checkEvaluation(0);
  }, [checkEvaluation]);

  // --------------------------------------------------
  // DISMISS ERROR
  // --------------------------------------------------

  const dismissError = useCallback(() => {
    setError("");
  }, []);

  // --------------------------------------------------
  // UNMOUNT CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      cleanupMedia();

      if (evaluationTimerRef.current) {
        clearTimeout(evaluationTimerRef.current);
      }
    };
  }, [cleanupMedia]);

  // --------------------------------------------------
  // RETURN
  // --------------------------------------------------

  return {
    step,
    messages,
    loading,
    listening,
    speaking,
    recording,
    cameraOn,
    transcript,
    statusText,
    error,
    recSeconds,
    evaluation,
    submissionStage,
    uploadProgress,
    evaluationTimedOut,

    videoRef,
    beginInterview,
    finishInterview,
    retrySubmission,
    retryEvaluation,
    dismissError,
  };
}