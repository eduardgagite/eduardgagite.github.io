import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { themes, defaultTheme, type Theme, type ThemeName, type ThemeColors } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'app-theme';

/**
 * Converts camelCase to kebab-case for CSS custom property names
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Applies theme colors as CSS custom properties on the document root
 */
function applyThemeToDocument(colors: ThemeColors): void {
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--theme-${toKebabCase(key)}`;
    root.style.setProperty(cssVar, value);
  });
}

/**
 * Sets the theme class on the document for potential CSS selectors
 */
function setThemeClass(themeName: ThemeName): void {
  const root = document.documentElement;
  
  // Remove existing theme classes
  Object.keys(themes).forEach((name) => {
    root.classList.remove(`theme-${name}`);
  });
  
  // Add current theme class
  root.classList.add(`theme-${themeName}`);
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Try to get from localStorage, fall back to initial or default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      if (stored && themes[stored]) {
        return stored;
      }
    }
    return initialTheme ?? defaultTheme;
  });

  const theme = themes[themeName];

  useEffect(() => {
    applyThemeToDocument(theme.colors);
    setThemeClass(themeName);
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }, [theme, themeName]);

  const setTheme = (name: ThemeName) => {
    if (themes[name]) {
      setThemeName(name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get current theme colors
 */
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
}
