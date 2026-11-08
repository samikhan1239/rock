import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PRICING_KEY = "pricing_settings";
const DEFAULT_FREE_CREDITS = 5;

type TransactionClient = Prisma.TransactionClient;

type PricingSettings = {
  freeCreditsOnSignup?: number;
};

async function getSignupCredits(tx: TransactionClient) {
  const setting = await tx.platformSetting.findUnique({
    where: {
      key: PRICING_KEY,
    },
  });

  const saved = setting?.value as PricingSettings | null;

  const configuredCredits = saved?.freeCreditsOnSignup;

  if (
    typeof configuredCredits !== "number" ||
    !Number.isSafeInteger(configuredCredits) ||
    configuredCredits < 0
  ) {
    return DEFAULT_FREE_CREDITS;
  }

  return configuredCredits;
}

export async function grantSignupCredits(
  tx: TransactionClient,
  userId: string
) {
  // Only teacher and client accounts receive signup credits.
  const user = await tx.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!["TEACHER", "CLIENT"].includes(user.role)) {
    return {
      success: false,
      creditsAwarded: 0,
      message: "This account is not eligible for signup credits.",
    };
  }

  // Unique reference prevents duplicate signup rewards.
  const referenceId = `SIGNUP_FREE_CREDITS_${userId}`;

  const existingTransaction =
    await tx.creditTransaction.findUnique({
      where: {
        referenceId,
      },
    });

  if (existingTransaction) {
    return {
      success: true,
      creditsAwarded: 0,
      alreadyAwarded: true,
      message: "Signup credits have already been awarded.",
    };
  }

  // Read the latest Super Admin pricing setting.
  const credits = await getSignupCredits(tx);

  // Create or update the user's wallet.
  const wallet = await tx.creditWallet.upsert({
    where: {
      userId,
    },

    update: {
      freeCredits: {
        increment: credits,
      },
    },

    create: {
      userId,
      freeCredits: credits,
      purchasedCredits: 0,
      reservedCredits: 0,
      usedCredits: 0,
    },
  });

  // Record the credit allocation.
  await tx.creditTransaction.create({
    data: {
      userId,
      type: "FREE_CREDIT",
      amount: credits,
      balanceAfter: wallet.freeCredits,
      referenceId,
      description: "Free credits awarded during signup",

      metadata: {
        source: "SIGNUP",
        configuredFreeCredits: credits,
        role: user.role,
      },
    },
  });

  return {
    success: true,
    creditsAwarded: credits,
    balance: wallet.freeCredits,
    alreadyAwarded: false,
  };
}