# eduardgagite.github.io

Personal site and practical backend knowledge base built with React, TypeScript, Vite, and Tailwind CSS.

The site combines:

- a compact profile and contact page;
- 167 Russian-language articles on Go, Redis, and Docker;
- course navigation, search, keyboard controls, and per-article SEO metadata.

## Local development

Requirements:

- Node.js 20.19 or newer;
- npm.

```bash
npm ci
npm run dev
```

Useful commands:

```bash
npm run check    # TypeScript and all tests
npm run build    # Regenerate content, sitemap, and production bundle
npm run preview  # Preview the production build on port 5173
```

## Project structure

```text
content/materials/       Markdown sources
scripts/                 Content and sitemap generators
scripts/tests/           Data, routing, and locale tests
src/components/          Shared interface components
src/features/materials/  Materials domain and reading UI
src/materials/           Loader, types, and generated index
src/pages/               Route-level components
public/                  Generated content and static assets
```

Markdown files are the source of truth. During development and production builds:

1. `scripts/generate-materials-json.mjs` validates frontmatter and generates the public index and article payloads.
2. `scripts/generate-sitemap.mjs` creates `public/sitemap.xml`.
3. TypeScript and Vite build the application.

## Adding an article

Create a file at:

```text
content/materials/<category>/<section>/<slug>.ru.md
```

Every article requires frontmatter:

```yaml
---
title: "Article title"
category: "golang"
categoryTitle: "Go"
section: "intro"
sectionTitle: "Introduction"
sectionOrder: 1
order: 1
---
```

Optional fields include `subtitle`, `datePublished`, `dateModified`, `level`, and `tags`.

After changing content, run:

```bash
npm run build
npm run check
```

Generated JSON and the sitemap are committed so GitHub Pages can serve them as static files.

## Localization

The interface supports Russian and English through `?lang=ru|en`. Articles currently exist in Russian; the English interface explicitly communicates this instead of presenting the content as translated.

## Deployment

`.github/workflows/deploy.yml` checks pull requests and deploys pushes to `main` to GitHub Pages.
