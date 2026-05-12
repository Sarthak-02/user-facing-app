import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAttendanceDraft = create(
  persist(
    (set, get) => ({
      drafts: {},
      pendingSubmissions: [],

      saveDraft: (sectionId, date, records) => {
        const key = `${sectionId}_${date}`;
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: { sectionId, date, records, savedAt: new Date().toISOString() },
          },
        }));
      },

      getDraft: (sectionId, date) => {
        return get().drafts[`${sectionId}_${date}`] || null;
      },

      clearDraft: (sectionId, date) => {
        const key = `${sectionId}_${date}`;
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[key];
          return { drafts };
        });
      },

      queueSubmission: (submission) => {
        set((state) => ({
          pendingSubmissions: [
            ...state.pendingSubmissions,
            {
              ...submission,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              queuedAt: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        }));
      },

      removeSubmission: (id) => {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== id),
        }));
      },

      incrementRetry: (id) => {
        set((state) => ({
          pendingSubmissions: state.pendingSubmissions.map((s) =>
            s.id === id ? { ...s, retryCount: s.retryCount + 1 } : s
          ),
        }));
      },
    }),
    { name: "attendance-draft" }
  )
);
