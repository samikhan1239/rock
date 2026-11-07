import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";



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
      include: { teacherProfile: true },
    });

    if (!user?.teacherProfile) {
      return NextResponse.json({
        interviewId: null,
        recordingAvailable: false,
      });
    }

    const interview = await prisma.aIInterview.findFirst({
      where: {
        teacherId: user.teacherProfile.id,
        status: "completed",
        recordingUrl: { not: null },
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        id: true,
        recordingUrl: true,
        status: true,
      },
    });

    return NextResponse.json({
      interviewId: interview?.id ?? null,
      status: interview?.status ?? null,
      recordingAvailable: Boolean(interview?.recordingUrl),
    });
  } catch (error) {
    console.error("Latest interview error:", error);

    return NextResponse.json(
      { error: "Unable to fetch interview status." },
      { status: 500 }
    );
  }
}