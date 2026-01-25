import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialValue = {
  teacher_id: "",
  teacher_name: "",
  teacher_subjects: [],
  classes: [],
  sections: [],
  students: [],
};

export const usePermissions = create(
  persist(
    (set, get) => ({
      permissions: initialValue,
      loading: false,
      error: null,

      // Set teacher permissions
      setPermissions: (data) => {
        set({
          permissions: {
            teacher_id: data.teacher_id || "",
            teacher_name: data.teacher_name || "",
            classes: data.classes || [],
            sections: data.sections || [],
            students: data.students || [],
            teacher_subjects: data.teacher_subjects || [],
          },
          error: null,
        });
      },

      // Update loading state
      setLoading: (loading) => set({ loading }),

      // Set error
      setError: (error) => set({ error, loading: false }),

      // Clear permissions
      clearPermissions: () => {
        set({
          permissions: initialValue,
          error: null,
          loading: false,
        });
      },

      // Get classes
      getClasses: () => get().permissions.classes,

      // Get sections for a specific class
      getSectionsByClass: (class_id) => {
        return get().permissions.sections.filter(
          (section) => section.class_id === class_id
        );
      },

      // Get students for a specific section
      getStudentsBySection: (section_id) => {
        return get().permissions.students.filter(
          (student) => student.section_id === section_id
        );
      },

      // Get all teacher subjects
      getTeacherSubjects: () => get().permissions.teacher_subjects,

      // Get subjects for a specific section
      getSubjectsBySection: (section_id) => {
        return get().permissions.teacher_subjects.filter(
          (subject) => subject.section_id === section_id
        );
      },
    }),
    {
      name: "permissions-store",
    }
  )
);
