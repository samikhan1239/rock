import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalTeachers,
      pendingTeachers,
      approvedTeachers,
      totalClients,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      prisma.teacherProfile.count(),
      prisma.teacherProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.teacherProfile.count({ where: { verificationStatus: "APPROVED" } }),
      prisma.clientProfile.count(),
      prisma.connectionRequest.count(),
      prisma.connectionRequest.count({ where: { status: "PENDING" } }),
      prisma.connectionRequest.count({ where: { status: "APPROVED" } }),
      prisma.connectionRequest.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalTeachers,
        pendingTeachers,
        approvedTeachers,
        totalClients,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}