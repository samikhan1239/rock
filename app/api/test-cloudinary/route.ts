import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      {
        folder: "tutorsathi/test",
      }
    );

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error: unknown) {
    console.error("Cloudinary test failed:", error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      http_code: (error as { http_code?: number })?.http_code,
    });
  }
}