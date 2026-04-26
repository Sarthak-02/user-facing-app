/**
 * Compress an image file in the browser before uploading.
 *
 * Strategy
 * ─────────
 * All inputs → WebP at quality 0.92 (visually lossless threshold).
 *
 * Why WebP over PNG or JPEG:
 *   • WebP 0.92  ≈ 65–70 % the size of an equivalent JPEG at 0.92
 *   • WebP 0.92  ≈ 10–20 % the size of a lossless PNG of the same photo
 *   • Quality 0.92 is imperceptible to the human eye for face/ID photos
 *
 * Note: canvas.toBlob('image/webp', quality) always produces lossy WebP —
 * the Canvas API does not expose lossless WebP encoding.  Lossless WebP would
 * be no better than PNG for photographs anyway.
 *
 * Fallback: if the browser does not support WebP encoding (rare — all modern
 * browsers do), canvas.toBlob returns null and we fall back to JPEG 0.92.
 *
 * Resizing
 * ────────
 * Images whose longest side exceeds MAX_SIDE are scaled down proportionally.
 * No upscaling ever occurs.  1 920 px is enough for clear face / ID photos.
 *
 * @param {File|Blob} file  Source image.
 * @returns {Promise<Blob>} Compressed WebP (or JPEG fallback) blob.
 */

const MAX_SIDE = 1920;
const QUALITY = 0.92;

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
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      // Try WebP first; fall back to JPEG if the browser doesn't support it
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // WebP not supported — fall back to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) resolve(jpegBlob);
                else reject(new Error("Canvas compression produced no output"));
              },
              "image/jpeg",
              QUALITY,
            );
          }
        },
        "image/webp",
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image for compression"));
    };

    img.src = objectUrl;
  });
}
