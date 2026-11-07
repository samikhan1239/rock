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

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const [
      pendingTeachers,
      pendingRequests,
      approvedTeachers,
      totalClients,
    ] = await Promise.all([
      prisma.teacherProfile.count({
        where: {
          verificationStatus: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      }),

      prisma.connectionRequest.count({
        where: {
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      }),

      prisma.teacherProfile.count({
        where: {
          verificationStatus: "APPROVED",
        },
      }),

      prisma.clientProfile.count(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        pendingTeachers,
        pendingRequests,
        approvedTeachers,
        totalClients,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}