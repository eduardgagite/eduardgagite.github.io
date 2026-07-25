import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATE_FILE = path.join(DIST_DIR, 'index.html');
const MATERIALS_FILE = path.join(ROOT_DIR, 'src', 'materials', 'generated-materials.json');
const PROJECTS_FILE = path.join(ROOT_DIR, 'src', 'projects', 'generated-projects.json');
const BASE_URL = 'https://eduardgagite.github.io';
const OG_IMAGE_URL = `${BASE_URL}/images/og-image.png`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${label} in the built HTML template`);
  }
  return source.replace(pattern, replacement);
}

function metaPattern(attribute, value) {
  return new RegExp(`<meta\\s+${attribute}="${value}"\\s+content="[^"]*"\\s*\\/>`);
}

function renderPageShell({
  template,
  lang,
  title,
  description,
  url,
  type = 'website',
  extraHead = '',
  hasAlternateLocale = true,
}) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedUrl = escapeHtml(url);
  const locale = lang === 'ru' ? 'ru_RU' : 'en_US';

  let html = template;
  html = replaceRequired(html, /<html lang="[^"]+">/, `<html lang="${lang}">`, 'html lang');
  html = replaceRequired(html, /<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`, 'title');
  html = replaceRequired(
    html,
    metaPattern('name', 'title'),
    `<meta name="title" content="${escapedTitle}" />`,
    'title meta',
  );
  html = replaceRequired(
    html,
    metaPattern('name', 'description'),
    `<meta name="description" content="${escapedDescription}" />`,
    'description meta',
  );
  html = replaceRequired(
    html,
    metaPattern('property', 'og:type'),
    `<meta property="og:type" content="${type}" />`,
    'og:type',
  );
  html = replaceRequired(
    html,
    metaPattern('property', 'og:url'),
    `<meta property="og:url" content="${escapedUrl}" />`,
    'og:url',
  );
  html = replaceRequired(
    html,
    metaPattern('property', 'og:title'),
    `<meta property="og:title" content="${escapedTitle}" />`,
    'og:title',
  );
  html = replaceRequired(
    html,
    metaPattern('property', 'og:description'),
    `<meta property="og:description" content="${escapedDescription}" />`,
    'og:description',
  );
  html = replaceRequired(
    html,
    metaPattern('property', 'og:locale'),
    `<meta property="og:locale" content="${locale}" />`,
    'og:locale',
  );
  if (!hasAlternateLocale) {
    html = html.replace(new RegExp(`\\s*${metaPattern('property', 'og:locale:alternate').source}`), '');
  }
  html = replaceRequired(
    html,
    metaPattern('name', 'twitter:url'),
    `<meta name="twitter:url" content="${escapedUrl}" />`,
    'twitter:url',
  );
  html = replaceRequired(
    html,
    metaPattern('name', 'twitter:title'),
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    'twitter:title',
  );
  html = replaceRequired(
    html,
    metaPattern('name', 'twitter:description'),
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    'twitter:description',
  );
  html = replaceRequired(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapedUrl}" />`,
    'canonical link',
  );

  if (extraHead) {
    html = replaceRequired(html, /<\/head>/, `${extraHead}\n  </head>`, 'head closing tag');
  }

  return html;
}

async function writeRouteShell(route, html) {
  const relativeRoute = route.replace(/^\/+|\/+$/g, '');
  const outputDir = path.join(DIST_DIR, relativeRoute);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

function buildArticleExtraHead(material, variants, url, description) {
  const alternateLinks = variants
    .map((variant) => {
      const route = `/materials/${variant.id.category}/${variant.id.section}/${variant.id.slug}`;
      const alternateUrl = `${BASE_URL}${route}?lang=${variant.id.lang}`;
      return `    <link rel="alternate" hreflang="${variant.id.lang}" href="${escapeHtml(alternateUrl)}" />`;
    })
    .join('\n');
  const defaultVariant = variants.find((variant) => variant.id.lang === 'ru') || variants[0];
  const defaultRoute = `/materials/${defaultVariant.id.category}/${defaultVariant.id.section}/${defaultVariant.id.slug}`;
  const defaultLink =
    variants.length > 1
      ? `\n    <link rel="alternate" hreflang="x-default" href="${BASE_URL}${defaultRoute}?lang=${defaultVariant.id.lang}" />`
      : '';
  const articleMeta = [
    '    <meta property="article:author" content="Eduard Gagite" />',
    `    <meta property="article:section" content="${escapeHtml(material.sectionTitle)}" />`,
    material.datePublished
      ? `    <meta property="article:published_time" content="${escapeHtml(material.datePublished)}" />`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: material.title,
    description,
    author: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: BASE_URL,
    },
    ...(material.datePublished ? { datePublished: material.datePublished } : {}),
    ...(material.dateModified || material.datePublished
      ? { dateModified: material.dateModified || material.datePublished }
      : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: material.sectionTitle,
    inLanguage: material.id.lang,
    image: OG_IMAGE_URL,
  };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return `${articleMeta}
${alternateLinks}${defaultLink}
    <script type="application/ld+json" data-type="article">${jsonLd}</script>`;
}

function buildProjectExtraHead(project, variants, url) {
  const alternateLinks = variants
    .map((variant) => {
      const alternateUrl = `${BASE_URL}/projects/${variant.id.slug}?lang=${variant.id.lang}`;
      return `    <link rel="alternate" hreflang="${variant.id.lang}" href="${escapeHtml(alternateUrl)}" />`;
    })
    .join('\n');
  const defaultLink =
    variants.length > 1
      ? `\n    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/projects/${project.id.slug}?lang=${project.id.lang}" />`
      : '';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description: project.summary,
    author: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: 'Проекты',
    inLanguage: project.id.lang,
    image: OG_IMAGE_URL,
    ...(Array.isArray(project.stack) && project.stack.length > 0 ? { keywords: project.stack.join(', ') } : {}),
  };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return `    <meta property="article:author" content="Eduard Gagite" />
    <meta property="article:section" content="Проекты" />
${alternateLinks}${defaultLink}
    <script type="application/ld+json" data-type="article">${jsonLd}</script>`;
}

async function main() {
  const [template, materialsPayload, projectsPayload] = await Promise.all([
    readFile(TEMPLATE_FILE, 'utf8'),
    readFile(MATERIALS_FILE, 'utf8').then(JSON.parse),
    readFile(PROJECTS_FILE, 'utf8').then(JSON.parse),
  ]);
  const entries = materialsPayload.entries || [];
  const projectEntries = projectsPayload.entries || [];
  const byCanonical = new Map();

  for (const entry of entries) {
    const key = `${entry.id.category}/${entry.id.section}/${entry.id.slug}`;
    const variants = byCanonical.get(key) || [];
    variants.push(entry);
    byCanonical.set(key, variants);
  }

  const materialsUrl = `${BASE_URL}/materials?lang=ru`;
  const materialsShell = renderPageShell({
    template,
    lang: 'ru',
    title: 'Материалы по backend-разработке — Eduard Gagite',
    description: 'Практические курсы, шпаргалки и конспекты по Go, Redis и Docker для backend-инженеров.',
    url: materialsUrl,
  });
  await writeRouteShell('/materials', materialsShell);

  const categoryIds = [...new Set(entries.map((entry) => entry.id.category))];
  for (const categoryId of categoryIds) {
    const sample = entries.find((entry) => entry.id.category === categoryId);
    const courseUrl = `${BASE_URL}/materials/${categoryId}?lang=ru`;
    await writeRouteShell(
      `/materials/${categoryId}`,
      renderPageShell({
        template,
        lang: 'ru',
        title: `${sample.categoryTitle} — Материалы — Eduard Gagite`,
        description: `Конспекты по теме «${sample.categoryTitle}»: разделы курса и список материалов.`,
        url: courseUrl,
      }),
    );
  }

  let articleShellCount = 0;
  for (const variants of byCanonical.values()) {
    const material = variants.find((variant) => variant.id.lang === 'ru') || variants[0];
    const route = `/materials/${material.id.category}/${material.id.section}/${material.id.slug}`;
    const url = `${BASE_URL}${route}?lang=${material.id.lang}`;
    const description =
      material.subtitle ||
      (material.id.lang === 'ru'
        ? `Материал «${material.title}» из раздела ${material.sectionTitle} курса ${material.categoryTitle}.`
        : `${material.title}, an article from the ${material.sectionTitle} section of ${material.categoryTitle}.`);
    const extraHead = buildArticleExtraHead(material, variants, url, description);
    const shell = renderPageShell({
      template,
      lang: material.id.lang,
      title: `${material.title} — ${material.categoryTitle}`,
      description,
      url,
      type: 'article',
      extraHead,
      hasAlternateLocale: variants.length > 1,
    });

    await writeRouteShell(route, shell);
    articleShellCount += 1;
  }

  const projectsUrl = `${BASE_URL}/projects?lang=ru`;
  const projectsShell = renderPageShell({
    template,
    lang: 'ru',
    title: 'Проекты — Eduard Gagite',
    description:
      'Кейсы backend-проектов на Go: мессенджер с E2E-шифрованием, платформа оценки недвижимости, продовые сервисы и собственная инфраструктура.',
    url: projectsUrl,
  });
  await writeRouteShell('/projects', projectsShell);

  let projectShellCount = 0;
  const projectsBySlug = new Map();
  for (const entry of projectEntries) {
    const variants = projectsBySlug.get(entry.id.slug) || [];
    variants.push(entry);
    projectsBySlug.set(entry.id.slug, variants);
  }

  for (const variants of projectsBySlug.values()) {
    const project = variants.find((variant) => variant.id.lang === 'ru') || variants[0];
    const route = `/projects/${project.id.slug}`;
    const url = `${BASE_URL}${route}?lang=${project.id.lang}`;
    const shell = renderPageShell({
      template,
      lang: project.id.lang,
      title: `${project.title} — Проекты — Eduard Gagite`,
      description: project.summary,
      url,
      type: 'article',
      extraHead: buildProjectExtraHead(project, variants, url),
      hasAlternateLocale: variants.length > 1,
    });

    await writeRouteShell(route, shell);
    projectShellCount += 1;
  }

  console.log(
    `Generated 1 materials shell, ${categoryIds.length} course shells, ${articleShellCount} article shells, 1 projects shell and ${projectShellCount} project shells`,
  );
}

main().catch((error) => {
  console.error('Failed to generate route HTML shells:', error);
  process.exit(1);
});
