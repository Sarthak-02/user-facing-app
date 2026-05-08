/**
 * PhotoPicker
 *
 * Upload-aware photo picker component.
 *
 * Flow
 * ────
 * 1. User clicks "Take Photo" or "From Gallery"
 *    → getPickupPhotoUploadUrl() is called immediately to get a GCS signed URL
 *    → camera overlay or file picker opens at the same time
 * 2. User captures/selects an image
 *    → image is compressed (WebP 0.92)
 *    → compressed blob is PUT to the signed GCS URL
 *    → /pickup/photo/process is called to get the final CDN URL
 * 3. onPhotoUrl(finalUrl, previewUrl) is called — parent stores the final URL
 *    and passes it directly to the create/update API.  No upload on submit.
 *
 * Props
 * ─────
 * entity      "authorized_person" | "pickup_log"
 * entityId    ID of the record (or a pre-generated temp UUID for new records)
 * preview     string | null   — current photo URL to display
 * onPhotoUrl  (url: string, previewUrl: string) => void
 * onRemove    () => void
 */

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, ImageIcon, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import CameraCapture from "./CameraCapture";
import { compressImage } from "../utils/compressImage";
import { getPickupPhotoUploadUrl, processPickupPhoto } from "../api/pickup.api";

export default function PhotoPicker({ entity, entityId, preview, onPhotoUrl, onRemove }) {
  const { t } = useTranslation();
  const galleryRef = useRef(null);
  // Store the in-flight signed-URL promise so compress + fetch can race
  const signedUrlPromiseRef = useRef(null);

  const [showCamera, setShowCamera] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | uploading | error
  const [errorMsg, setErrorMsg] = useState("");

  /** Fire off the signed-URL request immediately — before the user has even
   *  picked a photo.  We'll await it in uploadBlob once we have the blob. */
  function prefetchSignedUrl() {
    signedUrlPromiseRef.current = getPickupPhotoUploadUrl(entity, entityId, "image/webp");
  }

  async function uploadBlob(blob) {
    setStatus("uploading");
    setErrorMsg("");
    try {
      // Both compress and get signed URL start in parallel on button click;
      // by the time we have the blob the URL fetch is usually already done.
      const { uploadUrl: upload_url, objectPath: object_path } = await signedUrlPromiseRef.current;

      // PUT directly to GCS — signed URL handles auth, no Authorization header
      const res = await fetch(upload_url, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": blob.type || "image/webp" },
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const result = await processPickupPhoto(object_path, entity, entityId);
      const finalUrl = result?.photo_url || result?.url || result;
      const previewUrl = URL.createObjectURL(blob);

      setStatus("idle");
      onPhotoUrl(finalUrl, previewUrl);
    } catch {
      setStatus("error");
      setErrorMsg(t("ui.photoPicker.uploadFailed"));
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const blob = await compressImage(file).catch(() => file);
    await uploadBlob(blob);
  }

  async function handleCameraCapture(blob) {
    setShowCamera(false);
    await uploadBlob(blob);
  }

  // ── Uploading state ──────────────────────────────────────────────────────────
  if (status === "uploading") {
    return (
      <div className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-indigo-600">{t("ui.photoPicker.uploading")}</span>
      </div>
    );
  }

  return (
    <>
      {/* Hidden gallery input — no capture attribute so it opens photo library */}
      <input
        type="file"
        accept="image/*"
        ref={galleryRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <CameraCapture
        open={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />

      {/* ── Preview state ──────────────────────────────────────────────── */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={t("ui.photoPicker.previewAlt")}
            className="w-full h-36 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => { prefetchSignedUrl(); setShowCamera(true); }}
              className="bg-white rounded-lg px-2.5 py-2 min-h-[40px] shadow border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-1 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("ui.photoPicker.retake")}
            </button>
            <button
              type="button"
              onClick={() => { prefetchSignedUrl(); galleryRef.current?.click(); }}
              className="bg-white rounded-lg px-2.5 py-2 min-h-[40px] shadow border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-1 hover:bg-gray-50 transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {t("ui.photoPicker.gallery")}
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────── */
        <div className="space-y-2">
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {errorMsg}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { prefetchSignedUrl(); setShowCamera(true); }}
              className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl py-4 min-h-[88px] text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">{t("ui.photoPicker.takePhoto")}</span>
            </button>
            <button
              type="button"
              onClick={() => { prefetchSignedUrl(); galleryRef.current?.click(); }}
              className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl py-4 min-h-[88px] text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{t("ui.photoPicker.fromGallery")}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
