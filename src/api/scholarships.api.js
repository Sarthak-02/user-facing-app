import api from "./axios";

/**
 * Fetch all scholarships from the user-facing API.
 * @returns {Promise<Array>} List of scholarship records
 */
export async function getScholarships() {
  try {
    const response = await api.get("/scholarships");
    const raw = response.data?.data ?? response.data ?? [];
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    console.error("Error fetching scholarships:", err.response?.data);
    throw err.response?.data || err;
  }
}
