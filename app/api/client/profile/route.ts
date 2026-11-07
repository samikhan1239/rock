import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      fullName,
      phone,
      location,
      studentClass,
      requiredSubjects,
      teachingMode,
      preferredLanguage,
    } = body;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: fullName?.split(" ")[0] || "",
          lastName: fullName?.split(" ").slice(1).join(" ") || "",
          phone,
          role: "CLIENT",
          creditWallet: {
            create: {
              freeCredits: 5,
              purchasedCredits: 0,
              reservedCredits: 0,
              usedCredits: 0,
            },
          },
        },
      });
    }

    // Create or update ClientProfile
    await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        location,
        studentClass,
        requiredSubjects: requiredSubjects
          ? requiredSubjects.split(",").map((s: string) => s.trim())
          : [],
        teachingMode,
        preferredLanguage,
      },
      create: {
        userId: user.id,
        location,
        studentClass,
        requiredSubjects: requiredSubjects
          ? requiredSubjects.split(",").map((s: string) => s.trim())
          : [],
        teachingMode,
        preferredLanguage,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Client profile created successfully",
    });
  } catch (error: unknown) {
    console.error("Client profile error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}