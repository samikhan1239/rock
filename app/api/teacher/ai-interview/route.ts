import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

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

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

const jsonResponse = (
  data: Record<string, unknown>,
  status = 200
) => NextResponse.json(data, { status });

function clampScore(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.min(10, Math.max(0, number));
}

function parseEvaluation(text: string): EvaluationResult {
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
    subjectKnowledge: clampScore(parsed.subjectKnowledge),
    communication: clampScore(parsed.communication),
    explanationSkills: clampScore(parsed.explanationSkills),
    overallScore: clampScore(parsed.overallScore),

    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [],

    weaknesses: Array.isArray(parsed.weaknesses)
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

async function getTeacher(clerkId: string) {
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

// -----------------------------------------
// GEMINI INTERVIEW EVALUATION
// -----------------------------------------

async function evaluateInterview(
  interviewId: string,
  history: ChatMessage[],
  subjects: string[]
) {
  try {
    const conversation = history
      .map((message) => {
        const speaker =
          message.role === "assistant"
            ? "AI Interviewer"
            : "Teacher";

        return `${speaker}: ${message.content}`;
      })
      .join("\n\n");

    const prompt = `
You are an experienced professional teacher recruitment evaluator for TutorSathi.

Evaluate the teacher's interview based ONLY on the conversation below.

Teacher's subjects:
${subjects.length ? subjects.join(", ") : "Not specified"}

Interview conversation:
${conversation || "The teacher submitted the interview without providing any answers."}

Evaluate these four categories on a scale of 0 to 10:

1. subjectKnowledge:
Evaluate subject understanding, accuracy, and depth.

2. communication:
Evaluate clarity, confidence, language, and ability to communicate ideas.

3. explanationSkills:
Evaluate the ability to explain concepts in a structured, understandable way.

4. overallScore:
Give an overall score based on the complete interview.

Be fair and professional.
Do not invent information.
Do not penalize the candidate for answers that were never asked.
If the conversation is too short or contains no teacher answers, reflect that limitation in the evaluation.
Do not award high scores without supporting evidence.

Return ONLY valid JSON in this exact format:

{
  "subjectKnowledge": 7.5,
  "communication": 8,
  "explanationSkills": 7,
  "overallScore": 7.5,
  "strengths": [
    "Clear communication",
    "Good understanding of core concepts"
  ],
  "weaknesses": [
    "Could provide more practical examples"
  ],
  "summary": "A concise and professional overall assessment."
}
`;

    const result = await model.generateContent(prompt);

    const evaluation = parseEvaluation(
      result.response.text()
    );

    await prisma.interviewEvaluation.upsert({
      where: {
        interviewId,
      },

      create: {
        interviewId,
        subjectKnowledge: evaluation.subjectKnowledge,
        communication: evaluation.communication,
        explanationSkills: evaluation.explanationSkills,
        overallScore: evaluation.overallScore,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        summary: evaluation.summary,
        fullReport: evaluation as never,
      },

      update: {
        subjectKnowledge: evaluation.subjectKnowledge,
        communication: evaluation.communication,
        explanationSkills: evaluation.explanationSkills,
        overallScore: evaluation.overallScore,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        summary: evaluation.summary,
        fullReport: evaluation as never,
      },
    });

    console.info(
      `[AI Interview] Evaluation completed: ${interviewId}`
    );
  } catch (error) {
    console.error(
      `[AI Interview] Evaluation failed for ${interviewId}:`,
      error
    );
  }
}

// =========================================
// POST - START / CHAT / FINISH
// =========================================

export async function POST(request: NextRequest) {
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

    if (!process.env.GEMINI_API_KEY) {
      return jsonResponse(
        {
          success: false,
          message: "AI interview service is not configured.",
        },
        500
      );
    }

    const teacherData = await getTeacher(clerkId);

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

    // -----------------------------------------
    // START INTERVIEW
    // -----------------------------------------

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

      if (previousInterview) {
        return jsonResponse({
          success: true,
          interviewId: previousInterview.id,
          message:
            "You already have an interview in progress.",
          resumed: true,
        });
      }

      const subjectNames = teacher.subjects.map(
        (subject) => subject.subject
      );

      const prompt = `
You are TutorSathi's professional AI teacher interviewer.

You are interviewing a teacher who wants to join the TutorSathi teaching platform.

Teacher's subjects:
${subjectNames.length
          ? subjectNames.join(", ")
          : "Not specified"
        }

Instructions:
- Greet the teacher professionally and warmly.
- Introduce yourself as the TutorSathi AI interviewer.
- Ask one question at a time.
- Keep questions natural and conversational.
- Focus on teaching ability, subject knowledge, and explanation skills.
- Ask questions relevant to the teacher's subjects.
- Do not ask multiple questions in one message.
- Do not provide the answer to your own question.
- Avoid repeating previous questions.

Start the interview with a brief introduction and your first question.
`;

      const result = await model.generateContent(prompt);

      const firstMessage = result.response.text().trim();

      if (!firstMessage) {
        throw new Error(
          "Gemini did not generate an opening question."
        );
      }

      const interview = await prisma.aIInterview.create({
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
      });
    }

    // -----------------------------------------
    // CHAT / NEXT QUESTION
    // -----------------------------------------

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
            message: "Interview ID and answer are required.",
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
            message: "Active interview not found.",
          },
          404
        );
      }

      const storedResponses =
        interview.rawResponses as {
          history?: ChatMessage[];
        } | null;

      const history: ChatMessage[] =
        storedResponses?.history ?? [];

      const updatedHistory: ChatMessage[] = [
        ...history,
        {
          role: "user",
          content: message.trim(),
        },
      ];

      const subjectNames = teacher.subjects.map(
        (subject) => subject.subject
      );

      const conversation = updatedHistory
        .map(
          (item) =>
            `${item.role}: ${item.content}`
        )
        .join("\n\n");

      const prompt = `
You are TutorSathi's professional AI teacher interviewer.

Teacher's subjects:
${subjectNames.length
          ? subjectNames.join(", ")
          : "Not specified"
        }

Interview conversation so far:
${conversation}

Your task:
- Respond naturally to the teacher's latest answer.
- Briefly acknowledge the answer when appropriate.
- Ask exactly ONE relevant follow-up interview question.
- Evaluate the teacher's subject knowledge and teaching ability through questions.
- Ask practical teaching scenario questions when appropriate.
- Do not repeat previous questions.
- Do not reveal scores or evaluation results during the interview.
- Do not ask multiple questions at once.
- Keep your response concise and conversational.

Respond as the AI interviewer.
`;

      const result = await model.generateContent(prompt);

      const nextMessage = result.response.text().trim();

      if (!nextMessage) {
        throw new Error(
          "Gemini did not generate the next question."
        );
      }

      updatedHistory.push({
        role: "assistant",
        content: nextMessage,
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

      return jsonResponse({
        success: true,
        message: nextMessage,
        history: updatedHistory,
      });
    }

    // -----------------------------------------
    // FINISH INTERVIEW
    // NO MINIMUM ANSWER VALIDATION
    // -----------------------------------------

    if (action === "finish") {
      const { interviewId } = body;

      if (typeof interviewId !== "string") {
        return jsonResponse(
          {
            success: false,
            message: "Interview ID is required.",
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
            message: "Active interview not found.",
          },
          404
        );
      }

      const storedResponses =
        interview.rawResponses as {
          history?: ChatMessage[];
        } | null;

      const history: ChatMessage[] =
        storedResponses?.history ?? [];

      // No answer-count validation.
      // Teachers can submit even with zero answers.

      await prisma.$transaction([
        prisma.aIInterview.update({
          where: {
            id: interviewId,
          },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        }),

        prisma.teacherProfile.update({
          where: {
            id: teacher.id,
          },
          data: {
            verificationStatus: "UNDER_REVIEW",
          },
        }),
      ]);

      const subjectNames = teacher.subjects.map(
        (subject) => subject.subject
      );

      // Run evaluation after the response has been sent.
      after(async () => {
        await evaluateInterview(
          interviewId,
          history,
          subjectNames
        );
      });

      return jsonResponse({
        success: true,
        submitted: true,
        interviewId,
        evaluationPending: true,
        message:
          "Your interview has been submitted. Gemini is evaluating your responses.",
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
    console.error("[AI Interview POST]", error);

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

export async function GET(request: NextRequest) {
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

    const teacherData = await getTeacher(clerkId);

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

    const { searchParams } = new URL(request.url);

    const action = searchParams.get("action");
    const interviewId = searchParams.get("interviewId");

    // -----------------------------------------
    // GET EVALUATION
    // -----------------------------------------

    if (action === "evaluation") {
      if (!interviewId) {
        return jsonResponse(
          {
            success: false,
            message: "Interview ID is required.",
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
            message: "Completed interview not found.",
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
            "Gemini is analyzing your interview. Your results will appear here shortly.",
        });
      }

      const evaluation = interview.evaluation;

      return jsonResponse({
        success: true,
        evaluationPending: false,
        status: "completed",
        result: {
          subjectKnowledge: evaluation.subjectKnowledge,
          communication: evaluation.communication,
          explanationSkills: evaluation.explanationSkills,
          overallScore: evaluation.overallScore,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          summary: evaluation.summary,
          fullReport: evaluation.fullReport,
        },
      });
    }

    // -----------------------------------------
    // GET LATEST INTERVIEW STATUS
    // -----------------------------------------

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
      });
    }

  return jsonResponse({
  success: true,
  interview: {
    id: interview.id,
    status: interview.status,
    startedAt: interview.startedAt,
    completedAt: interview.completedAt,
    recordingUrl: interview.recordingUrl,
  },
  interviewId: interview.id,
  status: interview.status,
  recordingUrl: interview.recordingUrl,
  recordingAvailable: Boolean(interview.recordingUrl),
  evaluationAvailable: Boolean(interview.evaluation),
});
  } catch (error) {
    console.error("[AI Interview GET]", error);

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