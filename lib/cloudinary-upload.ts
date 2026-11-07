export type TeacherAssetType =
  | "profileImage"
  | "introduction"
  | "demo";

export type AIInterviewAssetType = "aiInterview";

type AssetType = TeacherAssetType | AIInterviewAssetType;

type ResourceType = "image" | "video";

interface UploadOptions {
  file: File;
  assetType: TeacherAssetType;
  onProgress?: (progress: number) => void;
}

interface AIInterviewUploadOptions {
  file: File;
  interviewId: string;
  onProgress?: (progress: number) => void;
}

interface SignatureResponse {
  success?: boolean;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder?: string;
  publicId: string;
  resourceType: ResourceType;
  error?: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  resource_type: ResourceType;
  format: string;
  bytes: number;
  duration?: number;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Invalid server response");
  }
}

async function uploadToCloudinary({
  file,
  assetType,
  interviewId,
  onProgress,
}: {
  file: File;
  assetType: AssetType;
  interviewId?: string;
  onProgress?: (progress: number) => void;
}) {
  // 1. Request signed upload parameters.
  const signatureResponse = await fetch(
    "/api/teacher/onboarding/media/signature",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assetType,
        ...(interviewId ? { interviewId } : {}),
      }),
    }
  );

  const signatureData =
    await readJsonResponse<SignatureResponse>(
      signatureResponse
    );

  if (!signatureResponse.ok) {
    console.error("Cloudinary signature API failed:", {
      status: signatureResponse.status,
      response: signatureData,
    });

    throw new Error(
      signatureData.error ||
        `Upload authorization failed (${signatureResponse.status})`
    );
  }

  const {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId,
    resourceType,
  } = signatureData;

  if (
    !cloudName ||
    !apiKey ||
    !timestamp ||
    !signature ||
    !publicId ||
    !resourceType
  ) {
    throw new Error(
      "Incomplete Cloudinary upload authorization."
    );
  }

  // 2. Upload directly to Cloudinary.
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("public_id", publicId);

  if (folder) {
    formData.append("folder", folder);
  }

  const cloudinaryResponse =
    await new Promise<CloudinaryUploadResponse>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
        );

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round(
              (event.loaded / event.total) * 100
            );

            onProgress(progress);
          }
        };

        xhr.onload = () => {
          let response: CloudinaryUploadResponse & {
            error?: { message?: string };
          };

          try {
            response = JSON.parse(xhr.responseText);
          } catch {
            reject(
              new Error("Invalid Cloudinary response")
            );
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            console.error("Cloudinary upload failed:", {
              status: xhr.status,
              response,
            });

            reject(
              new Error(
                response.error?.message ||
                  `Cloudinary upload failed (${xhr.status})`
              )
            );
          }
        };

        xhr.onerror = () => {
          reject(
            new Error("Network error during Cloudinary upload.")
          );
        };

        xhr.onabort = () => {
          reject(new Error("Upload cancelled."));
        };

        xhr.send(formData);
      }
    );

  // 3. Verify uploaded asset and save it in PostgreSQL.
  const completeResponse = await fetch(
    "/api/teacher/onboarding/media/complete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assetType,
        publicId: cloudinaryResponse.public_id,
        ...(interviewId ? { interviewId } : {}),
      }),
    }
  );

  const completeData =
    await readJsonResponse<ApiResponse>(completeResponse);

  if (!completeResponse.ok) {
    console.error("Cloudinary verification failed:", {
      status: completeResponse.status,
      response: completeData,
    });

    throw new Error(
      completeData.error ||
        "Unable to verify and save uploaded media."
    );
  }

  onProgress?.(100);

  return {
    ...cloudinaryResponse,
    ...completeData,
  };
}

// -----------------------------------------
// TEACHER PROFILE MEDIA UPLOAD
// -----------------------------------------

export async function uploadTeacherAsset({
  file,
  assetType,
  onProgress,
}: UploadOptions) {
  return uploadToCloudinary({
    file,
    assetType,
    onProgress,
  });
}

// -----------------------------------------
// AI INTERVIEW RECORDING UPLOAD
// -----------------------------------------

export async function uploadAIInterviewRecording({
  file,
  interviewId,
  onProgress,
}: AIInterviewUploadOptions) {
  if (!interviewId?.trim()) {
    throw new Error("Interview ID is required.");
  }

  if (!file || file.size === 0) {
    throw new Error("Interview recording is empty.");
  }

  return uploadToCloudinary({
    file,
    assetType: "aiInterview",
    interviewId,
    onProgress,
  });
}