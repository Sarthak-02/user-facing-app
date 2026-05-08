// providers/ThemeProvider.tsx
import { useEffect } from "react";
import { useThemeStore } from "../store/theme";
import { useReadabilityStore } from "../store/readability.store";

export function ThemeProvider({ children }) {
  const { mode, role } = useThemeStore();
  const textScale = useReadabilityStore((s) => s.textScale);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = role;
    root.classList.toggle("dark", mode === "dark");
    root.dataset.textScale = textScale === "comfortable" ? "comfortable" : "default";
  }, [role, mode, textScale]);

  return children;
}
