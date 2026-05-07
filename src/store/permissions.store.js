import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialValue = {
  teacher_id: "",
  teacher_name: "",
  teacher_subjects: [],
  classes: [],
  sections: [],
  students: [],
  tier_permissions: [],
};

function normalizeTierPermissions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item : item?.feature_id))
    .filter(Boolean);
}

export const usePermissions = create(
  persist(
    (set, get) => ({
      permissions: initialValue,
      permissionsLoaded: false,
      loading: false,
      error: null,

      // Set permissions (teacher or student)
      setPermissions: (data) => {
        set({
          permissionsLoaded: true,
          permissions: {
            teacher_id: data.teacher_id || "",
            teacher_name: data.teacher_name || "",
            classes: data.classes || [],
            sections: data.sections || [],
            students: data.students || [],
            teacher_subjects: data.teacher_subjects || [],
            tier_permissions: normalizeTierPermissions(data.features ?? data.tier_permissions),
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
          permissionsLoaded: false,
          error: null,
          loading: false,
        });
      },

      // Returns true if featureId is enabled. Accepts string or string[].
      // If permissions haven't been loaded yet, allows everything (avoids flash on refresh).
      isFeatureEnabled: (featureId) => {
        const { permissionsLoaded, permissions } = get();
        if (!permissionsLoaded) return true;
        const tier_permissions = permissions?.tier_permissions;
        if (!Array.isArray(tier_permissions)) return false;
        if (Array.isArray(featureId)) return featureId.some((f) => tier_permissions.includes(f));
        return tier_permissions.includes(featureId);
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

      // Get subjects for a specific section (prefers subjects embedded on the section row from API)
      getSubjectsBySection: (section_id) => {
        const perm = get().permissions;
        const section = (perm.sections || []).find((s) => s.section_id === section_id);
        console.log("section",section.section_subjects);
        if (section && Array.isArray(section.section_subjects) && section.section_subjects.length > 0) {
          return section.section_subjects.map((s) => ({
            subject_id: s,
            subject_name: s,
            section_id: section_id,
          }));
        }
        return [];
      },
    }),
    {
      name: "permissions-store",
    }
  )
);
