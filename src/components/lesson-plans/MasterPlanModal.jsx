import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui-components";
import { Download } from "lucide-react";
import { seedClassPlanFromMaster } from "../../api/lessonPlans.api";

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
 *   context: { teacherId: string, campusId: string, className: string, subjectName: string, academicYear: string },
 * }} props
 */
export default function MasterPlanModal({ open, onClose, onSeeded, context }) {
  const [board, setBoard] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setBoard("");
    setSubject(context.subjectName || "");
    setClassName(context.className || "");
    setAcademicYear(context.academicYear || getCurrentAcademicYear());
    setError("");
  }, [open, context]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!board.trim()) { setError("Board is required (e.g. CBSE, ICSE)."); return; }
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!className.trim()) { setError("Class name is required."); return; }
    if (!academicYear.trim()) { setError("Academic year is required."); return; }
    setSeeding(true);
    try {
      const plan = await seedClassPlanFromMaster({
        board: board.trim(),
        subject: subject.trim(),
        class_name: className.trim(),
        academic_year: academicYear.trim(),
        campus_id: context.campusId,
        teacher_id: context.teacherId,
        is_published: false,
      });
      onSeeded(plan);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to seed class plan from master. Check the board, subject, class, and year.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <div className="flex items-center gap-3 pr-10">
        <Download className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Pull from Master Plan</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Seed your class plan from the master syllabus database. Matching topics will be imported automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Board <span className="text-error-500">*</span>
          </label>
          <Input
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder="e.g. CBSE, ICSE, State Board"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Subject <span className="text-error-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Class <span className="text-error-500">*</span>
          </label>
          <Input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Class 10, Grade 5"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Academic year <span className="text-error-500">*</span>
          </label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2025-26"
            required
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={seeding} className="gap-2">
            <Download className="h-4 w-4" />
            Seed plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
