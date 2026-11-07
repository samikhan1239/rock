import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

function ProfileImagePreview({ file }: { file: File | null }) {
  const [preview, setPreview] = useState<{
    file: File;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview({
          file,
          url: reader.result,
        });
      }
    };

    reader.onerror = () => {
      console.error("Failed to read profile image.");
    };

    reader.readAsDataURL(file);

    return () => {
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file]);

  const previewUrl = preview?.file === file ? preview.url : null;

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Profile preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="h-10 w-10 text-indigo-400" />
      )}
    </div>
  );
}