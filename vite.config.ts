import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For a user site (eduardgagite.github.io), base should be '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
});


