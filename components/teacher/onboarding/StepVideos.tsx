"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Upload,
  ImagePlus,
  Video,
  UserRound,
  X,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  FileVideo,
  FileImage,
  Cloud,
  Clock,
  Loader2,
} from "lucide-react";

// ========================================
// TYPES
// ========================================

export interface VideosData {
  profileImage: File | null;
  introduction: File | null;
  demo: File | null;
}

export interface MediaUploadStatus {
  profileImage: boolean;
  introduction: boolean;
  demo: boolean;
}

export type FileField = keyof VideosData;

export type MediaUploadProgress = Partial<
  Record<FileField, number>
>;

export type MediaUploadErrors = Partial<
  Record<FileField, string>
>;

export type MediaUploadingState = Partial<
  Record<FileField, boolean>
>;

interface Props {
  videos: VideosData;
  onChange: (videos: VideosData) => void;

  // True only after Cloudinary upload and server confirmation.
  uploadStatus?: MediaUploadStatus;

  // Real upload state supplied by the parent.
  uploading?: MediaUploadingState;

  // Upload progress from 0 to 100.
  uploadProgress?: MediaUploadProgress;

  // Upload errors supplied by the parent.
  uploadErrors?: MediaUploadErrors;
}

// ========================================
// REUSABLE COMPONENTS
// ========================================

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

// ========================================
// FILE SIZE FORMATTER
// ========================================

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(0)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// ========================================
// FILE STATUS
// ========================================

function FileStatus({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
      <FileImage className="h-3.5 w-3.5 shrink-0 text-indigo-600" />

      <span className="max-w-full break-all text-slate-700">
        {file.name}
      </span>

      <span className="text-slate-400">
        · {formatFileSize(file.size)}
      </span>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="ml-1 font-medium text-slate-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}

// ========================================
// UPLOAD STATUS
// ========================================

function UploadStatus({
  file,
  uploaded,
  uploading,
  progress,
  error,
}: {
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
  progress?: number;
  error?: string;
}) {
  if (!file) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        No file selected
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600"
        role="alert"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {error}
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Successfully uploaded to Cloudinary
      </div>
    );
  }

  if (uploading) {
    const percentage = Math.min(
      100,
      Math.max(0, progress ?? 0)
    );

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-indigo-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading to Cloudinary...
          </span>

          <span className="font-semibold tabular-nums text-indigo-600">
            {percentage}%
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100"
          role="progressbar"
          aria-label="File upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <p className="text-[11px] text-slate-400">
          Please keep this page open until the upload finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600">
      <Cloud className="h-3.5 w-3.5" />

      Selected — Waiting for upload
    </div>
  );
}

// ========================================
// ERROR MESSAGE
// ========================================

function ErrorMessage({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <p
      className="mt-2 flex items-center gap-1.5 text-xs text-red-600"
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ========================================
// VIDEO PREVIEW
// ========================================

function VideoPreview({
  previewUrl,
}: {
  previewUrl: string;
}) {
  if (!previewUrl) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-black">
      <video
        src={previewUrl}
        controls
        playsInline
        preload="metadata"
        className="max-h-64 w-full object-contain"
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function StepVideos({
  videos,
  onChange,
  uploadStatus,
  uploading,
  uploadProgress,
  uploadErrors,
}: Props) {
  const [errors, setErrors] = useState<
    Partial<Record<FileField, string>>
  >({});

  // Preview URLs are generated in file-selection event handlers.
  const [previewUrls, setPreviewUrls] = useState<
    Partial<Record<FileField, string>>
  >({});

  // Keep the latest URLs available for cleanup.
  const previewUrlsRef = useRef<
    Partial<Record<FileField, string>>
  >({});

  const uploaded = uploadStatus ?? {
    profileImage: false,
    introduction: false,
    demo: false,
  };

  const uploadInProgress = uploading ?? {};

  const progress = uploadProgress ?? {};

  const serverErrors = uploadErrors ?? {};

  // ========================================
  // CLEAN UP OBJECT URLS ON UNMOUNT
  // ========================================

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // ========================================
  // PREVIEW URL MANAGEMENT
  // ========================================

  const updatePreview = (
    field: FileField,
    file: File | null
  ) => {
    const previousUrl = previewUrlsRef.current[field];

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    if (!file) {
      delete previewUrlsRef.current[field];

      setPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });

      return;
    }

    const newUrl = URL.createObjectURL(file);

    previewUrlsRef.current[field] = newUrl;

    setPreviewUrls((prev) => ({
      ...prev,
      [field]: newUrl,
    }));
  };

  
  // ========================================
  // UPDATE FILE
  // ========================================

  const updateFile = (
    field: FileField,
    file: File | null
  ) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    if (!file) {
      updatePreview(field, null);

      onChange({
        ...videos,
        [field]: null,
      });

      return;
    }

    // PROFILE IMAGE VALIDATION
    if (field === "profileImage") {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          profileImage:
            "Please upload a JPG, PNG, or WebP image.",
        }));

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profileImage:
            "Image size must not exceed 5 MB.",
        }));

        return;
      }
    }

    // VIDEO VALIDATION
    if (
      field === "introduction" ||
      field === "demo"
    ) {
      if (!file.type.startsWith("video/")) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Please select a valid video file.",
        }));

        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Video size must not exceed 100 MB.",
        }));

        return;
      }
    }

    // Create preview immediately after successful validation.
    updatePreview(field, file);

    onChange({
      ...videos,
      [field]: file,
    });
  };

  // ========================================
  // REMOVE FILE
  // ========================================

  const removeFile = (field: FileField) => {
    if (uploadInProgress[field]) return;

    updatePreview(field, null);

    onChange({
      ...videos,
      [field]: null,
    });

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // ========================================
  // INPUT HANDLER
  // ========================================

  const handleFileChange = (
    field: FileField,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    updateFile(field, file);

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // ========================================
  // STYLES
  // ========================================

  const uploadBoxClass =
    "flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/30";

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-8">

      {/* PROFILE PHOTO */}

      <section className="space-y-4">
        <SectionHeader
          icon={<UserRound className="h-4 w-4" />}
          title="Profile Photo"
          description="Upload a clear, professional photo so students can recognize you."
        />

        <div className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">

          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {previewUrls.profileImage ? (
              <img
                src={previewUrls.profileImage}
                alt="Profile photo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-10 w-10 text-slate-300" />
            )}

            {uploadInProgress.profileImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-medium text-slate-800">
              {videos.profileImage
                ? videos.profileImage.name
                : "Upload your profile photo"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG or WebP. Maximum size: 5 MB.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!!uploadInProgress.profileImage}
                onClick={() =>
                  document
                    .getElementById("profile-image-input")
                    ?.click()
                }
                className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" />

                {videos.profileImage
                  ? "Change Photo"
                  : "Choose Photo"}
              </Button>

              {videos.profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!!uploadInProgress.profileImage}
                  onClick={() => removeFile("profileImage")}
                  className="h-8 text-slate-500 hover:text-red-600"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>

            <Input
              id="profile-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) =>
                handleFileChange("profileImage", e)
              }
            />

            <ErrorMessage message={errors.profileImage} />

            <UploadStatus
              file={videos.profileImage}
              uploaded={uploaded.profileImage}
              uploading={!!uploadInProgress.profileImage}
              progress={progress.profileImage}
              error={serverErrors.profileImage}
            />
          </div>
        </div>
      </section>

      {/* INTRODUCTION VIDEO */}

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <SectionHeader
          icon={<Video className="h-4 w-4" />}
          title="Introduction Video"
          description="Introduce yourself, your educational background, and your teaching experience."
        />

        <div className={uploadBoxClass}>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <PlayCircle className="h-5 w-5" />
          </div>

          <p className="max-w-full break-all text-sm font-medium text-slate-800">
            {videos.introduction
              ? videos.introduction.name
              : "Upload your introduction"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recommended duration: 1–2 minutes
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!uploadInProgress.introduction}
            onClick={() =>
              document
                .getElementById("introduction-video-input")
                ?.click()
            }
            className="mt-3 h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />

            {videos.introduction
              ? "Change Video"
              : "Choose Video"}
          </Button>

          <Input
            id="introduction-video-input"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) =>
              handleFileChange("introduction", e)
            }
          />

          <ErrorMessage message={errors.introduction} />

          {videos.introduction && !errors.introduction && (
            <>
              <FileStatus
                file={videos.introduction}
                onRemove={() => removeFile("introduction")}
                disabled={!!uploadInProgress.introduction}
              />

              <UploadStatus
                file={videos.introduction}
                uploaded={uploaded.introduction}
                uploading={!!uploadInProgress.introduction}
                progress={progress.introduction}
                error={serverErrors.introduction}
              />

              <div className="w-full">
                <VideoPreview
                  previewUrl={previewUrls.introduction ?? ""}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* DEMO TEACHING VIDEO */}

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <SectionHeader
          icon={<Video className="h-4 w-4" />}
          title="Demo Teaching Video"
          description="Demonstrate your teaching style by explaining a topic from one of your subjects."
        />

        <div className={uploadBoxClass}>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <FileVideo className="h-5 w-5" />
          </div>

          <p className="max-w-full break-all text-sm font-medium text-slate-800">
            {videos.demo
              ? videos.demo.name
              : "Upload your teaching demonstration"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recommended duration: 3–5 minutes
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!uploadInProgress.demo}
            onClick={() =>
              document
                .getElementById("demo-video-input")
                ?.click()
            }
            className="mt-3 h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />

            {videos.demo
              ? "Change Video"
              : "Choose Video"}
          </Button>

          <Input
            id="demo-video-input"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) =>
              handleFileChange("demo", e)
            }
          />

          <ErrorMessage message={errors.demo} />

          {videos.demo && !errors.demo && (
            <>
              <FileStatus
                file={videos.demo}
                onRemove={() => removeFile("demo")}
                disabled={!!uploadInProgress.demo}
              />

              <UploadStatus
                file={videos.demo}
                uploaded={uploaded.demo}
                uploading={!!uploadInProgress.demo}
                progress={progress.demo}
                error={serverErrors.demo}
              />

              <div className="w-full">
                <VideoPreview
                  previewUrl={previewUrls.demo ?? ""}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* UPLOAD GUIDELINES */}

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

          <div>
            <p className="text-xs font-semibold text-indigo-900">
              Video Recording Tips
            </p>

            <ul className="mt-1.5 space-y-1 text-xs leading-5 text-indigo-900/75">
              <li>
                • Record in a well-lit and quiet environment.
              </li>

              <li>
                • Keep your face and voice clearly visible and audible.
              </li>

              <li>
                • Use a stable camera and landscape orientation.
              </li>

              <li>
                • Avoid background noise and unnecessary editing.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FILE SUMMARY */}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-indigo-600" />

          <h4 className="text-sm font-semibold text-slate-800">
            Media Upload Summary
          </h4>
        </div>

        <div className="mt-3 space-y-3">
          {(
            [
              {
                key: "profileImage",
                label: "Profile Photo",
              },
              {
                key: "introduction",
                label: "Introduction Video",
              },
              {
                key: "demo",
                label: "Demo Teaching Video",
              },
            ] as const
          ).map((item) => {
            const file = videos[item.key];
            const isUploaded = uploaded[item.key];
            const isUploading = !!uploadInProgress[item.key];
            const error = serverErrors[item.key];

            return (
              <div
                key={item.key}
                className="flex flex-col gap-1.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-xs font-medium text-slate-600">
                  {item.label}
                </span>

                {!file ? (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Not selected
                  </span>
                ) : error ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Upload failed
                  </span>
                ) : isUploaded ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Uploaded to Cloudinary
                  </span>
                ) : isUploading ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading {progress[item.key] ?? 0}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    Waiting for upload
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-400">
          Your media is securely uploaded to Cloudinary. Upload progress and confirmation are displayed above.
        </p>
      </div>
    </div>
  );
}