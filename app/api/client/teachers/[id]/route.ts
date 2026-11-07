import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        subjects: true,
        aiInterviews: {
          where: { status: "completed" },
          include: { evaluation: true },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        city: teacher.city,
        experienceYears: teacher.experienceYears,
        preferredMode: teacher.preferredMode,
        expectedSalary: teacher.expectedSalary,
        qualifications: teacher.qualifications,
        verificationStatus: teacher.verificationStatus,
        subjects: teacher.subjects,
        overallScore: teacher.aiInterviews[0]?.evaluation?.overallScore || null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
  }
}