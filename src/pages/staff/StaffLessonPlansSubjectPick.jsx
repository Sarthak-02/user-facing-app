import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

export default function StaffLessonPlansSubjectPick() {
  const { sectionId } = useParams();
  console.log("sectionId",sectionId);
  const navigate = useNavigate();
  const { permissions, getSubjectsBySection } = usePermissions();

  const section = (permissions.sections || []).find((s) => s.section_id === sectionId);

  const subjects = useMemo(() => {
    if (!sectionId) return [];
    return getSubjectsBySection(sectionId);
  }, [sectionId, getSubjectsBySection, permissions.sections, permissions.teacher_subjects]);
  
  useEffect(() => {
    if (subjects.length === 1 && sectionId) {
      navigate(`/staff/lesson-plans/section/${sectionId}/subject/${subjects[0].subject_id}`, {
        replace: true,
      });
    }
  }, [subjects, sectionId, navigate]);

  const sectionTitle = useMemo(() => {
    if (!section) return "Section";
    const cls = (permissions.classes || []).find((c) => c.class_id === section.class_id);
    return cls ? `${cls.class_name} · ${section.section_name}` : section.section_name;
  }, [section, permissions.classes]);

  const goBack = () => {
    if ((permissions.sections || []).length > 1) {
      navigate("/staff/lesson-plans");
    } else {
      navigate("/home");
    }
  };

  if (!sectionId || !section) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Section not found.</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={() => navigate("/staff/lesson-plans")}>
          Back
        </Button>
      </div>
    );
  }

  if (subjects.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-gray-900">{sectionTitle}</h1>
        <p className="mt-3 text-sm text-gray-600">No subjects are assigned for this section.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <h1 className="text-xl font-bold text-gray-900">{sectionTitle}</h1>
      <p className="mt-1 text-sm text-gray-600">Choose a subject to view or create lesson plans.</p>
      <div className="mt-6 space-y-2">
        {subjects.map((s) => (
          <Card
            key={s.subject_id}
            className="cursor-pointer transition hover:border-primary-300"
            onClick={() =>
              navigate(`/staff/lesson-plans/section/${sectionId}/subject/${s.subject_id}`)
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-900">{s.subject_name || s.subject_id}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
