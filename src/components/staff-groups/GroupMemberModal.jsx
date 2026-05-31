import { useState, useEffect, useMemo } from "react";
import { usePermissions } from "../../store/permissions.store";
import { getStudentGroup, addGroupMembers, removeGroupMembers } from "../../api/studentGroups.api";

export default function GroupMemberModal({ isOpen, onClose, group, onMemberCountChange }) {
  const { permissions } = usePermissions();

  const [originalMembers, setOriginalMembers] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    if (!isOpen || !group?.group_id) return;
    setSearch("");
    setClassFilter("");
    setError("");

    const load = async () => {
      setLoading(true);
      try {
        const data = await getStudentGroup(group.group_id);
        const memberList = data?.members || data?.students || [];
        // member shape: { studentId, student: { student_id, ... } }
        const ids = new Set(memberList.map((m) => m.studentId || m.student_id || m.student?.student_id));
        setOriginalMembers(ids);
        setSelected(new Set(ids));
      } catch {
        setError("Failed to load group members.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, group?.group_id]);

  const filteredStudents = useMemo(() => {
    const allStudents = permissions.students || [];
    return allStudents.filter((s) => {
      const matchesClass = !classFilter ||
        (permissions.sections || []).find((sec) => sec.section_id === s.section_id)?.class_id === classFilter;
      const matchesSearch = !search ||
        s.student_name?.toLowerCase().includes(search.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [permissions.students, permissions.sections, classFilter, search]);

  const handleToggle = (student_id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(student_id)) next.delete(student_id);
      else next.add(student_id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const toAdd = [...selected].filter((id) => !originalMembers.has(id));
      const toRemove = [...originalMembers].filter((id) => !selected.has(id));

      await Promise.all([
        toAdd.length > 0 ? addGroupMembers(group.group_id, toAdd) : Promise.resolve(),
        toRemove.length > 0 ? removeGroupMembers(group.group_id, toRemove) : Promise.resolve(),
      ]);

      onMemberCountChange?.(group.group_id, selected.size);
      onClose();
    } catch {
      setError("Failed to save members. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pendingAdds = useMemo(
    () => [...selected].filter((id) => !originalMembers.has(id)).length,
    [selected, originalMembers]
  );
  const pendingRemoves = useMemo(
    () => [...originalMembers].filter((id) => !selected.has(id)).length,
    [selected, originalMembers]
  );
  const hasChanges = pendingAdds > 0 || pendingRemoves > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">{group?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {selected.size} selected
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All classes</option>
            {(permissions.classes || []).map((c) => (
              <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="mx-6 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex-shrink-0">
            {error}
          </p>
        )}

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
              Loading…
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
              No students found
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selected.has(student.student_id);
              const section = (permissions.sections || []).find(
                (s) => s.section_id === student.section_id
              );
              const cls = section
                ? (permissions.classes || []).find((c) => c.class_id === section.class_id)
                : null;
              const sectionLabel = cls
                ? `${cls.class_name} · ${section.section_name}`
                : section?.section_name || "";

              return (
                <button
                  key={student.student_id}
                  type="button"
                  onClick={() => handleToggle(student.student_id)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-60 ${
                    isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {student.student_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.student_name}</p>
                    {sectionLabel && (
                      <p className="text-xs text-gray-400 truncate">{sectionLabel}</p>
                    )}
                  </div>
                  {isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving
              ? "Saving…"
              : pendingAdds > 0 && pendingRemoves > 0
                ? `Save (${pendingAdds} added, ${pendingRemoves} removed)`
                : pendingAdds > 0
                  ? `Add ${pendingAdds} student${pendingAdds !== 1 ? "s" : ""}`
                  : pendingRemoves > 0
                    ? `Remove ${pendingRemoves} student${pendingRemoves !== 1 ? "s" : ""}`
                    : "No changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
