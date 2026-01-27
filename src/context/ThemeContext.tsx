import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, getThemeById, defaultThemeId } from '../constants/themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  allThemes: Theme[];
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'emlak-crm-theme';
const DARK_MODE_STORAGE_KEY = 'theme'; // Keep existing key for dark mode

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    return savedThemeId ? getThemeById(savedThemeId) : getThemeById(defaultThemeId);
  });

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'dark' ||
      (!localStorage.getItem(DARK_MODE_STORAGE_KEY) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Apply theme CSS variables
  useEffect(() => {
    const colors = currentTheme.colors;
    const root = document.documentElement;

    // Set CSS custom properties
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-hover', colors.accentHover);

    root.style.setProperty('--color-sidebar-bg', isDark ? colors.sidebarBgDark : colors.sidebarBg);
    root.style.setProperty('--color-sidebar-text', isDark ? colors.sidebarTextDark : colors.sidebarText);
    root.style.setProperty('--color-sidebar-active', isDark ? colors.sidebarActiveDark : colors.sidebarActive);
    root.style.setProperty('--color-sidebar-active-bg', isDark ? colors.sidebarActiveBgDark : colors.sidebarActiveBg);

    root.style.setProperty('--color-content-bg', isDark ? colors.contentBgDark : colors.contentBg);
    root.style.setProperty('--color-card-bg', isDark ? colors.cardBgDark : colors.cardBg);
    root.style.setProperty('--color-card-border', isDark ? colors.cardBorderDark : colors.cardBorder);

    root.style.setProperty('--color-fab-bg', colors.fabBg);
    root.style.setProperty('--color-fab-glow', colors.fabGlow);

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.id);
  }, [currentTheme, isDark]);

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(DARK_MODE_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(DARK_MODE_STORAGE_KEY, 'light');
    }
  }, [isDark]);

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
  };

  const toggleDark = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      allThemes: themes,
      isDark,
      toggleDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
