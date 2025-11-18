import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, createReadStream } from 'fs';
import { join } from 'path';
import type { Plugin } from 'vite';

// For a user site (eduardgagite.github.io), base should be '/'
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-content-assets',
      writeBundle() {
        // Copy images and other assets from content/materials to dist
        const contentDir = join(process.cwd(), 'content/materials');
        const distDir = join(process.cwd(), 'dist');
        
        function copyAssets(src: string, dest: string) {
          if (!existsSync(src)) return;
          
          const items = readdirSync(src);
          for (const item of items) {
            const srcPath = join(src, item);
            const destPath = join(dest, item);
            
            if (statSync(srcPath).isDirectory()) {
              if (!existsSync(destPath)) {
                mkdirSync(destPath, { recursive: true });
              }
              copyAssets(srcPath, destPath);
            } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(item)) {
              if (!existsSync(dest)) {
                mkdirSync(dest, { recursive: true });
              }
              copyFileSync(srcPath, destPath);
            }
          }
        }
        
        copyAssets(contentDir, join(distDir, 'content/materials'));
      },
    },
    {
      name: 'serve-content-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/content/materials/')) {
            const filePath = join(process.cwd(), req.url);
            if (existsSync(filePath) && statSync(filePath).isFile()) {
              const ext = filePath.split('.').pop()?.toLowerCase();
              const contentType = 
                ext === 'png' ? 'image/png' :
                ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                ext === 'gif' ? 'image/gif' :
                ext === 'svg' ? 'image/svg+xml' :
                ext === 'webp' ? 'image/webp' :
                'application/octet-stream';
              res.setHeader('Content-Type', contentType);
              createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    } as Plugin,
  ],
  base: '/',
});


