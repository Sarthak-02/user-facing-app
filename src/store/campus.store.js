import { create } from "zustand";

export const useCampus = create((set, get) => ({
  // State
  campusDetails: {
    campus_id: "",
    class: "",
    sections: [],
    students: []
  },
  loading: false,
  error: null,

  // Actions
  setCampusDetails: (details) => {
    set({
      campusDetails: {
        campus_id: details.campus_id || "",
        class: details.class || "",
        sections: details.sections || [],
        students: details.students || []
      },
      error: null
    });
  },

  updateCampusId: (campus_id) => {
    set({
      campusDetails: {
        ...get().campusDetails,
        campus_id
      }
    });
  },

  updateClass: (classValue) => {
    set({
      campusDetails: {
        ...get().campusDetails,
        class: classValue
      }
    });
  },

  updateSections: (sections) => {
    set({
      campusDetails: {
        ...get().campusDetails,
        sections
      }
    });
  },

  updateStudents: (students) => {
    set({
      campusDetails: {
        ...get().campusDetails,
        students
      }
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  clearCampusDetails: () => {
    set({
      campusDetails: {
        campus_id: "",
        class: "",
        sections: [],
        students: []
      },
      error: null
    });
  }
}));
