/**
 * Theme definitions for the application.
 * Each theme defines semantic color tokens that map to CSS custom properties.
 */

export interface ThemeColors {
  // Base
  background: string;
  foreground: string;
  
  // Surfaces
  surface: string;
  surfaceElevated: string;
  card: string;
  
  // Primary brand color
  primary: string;
  primaryHover: string;
  primaryRgb: string; // RGB values for gradients
  
  // Accent colors (for highlights, links, interactive elements)
  accent: string;
  accentSecondary: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  
  // Text hierarchy
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  textFaint: string;
  textDisabled: string;
  
  // Borders
  border: string;
  borderHover: string;
  
  // Special
  glow: string;
  networkColor: string;
  
  // Scrollbar
  scrollbar: string;
  scrollbarThumb: string;
  
  // Code block background (separate from surface for syntax highlighting)
  codeBackground: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

/**
 * Midnight theme - the current dark theme
 * All values extracted from the existing design
 */
export const midnightTheme: Theme = {
  name: 'midnight',
  colors: {
    // Base
    background: '#0b0c10',
    foreground: '#e9eef4',
    
    // Surfaces (white with alpha for glass effect)
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceElevated: 'rgba(255, 255, 255, 0.05)',
    card: 'rgba(255, 255, 255, 0.04)',
    
    // Primary brand
    primary: '#1f6feb',
    primaryHover: '#388bfd',
    primaryRgb: '31, 111, 235', // RGB values for gradients
    
    // Accent (sky/cyan tones)
    accent: '#38bdf8',
    accentSecondary: '#60a5fa',
    
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // Text hierarchy
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    textSubtle: 'rgba(255, 255, 255, 0.7)',
    textFaint: 'rgba(255, 255, 255, 0.4)',
    textDisabled: 'rgba(255, 255, 255, 0.3)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',
    
    // Special
    glow: 'rgba(31, 111, 235, 0.35)',
    networkColor: '#e9eef4',
    
    // Scrollbar
    scrollbar: 'rgba(255, 255, 255, 0.04)',
    scrollbarThumb: 'rgba(56, 189, 248, 0.9)',
    
    // Code
    codeBackground: '#0d1117',
  },
};

// Available themes
export const themes = {
  midnight: midnightTheme,
} as const;

export type ThemeName = keyof typeof themes;

export const defaultTheme: ThemeName = 'midnight';
