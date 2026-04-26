import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

export default function StaffLessonPlansHome() {
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  const rows = useMemo(() => {
    const sections = permissions.sections || [];
    return sections.map((s) => {
      const cls = (permissions.classes || []).find((c) => c.class_id === s.class_id);
      return {
        sectionId: s.section_id,
        label: cls ? `${cls.class_name} · ${s.section_name}` : s.section_name,
      };
    });
  }, [permissions.sections, permissions.classes]);

  useEffect(() => {
    if (rows.length === 1) {
      navigate(`/staff/lesson-plans/section/${rows[0].sectionId}`, { replace: true });
    }
  }, [rows, navigate]);

  if (rows.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-gray-900">Lesson plans</h1>
        <p className="mt-3 text-sm text-gray-600">
          No class or section assignments were found. If you just logged in, try refreshing after
          permissions load.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Lesson plans</h1>
      <p className="mt-1 text-sm text-gray-600">Choose a class and section to continue.</p>
      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <Card
            key={r.sectionId}
            className="cursor-pointer transition hover:border-primary-300"
            onClick={() => navigate(`/staff/lesson-plans/section/${r.sectionId}`)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-900">{r.label}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
