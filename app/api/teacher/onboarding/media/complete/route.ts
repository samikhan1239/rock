import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

    const { assetType, publicId, interviewId } = body as {
      assetType: AssetType;
      publicId: string;
      interviewId?: string;
    };

    if (
      !allowedTypes.includes(assetType) ||
      typeof publicId !== "string" ||
      !publicId
    ) {
      return NextResponse.json(
        { error: "Invalid upload information" },
        { status: 400 }
      );
    }

    const teacherId = user.teacherProfile.id;

    const resourceType =
      assetType === "profileImage" ? "image" : "video";

    // -----------------------------------------
    // VERIFY AI INTERVIEW RECORDING
    // -----------------------------------------

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

      const expectedFolder =
        `tutorsathi/ai-interviews/${teacherId}`;

      const expectedPublicId =
        `${expectedFolder}/interview_${interviewId}`;

      // Verify exact ownership and public ID.
      if (publicId !== expectedPublicId) {
        return NextResponse.json(
          { error: "Invalid interview recording ownership" },
          { status: 403 }
        );
      }

      // Verify interview belongs to this teacher.
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

      // Verify video exists in Cloudinary.
      const asset = await cloudinary.api.resource(publicId, {
        resource_type: "video",
      });

      if (
        asset.public_id !== expectedPublicId ||
        asset.resource_type !== "video"
      ) {
        return NextResponse.json(
          { error: "Cloudinary recording verification failed" },
          { status: 403 }
        );
      }

      if (!asset.secure_url) {
        return NextResponse.json(
          { error: "Recording URL is unavailable" },
          { status: 400 }
        );
      }

      // Save recording details in AIInterview.
      await prisma.aIInterview.update({
        where: {
          id: interviewId,
        },
        data: {
          recordingUrl: asset.secure_url,
          recordingPublicId: asset.public_id,
          recordingDuration:
            typeof asset.duration === "number"
              ? Math.round(asset.duration)
              : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Interview recording verified successfully",
        interviewId,
        recording: {
          url: asset.secure_url,
          publicId: asset.public_id,
          duration: asset.duration || 0,
          format: asset.format,
          bytes: asset.bytes,
        },
      });
    }

    // -----------------------------------------
    // VERIFY TEACHER PROFILE MEDIA
    // -----------------------------------------

    const expectedFolder = `tutorsathi/teachers/${teacherId}`;

    if (!publicId.startsWith(`${expectedFolder}/`)) {
      return NextResponse.json(
        { error: "Invalid Cloudinary asset ownership" },
        { status: 403 }
      );
    }

    const asset = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    if (asset.public_id !== publicId) {
      return NextResponse.json(
        { error: "Cloudinary public ID mismatch" },
        { status: 403 }
      );
    }

    // SAVE PROFILE IMAGE
    if (assetType === "profileImage") {
      await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: {
          profilePhotoUrl: asset.secure_url,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile photo uploaded successfully",
        url: asset.secure_url,
      });
    }

    // SAVE INTRODUCTION / DEMO VIDEO
    const existingVideo = await prisma.teacherVideo.findFirst({
      where: {
        teacherId,
        type: assetType,
      },
    });

    const videoData = {
      url: asset.secure_url,
      publicId: asset.public_id,
      duration: Math.round(asset.duration || 0),
      title:
        assetType === "introduction"
          ? "Introduction Video"
          : "Demo Teaching Video",
    };

    if (existingVideo) {
      await prisma.teacherVideo.update({
        where: { id: existingVideo.id },
        data: videoData,
      });
    } else {
      await prisma.teacherVideo.create({
        data: {
          teacherId,
          type: assetType,
          ...videoData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      url: asset.secure_url,
      duration: asset.duration || 0,
    });
  } catch (error) {
    console.error("Media verification error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify uploaded media",
      },
      { status: 500 }
    );
  }
}