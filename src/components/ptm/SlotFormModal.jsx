import { useState, useEffect, useMemo } from "react";
import { usePermissions } from "../../store/permissions.store";

export default function SlotFormModal({ isOpen, onClose, onSubmit, slot, isSubmitting, submitError }) {
  const isEditing = !!slot;
  const { permissions, getStudentsBySection } = usePermissions();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: 1,
  });

  // Teacher-assign state (only relevant on create)
  const [assignToStudent, setAssignToStudent] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      title: slot?.title || "",
      description: slot?.description || "",
      date: slot?.date ? slot.date.split("T")[0] : "",
      start_time: slot?.startTime || "",
      end_time: slot?.endTime || "",
      capacity: slot?.capacity ?? 1,
    });
    setAssignToStudent(false);
    setSelectedSectionId("");
    setSelectedStudentId("");
  }, [isOpen, slot]);

  const studentsInSection = useMemo(() => {
    if (!selectedSectionId) return [];
    return [...(getStudentsBySection(selectedSectionId) || [])].sort((a, b) =>
      (a.student_name || "").localeCompare(b.student_name || "", undefined, { sensitivity: "base" })
    );
  }, [selectedSectionId, getStudentsBySection, permissions.students]);

  const sections = permissions.sections || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (e) => {
    setSelectedSectionId(e.target.value);
    setSelectedStudentId("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!isEditing && assignToStudent && selectedStudentId) {
      payload.student_id = selectedStudentId;
    }
    onSubmit(payload);
  };

  const canSubmit =
    formData.title.trim() &&
    formData.date &&
    formData.start_time &&
    formData.end_time &&
    (!assignToStudent || selectedStudentId) &&
    !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit PTM Slot" : "Create PTM Slot"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g. Term 1 Parent-Teacher Meeting"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              maxLength={300}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              placeholder="Optional details about this meeting"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Max Students (Capacity)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, capacity: Math.max(1, (p.capacity || 1) - 1) }))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-900">{formData.capacity}</span>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, capacity: (p.capacity || 1) + 1 }))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                +
              </button>
              <span className="text-xs text-gray-400 ml-1">student{formData.capacity !== 1 ? "s" : ""} per slot</span>
            </div>
          </div>

          {/* Assign to student — only on create */}
          {!isEditing && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setAssignToStudent((v) => !v);
                  setSelectedSectionId("");
                  setSelectedStudentId("");
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Assign to a specific student</span>
                <span className={`w-8 h-5 rounded-full transition-colors flex-shrink-0 ${assignToStudent ? "bg-blue-500" : "bg-gray-200"}`}>
                  <span className={`block w-4 h-4 mt-0.5 rounded-full bg-white shadow transition-transform ${assignToStudent ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </span>
              </button>

              {assignToStudent && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 bg-gray-50">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block uppercase tracking-wide">Section</label>
                    <select
                      value={selectedSectionId}
                      onChange={handleSectionChange}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select section…</option>
                      {sections.map((sec) => {
                        const cls = (permissions.classes || []).find((c) => c.class_id === sec.class_id);
                        const label = cls ? `${cls.class_name} · ${sec.section_name}` : sec.section_name;
                        return (
                          <option key={sec.section_id} value={sec.section_id}>{label}</option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedSectionId && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block uppercase tracking-wide">Student</label>
                      {studentsInSection.length === 0 ? (
                        <p className="text-sm text-gray-400">No students in this section.</p>
                      ) : (
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select student…</option>
                          {studentsInSection.map((st) => (
                            <option key={st.student_id} value={st.student_id}>
                              {st.student_name || st.student_id}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {assignToStudent && !selectedStudentId && (
                    <p className="text-xs text-amber-600">Please select a student to assign this slot.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
