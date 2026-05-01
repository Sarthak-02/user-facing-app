import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui-components";
import { createClassPlan } from "../../api/lessonPlans.api";
import { useTranslation } from "react-i18next";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCreated: (plan: object) => void,
 *   context: { teacherId: string, campusId: string, className: string, subjectName: string, academicYear: string },
 * }} props
 */
export default function CreateClassPlanModal({ open, onClose, onCreated, context }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubject(context.subjectName || "");
    setClassName(context.className || "");
    setAcademicYear(context.academicYear || "");
    setError("");
  }, [open, context]);

  const handleSave = async (isPublished) => {
    setError("");
    if (!subject.trim()) { setError(t("lessonPlans.createModal.errorSubjectRequired")); return; }
    if (!className.trim()) { setError(t("lessonPlans.createModal.errorClassRequired")); return; }
    if (!academicYear.trim()) { setError(t("lessonPlans.createModal.errorAcademicYearRequired")); return; }
    setSubmitting(true);
    try {
      const plan = await createClassPlan({
        campus_id: context.campusId,
        teacher_id: context.teacherId,
        class_name: className.trim(),
        subject: subject.trim(),
        academic_year: academicYear.trim(),
        is_published: isPublished,
      });
      onCreated(plan);
    } catch (err) {
      console.error(err);
      setError(err?.message || t("lessonPlans.createModal.errorFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <h2 className="pr-10 text-lg font-semibold text-gray-900">{t("lessonPlans.createModal.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {t("lessonPlans.createModal.subtitle")}
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.createModal.subject")}</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("lessonPlans.createModal.subjectPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.createModal.class")}</label>
          <Input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder={t("lessonPlans.createModal.classPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.createModal.academicYear")}</label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder={t("lessonPlans.createModal.academicYearPlaceholder")}
            required
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={submitting}
            onClick={() => handleSave(false)}
          >
            {t("lessonPlans.createModal.saveAsDraft")}
          </Button>
          <Button
            type="button"
            loading={submitting}
            onClick={() => handleSave(true)}
          >
            {t("lessonPlans.createModal.publish")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
