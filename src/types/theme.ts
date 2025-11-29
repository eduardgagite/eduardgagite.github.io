export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  surface: string;

  // Accent colors
  primary: string;
  primaryHover: string;
  accent: string;
  accentSecondary: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;

  // UI element colors
  cardBackground: string;
  border: string;
  borderHover: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Special colors for components
  glow: string;
  networkColor: string;
  scrollbar: string;
  scrollbarThumb: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export type ThemeId = 'dark';

export interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: Theme[];
}
