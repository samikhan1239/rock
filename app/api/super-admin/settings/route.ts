import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const SETTINGS_KEY = "platform_settings";

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    return NextResponse.json({
      settings: setting?.value || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await prisma.platformSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: {
        value: body,
        updatedBy: userId,
      },
      create: {
        key: SETTINGS_KEY,
        value: body,
        description: "Platform feature toggles",
        updatedBy: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}