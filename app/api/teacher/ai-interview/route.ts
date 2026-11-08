import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

// =========================================
// CONFIGURATION
// =========================================

const INTERVIEW_DURATION_MINUTES = 5;
const MAX_INTERVIEW_DURATION_MS = 5 * 60 * 1000;
const MAX_INTERVIEW_QUESTIONS = 5;

const EVALUATION_MODEL = "gemini-3.6-flash";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type EvaluationResult = {
  subjectKnowledge: number;
  communication: number;
  explanationSkills: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
};

// =========================================
// FIXED INTERVIEW QUESTIONS
// =========================================

const INTERVIEW_QUESTIONS = [
  {
    stage: "introduction",
    question:
      "Hello! Welcome to TutorSathi. Please introduce yourself and briefly tell us about your educational background.",
  },
  {
    stage: "motivation",
    question:
      "What motivates you to become a teacher on TutorSathi, and why do you enjoy helping students learn?",
  },
  {
    stage: "subjects",
    question:
      "Which subjects and school classes are you comfortable teaching? Please briefly explain your strongest subject.",
  },
  {
    stage: "topic_selection",
    question:
      "Choose one topic from your strongest subject that you would like to teach. Tell us the topic and briefly explain why you selected it.",
  },
  {
    stage: "teaching_demonstration",
    question:
      "Now imagine I am a school student attending your class. Please teach me the topic you selected. Explain it step by step, use a simple example, and make it easy for a student to understand. You may begin!",
  },
] as const;

// =========================================
// GEMINI CONFIGURATION
// =========================================

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: EVALUATION_MODEL,
  });
}

// =========================================
// RESPONSE HELPER
// =========================================

const jsonResponse = (
  data: Record<string, unknown>,
  status = 200
) => {
  return NextResponse.json(data, { status });
};

// =========================================
// HISTORY HELPERS
// =========================================

function getHistory(
  rawResponses: unknown
): ChatMessage[] {
  if (
    !rawResponses ||
    typeof rawResponses !== "object"
  ) {
    return [];
  }

  const responses = rawResponses as {
    history?: unknown;
  };

  if (!Array.isArray(responses.history)) {
    return [];
  }

  return responses.history.filter(
    (message): message is ChatMessage => {
      if (
        !message ||
        typeof message !== "object"
      ) {
        return false;
      }

      const item = message as Record<
        string,
        unknown
      >;

      return (
        (item.role === "user" ||
          item.role === "assistant") &&
        typeof item.content === "string"
      );
    }
  );
}

function getQuestionCount(
  history: ChatMessage[]
): number {
  return history.filter(
    (message) => message.role === "assistant"
  ).length;
}

function getAnswerCount(
  history: ChatMessage[]
): number {
  return history.filter(
    (message) => message.role === "user"
  ).length;
}

// =========================================
// REMAINING TIME HELPER
// FIXED: SUPPORTS DATE | NULL
// =========================================

function getRemainingTime(
  startedAt: Date | null
) {
  // Missing start date means the interview
  // cannot safely continue.
  if (!startedAt) {
    return {
      elapsed: MAX_INTERVIEW_DURATION_MS,
      remaining: 0,
      expired: true,
      remainingSeconds: 0,
    };
  }

  const elapsed =
    Date.now() - startedAt.getTime();

  const remaining = Math.max(
    0,
    MAX_INTERVIEW_DURATION_MS - elapsed
  );

  return {
    elapsed,
    remaining,
    expired: remaining <= 0,
    remainingSeconds: Math.ceil(
      remaining / 1000
    ),
  };
}

// =========================================
// EVALUATION PARSING
// =========================================

function clampScore(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    10,
    Math.max(0, number)
  );
}

function parseEvaluation(
  text: string
): EvaluationResult {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error(
      "Gemini returned an invalid evaluation format."
    );
  }

  const parsed = JSON.parse(
    cleaned.slice(start, end + 1)
  );

  return {
    subjectKnowledge: clampScore(
      parsed.subjectKnowledge
    ),

    communication: clampScore(
      parsed.communication
    ),

    explanationSkills: clampScore(
      parsed.explanationSkills
    ),

    overallScore: clampScore(
      parsed.overallScore
    ),

    strengths: Array.isArray(
      parsed.strengths
    )
      ? parsed.strengths.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [],

    weaknesses: Array.isArray(
      parsed.weaknesses
    )
      ? parsed.weaknesses.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [],

    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Your interview evaluation has been completed.",
  };
}

// =========================================
// TEACHER HELPER
// =========================================

async function getTeacher(
  clerkId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      clerkId,
    },

    include: {
      teacherProfile: {
        include: {
          subjects: true,
        },
      },
    },
  });

  if (!user || !user.teacherProfile) {
    return null;
  }

  return {
    user,
    teacher: user.teacherProfile,
  };
}

// =========================================
// BUILD EVALUATION CONVERSATION
// =========================================

function buildConversation(
  history: ChatMessage[]
): string {
  return history
    .map((message) => {
      const speaker =
        message.role === "assistant"
          ? "INTERVIEW QUESTION"
          : "TEACHER RESPONSE";

      return `${speaker}:\n${message.content}`;
    })
    .join("\n\n");
}

// =========================================
// GEMINI EVALUATION
// =========================================

async function evaluateInterview(
  interviewId: string,
  history: ChatMessage[],
  subjects: string[]
) {
  try {
    console.info(
      `[AI Interview] Starting evaluation: ${interviewId}`
    );

    const teacherAnswers = history.filter(
      (message) => message.role === "user"
    );

    const conversation =
      buildConversation(history);

    const model = getGeminiModel();

    const prompt = `
You are a senior teacher recruitment evaluator for TutorSathi, an Indian EdTech platform.

Your responsibility is to evaluate a college student's ability to teach school students.

The candidate completed a structured five-minute teacher interview.

CANDIDATE'S REGISTERED SUBJECTS:
${
  subjects.length
    ? subjects.join(", ")
    : "Not specified"
}

NUMBER OF TEACHER RESPONSES:
${teacherAnswers.length}

INTERVIEW CONVERSATION:

${conversation || "No interview responses were submitted."}

==================================================
INTERVIEW STRUCTURE
==================================================

The interview contains five predefined stages:

1. SELF INTRODUCTION
The candidate introduces themselves and describes their educational background.

2. TEACHING MOTIVATION
The candidate explains why they want to teach and their interest in helping students.

3. SUBJECTS AND CLASSES
The candidate identifies their teaching subjects, preferred classes and strongest subject.

4. TOPIC SELECTION
The candidate selects a topic and explains why they chose it.

5. TEACHING DEMONSTRATION
The candidate teaches the selected topic as if explaining it to a school student.

==================================================
EVALUATION CRITERIA
==================================================

Evaluate the candidate on a scale of 0 to 10.

1. subjectKnowledge

Evaluate:
- Understanding of the selected subject.
- Accuracy of concepts.
- Correctness of examples.
- Depth of subject understanding.
- Ability to explain the selected topic correctly.

2. communication

Evaluate:
- Clarity of communication.
- Ability to express ideas.
- Language and sentence structure.
- Confidence reflected in the response.
- Ability to communicate with school students.

3. explanationSkills

Evaluate:
- Step-by-step explanation.
- Simplicity of teaching.
- Use of examples and practical applications.
- Logical flow of concepts.
- Ability to make difficult topics understandable.

4. overallScore

Give an overall score considering all available responses.

Suggested weighting:

- Subject knowledge: 25%
- Communication: 20%
- Explanation skills: 40%
- Interview completeness and teaching motivation: 15%

==================================================
IMPORTANT EVALUATION RULES
==================================================

- Be fair, objective and professional.
- Evaluate only the evidence in the submitted conversation.
- Never invent information about the candidate.
- Give special importance to the teaching demonstration.
- A good introduction alone must not result in a high score.
- Reward simple explanations and relevant examples.
- Penalize incorrect subject information.
- Do not confuse the interview questions with candidate answers.
- Do not award high scores without supporting evidence.
- If the candidate did not complete the teaching demonstration, reflect this in the score.
- If there are no teacher responses, assign zero scores.
- Do not assume that a candidate is confident based only on their written words.
- This evaluation is based on the available response transcript, not independently verified video or audio analysis.
- Keep strengths and weaknesses specific and useful.
- Scores must be between 0 and 10.

Return ONLY valid JSON.

Use exactly this structure:

{
  "subjectKnowledge": 7.5,
  "communication": 8,
  "explanationSkills": 7,
  "overallScore": 7.5,
  "strengths": [
    "Demonstrates a good understanding of the selected topic",
    "Uses relevant examples while explaining concepts"
  ],
  "weaknesses": [
    "Could improve the structure of explanations",
    "Could provide more practical examples"
  ],
  "summary": "A concise and professional overall assessment of the candidate's teaching ability."
}
`;

    const result =
      await model.generateContent(prompt);

    const evaluation = parseEvaluation(
      result.response.text()
    );

    await prisma.interviewEvaluation.upsert({
      where: {
        interviewId,
      },

      create: {
        interviewId,

        subjectKnowledge:
          evaluation.subjectKnowledge,

        communication:
          evaluation.communication,

        explanationSkills:
          evaluation.explanationSkills,

        overallScore:
          evaluation.overallScore,

        strengths:
          evaluation.strengths,

        weaknesses:
          evaluation.weaknesses,

        summary:
          evaluation.summary,

        fullReport: evaluation as never,
      },

      update: {
        subjectKnowledge:
          evaluation.subjectKnowledge,

        communication:
          evaluation.communication,

        explanationSkills:
          evaluation.explanationSkills,

        overallScore:
          evaluation.overallScore,

        strengths:
          evaluation.strengths,

        weaknesses:
          evaluation.weaknesses,

        summary:
          evaluation.summary,

        fullReport: evaluation as never,
      },
    });

    console.info(
      `[AI Interview] Evaluation completed: ${interviewId}`
    );
  } catch (error) {
    console.error(
      `[AI Interview] Evaluation failed: ${interviewId}`,
      error
    );
  }
}

// =========================================
// COMPLETE INTERVIEW
// =========================================

async function completeInterview(
  interviewId: string,
  teacherId: string,
  history: ChatMessage[],
  subjects: string[]
) {
  await prisma.$transaction([
    prisma.aIInterview.update({
      where: {
        id: interviewId,
      },

      data: {
        status: "completed",
        completedAt: new Date(),

        rawResponses: {
          history,
        },
      },
    }),

    prisma.teacherProfile.update({
      where: {
        id: teacherId,
      },

      data: {
        verificationStatus: "UNDER_REVIEW",
      },
    }),
  ]);

  // Evaluation runs after the response is sent.
  after(async () => {
    await evaluateInterview(
      interviewId,
      history,
      subjects
    );
  });
}

// =========================================
// POST - START / CHAT / FINISH
// =========================================

export async function POST(
  request: NextRequest
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return jsonResponse(
        {
          success: false,
          message: "Please sign in to continue.",
        },
        401
      );
    }

    const teacherData =
      await getTeacher(clerkId);

    if (!teacherData) {
      return jsonResponse(
        {
          success: false,
          message: "Teacher profile not found.",
        },
        404
      );
    }

    const { teacher } = teacherData;

    const body = await request.json();

    const { action } = body;

    const subjectNames =
      teacher.subjects.map(
        (subject) => subject.subject
      );

    // =====================================
    // START INTERVIEW
    // =====================================

    if (action === "start") {
      const previousInterview =
        await prisma.aIInterview.findFirst({
          where: {
            teacherId: teacher.id,
            status: "in_progress",
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      // Resume an active interview.
      if (previousInterview) {
        const time = getRemainingTime(
          previousInterview.startedAt
        );

        if (!time.expired) {
          const history = getHistory(
            previousInterview.rawResponses
          );

          const questionCount =
            getQuestionCount(history);

          return jsonResponse({
            success: true,

            interviewId:
              previousInterview.id,

            message:
              "Your interview has been restored.",

            resumed: true,

            history,

            remainingSeconds:
              time.remainingSeconds,

            questionCount,

            maxQuestions:
              MAX_INTERVIEW_QUESTIONS,

            durationMinutes:
              INTERVIEW_DURATION_MINUTES,

            questions:
              INTERVIEW_QUESTIONS,
          });
        }

        // Complete expired interview.
        const expiredHistory = getHistory(
          previousInterview.rawResponses
        );

        await completeInterview(
          previousInterview.id,
          teacher.id,
          expiredHistory,
          subjectNames
        );
      }

      // No Gemini call here.
      const firstMessage =
        INTERVIEW_QUESTIONS[0].question;

      const interview =
        await prisma.aIInterview.create({
          data: {
            teacherId: teacher.id,

            status: "in_progress",

            startedAt: new Date(),

            rawResponses: {
              history: [
                {
                  role: "assistant",
                  content: firstMessage,
                },
              ],
            },
          },
        });

      return jsonResponse({
        success: true,

        interviewId: interview.id,

        message: firstMessage,

        resumed: false,

        durationMinutes:
          INTERVIEW_DURATION_MINUTES,

        remainingSeconds:
          INTERVIEW_DURATION_MINUTES * 60,

        questionCount: 1,

        maxQuestions:
          MAX_INTERVIEW_QUESTIONS,

        questions:
          INTERVIEW_QUESTIONS,
      });
    }

    // =====================================
    // CHAT - SAVE ANSWER AND RETURN FIXED
    // NEXT QUESTION
    // =====================================

    if (action === "chat") {
      const { interviewId, message } = body;

      if (
        typeof interviewId !== "string" ||
        typeof message !== "string" ||
        !message.trim()
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Interview ID and answer are required.",
          },
          400
        );
      }

      const interview =
        await prisma.aIInterview.findFirst({
          where: {
            id: interviewId,
            teacherId: teacher.id,
            status: "in_progress",
          },
        });

      if (!interview) {
        return jsonResponse(
          {
            success: false,
            message:
              "Active interview not found.",
          },
          404
        );
      }

      const history = getHistory(
        interview.rawResponses
      );

      const time = getRemainingTime(
        interview.startedAt
      );

      const updatedHistory: ChatMessage[] = [
        ...history,
        {
          role: "user",
          content: message.trim(),
        },
      ];

      // ---------------------------------
      // TIME EXPIRED
      // ---------------------------------

      if (time.expired) {
        await completeInterview(
          interviewId,
          teacher.id,
          updatedHistory,
          subjectNames
        );

        return jsonResponse({
          success: true,

          interviewCompleted: true,

          evaluationPending: true,

          message:
            "Your interview time has ended. Your responses have been submitted for evaluation.",

          questionCount:
            getQuestionCount(history),

          maxQuestions:
            MAX_INTERVIEW_QUESTIONS,
        });
      }

      // ---------------------------------
      // FIND NEXT FIXED QUESTION
      // ---------------------------------

      const answeredCount =
        getAnswerCount(updatedHistory);

      // All five questions have been answered.
      if (
        answeredCount >=
        MAX_INTERVIEW_QUESTIONS
      ) {
        await completeInterview(
          interviewId,
          teacher.id,
          updatedHistory,
          subjectNames
        );

        return jsonResponse({
          success: true,

          interviewCompleted: true,

          evaluationPending: true,

          message:
            "Thank you! You have completed all five stages of your TutorSathi teaching interview. Your responses are now being evaluated.",

          questionCount:
            MAX_INTERVIEW_QUESTIONS,

          maxQuestions:
            MAX_INTERVIEW_QUESTIONS,
        });
      }

      // The next question is selected locally.
      // No Gemini request is made here.
      const nextQuestion =
        INTERVIEW_QUESTIONS[answeredCount];

      if (!nextQuestion) {
        await completeInterview(
          interviewId,
          teacher.id,
          updatedHistory,
          subjectNames
        );

        return jsonResponse({
          success: true,
          interviewCompleted: true,
          evaluationPending: true,
          message:
            "Your interview has been submitted for evaluation.",
        });
      }

      updatedHistory.push({
        role: "assistant",
        content: nextQuestion.question,
      });

      await prisma.aIInterview.update({
        where: {
          id: interviewId,
        },

        data: {
          rawResponses: {
            history: updatedHistory,
          },
        },
      });

      const updatedTime =
        getRemainingTime(
          interview.startedAt
        );

      return jsonResponse({
        success: true,

        message: nextQuestion.question,

        history: updatedHistory,

        questionCount:
          getQuestionCount(updatedHistory),

        answerCount: answeredCount,

        maxQuestions:
          MAX_INTERVIEW_QUESTIONS,

        remainingSeconds:
          updatedTime.remainingSeconds,

        durationMinutes:
          INTERVIEW_DURATION_MINUTES,

        stage: nextQuestion.stage,
      });
    }

    // =====================================
    // FINISH INTERVIEW
    // =====================================

    if (action === "finish") {
      const { interviewId, transcript } = body;

      if (typeof interviewId !== "string") {
        return jsonResponse(
          {
            success: false,
            message:
              "Interview ID is required.",
          },
          400
        );
      }

      const interview =
        await prisma.aIInterview.findFirst({
          where: {
            id: interviewId,
            teacherId: teacher.id,
            status: "in_progress",
          },
        });

      if (!interview) {
        return jsonResponse(
          {
            success: false,
            message:
              "Active interview not found.",
          },
          404
        );
      }

      let history = getHistory(
        interview.rawResponses
      );

      // Optional final transcript from the frontend.
      // This can preserve the final speech-recognition
      // result if it was not already submitted through chat.
      if (
        typeof transcript === "string" &&
        transcript.trim()
      ) {
        const lastMessage =
          history[history.length - 1];

        if (
          lastMessage?.role === "user"
        ) {
          history = [
            ...history.slice(0, -1),
            {
              role: "user",
              content: transcript.trim(),
            },
          ];
        } else {
          history = [
            ...history,
            {
              role: "user",
              content: transcript.trim(),
            },
          ];
        }
      }

      await completeInterview(
        interviewId,
        teacher.id,
        history,
        subjectNames
      );

      return jsonResponse({
        success: true,

        submitted: true,

        interviewCompleted: true,

        interviewId,

        evaluationPending: true,

        message:
          "Your interview has been submitted. Gemini is now evaluating your responses.",
      });
    }

    return jsonResponse(
      {
        success: false,
        message: "Invalid interview action.",
      },
      400
    );
  } catch (error) {
    console.error(
      "[AI Interview POST]",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing your interview. Please try again.",
      },
      500
    );
  }
}

// =========================================
// GET - INTERVIEW STATUS / EVALUATION
// =========================================

export async function GET(
  request: NextRequest
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return jsonResponse(
        {
          success: false,
          message: "Unauthorized.",
        },
        401
      );
    }

    const teacherData =
      await getTeacher(clerkId);

    if (!teacherData) {
      return jsonResponse(
        {
          success: false,
          message:
            "Teacher profile not found.",
        },
        404
      );
    }

    const { teacher } = teacherData;

    const { searchParams } =
      new URL(request.url);

    const action =
      searchParams.get("action");

    const interviewId =
      searchParams.get("interviewId");

    // =====================================
    // GET EVALUATION
    // =====================================

    if (action === "evaluation") {
      if (!interviewId) {
        return jsonResponse(
          {
            success: false,
            message:
              "Interview ID is required.",
          },
          400
        );
      }

      const interview =
        await prisma.aIInterview.findFirst({
          where: {
            id: interviewId,
            teacherId: teacher.id,
            status: "completed",
          },

          include: {
            evaluation: true,
          },
        });

      if (!interview) {
        return jsonResponse(
          {
            success: false,
            message:
              "Completed interview not found.",
          },
          404
        );
      }

      if (!interview.evaluation) {
        return jsonResponse({
          success: true,

          evaluationPending: true,

          status: "processing",

          message:
            "Gemini is evaluating your teaching interview. Your results will appear here shortly.",
        });
      }

      const evaluation =
        interview.evaluation;

      return jsonResponse({
        success: true,

        evaluationPending: false,

        status: "completed",

        result: {
          subjectKnowledge:
            evaluation.subjectKnowledge,

          communication:
            evaluation.communication,

          explanationSkills:
            evaluation.explanationSkills,

          overallScore:
            evaluation.overallScore,

          strengths:
            evaluation.strengths,

          weaknesses:
            evaluation.weaknesses,

          summary:
            evaluation.summary,

          fullReport:
            evaluation.fullReport,
        },
      });
    }

    // =====================================
    // GET LATEST INTERVIEW STATUS
    // =====================================

    const interview =
      await prisma.aIInterview.findFirst({
        where: {
          teacherId: teacher.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          evaluation: true,
        },
      });

    if (!interview) {
      return jsonResponse({
        success: true,

        interview: null,

        interviewId: null,

        status: null,

        recordingAvailable: false,

        durationMinutes:
          INTERVIEW_DURATION_MINUTES,
      });
    }

    const history = getHistory(
      interview.rawResponses
    );

    const time =
      interview.status === "in_progress"
        ? getRemainingTime(
            interview.startedAt
          )
        : null;

    return jsonResponse({
      success: true,

      interview: {
        id: interview.id,

        status: interview.status,

        startedAt: interview.startedAt,

        completedAt: interview.completedAt,

        recordingUrl:
          interview.recordingUrl,
      },

      interviewId: interview.id,

      status: interview.status,

      recordingUrl:
        interview.recordingUrl,

      recordingAvailable:
        Boolean(interview.recordingUrl),

      evaluationAvailable:
        Boolean(interview.evaluation),

      questionCount:
        getQuestionCount(history),

      answerCount:
        getAnswerCount(history),

      maxQuestions:
        MAX_INTERVIEW_QUESTIONS,

      durationMinutes:
        INTERVIEW_DURATION_MINUTES,

      remainingSeconds:
        time?.remainingSeconds ?? 0,

      timeExpired:
        time?.expired ?? false,
    });
  } catch (error) {
    console.error(
      "[AI Interview GET]",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to retrieve interview information.",
      },
      500
    );
  }
}