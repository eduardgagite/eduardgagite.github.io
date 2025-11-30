import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for backward compatibility)
        background: 'var(--theme-background)',
        foreground: 'var(--theme-foreground)',
        // Primary needs hardcoded value for opacity modifiers to work (e.g. primary/30)
        primary: '#1f6feb',
        
        // Theme-aware semantic colors
        theme: {
          background: 'var(--theme-background)',
          foreground: 'var(--theme-foreground)',
          surface: 'var(--theme-surface)',
          'surface-elevated': 'var(--theme-surface-elevated)',
          card: 'var(--theme-card)',
          primary: 'var(--theme-primary)',
          'primary-hover': 'var(--theme-primary-hover)',
          accent: 'var(--theme-accent)',
          'accent-secondary': 'var(--theme-accent-secondary)',
          success: 'var(--theme-success)',
          warning: 'var(--theme-warning)',
          error: 'var(--theme-error)',
          text: 'var(--theme-text)',
          'text-secondary': 'var(--theme-text-secondary)',
          'text-muted': 'var(--theme-text-muted)',
          'text-subtle': 'var(--theme-text-subtle)',
          'text-faint': 'var(--theme-text-faint)',
          'text-disabled': 'var(--theme-text-disabled)',
          border: 'var(--theme-border)',
          'border-hover': 'var(--theme-border-hover)',
          glow: 'var(--theme-glow)',
          'network-color': 'var(--theme-network-color)',
          scrollbar: 'var(--theme-scrollbar)',
          'scrollbar-thumb': 'var(--theme-scrollbar-thumb)',
          'code-background': 'var(--theme-code-background)',
        },
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
