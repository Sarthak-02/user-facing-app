import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logoutApi } from "../api/auth.api";  // <-- add this

const initialValue = {
  userId: "",
  username: "",
  role: "student",
  campus_id:"",
  sections:[],
  details: {},
};

export const useAuth = create(
  persist(
    (set, get) => ({
      auth: initialValue,

      // Set logged-in user
      setAuth: (newUser) => set({ auth: newUser }),

      // setActiveSchool: (schoolValue) =>
      //   set({
      //     auth: {
      //       ...get().auth,
      //       active_school: get().auth.site_permissions.find(
      //         (site) => site.value === schoolValue
      //       ) || {}
      //     }
      //   }),

      // setActiveCampus: (campus) =>
      //   set({ auth: { ...get().auth, active_campus: campus } }),
      // ------------------------
      // LOGOUT USER
      // ------------------------
      logout: async () => {
        try {
          await logoutApi(); // call backend logout
        } catch (err) {
          console.error("Logout API failed (continuing):", err);
        }
        finally {
          // Clear auth state
          set({ auth: initialValue });
          localStorage.clear()
          // Redirect to login
          window.location.href = "/login";
        }


      }
    }),
    {
      name: "cd-store"
    }
  )
);
