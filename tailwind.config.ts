import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b0c10',
        foreground: '#e9eef4',
        primary: '#1f6feb',
      },
    },
  },
  plugins: [],
} satisfies Config;


