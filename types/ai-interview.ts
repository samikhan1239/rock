export type Step =
  | "ready"
  | "live"
  | "submitting"
  | "evaluating"
  | "results";

export type SubmissionStage =
  | "recording"
  | "uploading"
  | "submitting"
  | "evaluating"
  | "completed";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface InterviewResult {
  subjectKnowledge: number | null;
  communication: number | null;
  explanationSkills: number | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  fullReport?: unknown;
}

export interface AIInterviewState {
  step: Step;
  messages: Message[];
  loading: boolean;
  listening: boolean;
  speaking: boolean;
  recording: boolean;
  cameraOn: boolean;
  transcript: string;
  statusText: string;
  error: string;
  recSeconds: number;
  evaluation: InterviewResult | null;
  submissionStage: SubmissionStage;
  uploadProgress: number;
  evaluationTimedOut: boolean;
}