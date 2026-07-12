import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const MATERIALS_DIR = path.join(ROOT_DIR, 'content', 'materials');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'materials', 'generated-materials.json');
const PUBLIC_INDEX_FILE = path.join(ROOT_DIR, 'public', 'materials-index.json');
const CONTENT_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'materials-content');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDateString(value) {
  if (!isNonEmptyString(value) || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseMarkdownWithFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    throw new Error('missing frontmatter block');
  }

  const data = parseYaml(match[1]) ?? {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('frontmatter must be a YAML mapping');
  }

  return {
    data,
    content: match[2],
  };
}

function validateFrontmatter({ frontmatter, id, filePath }) {
  const errors = [];
  const fm = frontmatter || {};

  const requiredStringFields = ['title', 'category', 'categoryTitle', 'section', 'sectionTitle'];
  for (const field of requiredStringFields) {
    if (!isNonEmptyString(fm[field])) {
      errors.push(`${filePath}: frontmatter "${field}" must be a non-empty string`);
    }
  }

  if (isNonEmptyString(fm.category) && fm.category !== id.category) {
    errors.push(`${filePath}: frontmatter "category" (${fm.category}) must match path category (${id.category})`);
  }

  if (isNonEmptyString(fm.section) && fm.section !== id.section) {
    errors.push(`${filePath}: frontmatter "section" (${fm.section}) must match path section (${id.section})`);
  }

  if (fm.subtitle !== undefined && !isNonEmptyString(fm.subtitle)) {
    errors.push(`${filePath}: frontmatter "subtitle" must be a non-empty string when provided`);
  }

  if (fm.level !== undefined && !isNonEmptyString(fm.level)) {
    errors.push(`${filePath}: frontmatter "level" must be a non-empty string when provided`);
  }

  if (fm.order !== undefined && (!Number.isInteger(fm.order) || fm.order < 0)) {
    errors.push(`${filePath}: frontmatter "order" must be an integer >= 0`);
  }

  if (fm.sectionOrder !== undefined && (!Number.isInteger(fm.sectionOrder) || fm.sectionOrder < 0)) {
    errors.push(`${filePath}: frontmatter "sectionOrder" must be an integer >= 0`);
  }

  if (fm.tags !== undefined) {
    if (!Array.isArray(fm.tags) || fm.tags.some((tag) => !isNonEmptyString(tag))) {
      errors.push(`${filePath}: frontmatter "tags" must be an array of non-empty strings`);
    }
  }

  if (fm.datePublished !== undefined && !isValidDateString(fm.datePublished)) {
    errors.push(`${filePath}: frontmatter "datePublished" must be in YYYY-MM-DD format`);
  }

  if (fm.dateModified !== undefined && !isValidDateString(fm.dateModified)) {
    errors.push(`${filePath}: frontmatter "dateModified" must be in YYYY-MM-DD format`);
  }

  if (isValidDateString(fm.datePublished) && isValidDateString(fm.dateModified) && fm.dateModified < fm.datePublished) {
    errors.push(`${filePath}: frontmatter "dateModified" cannot be earlier than "datePublished"`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalized = {
    title: fm.title.trim(),
    category: fm.category.trim(),
    categoryTitle: fm.categoryTitle.trim(),
    section: fm.section.trim(),
    sectionTitle: fm.sectionTitle.trim(),
    ...(fm.subtitle !== undefined ? { subtitle: fm.subtitle.trim() } : {}),
    ...(fm.level !== undefined ? { level: fm.level.trim() } : {}),
    ...(fm.order !== undefined ? { order: fm.order } : {}),
    ...(fm.sectionOrder !== undefined ? { sectionOrder: fm.sectionOrder } : {}),
    ...(fm.tags !== undefined ? { tags: fm.tags.map((tag) => tag.trim()) } : {}),
    ...(fm.datePublished !== undefined ? { datePublished: fm.datePublished } : {}),
    ...(fm.dateModified !== undefined ? { dateModified: fm.dateModified } : {}),
  };

  return { ok: true, value: normalized };
}

async function main() {
  const entries = [];
  const errors = [];
  const seenIds = new Set();

  await rm(CONTENT_OUTPUT_DIR, { recursive: true, force: true });

  await walkDir(MATERIALS_DIR, async (filePath) => {
    const raw = await readFile(filePath, 'utf8');
    if (!raw.trim()) {
      errors.push(`${filePath}: file is empty`);
      return;
    }

    let parsed;
    try {
      parsed = parseMarkdownWithFrontmatter(raw);
    } catch (error) {
      errors.push(`${toPosixPath(path.relative(ROOT_DIR, filePath))}: invalid frontmatter: ${error.message}`);
      return;
    }

    const { data, content } = parsed;
    if (!content.trim()) {
      errors.push(`${filePath}: markdown content is empty`);
      return;
    }

    const id = deriveIdFromPath(filePath);
    if (!id) {
      errors.push(`${filePath}: invalid material path. Expected */materials/<category>/<section>/<slug>.<ru|en>.md`);
      return;
    }

    const materialId = `${id.category}/${id.section}/${id.slug}/${id.lang}`;
    if (seenIds.has(materialId)) {
      errors.push(`${filePath}: duplicate material id "${materialId}"`);
      return;
    }
    seenIds.add(materialId);

    const validated = validateFrontmatter({
      frontmatter: data || {},
      id,
      filePath: toPosixPath(path.relative(ROOT_DIR, filePath)),
    });
    if (!validated.ok) {
      errors.push(...validated.errors);
      return;
    }

    const webPath = `/content/materials/${toPosixPath(path.relative(MATERIALS_DIR, filePath))}`;

    const relativePath = toPosixPath(path.relative(MATERIALS_DIR, filePath));
    const contentRelativePath = relativePath.replace(/\.md$/, '.json');
    const contentPath = `/materials-content/${contentRelativePath}`;
    const contentOutputFile = path.join(CONTENT_OUTPUT_DIR, contentRelativePath);

    await mkdir(path.dirname(contentOutputFile), { recursive: true });
    await writeFile(contentOutputFile, JSON.stringify({ content }), 'utf8');

    entries.push({
      ...validated.value,
      id,
      path: webPath,
      contentPath,
    });
  });

  if (errors.length > 0) {
    console.error('Material generation failed with validation errors:');
    errors.forEach((entry) => {
      console.error(`- ${entry}`);
    });
    process.exit(1);
  }

  const payload = { entries };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  await mkdir(path.dirname(PUBLIC_INDEX_FILE), { recursive: true });
  await writeFile(PUBLIC_INDEX_FILE, JSON.stringify(payload), 'utf8');

  console.log(
    `Generated ${entries.length} materials into ${path.relative(ROOT_DIR, OUTPUT_FILE)} and ${path.relative(ROOT_DIR, PUBLIC_INDEX_FILE)}`,
  );
}

main().catch((error) => {
  console.error('Failed to generate materials JSON:', error);
  process.exit(1);
});
