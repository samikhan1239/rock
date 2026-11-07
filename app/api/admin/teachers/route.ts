import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacherProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        subjects: true,
        videos: true,
        aiInterviews: {
          where: { status: "completed" },
          include: {
            evaluation: true,
          },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId, action } = await req.json();

    if (!teacherId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.teacherProfile.update({
      where: { id: teacherId },
      data: {
        verificationStatus: status,
        isVerified: action === "approve",
      },
    });

    await prisma.verificationRecord.create({
      data: {
        teacherId,
        status,
        reviewedBy: userId,
        notes: `Teacher ${action}d by admin`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Teacher ${action}d`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}