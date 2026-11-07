import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const role = body.role as "TEACHER" | "CLIENT";

    if (!role || !["TEACHER", "CLIENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // 1. Update role in Clerk publicMetadata
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: role,
      },
    });

    // 2. Get Clerk user details
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";

    // 3. Create or update user in PostgreSQL
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        teacherProfile: true,
        clientProfile: true,
      },
    });

    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { clerkId: userId },
        data: { role },
        include: {
          teacherProfile: true,
          clientProfile: true,
        },
      });
    } else {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role,
          creditWallet: {
            create: {
              freeCredits: 5,
              purchasedCredits: 0,
              reservedCredits: 0,
              usedCredits: 0,
            },
          },
        },
        include: {
          teacherProfile: true,
          clientProfile: true,
        },
      });
    }

    // 4. Create profile based on role
    if (role === "TEACHER" && !dbUser.teacherProfile) {
      await prisma.teacherProfile.create({
        data: {
          userId: dbUser.id,
          verificationStatus: "DRAFT",
        },
      });
    }

    if (role === "CLIENT" && !dbUser.clientProfile) {
      await prisma.clientProfile.create({
        data: {
          userId: dbUser.id,
        },
      });
    }

    // 5. Response + cookie for middleware
    const response = NextResponse.json({
      success: true,
      role,
    });

    response.cookies.set("user_role", role, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error("Set role error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}