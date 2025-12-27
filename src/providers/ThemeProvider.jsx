// providers/ThemeProvider.tsx
import { useEffect } from 'react';
import { useThemeStore } from '../store/theme';

export function ThemeProvider({ children }) {
  const { mode ,role} = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = role;
    root.classList.toggle('dark', mode === 'dark');
  }, [role, mode]);
  
  return children;
}
