import { useEffect, useState } from "react";
import { Button, Modal } from "../../ui-components";
import { Copy } from "lucide-react";
import { cloneLessonPlan } from "../../api/lessonPlans.api";
import { useTranslation } from "react-i18next";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCloned: (plan: object) => void,
 *   context: { sectionId: string, subjectName: string },
 *   sections: Array<{ section_id: string, section_name: string, class_id: string, section_subjects: string[] }>,
 *   classes: Array<{ class_id: string, class_name: string }>,
 * }} props
 */
export default function CloneFromClassModal({ open, onClose, onCloned, context, sections, classes }) {
  const { t } = useTranslation();
  const [sourceSectionId, setSourceSectionId] = useState("");
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");

  const availableSections = (sections || []).filter(
    (s) =>
      s.section_id !== context.sectionId &&
      Array.isArray(s.section_subjects) &&
      s.section_subjects.includes(context.subjectName)
  );

  useEffect(() => {
    if (!open) return;
    setSourceSectionId(availableSections[0]?.section_id || "");
    setError("");
  }, [open]);

  const getSectionLabel = (section) => {
    const cls = (classes || []).find((c) => c.class_id === section.class_id);
    return cls ? `${cls.class_name} · ${section.section_name}` : section.section_name;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceSectionId) { setError(t("lessonPlans.clone.errorSectionRequired")); return; }
    setError("");
    setCloning(true);
    try {
      const plan = await cloneLessonPlan({
        source_section_id: sourceSectionId,
        destination_section_id: context.sectionId,
        subject: context.subjectName,
      });
      onCloned(plan);
    } catch (err) {
      console.error(err);
      setError(err?.message || t("lessonPlans.clone.errorFailed"));
    } finally {
      setCloning(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <div className="flex items-center gap-3 pr-10">
        <Copy className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t("lessonPlans.clone.title")}</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">{t("lessonPlans.clone.description")}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {availableSections.length === 0 ? (
          <p className="text-sm text-gray-500">{t("lessonPlans.clone.noSectionsAvailable")}</p>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("lessonPlans.clone.sourceClass")} <span className="text-error-500">*</span>
            </label>
            <select
              value={sourceSectionId}
              onChange={(e) => setSourceSectionId(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {availableSections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {getSectionLabel(s)}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          {availableSections.length > 0 && (
            <Button type="submit" loading={cloning} className="gap-2">
              <Copy className="h-4 w-4" />
              {t("lessonPlans.clone.clonePlan")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
