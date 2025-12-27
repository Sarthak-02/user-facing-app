/* ================================
   SHARED / GLOBAL COLORS
   Used by both Teacher & Student
================================ */

const neutral = {
    white: '#FFFFFF',
    black: '#000000',
  
    gray: {
      50:  '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      500: '#6B7280',
      700: '#374151',
      900: '#111827',
    },
  };
  
  /* ================================
     TEACHER APP COLORS
     Calm, professional, focused
  ================================ */
  
  const teacher = {
    primary: {
      50:  '#EFF6FF',
      100: '#DBEAFE',
      600: '#2563EB',
      800: '#1E40AF',
    },
  
    success: {
      100: '#DCFCE7',
      600: '#16A34A',
    },
  
    warning: {
      100: '#FEF3C7',
      600: '#D97706',
    },
  
    error: {
      100: '#FEE2E2',
      600: '#DC2626',
    },
  
    info: {
      100: '#E0F2FE',
      600: '#0284C7',
    },
  
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
  };
  
  /* ================================
     STUDENT APP COLORS
     Friendly, motivating, softer
  ================================ */
  
  const student = {
    primary: {
      50:  '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      700: '#4338CA',
    },
  
    success: {
      100: '#DCFCE7',
      500: '#22C55E',
    },
  
    warning: {
      100: '#FEF3C7',
      500: '#F59E0B',
    },
  
    error: {
      100: '#FEE2E2',
      500: '#EF4444',
    },
  
    accent: {
      100: '#CCFBF1',
      500: '#14B8A6',
    },
  
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
  };
  
  /* ================================
     EXPORT
  ================================ */
  
  export const colors = {
    neutral,
    teacher,
    student,
  };
  