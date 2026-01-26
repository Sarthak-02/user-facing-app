import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialValue = {
  exam: null,
  students: [],
  studentCount: 0,
};

export const useExamDetail = create(
  persist(
    (set, get) => ({
      examDetail: initialValue,
      loading: false,
      error: null,

      // Set exam detail
      setExamDetail: (exam) => {
        set({
          examDetail: {
            ...get().examDetail,
            exam,
          },
          error: null,
        });
      },

      // Set students for the exam
      setExamStudents: (students, count) => {
        set({
          examDetail: {
            ...get().examDetail,
            students,
            studentCount: count || students?.length || 0,
          },
          error: null,
        });
      },

      // Set both exam and students together
      setExamWithStudents: (exam, students, count) => {
        set({
          examDetail: {
            exam,
            students,
            studentCount: count || students?.length || 0,
          },
          error: null,
        });
      },

      // Update loading state
      setLoading: (loading) => set({ loading }),

      // Set error
      setError: (error) => set({ error, loading: false }),

      // Clear exam detail
      clearExamDetail: () => {
        set({
          examDetail: initialValue,
          error: null,
          loading: false,
        });
      },

      // Get current exam
      getExam: () => get().examDetail.exam,

      // Get students
      getStudents: () => get().examDetail.students,

      // Get student count
      getStudentCount: () => get().examDetail.studentCount,

      // Check if exam is loaded
      hasExam: () => !!get().examDetail.exam,

      // Check if students are loaded
      hasStudents: () => get().examDetail.students.length > 0,
    }),
    {
      name: "exam-detail-store",
    }
  )
);
