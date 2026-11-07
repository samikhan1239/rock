import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId } = await req.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        clientProfile: true,
        creditWallet: true,
      },
    });

    if (!user?.clientProfile) {
      return NextResponse.json(
        { error: "Please complete your client profile first" },
        { status: 400 }
      );
    }

    const wallet = user.creditWallet;
    if (!wallet) {
      return NextResponse.json(
        { error: "Credit wallet not found" },
        { status: 400 }
      );
    }

    const availableCredits =
      wallet.freeCredits + wallet.purchasedCredits - wallet.reservedCredits;

    if (availableCredits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. Please buy more credits." },
        { status: 400 }
      );
    }

    // Teacher must exist and be approved
    const teacher = await prisma.teacherProfile.findFirst({
      where: {
        id: teacherId,
        verificationStatus: "APPROVED",
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found or not verified" },
        { status: 404 }
      );
    }

    const existing = await prisma.connectionRequest.findFirst({
      where: {
        clientId: user.clientProfile.id,
        teacherId,
        status: {
          in: ["PENDING", "UNDER_REVIEW", "APPROVED", "CONNECTION_ESTABLISHED"],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active request with this teacher" },
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

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.connectionRequest.create({
        data: {
          clientId: user.clientProfile!.id,
          teacherId,
          status: "PENDING",
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
          userId: user.id,
          type: "CREDIT_CONSUMED",
          amount: -1,
          balanceAfter: availableCredits - 1,
          referenceId: `req_${request.id}`,
          description: "1 credit used for connection request",
          metadata: {
            requestId: request.id,
            teacherId,
            initiatedBy: "CLIENT",
          },
        },
      });

      return request;
    });

    return NextResponse.json({
      success: true,
      message: "Request sent to admin. 1 credit deducted.",
      requestId: result.id,
    });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { clientProfile: true },
    });

    if (!user?.clientProfile) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await prisma.connectionRequest.findMany({
      where: { clientId: user.clientProfile.id },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}