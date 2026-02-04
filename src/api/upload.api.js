import api from "./axios";
import axios from "axios"; // IMPORTANT

export async function generateImageSignedUrl(data) {
  const { file, ...payload } = data;

  try {
    // 1️⃣ Get signed URL from backend
    const resp = await api.post("/images/upload-url", payload);

    const { uploadUrl, expectedUrls } = resp.data;

    // 2️⃣ Upload image directly to GCS
    await uploadImage(uploadUrl, file);

    // 3️⃣ Return optimized image URLs
    return expectedUrls;
  } catch (err) {
    console.error("Image upload failed:", err);
    throw err;
  }
}

export async function uploadImage(uploadUrl, file) {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    return true;
  } catch (err) {
    console.error("GCS upload failed:", err);
    throw err;
  }
}
