import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Read request body
    const body = await req.json();

    // Maintain backward compatibility with existing credit frontend
    const purpose = body.purpose || "credits";

    const credits = Number(body.credits ?? 0);
    const requestedAmount = Number(body.amount);

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 4. Fetch platform pricing
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "pricing_settings" },
    });

    const value =
      (setting?.value as Record<string, unknown> | null) ?? {};

    let amountInr = 0;

    // ==========================================
    // 5. TEACHER REGISTRATION PAYMENT
    // ==========================================

    if (purpose === "teacher_registration") {
      if (user.role !== "TEACHER") {
        return NextResponse.json(
          { error: "Only teachers can make this payment" },
          { status: 403 }
        );
      }

      const profile = await prisma.teacherProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 404 }
        );
      }

      amountInr = Number(value.teacherRegistrationFee ?? 0);

      // Prevent duplicate successful payments
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          purpose: "teacher_registration",
          status: "SUCCESS",
        },
      });

      if (existingPayment) {
        return NextResponse.json(
          { error: "Registration fee already paid" },
          { status: 409 }
        );
      }
    }

    // ==========================================
    // 6. CLIENT REGISTRATION PAYMENT
    // ==========================================

    else if (purpose === "client_registration") {
      if (user.role !== "CLIENT") {
        return NextResponse.json(
          { error: "Only clients can make this payment" },
          { status: 403 }
        );
      }

      const profile = await prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Client profile not found" },
          { status: 404 }
        );
      }

      amountInr = Number(value.clientRegistrationFee ?? 0);

      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          purpose: "client_registration",
          status: "SUCCESS",
        },
      });

      if (existingPayment) {
        return NextResponse.json(
          { error: "Registration fee already paid" },
          { status: 409 }
        );
      }
    }

    // ==========================================
    // 7. CREDIT PURCHASE
    // ==========================================

    else if (purpose === "credits") {
      if (!Number.isSafeInteger(credits) || credits < 1) {
        return NextResponse.json(
          { error: "Invalid credit quantity" },
          { status: 400 }
        );
      }

      if (
        !Number.isSafeInteger(requestedAmount) ||
        requestedAmount < 1
      ) {
        return NextResponse.json(
          { error: "Invalid credit amount" },
          { status: 400 }
        );
      }

      // Get available credit packs
      const configuredPacks = Array.isArray(value.creditPacks)
        ? value.creditPacks
        : [];

      // Default packs if platform settings are not configured
      const defaultPacks = [
        { credits: 5, amount: 99, label: "Starter" },
        { credits: 15, amount: 249, label: "Popular" },
        { credits: 40, amount: 599, label: "Pro" },
      ];

      const creditPacks =
        configuredPacks.length > 0
          ? configuredPacks
          : defaultPacks;

      // Validate selected pack against database pricing
      const selectedPack = creditPacks.find((pack: unknown) => {
        if (!pack || typeof pack !== "object") {
          return false;
        }

        const item = pack as Record<string, unknown>;

        return (
          Number(item.credits) === credits &&
          Number(item.amount) === requestedAmount
        );
      });

      if (!selectedPack) {
        return NextResponse.json(
          { error: "Invalid credit pack or price" },
          { status: 400 }
        );
      }

      amountInr = requestedAmount;
    }

    // ==========================================
    // 8. INVALID PAYMENT PURPOSE
    // ==========================================

    else {
      return NextResponse.json(
        { error: "Invalid payment purpose" },
        { status: 400 }
      );
    }

    // ==========================================
    // 9. VALIDATE FINAL AMOUNT
    // ==========================================

    if (
      !Number.isSafeInteger(amountInr) ||
      amountInr <= 0 ||
      !Number.isSafeInteger(amountInr * 100)
    ) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // ==========================================
    // 10. CREATE RAZORPAY ORDER
    // ==========================================

    const amountPaise = amountInr * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",

      receipt: `payment_${user.id}_${Date.now()}`,

      notes: {
        userId: user.id,
        clerkId: userId,
        purpose,
        credits: String(credits),
      },
    });

    // ==========================================
    // 11. SAVE PENDING PAYMENT
    // ==========================================

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: amountInr,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId: order.id,
        purpose,

        metadata: {
          credits,
        },
      },
    });

    // ==========================================
    // 12. RETURN CHECKOUT DETAILS
    // ==========================================

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amountPaise,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      credits,
    });

  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}