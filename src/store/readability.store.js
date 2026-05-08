import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Persisted display preferences (local device).
 * textScale "comfortable" maps to html[data-text-scale="comfortable"] (see theme.css).
 */
export const useReadabilityStore = create(
  persist(
    (set) => ({
      textScale: "default",
      setTextScale: (value) =>
        set({ textScale: value === "comfortable" ? "comfortable" : "default" }),
    }),
    { name: "digischool-readability-v1" },
  ),
);
