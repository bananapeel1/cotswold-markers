"use client";

import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase-client";

interface ImageUploadProps {
  currentUrl: string;
  markerId: string;
  onUpload: (url: string) => void;
}

export default function ImageUpload({ currentUrl, markerId, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Firebase Storage
    const storageRef = ref(storage, `markers/${markerId}/${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      (err) => {
        setError(err.message);
        setUploading(false);
        setPreview(currentUrl);
      },
      async () => {
        const downloadUrl = await getDownloadURL(task.snapshot.ref);
        setPreview(downloadUrl);
        setUploading(false);
        onUpload(downloadUrl);
        URL.revokeObjectURL(localUrl);
      }
    );
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden bg-surface-container">
          <img
            src={preview}
            alt="Marker image"
            className="w-full h-48 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-sm font-bold mb-2">{progress}%</p>
                <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-surface-container text-sm font-bold text-primary hover:bg-surface-container-high transition-all disabled:opacity-50 active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">upload</span>
        {uploading ? "Uploading..." : preview ? "Replace Image" : "Upload Image"}
      </button>

      {error && (
        <p className="text-error text-xs font-bold">{error}</p>
      )}
    </div>
  );
}
