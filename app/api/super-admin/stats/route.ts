import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add SUPER_ADMIN role check

    const [
      totalTeachers,
      totalClients,
      totalAdmins,
      pendingTeachers,
      totalRequests,
      approvedRequests,
      payments,
    ] = await Promise.all([
      prisma.teacherProfile.count(),
      prisma.clientProfile.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.teacherProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.connectionRequest.count(),
      prisma.connectionRequest.count({ where: { status: "APPROVED" } }),
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const now = new Date();
    const monthlyRevenue = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      stats: {
        totalTeachers,
        totalClients,
        totalAdmins,
        pendingTeachers,
        totalRequests,
        approvedRequests,
        totalRevenue,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}