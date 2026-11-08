import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SIGNUP_CREDITS = 5;

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "pricing_settings" },
    });

    const value = setting?.value as {
      freeCreditsOnSignup?: number;
    } | null;

    const credits = Number(
      value?.freeCreditsOnSignup ?? DEFAULT_SIGNUP_CREDITS
    );

    return NextResponse.json({
      freeCreditsOnSignup:
        Number.isInteger(credits) && credits >= 0
          ? credits
          : DEFAULT_SIGNUP_CREDITS,
    });
  } catch (error) {
    console.error("Failed to fetch signup credits:", error);

    return NextResponse.json({
      freeCreditsOnSignup: DEFAULT_SIGNUP_CREDITS,
    });
  }
}