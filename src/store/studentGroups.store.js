import { create } from "zustand";
import { listStudentGroups } from "../api/studentGroups.api";

export const useStudentGroups = create((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  fetchGroups: async (campus_id) => {
    if (!campus_id) return;
    set({ loading: true, error: null });
    try {
      const data = await listStudentGroups(campus_id);
      const raw = Array.isArray(data) ? data : data?.groups || [];
      const list = raw.map((g) => ({
        ...g,
        group_id: g.group_id || g.id,
        member_count: g.member_count ?? g._count?.members ?? 0,
      }));
      set({ groups: list, loading: false });
    } catch (err) {
      set({ error: err?.message || "Failed to load groups", loading: false });
    }
  },

  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),

  updateGroup: (group_id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.group_id === group_id ? { ...g, ...updates } : g
      ),
    })),

  removeGroup: (group_id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.group_id !== group_id),
    })),

  // Update member count after add/remove member operations
  setMemberCount: (group_id, count) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.group_id === group_id ? { ...g, member_count: count } : g
      ),
    })),
}));
