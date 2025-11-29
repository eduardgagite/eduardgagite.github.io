import { Theme, ThemeId } from '../types/theme';

/**
 * Система тем для приложения
 *
 * Чтобы добавить новую тему:
 * 1. Создайте объект Theme с уникальным id и name
 * 2. Определите все цвета в ThemeColors
 * 3. Добавьте тему в themes объект
 * 4. Обновите ThemeId тип в types/theme.ts
 *
 * Цвета автоматически применяются через CSS custom properties
 */

// Dark theme (current default)
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Base colors
    background: 'rgb(11, 12, 16)',
    foreground: 'rgb(233, 238, 244)',
    surface: 'rgba(255, 255, 255, 0.03)',

    // Accent colors
    primary: 'rgb(31, 111, 235)',
    primaryHover: 'rgb(56, 139, 253)',
    accent: 'rgb(56, 189, 248)',
    accentSecondary: 'rgb(96, 165, 250)',

    // Semantic colors
    success: 'rgb(16, 185, 129)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',

    // UI element colors
    cardBackground: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',

    // Text colors
    text: 'rgb(255, 255, 255)',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.5)',

    // Special colors for components
    glow: 'rgba(31, 111, 235, 0.35)',
    networkColor: 'rgb(233, 238, 244)',
    scrollbar: 'rgba(255, 255, 255, 0.04)',
    scrollbarThumb: 'rgba(56, 189, 248, 0.9)',
  },
};


/**
 * Пример добавления новой темы:
 *
 * export const customTheme: Theme = {
 *   id: 'custom',
 *   name: 'Custom',
 *   colors: {
 *     background: '#your-bg-color',
 *     foreground: '#your-text-color',
 *     // ... остальные цвета
 *   },
 * };
 *
 * Затем добавьте в themes объект и ThemeId тип
 */

// All available themes
export const themes: Record<ThemeId, Theme> = {
  dark: darkTheme,
};

// Get theme by ID
export const getTheme = (themeId: ThemeId): Theme => {
  return themes[themeId];
};

// Get all available themes
export const getAvailableThemes = (): Theme[] => {
  return Object.values(themes);
};

// Default theme
export const defaultThemeId: ThemeId = 'dark';
