import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const MATERIALS_FILE = path.join(ROOT_DIR, 'src', 'materials', 'generated-materials.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const BASE_URL = 'https://eduardgagite.github.io';

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function main() {
  const materialsData = JSON.parse(await readFile(MATERIALS_FILE, 'utf8'));
  const entries = materialsData.entries || [];

  // Group by canonical ID (category/section/slug) to avoid duplicates
  const urlSet = new Set();
  const urls = [];

  // Add main pages (language-specific)
  const mainPages = [
    { path: '/', priority: '1.0' },
    { path: '/materials', priority: '0.9' },
  ];

  for (const page of mainPages) {
    for (const lang of ['ru', 'en']) {
      const loc = `${BASE_URL}${page.path}?lang=${lang}`;
      if (urlSet.has(loc)) continue;
      urlSet.add(loc);
      urls.push({
        loc,
        changefreq: 'weekly',
        priority: page.priority,
      });
    }
  }

  // Add material pages (language-specific URLs)
  const byCanonical = {};
  for (const entry of entries) {
    const canonicalKey = `${entry.id.category}/${entry.id.section}/${entry.id.slug}`;
    if (!byCanonical[canonicalKey]) {
      byCanonical[canonicalKey] = [];
    }
    byCanonical[canonicalKey].push(entry);
  }

  for (const [canonicalKey, variants] of Object.entries(byCanonical)) {
    const sample = variants[0];
    const langs = Array.from(new Set(variants.map((v) => v.id.lang)));
    for (const lang of langs) {
      const url = `${BASE_URL}/materials/${sample.id.category}/${sample.id.section}/${sample.id.slug}?lang=${lang}`;
      if (urlSet.has(url)) continue;
      urlSet.add(url);
      urls.push({
        loc: url,
        changefreq: 'monthly',
        priority: '0.8',
      });
    }
  }

  // Generate XML
  // Use W3C Datetime format (YYYY-MM-DD) for better compatibility
  const now = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Write file with UTF-8 encoding (without BOM)
  await writeFile(OUTPUT_FILE, xml, { encoding: 'utf8' });
  console.log(`Generated sitemap.xml with ${urls.length} URLs`);
  console.log(`Sitemap location: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});

