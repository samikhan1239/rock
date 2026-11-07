import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch approved teachers with complete public profile information
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        clientProfile: {
          select: { id: true },
        },
      },
    });

    if (!user || user.role !== "CLIENT" || !user.clientProfile) {
      return NextResponse.json(
        { error: "Clients only" },
        { status: 403 }
      );
    }

    const teachers = await prisma.teacherProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        isVerified: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subjects: true,
        videos: true,
        aiInterviews: {
          where: {
            status: "completed",
          },
          include: {
            evaluation: true,
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const formattedTeachers = teachers.map((teacher) => {
      const interview = teacher.aiInterviews[0] ?? null;
      const evaluation = interview?.evaluation ?? null;

      return {
        id: teacher.id,

        name: [
          teacher.user.firstName,
          teacher.user.lastName,
        ]
          .filter(Boolean)
          .join(" "),

        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,

        // Public profile information
        profilePhotoUrl: teacher.profilePhotoUrl,
        city: teacher.city,
        experienceYears: teacher.experienceYears,
        preferredMode: teacher.preferredMode,
        expectedSalary: teacher.expectedSalary,
        qualifications: teacher.qualifications,

        verificationStatus: teacher.verificationStatus,
        isVerified: teacher.isVerified,

        // Subjects and classes
        subjects: teacher.subjects,

        // Introduction and demonstration videos
        videos: teacher.videos,

        // Latest completed AI interview
        aiInterview: interview
          ? {
              id: interview.id,
              status: interview.status,
              recordingUrl: interview.recordingUrl,
              recordingDuration: interview.recordingDuration,
              completedAt: interview.completedAt,

              evaluation: evaluation
                ? {
                    subjectKnowledge: evaluation.subjectKnowledge,
                    communication: evaluation.communication,
                    explanationSkills: evaluation.explanationSkills,
                    overallScore: evaluation.overallScore,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    summary: evaluation.summary,
                    fullReport: evaluation.fullReport,
                  }
                : null,
            }
          : null,

        overallScore: evaluation?.overallScore ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
    });
  } catch (error) {
    console.error("Client teachers GET error:", error);

    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST: Client sends connection request to teacher → ADMIN
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const teacherId = body.teacherId as string | undefined;

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
        { status: 400 }
      );
    }

    const clientUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        clientProfile: true,
        creditWallet: true,
      },
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Clients only" },
        { status: 403 }
      );
    }

    if (!clientUser.clientProfile) {
      return NextResponse.json(
        { error: "Please complete your client profile first" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        verificationStatus: true,
        isVerified: true,
      },
    });

    if (
      !teacher ||
      teacher.verificationStatus !== "APPROVED" ||
      !teacher.isVerified
    ) {
      return NextResponse.json(
        { error: "This teacher is not currently available for requests" },
        { status: 400 }
      );
    }

    const existing = await prisma.connectionRequest.findFirst({
      where: {
        clientId: clientUser.clientProfile.id,
        teacherId,
        status: {
          in: [
            "PENDING",
            "UNDER_REVIEW",
            "APPROVED",
            "CONNECTION_ESTABLISHED",
            "HIRING_CONFIRMED",
          ],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "You already have an active request with this teacher",
        },
        { status: 400 }
      );
    }

    const wallet = clientUser.creditWallet;

    if (!wallet) {
      return NextResponse.json(
        { error: "Credit wallet not found. Please contact support." },
        { status: 400 }
      );
    }

    const available =
      wallet.freeCredits +
      wallet.purchasedCredits -
      wallet.reservedCredits;

    if (available < 1) {
      return NextResponse.json(
        {
          error: "Not enough credits to send request. Please buy credits.",
        },
        { status: 400 }
      );
    }

    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.connectionRequest.create({
        data: {
          teacherId,
          clientId: clientUser.clientProfile!.id,
          status: "PENDING",
          adminNotes: "Requested by client",
        },
      });

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          reservedCredits: {
            increment: 1,
          },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: clientUser.id,
          type: "CREDIT_RESERVED",
          amount: -1,
          balanceAfter: available - 1,
          referenceId: `creq_${newRequest.id}`,
          description: "Credit reserved for client connection request",
          metadata: {
            requestId: newRequest.id,
            teacherId,
            initiatedBy: "CLIENT",
          },
        },
      });

      return newRequest;
    });

    return NextResponse.json({
      success: true,
      message: "Connection request sent to admin for approval",
      request,
    });
  } catch (error) {
    console.error("Client teachers POST error:", error);

    return NextResponse.json(
      { error: "Failed to send connection request" },
      { status: 500 }
    );
  }
}