import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { teacherProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: "TEACHER",
          creditWallet: {
            create: {
              freeCredits: 5,
              purchasedCredits: 0,
              reservedCredits: 0,
              usedCredits: 0,
            },
          },
          teacherProfile: {
            create: {
              verificationStatus: "DRAFT",
            },
          },
        },
        include: { teacherProfile: true },
      });
    } else if (!user.teacherProfile) {
      await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          verificationStatus: "DRAFT",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}