import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

import type { UploadApiResponse } from "cloudinary";



const MAX_FILE_SIZE = 45 * 1024 * 1024;

const CLOUDINARY_FOLDER = "tutorsathi/ai-interviews";

// Upload a video buffer to Cloudinary using upload_stream.
function uploadToCloudinary(
  buffer: Buffer,
  interviewId: string,
  mimeType: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: CLOUDINARY_FOLDER,
        public_id: `interview_${interviewId}`,
        overwrite: true,
        invalidate: true,
        format: mimeType.includes("webm") ? "webm" : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned an empty upload response."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(req: Request) {
  let currentStage = "initialization";

  try {
    // 1. Authenticate user
    currentStage = "authentication";

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please log in again.",
        },
        { status: 401 }
      );
    }

    // 2. Read form data
    currentStage = "form-data";

    const formData = await req.formData();

    const video = formData.get("video");
    const interviewId = formData.get("interviewId");
    const recordingDurationValue = formData.get("recordingDuration");

    if (
      !(video instanceof File) ||
      typeof interviewId !== "string" ||
      !interviewId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Video and interviewId are required.",
        },
        { status: 400 }
      );
    }

    // 3. Validate video
    currentStage = "video-validation";

    if (video.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded video is empty.",
        },
        { status: 400 }
      );
    }

    if (video.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Video must be smaller than 45 MB.",
        },
        { status: 413 }
      );
    }

    if (!video.type.startsWith("video/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid video format.",
        },
        { status: 400 }
      );
    }

    // 4. Find teacher
    currentStage = "teacher-lookup";

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
      include: {
        teacherProfile: true,
      },
    });

    if (!user?.teacherProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher profile not found.",
        },
        { status: 404 }
      );
    }

    // 5. Verify interview ownership
    currentStage = "interview-verification";

    const interview = await prisma.aIInterview.findFirst({
      where: {
        id: interviewId,
        teacherId: user.teacherProfile.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        {
          success: false,
          error: "Interview not found or access denied.",
        },
        { status: 404 }
      );
    }

    if (interview.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          error: "This interview has already been completed.",
        },
        { status: 409 }
      );
    }

    // 6. Convert video to Buffer
    currentStage = "video-conversion";

    const buffer = Buffer.from(await video.arrayBuffer());

    const mimeType = video.type || "video/webm";

    // 7. Calculate recording duration
    currentStage = "recording-duration";

    const submittedDuration =
      typeof recordingDurationValue === "string"
        ? Number(recordingDurationValue)
        : 0;

    const recordingDuration =
      Number.isFinite(submittedDuration) && submittedDuration > 0
        ? Math.round(submittedDuration)
        : null;

    // 8. Upload recording to Cloudinary
    currentStage = "cloudinary-upload";

    const uploadResult = await uploadToCloudinary(
      buffer,
      interviewId,
      mimeType
    );

    if (!uploadResult.secure_url || !uploadResult.public_id) {
      throw new Error("Cloudinary upload did not return a valid recording URL.");
    }

    // 9. Save Cloudinary details in database
    currentStage = "database-update";

    await prisma.aIInterview.update({
      where: {
        id: interviewId,
      },
      data: {
        recordingUrl: uploadResult.secure_url,
        recordingPublicId: uploadResult.public_id,
        recordingDuration,
      },
    });

    console.log("AI interview recording uploaded successfully:", {
      interviewId,
      publicId: uploadResult.public_id,
      size: uploadResult.bytes,
      duration: recordingDuration,
      format: uploadResult.format,
      url: uploadResult.secure_url,
    });

    // 10. Return success
    return NextResponse.json(
      {
        success: true,
        message: "Interview recording uploaded successfully.",
        interviewId,
        recording: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          size: uploadResult.bytes,
          duration: recordingDuration,
          format: uploadResult.format,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("AI INTERVIEW RECORDING ERROR:", {
      stage: currentStage,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload interview recording.",
        stage: currentStage,
      },
      { status: 500 }
    );
  }
}