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

  // Student booking state — only used on create
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      title: slot?.title || "",
      description: slot?.description || "",
      date: slot?.date ? slot.date.split("T")[0] : "",
      start_time: slot?.startTime || "",
      end_time: slot?.endTime || "",
      capacity: 9999,
    });
    setSelectedSectionId("");
    setSelectedStudentIds(new Set());
  }, [isOpen, slot]);

  const studentsInSection = useMemo(() => {
    if (!selectedSectionId) return [];
    return [...(getStudentsBySection(selectedSectionId) || [])].sort((a, b) =>
      (a.student_name || "").localeCompare(b.student_name || "", undefined, { sensitivity: "base" })
    );
  }, [selectedSectionId, getStudentsBySection, permissions.students]);

  const sections = permissions.sections || [];
  const capacity = formData.capacity || 1;
  const spotsLeft = capacity - selectedStudentIds.size;

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else if (next.size < capacity) {
        next.add(studentId);
      }
      return next;
    });
  };

  // When capacity decreases, trim excess selections
  useEffect(() => {
    if (selectedStudentIds.size > capacity) {
      const trimmed = [...selectedStudentIds].slice(0, capacity);
      setSelectedStudentIds(new Set(trimmed));
    }
  }, [capacity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const studentBookings = isEditing ? [] : [...selectedStudentIds].map((id) => ({ student_id: id }));
    onSubmit({ formData, studentBookings });
  };

  const canSubmit =
    formData.title.trim() &&
    formData.date &&
    formData.start_time &&
    formData.end_time &&
    !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
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
          {/* Title */}
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

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
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

          {/* Date */}
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

          {/* Start / End time */}
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

          {/* Book students — only on create */}
          {!isEditing && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Book for Students
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                {selectedStudentIds.size > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    {selectedStudentIds.size} selected
                  </span>
                )}
              </div>

              {/* Section picker */}
              <select
                value={selectedSectionId}
                onChange={(e) => { setSelectedSectionId(e.target.value); setSelectedStudentIds(new Set()); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select section…</option>
                {sections.map((sec) => {
                  const cls = (permissions.classes || []).find((c) => c.class_id === sec.class_id);
                  return (
                    <option key={sec.section_id} value={sec.section_id}>
                      {cls ? `${cls.class_name} · ${sec.section_name}` : sec.section_name}
                    </option>
                  );
                })}
              </select>

              {/* Student checkbox list */}
              {selectedSectionId && (
                studentsInSection.length === 0 ? (
                  <p className="text-sm text-gray-400">No students in this section.</p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Students</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = studentsInSection.every((s) => selectedStudentIds.has(s.student_id));
                          setSelectedStudentIds(allSelected ? new Set() : new Set(studentsInSection.map((s) => s.student_id)));
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                      >
                        {studentsInSection.every((s) => selectedStudentIds.has(s.student_id)) ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-44 overflow-y-auto">
                      {studentsInSection.map((st) => {
                        const isSelected = selectedStudentIds.has(st.student_id);
                        const atCapacity = !isSelected && selectedStudentIds.size >= capacity;
                        return (
                          <label
                            key={st.student_id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50" : atCapacity ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={atCapacity}
                              onChange={() => toggleStudent(st.student_id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-800">{st.student_name || st.student_id}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )
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
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : selectedStudentIds.size > 0
                    ? `Create & Book ${selectedStudentIds.size} Student${selectedStudentIds.size !== 1 ? "s" : ""}`
                    : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
