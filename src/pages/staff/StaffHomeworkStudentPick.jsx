import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

export default function StaffHomeworkStudentPick() {
  const { t } = useTranslation();
  const { sectionId, subjectId: subjectIdParam } = useParams();
  const navigate = useNavigate();
  const { permissions, getSubjectsBySection, getStudentsBySection } = usePermissions();

  const subjectIdKey = subjectIdParam || "";

  const section = (permissions.sections || []).find((s) => s.section_id === sectionId);

  const subjectsInSection = useMemo(
    () => (sectionId ? getSubjectsBySection(sectionId) : null) || [],
    [sectionId, getSubjectsBySection, permissions.sections, permissions.teacher_subjects]
  );

  const subjectMeta = useMemo(
    () => subjectsInSection.find((s) => s.subject_id === subjectIdKey),
    [subjectsInSection, subjectIdKey]
  );

  const students = useMemo(() => {
    if (!sectionId) return [];
    const list = getStudentsBySection(sectionId) || [];
    return [...list].sort((a, b) =>
      (a.student_name || "").localeCompare(b.student_name || "", undefined, { sensitivity: "base" })
    );
  }, [sectionId, getStudentsBySection, permissions.students]);

  const subjectEnc = useMemo(() => encodeURIComponent(subjectIdKey), [subjectIdKey]);

  useEffect(() => {
    if (students.length === 1 && sectionId && subjectIdKey) {
      const sid = encodeURIComponent(students[0].student_id);
      navigate(`/staff/homework/section/${sectionId}/subject/${subjectEnc}/student/${sid}`, {
        replace: true,
      });
    }
  }, [students, sectionId, subjectIdKey, subjectEnc, navigate]);

  const sectionTitle = useMemo(() => {
    if (!section) return t("staffPicker.sectionFallback");
    const cls = (permissions.classes || []).find((c) => c.class_id === section.class_id);
    return cls ? `${cls.class_name} · ${section.section_name}` : section.section_name;
  }, [section, permissions.classes, t]);

  const subjectTitle = subjectMeta?.subject_name || subjectIdKey || t("staffPicker.subjectFallback");

  const goBack = () => {
    navigate(`/staff/homework/section/${sectionId}`);
  };

  if (!sectionId || !section || !subjectIdKey) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
        <p className="text-sm text-gray-600">{t("staffPicker.invalidRoute")}</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={() => navigate("/staff/homework")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (subjectsInSection.length > 0 && !subjectMeta) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
        <p className="text-sm text-gray-600">{t("staffPicker.subjectNotFound")}</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={goBack}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (students.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-xl font-bold text-gray-900">{subjectTitle}</h1>
        <p className="mt-1 text-sm text-gray-600">{sectionTitle}</p>
        <p className="mt-3 text-sm text-gray-600">{t("staffPicker.noStudents")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>
      <h1 className="text-xl font-bold text-gray-900">{subjectTitle}</h1>
      <p className="mt-1 text-sm text-gray-600">{sectionTitle}</p>
      <p className="mt-3 text-sm text-gray-600">{t("staffPicker.chooseStudent")}</p>
      <div className="mt-6 space-y-2">
        {students.map((st) => (
          <Card
            key={st.student_id}
            className="cursor-pointer transition hover:border-primary-300"
            onClick={() => {
              const sid = encodeURIComponent(st.student_id);
              navigate(`/staff/homework/section/${sectionId}/subject/${subjectEnc}/student/${sid}`);
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-900">{st.student_name || st.student_id}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
