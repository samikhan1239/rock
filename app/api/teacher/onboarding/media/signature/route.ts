import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

const allowedTypes = [
  "profileImage",
  "introduction",
  "demo",
  "aiInterview",
] as const;

type AssetType = (typeof allowedTypes)[number];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { teacherProfile: true },
    });

    if (!user || user.role !== "TEACHER" || !user.teacherProfile) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const assetType = body.assetType as AssetType;
    const interviewId = body.interviewId;

    if (!allowedTypes.includes(assetType)) {
      return NextResponse.json(
        { error: "Invalid asset type" },
        { status: 400 }
      );
    }

    const teacherId = user.teacherProfile.id;

    const resourceType =
      assetType === "profileImage" ? "image" : "video";

    let folder: string;
    let publicId: string;

    // AI INTERVIEW RECORDING
    if (assetType === "aiInterview") {
      if (
        typeof interviewId !== "string" ||
        !interviewId.trim()
      ) {
        return NextResponse.json(
          { error: "Interview ID is required" },
          { status: 400 }
        );
      }

      const interview = await prisma.aIInterview.findFirst({
        where: {
          id: interviewId,
          teacherId,
          status: "in_progress",
        },
        select: {
          id: true,
        },
      });

      if (!interview) {
        return NextResponse.json(
          { error: "Active interview not found" },
          { status: 404 }
        );
      }

      folder = `tutorsathi/ai-interviews/${teacherId}`;
      publicId = `interview_${interviewId}`;
    } else {
      // TEACHER PROFILE MEDIA
      folder = `tutorsathi/teachers/${teacherId}`;
      publicId = `${assetType}_${randomUUID()}`;
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return NextResponse.json(
      { error: "Unable to authorize upload" },
      { status: 500 }
    );
  }
}