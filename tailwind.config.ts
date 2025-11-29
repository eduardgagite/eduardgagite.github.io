import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS custom properties
        background: 'var(--theme-background)',
        foreground: 'var(--theme-foreground)',
        surface: 'var(--theme-surface)',
        primary: {
          DEFAULT: 'var(--theme-primary)',
          hover: 'var(--theme-primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--theme-accent)',
          secondary: 'var(--theme-accent-secondary)',
        },
        success: 'var(--theme-success)',
        warning: 'var(--theme-warning)',
        error: 'var(--theme-error)',
        card: {
          background: 'var(--theme-card-background)',
        },
        border: {
          DEFAULT: 'var(--theme-border)',
          hover: 'var(--theme-border-hover)',
        },
        text: {
          DEFAULT: 'var(--theme-text)',
          secondary: 'var(--theme-text-secondary)',
          muted: 'var(--theme-text-muted)',
        },
        // Legacy colors for backward compatibility
        sky: {
          300: 'var(--theme-accent-secondary)',
          400: 'var(--theme-accent)',
        },
        blue: {
          400: 'var(--theme-accent)',
        },
        white: 'var(--theme-text)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
