import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, createReadStream } from 'fs';
import { extname, join, relative, resolve } from 'path';
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
        const contentRoot = resolve(process.cwd(), 'content/materials');
        const prefix = '/content/materials/';
        const allowedImageExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

        server.middlewares.use((req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const pathname = (() => {
            try {
              return new URL(req.url, 'http://localhost').pathname;
            } catch {
              return null;
            }
          })();

          if (!pathname?.startsWith(prefix)) {
            next();
            return;
          }

          let decodedPathname: string;
          try {
            decodedPathname = decodeURIComponent(pathname);
          } catch {
            res.statusCode = 400;
            res.end('Bad Request');
            return;
          }

          const rawRelativePath = decodedPathname.slice(prefix.length);
          const safeRelativePath = rawRelativePath.replace(/^\/+/, '');
          const filePath = resolve(contentRoot, safeRelativePath);
          const relativePath = relative(contentRoot, filePath);
          if (relativePath.startsWith('..') || relativePath.includes('/..') || relativePath.includes('\\..')) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          const ext = extname(filePath).toLowerCase();
          if (!allowedImageExt.has(ext)) {
            next();
            return;
          }

          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const contentType = 
              ext === '.png' ? 'image/png' :
              ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
              ext === '.gif' ? 'image/gif' :
              ext === '.svg' ? 'image/svg+xml' :
              ext === '.webp' ? 'image/webp' :
              'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            createReadStream(filePath).pipe(res);
            return;
          }

          next();
        });
      },
    } as Plugin,
  ],
  base: '/',
});

