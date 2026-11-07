import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. READ RAZORPAY RESPONSE
    // ==========================================

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment fields" },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. VERIFY SIGNATURE
    // ==========================================

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    );

    const receivedBuffer = Buffer.from(
      String(razorpay_signature),
      "hex"
    );

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. FIND USER
    // ==========================================

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ==========================================
    // 5. FIND PAYMENT
    // ==========================================

    const payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        razorpayOrderId: razorpay_order_id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // ==========================================
    // 6. PREVENT DUPLICATE PROCESSING
    // ==========================================

    if (payment.status === "SUCCESS") {
      if (payment.razorpayPaymentId !== razorpay_payment_id) {
        return NextResponse.json(
          { error: "Payment already processed" },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment already processed",
      });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment cannot be processed" },
        { status: 400 }
      );
    }

    // ==========================================
    // 7. VERIFY ACTUAL RAZORPAY PAYMENT
    // ==========================================

    const [order, razorpayPayment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);

    const expectedAmount = payment.amount * 100;

    if (
      order.id !== razorpay_order_id ||
      Number(order.amount) !== expectedAmount ||
      order.currency !== payment.currency
    ) {
      return NextResponse.json(
        { error: "Order amount or currency mismatch" },
        { status: 400 }
      );
    }

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      Number(razorpayPayment.amount) !== expectedAmount ||
      razorpayPayment.currency !== payment.currency ||
      razorpayPayment.status !== "captured"
    ) {
      return NextResponse.json(
        {
          error: "Payment is not captured or payment details mismatch",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 8. READ PAYMENT METADATA
    // ==========================================

    const metadata =
      (payment.metadata as { credits?: number } | null) ?? {};

    const credits = Number(metadata.credits ?? 0);

    // ==========================================
    // 9. CREDIT PURCHASE
    // ==========================================

    if (payment.purpose === "credits") {
      if (
        !Number.isSafeInteger(credits) ||
        credits < 1
      ) {
        return NextResponse.json(
          { error: "Invalid credit amount" },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Claim payment exactly once
        const claimed = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: "PENDING",
          },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
        });

        if (claimed.count === 0) {
          return {
            alreadyProcessed: true,
          };
        }

        // Ensure wallet exists
        await tx.creditWallet.upsert({
          where: {
            userId: user.id,
          },
          create: {
            userId: user.id,
            freeCredits: 0,
            purchasedCredits: 0,
            reservedCredits: 0,
            usedCredits: 0,
          },
          update: {},
        });

        // Add purchased credits
        const wallet = await tx.creditWallet.update({
          where: {
            userId: user.id,
          },
          data: {
            purchasedCredits: {
              increment: credits,
            },
          },
        });

        // Calculate available balance
        const balanceAfter =
          wallet.freeCredits +
          wallet.purchasedCredits -
          wallet.reservedCredits;

        // Record credit transaction
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            type: "CREDIT_PURCHASE",
            amount: credits,
            balanceAfter,

            // Preserve your existing reference format
            referenceId: `pay_${razorpay_payment_id}`,

            description: `Purchased ${credits} credits`,

            metadata: {
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
            },
          },
        });

        return {
          alreadyProcessed: false,
          credits,
          balanceAfter,
        };
      });

      return NextResponse.json({
        success: true,
        alreadyProcessed: result.alreadyProcessed,

        message: result.alreadyProcessed
          ? "Payment already processed"
          : `${credits} credits added successfully`,

        credits: result.alreadyProcessed ? 0 : credits,
      });
    }

    // ==========================================
    // 10. TEACHER REGISTRATION PAYMENT
    // ==========================================

    if (payment.purpose === "teacher_registration") {
      if (user.role !== "TEACHER") {
        return NextResponse.json(
          { error: "Invalid teacher account" },
          { status: 403 }
        );
      }

      const profile = await prisma.teacherProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: "PENDING",
          },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
        });

        if (claimed.count === 0) {
          return {
            alreadyProcessed: true,
          };
        }

        await tx.teacherProfile.update({
          where: {
            userId: user.id,
          },
          data: {
            verificationStatus: "PENDING",
          },
        });

        return {
          alreadyProcessed: false,
        };
      });

      return NextResponse.json({
        success: true,
        alreadyProcessed: result.alreadyProcessed,

        message: result.alreadyProcessed
          ? "Payment already processed"
          : "Teacher registration payment successful",
      });
    }

    // ==========================================
    // 11. CLIENT REGISTRATION PAYMENT
    // ==========================================

    if (payment.purpose === "client_registration") {
      if (user.role !== "CLIENT") {
        return NextResponse.json(
          { error: "Invalid client account" },
          { status: 403 }
        );
      }

      const profile = await prisma.clientProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Client profile not found" },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: "PENDING",
          },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
        });

        return {
          alreadyProcessed: claimed.count === 0,
        };
      });

      return NextResponse.json({
        success: true,
        alreadyProcessed: result.alreadyProcessed,

        message: result.alreadyProcessed
          ? "Payment already processed"
          : "Client registration payment successful",
      });
    }

    // ==========================================
    // 12. INVALID PAYMENT PURPOSE
    // ==========================================

    return NextResponse.json(
      { error: "Unsupported payment purpose" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Verify payment error:", error);

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}