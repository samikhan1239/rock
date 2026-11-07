import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET: list all enrolled clients
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { teacherProfile: true },
    });

    if (!teacherUser || teacherUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") || "";
    const classFilter = searchParams.get("class") || "";
    const city = searchParams.get("city") || "";
    const mode = searchParams.get("mode") || "";

    const clients = await prisma.clientProfile.findMany({
      where: {
        ...(city
          ? { location: { contains: city, mode: "insensitive" } }
          : {}),
        ...(classFilter ? { studentClass: classFilter } : {}),
        ...(mode
          ? {
              OR: [{ teachingMode: mode }, { teachingMode: "both" }],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const filtered = subject
      ? clients.filter((c) =>
          c.requiredSubjects.some((s) =>
            s.toLowerCase().includes(subject.toLowerCase())
          )
        )
      : clients;

    const formatted = filtered.map((c) => ({
      id: c.id,
      location: c.location,
      studentClass: c.studentClass,
      requiredSubjects: c.requiredSubjects,
      teachingMode: c.teachingMode,
      preferredLanguage: c.preferredLanguage,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
    }));

    return NextResponse.json({ clients: formatted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST: teacher sends connection request → ADMIN + minus 1 credit
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const clientId = body.clientId as string | undefined;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const teacherUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        teacherProfile: true,
        creditWallet: true,
      },
    });

    if (!teacherUser?.teacherProfile || teacherUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    if (teacherUser.teacherProfile.verificationStatus !== "APPROVED") {
      return NextResponse.json(
        {
          error:
            "Your teacher profile is not verified yet. Complete verification to send requests.",
        },
        { status: 400 }
      );
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const existing = await prisma.connectionRequest.findFirst({
      where: {
        teacherId: teacherUser.teacherProfile.id,
        clientId,
        status: {
          in: [
            "PENDING",
            "UNDER_REVIEW",
            "APPROVED",
            "CONNECTION_ESTABLISHED",
          ],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "You already sent a request to this client. Please wait for admin approval.",
        },
        { status: 400 }
      );
    }

    const wallet = teacherUser.creditWallet;
    if (!wallet) {
      return NextResponse.json(
        { error: "Credit wallet not found" },
        { status: 400 }
      );
    }

    const available =
      wallet.freeCredits + wallet.purchasedCredits - wallet.reservedCredits;

    if (available < 1) {
      return NextResponse.json(
        {
          error:
            "Not enough credits. Buy credits to send a connection request.",
        },
        { status: 400 }
      );
    }

    // Deduct 1 credit: free first, then purchased
    let freeCredits = wallet.freeCredits;
    let purchasedCredits = wallet.purchasedCredits;

    if (freeCredits >= 1) {
      freeCredits -= 1;
    } else {
      purchasedCredits -= 1;
    }

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.connectionRequest.create({
        data: {
          teacherId: teacherUser.teacherProfile!.id,
          clientId,
          status: "PENDING",
          adminNotes: "Requested by teacher",
        },
      });

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          freeCredits,
          purchasedCredits,
          usedCredits: { increment: 1 },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: teacherUser.id,
          type: "CREDIT_CONSUMED",
          amount: -1,
          balanceAfter: available - 1,
          referenceId: `treq_${created.id}`,
          description: "1 credit used for connection request",
          metadata: {
            requestId: created.id,
            clientId,
            initiatedBy: "TEACHER",
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Request sent to admin. 1 credit deducted.",
      request,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send connection request" },
      { status: 500 }
    );
  }
}