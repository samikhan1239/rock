import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subjects: true,
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
    });

    const formatted = teachers.map((t) => ({
      id: t.id,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      profileImage: t.profilePhotoUrl ?? null,
      photo: t.profilePhotoUrl ?? null,
      city: t.city,
      experienceYears: t.experienceYears,
      preferredMode: t.preferredMode,
      expectedSalary: t.expectedSalary,
      verificationStatus: t.verificationStatus,
      subjects: t.subjects,
      overallScore:
        t.aiInterviews[0]?.evaluation?.overallScore ?? null,
    }));

    return NextResponse.json({
      success: true,
      teachers: formatted,
    });
  } catch (error) {
    console.error("Teacher fetching error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch teachers",
      },
      { status: 500 }
    );
  }
}