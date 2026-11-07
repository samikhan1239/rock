import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const PRICING_KEY = "pricing_settings";

export type CreditPack = {
  credits: number;
  amount: number;
  label: string;
  popular?: boolean;
};

export type PricingSettings = {
  teacherRegistrationFee: number;
  clientRegistrationFee: number;
  connectionCreditPrice: number;
  teacherSubscriptionMonthly: number;
  clientSubscriptionMonthly: number;
  freeCreditsOnSignup: number;
  platformCommissionPercent: number;
  creditPacks: CreditPack[];
};

const DEFAULT_SETTINGS: PricingSettings = {
  teacherRegistrationFee: 0,
  clientRegistrationFee: 0,
  connectionCreditPrice: 1,
  teacherSubscriptionMonthly: 299,
  clientSubscriptionMonthly: 199,
  freeCreditsOnSignup: 5,
  platformCommissionPercent: 10,
  creditPacks: [
    { credits: 5, amount: 99, label: "Starter" },
    { credits: 15, amount: 249, label: "Popular", popular: true },
    { credits: 40, amount: 599, label: "Pro" },
  ],
};

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: PRICING_KEY },
    });

   const saved = (setting?.value as Partial<PricingSettings> | null) || null;

return NextResponse.json({
  settings: {
    ...DEFAULT_SETTINGS,
    ...(saved || {}),
    creditPacks:
      Array.isArray(saved?.creditPacks) && saved.creditPacks.length > 0
        ? saved.creditPacks
        : DEFAULT_SETTINGS.creditPacks,
  },
});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PricingSettings;

    // Basic validation for credit packs
    if (!Array.isArray(body.creditPacks) || body.creditPacks.length === 0) {
      return NextResponse.json(
        { error: "At least one credit pack is required" },
        { status: 400 }
      );
    }

    for (const pack of body.creditPacks) {
      if (!pack.credits || pack.credits < 1 || !pack.amount || pack.amount < 1) {
        return NextResponse.json(
          { error: "Each pack needs valid credits and amount" },
          { status: 400 }
        );
      }
    }

    await prisma.platformSetting.upsert({
      where: { key: PRICING_KEY },
      update: {
        value: body,
        updatedBy: userId,
      },
      create: {
        key: PRICING_KEY,
        value: body,
        description: "Dynamic pricing + credit packs",
        updatedBy: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save pricing" },
      { status: 500 }
    );
  }
}