import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const MATERIALS_DIR = path.join(ROOT_DIR, 'content', 'materials');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'materials', 'generated-materials.json');

async function walkDir(dir, visitor) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, visitor);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Only process markdown materials
      await visitor(fullPath);
    }
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function deriveIdFromPath(absolutePath) {
  const rel = toPosixPath(path.relative(ROOT_DIR, absolutePath));
  const parts = rel.split('/');
  const idx = parts.indexOf('materials');
  if (idx === -1 || parts.length < idx + 4) return null;

  const category = parts[idx + 1] || '';
  const section = parts[idx + 2] || '';
  const file = parts[idx + 3] || '';

  const match = file.match(/^(.*)\.(ru|en)\.md$/);
  if (!match) return null;
  const [, slug, lang] = match;
  if (lang !== 'ru' && lang !== 'en') return null;

  return {
    category,
    section,
    slug,
    lang,
  };
}

async function main() {
  const entries = [];

  await walkDir(MATERIALS_DIR, async (filePath) => {
    const raw = await readFile(filePath, 'utf8');
    if (!raw.trim()) return;

    const { data, content } = matter(raw);
    const fm = data || {};

    if (
      !fm.title ||
      !fm.category ||
      !fm.categoryTitle ||
      !fm.section ||
      !fm.sectionTitle
    ) {
      return;
    }

    const id = deriveIdFromPath(filePath);
    if (!id) return;

    const webPath = `/content/materials/${toPosixPath(
      path.relative(MATERIALS_DIR, filePath),
    )}`;

    entries.push({
      ...(fm),
      id,
      path: webPath,
      content,
    });
  });

  const payload = { entries };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Generated ${entries.length} materials into ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate materials JSON:', error);
  process.exit(1);
});


