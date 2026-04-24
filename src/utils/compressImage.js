/**
 * Compress an image file in the browser before uploading.
 *
 * Strategy
 * ─────────
 * • PNG  → output as PNG (Canvas round-trips pixel-perfect → truly lossless).
 * • JPEG / WebP / HEIC / anything else
 *        → output as JPEG at quality 0.92.
 *          At this quality level the difference is invisible to the human eye
 *          (industry "visually lossless" threshold) while file size typically
 *          drops 30–60 %.  True mathematical losslessness for photos is not
 *          practical: a 12 MP camera JPEG (~3 MB) re-encoded as PNG becomes
 *          ~15–20 MB.
 *
 * Resizing
 * ────────
 * Images whose longest side exceeds MAX_SIDE are scaled down proportionally.
 * No upscaling ever occurs.  1 920 px is enough for clear face / ID photos.
 *
 * @param {File|Blob} file  Source image.
 * @returns {Promise<Blob>} Compressed image blob with correct MIME type.
 */

const MAX_SIDE = 1920;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // Downscale only — never upscale
      if (w > MAX_SIDE || h > MAX_SIDE) {
        const ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      // PNG → lossless PNG; everything else → high-quality JPEG
      const isPng = file.type === "image/png";
      const outputMime = isPng ? "image/png" : "image/jpeg";
      const quality = isPng ? undefined : 0.92;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas compression produced no output"));
        },
        outputMime,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image for compression"));
    };

    img.src = objectUrl;
  });
}
