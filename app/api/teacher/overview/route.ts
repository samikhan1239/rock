import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Authenticate teacher
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Fetch user and teacher profile
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
      include: {
        creditWallet: true,
        teacherProfile: {
          include: {
            subjects: true,
            videos: true,
            aiInterviews: {
              where: {
                status: "completed",
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher account not found" },
        { status: 404 }
      );
    }

    const profile = user.teacherProfile;
    const wallet = user.creditWallet;

    // 3. Wallet information
    const freeCredits = wallet?.freeCredits ?? 0;
    const purchasedCredits = wallet?.purchasedCredits ?? 0;
    const reservedCredits = wallet?.reservedCredits ?? 0;
    const usedCredits = wallet?.usedCredits ?? 0;

    const availableCredits =
      freeCredits + purchasedCredits - reservedCredits;

    // 4. Verification status
    const verificationStatus =
      profile?.verificationStatus ?? "DRAFT";

    // 5. Connection requests
    const teacherId = profile?.id;

    const [pendingRequests, activeConnections] = teacherId
      ? await Promise.all([
          prisma.connectionRequest.count({
            where: {
              teacherId,
              status: {
                in: ["PENDING", "UNDER_REVIEW"],
              },
            },
          }),

          prisma.connectionRequest.count({
            where: {
              teacherId,
              status: {
                in: [
                  "APPROVED",
                  "CONNECTION_ESTABLISHED",
                  "HIRING_CONFIRMED",
                ],
              },
            },
          }),
        ])
      : [0, 0];

    // 6. Profile completion
    const stepsDone = {
      profile: Boolean(profile?.city && profile?.address),

      education: Boolean(
        profile?.college && profile?.degree
      ),

      subjects: (profile?.subjects?.length ?? 0) > 0,

      videos: (profile?.videos?.length ?? 0) > 0,

      interview: (profile?.aiInterviews?.length ?? 0) > 0,

      submitted: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
      ].includes(verificationStatus),
    };

    const completedCount = Object.values(stepsDone).filter(
      Boolean
    ).length;

    const progressPct = Math.round(
      (completedCount / 6) * 100
    );

    // 7. Recent credit activity
    const recentActivity = await prisma.creditTransaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    // 8. Response
    return NextResponse.json({
      success: true,

      teacher: {
        id: user.id,
        firstName: user.firstName || clerkUser.firstName || "Teacher",
        lastName: user.lastName || clerkUser.lastName || "",
        email: user.email,
      },

      profile: {
        id: profile?.id ?? null,
        verificationStatus,
        city: profile?.city ?? null,
        address: profile?.address ?? null,
        college: profile?.college ?? null,
        degree: profile?.degree ?? null,
      },

      wallet: {
        freeCredits,
        purchasedCredits,
        reservedCredits,
        usedCredits,
        availableCredits,
      },

      requests: {
        pendingRequests,
        activeConnections,
      },

      completion: {
        stepsDone,
        completedCount,
        totalSteps: 6,
        progressPct,
      },

      recentActivity,
    });
  } catch (error) {
    console.error("Teacher overview API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch teacher overview",
      },
      { status: 500 }
    );
  }
}