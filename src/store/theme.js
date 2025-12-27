// store/theme.ts
import { create } from 'zustand';



export const useThemeStore = create(set => ({
  role: 'teacher',
  mode: 'light',

  setRole: role => set({ role }),
  toggleMode: () =>
    set(state => ({
      mode: state.mode === 'light' ? 'dark' : 'light',
    })),
}));
