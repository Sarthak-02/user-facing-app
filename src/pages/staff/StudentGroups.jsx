import { useEffect, useState } from "react";
import { useAuth } from "../../store/auth.store";
import { useStudentGroups } from "../../store/studentGroups.store";
import {
  createStudentGroup,
  updateStudentGroup,
  deleteStudentGroup,
} from "../../api/studentGroups.api";
import GroupFormModal from "../../components/staff-groups/GroupFormModal";
import GroupMemberModal from "../../components/staff-groups/GroupMemberModal";

function GroupCard({ group, onEdit, onManageMembers, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(group)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Edit group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(group.group_id); setConfirmDelete(false); }}
                className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {group.member_count ?? 0} student{(group.member_count ?? 0) !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => onManageMembers(group)}
          className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
        >
          Manage members →
        </button>
      </div>
    </div>
  );
}

export default function StudentGroups() {
  const { auth } = useAuth();
  const campus_id = auth?.campus?.campus_id || auth?.campus_id || "";
  const teacher_id = auth?.userId || "";

  const { groups, loading, fetchGroups, addGroup, updateGroup, removeGroup, setMemberCount } = useStudentGroups();

  const [formModal, setFormModal] = useState({ open: false, group: null });
  const [memberModal, setMemberModal] = useState({ open: false, group: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (campus_id) fetchGroups(campus_id);
  }, [campus_id, fetchGroups]);

  const handleFormSubmit = async ({ name, description }) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (formModal.group) {
        const groupId = formModal.group.group_id || formModal.group.id;
        await updateStudentGroup(groupId, { name, description });
        updateGroup(groupId, { name, description });
        setFormModal({ open: false, group: null });
      } else {
        const created = await createStudentGroup({ name, description, campus_id, created_by: teacher_id });
        const raw = created?.group || created || {};
        const newGroup = { ...raw, group_id: raw.group_id || raw.id, name, description, member_count: 0 };
        addGroup(newGroup);
        setFormModal({ open: false, group: null });
        setMemberModal({ open: true, group: newGroup });
      }
    } catch (err) {
      setSubmitError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (group_id) => {
    try {
      await deleteStudentGroup(group_id);
      removeGroup(group_id);
    } catch {
      // silently ignore — could add toast here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Groups</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create school-wide groups to target homework, exams, and broadcasts.
            </p>
          </div>
          <button
            onClick={() => { setSubmitError(""); setFormModal({ open: true, group: null }); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Group
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No groups yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Create a group to assign homework, exams, or broadcasts to a custom set of students.
            </p>
            <button
              onClick={() => { setSubmitError(""); setFormModal({ open: true, group: null }); }}
              className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Create First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.group_id}
                group={group}
                onEdit={(g) => { setSubmitError(""); setFormModal({ open: true, group: g }); }}
                onManageMembers={(g) => setMemberModal({ open: true, group: g })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <GroupFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, group: null })}
        onSubmit={handleFormSubmit}
        group={formModal.group}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      <GroupMemberModal
        isOpen={memberModal.open}
        onClose={() => setMemberModal({ open: false, group: null })}
        group={memberModal.group}
        onMemberCountChange={setMemberCount}
      />
    </div>
  );
}
