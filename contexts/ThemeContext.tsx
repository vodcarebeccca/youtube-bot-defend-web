/**
 * Theme Context - Custom theme support dengan multiple color schemes
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Available theme presets
export type ThemePreset = 'dark' | 'light' | 'midnight' | 'emerald' | 'purple' | 'sunset';

// Theme colors interface
export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgHover: string;
  bgInput: string;
  
  // Sidebar
  sidebarBg: string;
  sidebarHover: string;
  sidebarActive: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Brand/Accent
  accent: string;
  accentHover: string;
  
  // Status
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // Border
  border: string;
  borderLight: string;
}

// Theme presets
const themePresets: Record<ThemePreset, ThemeColors> = {
  dark: {
    bgPrimary: '#0f0f0f',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#252525',
    bgCard: '#1e1e1e',
    bgHover: '#2a2a2a',
    bgInput: '#141414',
    sidebarBg: '#111111',
    sidebarHover: '#1f1f1f',
    sidebarActive: '#ef4444',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textMuted: '#6b7280',
    accent: '#ef4444',
    accentHover: '#dc2626',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    border: '#2d2d2d',
    borderLight: '#3d3d3d',
  },
  light: {
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    bgCard: '#ffffff',
    bgHover: '#e2e8f0',
    bgInput: '#ffffff',
    sidebarBg: '#1e293b',
    sidebarHover: '#334155',
    sidebarActive: '#ef4444',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#ef4444',
    accentHover: '#dc2626',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
  },
  midnight: {
    bgPrimary: '#0a0a1a',
    bgSecondary: '#12122a',
    bgTertiary: '#1a1a3a',
    bgCard: '#151530',
    bgHover: '#202050',
    bgInput: '#0d0d20',
    sidebarBg: '#08081a',
    sidebarHover: '#15153a',
    sidebarActive: '#6366f1',
    textPrimary: '#e0e7ff',
    textSecondary: '#a5b4fc',
    textMuted: '#6366f1',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    border: '#1e1e4a',
    borderLight: '#2a2a5a',
  },
  emerald: {
    bgPrimary: '#0a1410',
    bgSecondary: '#0f1f18',
    bgTertiary: '#152a20',
    bgCard: '#122218',
    bgHover: '#1a3525',
    bgInput: '#0a1410',
    sidebarBg: '#081210',
    sidebarHover: '#0f2018',
    sidebarActive: '#10b981',
    textPrimary: '#d1fae5',
    textSecondary: '#6ee7b7',
    textMuted: '#34d399',
    accent: '#10b981',
    accentHover: '#059669',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    border: '#1a3525',
    borderLight: '#234535',
  },
  purple: {
    bgPrimary: '#0f0a14',
    bgSecondary: '#1a1020',
    bgTertiary: '#25182a',
    bgCard: '#1e1525',
    bgHover: '#2a1e35',
    bgInput: '#120d18',
    sidebarBg: '#0d0812',
    sidebarHover: '#1a1025',
    sidebarActive: '#a855f7',
    textPrimary: '#f3e8ff',
    textSecondary: '#d8b4fe',
    textMuted: '#a855f7',
    accent: '#a855f7',
    accentHover: '#9333ea',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    border: '#2a1e35',
    borderLight: '#3a2845',
  },
  sunset: {
    bgPrimary: '#140a0a',
    bgSecondary: '#201010',
    bgTertiary: '#2a1818',
    bgCard: '#251515',
    bgHover: '#351e1e',
    bgInput: '#180d0d',
    sidebarBg: '#120808',
    sidebarHover: '#251515',
    sidebarActive: '#f97316',
    textPrimary: '#fff7ed',
    textSecondary: '#fed7aa',
    textMuted: '#fb923c',
    accent: '#f97316',
    accentHover: '#ea580c',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    border: '#351e1e',
    borderLight: '#452828',
  },
};

// Theme context interface
interface ThemeContextType {
  theme: ThemePreset;
  colors: ThemeColors;
  setTheme: (theme: ThemePreset) => void;
  availableThemes: ThemePreset[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemePreset) || 'dark';
  });

  const colors = themePresets[theme];

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, [colors]);

  return (
    <ThemeContext.Provider value={{
      theme,
      colors,
      setTheme,
      availableThemes: Object.keys(themePresets) as ThemePreset[],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
