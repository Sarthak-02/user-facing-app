/**
 * CameraCapture
 *
 * Full-screen in-app camera using getUserMedia.
 * - Rear camera by default; flip button to switch.
 * - Capture button snapshots the video frame → compressed Blob.
 * - Graceful fallback: if getUserMedia is unavailable or denied, surfaces
 *   an error message and lets the parent fall back to the file input gallery.
 *
 * Props
 * ─────
 * open      boolean        Whether the camera overlay is visible.
 * onCapture (blob, previewUrl) => void   Called with compressed Blob + object URL.
 * onClose   () => void     Called when user dismisses without capturing.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { compressImage } from "../utils/compressImage";

export default function CameraCapture({ open, onCapture, onClose }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [ready, setReady] = useState(false);       // video metadata loaded
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("ui.camera.apiNotSupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? t("ui.camera.accessDenied")
          : err.name === "NotFoundError"
            ? t("ui.camera.noCameraFound")
            : t("ui.camera.couldNotOpen");
      setError(msg);
    }
  }, [facingMode, stopStream, t]);

  // Start/restart stream when overlay opens or facing mode flips
  useEffect(() => {
    if (open) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [open, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    stopStream();
    onClose();
  }

  function flipCamera() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  async function handleCapture() {
    if (!videoRef.current || !ready) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      // canvas.toBlob is async; wrap in Promise
      const rawBlob = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", 1.0)
      );

      // Run through our compress utility (JPEG 0.92 — visually lossless)
      const compressed = await compressImage(rawBlob);
      const previewUrl = URL.createObjectURL(compressed);

      stopStream();
      onCapture(compressed, previewUrl);
    } catch (err) {
      setError(t("ui.camera.captureFailed"));
    } finally {
      setCapturing(false);
    }
  }

  if (!open) return null;

  return (
    // Full-screen overlay — above all modals (z-[60])
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label={t("ui.camera.closeCamera")}
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={flipCamera}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label={t("ui.camera.flipCamera")}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* ── Video feed ──────────────────────────────────────────────────── */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-white text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            {t("ui.camera.useGalleryInstead")}
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline   // Required on iOS — prevents fullscreen native player
          muted
          onLoadedMetadata={() => setReady(true)}
          className="flex-1 w-full object-cover"
          style={{
            // Mirror front camera so it feels natural
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />
      )}

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      {!error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center pb-10 pt-6 bg-gradient-to-t from-black/60 to-transparent">
          {!ready ? (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={capturing}
              aria-label={t("ui.camera.takePhoto")}
              className="relative w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-60"
            >
              {/* Outer ring */}
              <span className="absolute inset-0 rounded-full border-4 border-white" />
              {/* Inner fill */}
              {capturing ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-white" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
