import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PACKS = [
  { credits: 5, amount: 99, label: "Starter" },
  { credits: 15, amount: 249, label: "Popular", popular: true },
  { credits: 40, amount: 599, label: "Pro" },
];

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "pricing_settings" },
    });

    const value = setting?.value as { creditPacks?: typeof DEFAULT_PACKS } | null;
    const packs =
      value?.creditPacks && value.creditPacks.length > 0
        ? value.creditPacks
        : DEFAULT_PACKS;

    return NextResponse.json({ packs });
  } catch {
    return NextResponse.json({ packs: DEFAULT_PACKS });
  }
}