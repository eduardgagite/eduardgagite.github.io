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

  // Add main pages
  urls.push({
    loc: `${BASE_URL}/`,
    changefreq: 'weekly',
    priority: '1.0',
  });

  urls.push({
    loc: `${BASE_URL}/materials`,
    changefreq: 'weekly',
    priority: '0.9',
  });

  // Add material pages (prefer Russian version, but include both if available)
  const byCanonical = {};
  for (const entry of entries) {
    const canonicalKey = `${entry.id.category}/${entry.id.section}/${entry.id.slug}`;
    if (!byCanonical[canonicalKey]) {
      byCanonical[canonicalKey] = [];
    }
    byCanonical[canonicalKey].push(entry);
  }

  for (const [canonicalKey, variants] of Object.entries(byCanonical)) {
    // Prefer Russian, fallback to any available
    const preferred = variants.find((v) => v.id.lang === 'ru') || variants[0];
    const url = `${BASE_URL}/materials/${preferred.id.category}/${preferred.id.section}/${preferred.id.slug}`;
    
    if (!urlSet.has(url)) {
      urlSet.add(url);
      urls.push({
        loc: url,
        changefreq: 'monthly',
        priority: '0.8',
      });
    }
  }

  // Generate XML
  const now = new Date().toISOString();
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

  await writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`Generated sitemap.xml with ${urls.length} URLs`);
}

main().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});

