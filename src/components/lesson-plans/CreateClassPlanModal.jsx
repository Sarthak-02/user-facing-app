import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui-components";
import { createClassPlan } from "../../api/lessonPlans.api";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCreated: (plan: object) => void,
 *   context: { teacherId: string, campusId: string, className: string, subjectName: string, academicYear: string },
 * }} props
 */
export default function CreateClassPlanModal({ open, onClose, onCreated, context }) {
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
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!className.trim()) { setError("Class name is required."); return; }
    if (!academicYear.trim()) { setError("Academic year is required."); return; }
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
      setError(err?.message || "Failed to create class plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <h2 className="pr-10 text-lg font-semibold text-gray-900">Create class plan</h2>
      <p className="mt-1 text-sm text-gray-500">
        Review the details below, then save as a draft or publish immediately.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
          <Input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Class 10"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Academic year</label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2025-26"
            required
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={submitting}
            onClick={() => handleSave(false)}
          >
            Save as draft
          </Button>
          <Button
            type="button"
            loading={submitting}
            onClick={() => handleSave(true)}
          >
            Publish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
