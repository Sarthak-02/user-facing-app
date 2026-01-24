import { create } from "zustand";

export const useAttendance = create((set, get) => ({
  // State
  summary: {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendance_percentage: "0.00"
  },
  records: [],
  loading: false,
  error: null,

  // Actions
  setAttendanceData: (data) => {
    set({
      summary: data.summary || get().summary,
      records: data.records || [],
      error: null
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  clearAttendanceData: () => {
    set({
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendance_percentage: "0.00"
      },
      records: [],
      error: null
    });
  }
}));
