import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui-components";
import { Download } from "lucide-react";
import { seedClassPlanFromMaster } from "../../api/lessonPlans.api";
import { useTranslation } from "react-i18next";

/** Derive academic year from today: April onward = new year */
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSeeded: (plan: object) => void,
 *   context: { teacherId: string, campusId: string, sectionId: string, subjectName: string, academicYear: string },
 * }} props
 */
export default function MasterPlanModal({ open, onClose, onSeeded, context }) {
  const { t } = useTranslation();
  const [board, setBoard] = useState("");
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setBoard("");
    setSubject(context.subjectName || "");
    setAcademicYear(context.academicYear || getCurrentAcademicYear());
    setError("");
  }, [open, context]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!board.trim()) { setError(t("lessonPlans.masterPlan.errorBoardRequired")); return; }
    if (!subject.trim()) { setError(t("lessonPlans.masterPlan.errorSubjectRequired")); return; }
    if (!academicYear.trim()) { setError(t("lessonPlans.masterPlan.errorYearRequired")); return; }
    setSeeding(true);
    try {
      const plan = await seedClassPlanFromMaster({
        board: board.trim(),
        subject: subject.trim(),
        section_id: context.sectionId,
        academic_year: academicYear.trim(),
        campus_id: context.campusId,
        teacher_id: context.teacherId,
        is_published: false,
      });
      onSeeded(plan);
    } catch (err) {
      console.error(err);
      setError(err?.message || t("lessonPlans.masterPlan.errorFailed"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <div className="flex items-center gap-3 pr-10">
        <Download className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t("lessonPlans.masterPlan.title")}</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {t("lessonPlans.masterPlan.description")}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("lessonPlans.masterPlan.board")} <span className="text-error-500">*</span>
          </label>
          <Input
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder={t("lessonPlans.masterPlan.boardPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("lessonPlans.masterPlan.subject")} <span className="text-error-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("lessonPlans.masterPlan.subjectPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("lessonPlans.masterPlan.academicYear")} <span className="text-error-500">*</span>
          </label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder={t("lessonPlans.masterPlan.academicYearPlaceholder")}
            required
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" loading={seeding} className="gap-2">
            <Download className="h-4 w-4" />
            {t("lessonPlans.masterPlan.seedPlan")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
