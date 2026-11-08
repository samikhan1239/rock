"use client";

import { useAIInterview } from "./hooks/useAIInterview";

import ReadyScreen from "./screens/ReadyScreen";
import LiveInterviewRoom from "./screens/LiveInterviewRoom";
import SubmissionScreen from "./screens/SubmissionScreen";
import EvaluationScreen from "./screens/EvaluationScreen";
import ResultsScreen from "./screens/ResultScreen";

export default function AIInterviewPage() {
  const interview = useAIInterview();

  switch (interview.step) {
    case "ready":
      return (
        <ReadyScreen
          loading={interview.loading}
          error={interview.error}
          onStart={interview.beginInterview}
        />
      );

    case "live":
      return (
        <LiveInterviewRoom
          messages={interview.messages}
          transcript={interview.transcript}
          statusText={interview.statusText}
          listening={interview.listening}
          speaking={interview.speaking}
          loading={interview.loading}
          recording={interview.recording}
          cameraOn={interview.cameraOn}
          recSeconds={interview.recSeconds}
          error={interview.error}
          videoRef={interview.videoRef}
          onFinish={interview.finishInterview}
          onDismissError={interview.dismissError}
        />
      );

    case "submitting":
      return (
        <SubmissionScreen
          stage={interview.submissionStage}
          progress={interview.uploadProgress}
          error={interview.error}
          onRetry={interview.retrySubmission}
        />
      );

    case "evaluating":
      return (
        <EvaluationScreen
          timedOut={interview.evaluationTimedOut}
          error={interview.error}
          onRetry={interview.retryEvaluation}
        />
      );

    case "results":
      return (
        <ResultsScreen
          evaluation={interview.evaluation}
        />
      );

    default:
      return null;
  }
}