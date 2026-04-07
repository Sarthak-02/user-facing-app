import { useMemo } from "react";
import { useAuth } from "../store/auth.store";
import { usePermissions } from "../store/permissions.store";

/**
 * Sections the teacher can take attendance for — same shape as lesson plans when
 * permissions exist; falls back to auth.details sections from login.
 */
export function useTeacherSectionRows() {
  const { auth } = useAuth();
  const { permissions } = usePermissions();

  return useMemo(() => {
    const permSections = permissions.sections || [];
    if (permSections.length > 0) {
      return permSections.map((s) => {
        const cls = (permissions.classes || []).find((c) => c.class_id === s.class_id);
        return {
          sectionId: s.section_id,
          label: cls ? `${cls.class_name} · ${s.section_name}` : s.section_name,
        };
      });
    }
    return (auth.sections || []).map((s) => ({
      sectionId: String(s.value),
      label: s.label || String(s.value),
    }));
  }, [permissions.sections, permissions.classes, auth.sections]);
}
