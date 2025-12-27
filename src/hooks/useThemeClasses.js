// hooks/useThemeClasses.ts
import { semantic } from '../design-tokens/semantic';
import { useThemeStore } from '../store/theme';

export function useThemeClasses() {
  const role = useThemeStore(s => s.role);

  return {
    primaryBg: semantic.primary.bg[role],
    primaryText: semantic.primary.text[role],
    successBg: semantic.success.bg[role],
    surfaceBg: semantic.surface.bg[role],
  };
}
