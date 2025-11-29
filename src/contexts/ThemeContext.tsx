import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeId, ThemeContextType } from '../types/theme';
import { themes, defaultThemeId, getAvailableThemes } from '../themes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    // Get theme from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved && saved in themes) {
        return saved as ThemeId;
      }
    }
    return defaultThemeId;
  });

  const theme = themes[themeId];
  const availableThemes = getAvailableThemes();

  const setTheme = (newThemeId: ThemeId) => {
    setThemeIdState(newThemeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newThemeId);
    }
  };

  // Apply theme CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;

    // Set CSS custom properties
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-foreground', colors.foreground);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-hover', colors.primaryHover);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-accent-secondary', colors.accentSecondary);
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    root.style.setProperty('--theme-card-background', colors.cardBackground);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-border-hover', colors.borderHover);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-glow', colors.glow);
    root.style.setProperty('--theme-network-color', colors.networkColor);
    root.style.setProperty('--theme-scrollbar', colors.scrollbar);
    root.style.setProperty('--theme-scrollbar-thumb', colors.scrollbarThumb);

    // Update color-scheme for system preferences
    root.style.colorScheme = 'dark';
  }, [theme, themeId]);

  const value: ThemeContextType = {
    theme,
    themeId,
    setTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
