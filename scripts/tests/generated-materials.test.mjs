import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..', '..');
const materialsDir = path.join(rootDir, 'content', 'materials');
const publicContentDir = path.join(rootDir, 'public', 'materials-content');
const srcIndexPath = path.join(rootDir, 'src', 'materials', 'generated-materials.json');
const publicIndexPath = path.join(rootDir, 'public', 'materials-index.json');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const baseUrl = 'https://eduardgagite.github.io';

async function walkMarkdownFiles(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(fullPath);
    }
  }
  return out;
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function deriveIdFromRelativePath(relativePath) {
  const parts = relativePath.split('/');
  const file = parts[2] || '';
  const match = file.match(/^(.*)\.(ru|en)\.md$/);
  if (parts.length !== 3 || !match) return null;
  return {
    category: parts[0],
    section: parts[1],
    slug: match[1],
    lang: match[2],
  };
}

function materialIdString(id) {
  return `${id.category}/${id.section}/${id.slug}/${id.lang}`;
}

const frontmatterFields = [
  'title',
  'subtitle',
  'datePublished',
  'dateModified',
  'level',
  'category',
  'categoryTitle',
  'section',
  'sectionTitle',
  'sectionOrder',
  'order',
  'tags',
];

function parseMarkdownWithFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  assert.ok(match, 'Markdown file must contain a frontmatter block');
  const frontmatter = parseYaml(match[1]) ?? {};
  assert.equal(typeof frontmatter, 'object', 'Frontmatter must be a YAML mapping');
  assert.equal(Array.isArray(frontmatter), false, 'Frontmatter must be a YAML mapping');
  return {
    frontmatter,
    content: match[2],
  };
}

function normalizeFrontmatter(frontmatter) {
  return Object.fromEntries(
    frontmatterFields
      .filter((field) => frontmatter[field] !== undefined)
      .map((field) => {
        const value = frontmatter[field];
        if (typeof value === 'string') return [field, value.trim()];
        if (Array.isArray(value)) {
          return [field, value.map((item) => (typeof item === 'string' ? item.trim() : item))];
        }
        return [field, value];
      }),
  );
}

function pickGeneratedFrontmatter(entry) {
  return Object.fromEntries(
    frontmatterFields.filter((field) => entry[field] !== undefined).map((field) => [field, entry[field]]),
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

test('generated material indexes and content files match markdown sources', async () => {
  const [sourceFiles, publicIndex] = await Promise.all([walkMarkdownFiles(materialsDir), readJson(publicIndexPath)]);
  const entries = publicIndex.entries || [];

  const sourceById = new Map();
  for (const filePath of sourceFiles) {
    const relativePath = toPosixPath(path.relative(materialsDir, filePath));
    const id = deriveIdFromRelativePath(relativePath);
    assert.ok(id, `Invalid material filename: ${relativePath}`);
    sourceById.set(materialIdString(id), { filePath, relativePath, id });
  }

  const entryIds = entries.map((entry) => materialIdString(entry.id)).sort();
  const sourceIds = [...sourceById.keys()].sort();
  assert.deepEqual(entryIds, sourceIds, 'Generated material index is out of sync with markdown files');

  for (const entry of entries) {
    const source = sourceById.get(materialIdString(entry.id));
    assert.ok(source, `Missing source for generated entry: ${materialIdString(entry.id)}`);

    const expectedContentPath = `/materials-content/${source.relativePath.replace(/\.md$/, '.json')}`;
    assert.equal(entry.contentPath, expectedContentPath);

    const markdownRaw = await readFile(source.filePath, 'utf8');
    const { frontmatter, content } = parseMarkdownWithFrontmatter(markdownRaw);
    assert.deepEqual(
      pickGeneratedFrontmatter(entry),
      normalizeFrontmatter(frontmatter),
      `Stale generated frontmatter: ${source.relativePath}`,
    );

    const contentFilePath = path.join(publicContentDir, source.relativePath.replace(/\.md$/, '.json'));
    const contentPayload = await readJson(contentFilePath);
    assert.equal(contentPayload.content, content, `Stale generated content: ${source.relativePath}`);
  }
});

test('public and src material indexes contain the same payload', async () => {
  const [srcIndex, publicIndex] = await Promise.all([readJson(srcIndexPath), readJson(publicIndexPath)]);

  assert.deepEqual(publicIndex, srcIndex);
});

test('sitemap contains all generated material and main page URLs', async () => {
  const [publicIndex, sitemap] = await Promise.all([readJson(publicIndexPath), readFile(sitemapPath, 'utf8')]);
  const entries = publicIndex.entries || [];
  const urls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));

  const expectedUrls = [
    `${baseUrl}/?lang=ru`,
    `${baseUrl}/?lang=en`,
    `${baseUrl}/materials?lang=ru`,
    `${baseUrl}/materials?lang=en`,
    ...entries.map(
      (entry) => `${baseUrl}/materials/${entry.id.category}/${entry.id.section}/${entry.id.slug}?lang=${entry.id.lang}`,
    ),
  ].sort();

  assert.deepEqual([...urls].sort(), expectedUrls);
});
