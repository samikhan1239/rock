import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "pricing_settings" },
    });

    const value = (setting?.value as Record<string, unknown> | null) || {};

    return NextResponse.json({
      settings: {
        teacherRegistrationFee: Number(value.teacherRegistrationFee ?? 0),
        clientRegistrationFee: Number(value.clientRegistrationFee ?? 0),
        freeCreditsOnSignup: Number(value.freeCreditsOnSignup ?? 5),
        connectionCreditPrice: Number(value.connectionCreditPrice ?? 1),
        creditPacks: Array.isArray(value.creditPacks) ? value.creditPacks : [],
      },
    });
  } catch {
    return NextResponse.json({
      settings: {
        teacherRegistrationFee: 0,
        clientRegistrationFee: 0,
        freeCreditsOnSignup: 5,
        connectionCreditPrice: 1,
        creditPacks: [],
      },
    });
  }
}