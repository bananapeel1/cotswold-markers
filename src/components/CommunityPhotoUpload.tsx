"use client";

import { useState, useRef } from "react";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface CommunityPhotoUploadProps {
  storagePath: string;
  onUpload: (url: string, path: string) => void;
  onRemove: () => void;
  currentUrl?: string | null;
  maxSizeMB?: number;
}

export default function CommunityPhotoUpload({
  storagePath,
  onUpload,
  onRemove,
  currentUrl,
  maxSizeMB = 5,
}: CommunityPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setError("");

    const fullPath = `${storagePath}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fullPath);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      () => {
        setError("Upload failed");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onUpload(url, fullPath);
        setUploading(false);
        setProgress(0);
      }
    );
  }

  if (currentUrl) {
    return (
      <div className="relative inline-block">
        <img src={currentUrl} alt="Upload" className="h-12 w-12 rounded-md object-cover" />
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center text-[9px]"
        >
          ×
        </button>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-2 w-24">
        <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] text-secondary">{progress}%</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="text-[11px] text-secondary flex items-center gap-1 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">add_a_photo</span>
        Photo
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {error && <p className="text-[10px] text-error">{error}</p>}
    </>
  );
}
