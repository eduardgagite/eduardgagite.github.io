import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..', '..');
const projectsDir = path.join(rootDir, 'content', 'projects');
const publicContentDir = path.join(rootDir, 'public', 'projects-content');
const srcIndexPath = path.join(rootDir, 'src', 'projects', 'generated-projects.json');
const publicIndexPath = path.join(rootDir, 'public', 'projects-index.json');

const frontmatterFields = [
  'title',
  'summary',
  'order',
  'status',
  'code',
  'kind',
  'stack',
  'role',
  'codeUrl',
  'liveUrl',
  'shots',
];

function deriveIdFromFileName(fileName) {
  const match = fileName.match(/^(.*)\.(ru|en)\.md$/);
  if (!match) return null;
  return { slug: match[1], lang: match[2] };
}

function projectIdString(id) {
  return `${id.slug}/${id.lang}`;
}

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
        if (field === 'stack' && Array.isArray(value)) {
          return [field, value.map((item) => (typeof item === 'string' ? item.trim() : item))];
        }
        if (field === 'shots' && Array.isArray(value)) {
          return [
            field,
            value.map((shot) => ({
              src: typeof shot.src === 'string' ? shot.src.trim() : shot.src,
              caption: typeof shot.caption === 'string' ? shot.caption.trim() : shot.caption,
            })),
          ];
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

test('generated project indexes and content files match markdown sources', async () => {
  const [dirEntries, publicIndex] = await Promise.all([
    readdir(projectsDir, { withFileTypes: true }),
    readJson(publicIndexPath),
  ]);
  const entries = publicIndex.entries || [];

  const sourceById = new Map();
  for (const dirEntry of dirEntries) {
    if (!dirEntry.isFile() || !dirEntry.name.endsWith('.md')) continue;
    const id = deriveIdFromFileName(dirEntry.name);
    assert.ok(id, `Invalid project filename: ${dirEntry.name}`);
    sourceById.set(projectIdString(id), { filePath: path.join(projectsDir, dirEntry.name), id });
  }

  const entryIds = entries.map((entry) => projectIdString(entry.id)).sort();
  const sourceIds = [...sourceById.keys()].sort();
  assert.deepEqual(entryIds, sourceIds, 'Generated project index is out of sync with markdown files');

  for (const entry of entries) {
    const source = sourceById.get(projectIdString(entry.id));
    assert.ok(source, `Missing source for generated entry: ${projectIdString(entry.id)}`);

    const expectedContentPath = `/projects-content/${entry.id.slug}.${entry.id.lang}.json`;
    assert.equal(entry.contentPath, expectedContentPath);

    const markdownRaw = await readFile(source.filePath, 'utf8');
    const { frontmatter, content } = parseMarkdownWithFrontmatter(markdownRaw);
    assert.deepEqual(
      pickGeneratedFrontmatter(entry),
      normalizeFrontmatter(frontmatter),
      `Stale generated frontmatter: ${entry.id.slug}.${entry.id.lang}.md`,
    );

    const contentFilePath = path.join(publicContentDir, `${entry.id.slug}.${entry.id.lang}.json`);
    const contentPayload = await readJson(contentFilePath);
    assert.equal(contentPayload.content, content, `Stale generated content: ${entry.id.slug}.${entry.id.lang}.md`);
  }
});

test('project entries are sorted by order and reference existing images', async () => {
  const publicIndex = await readJson(publicIndexPath);
  const entries = publicIndex.entries || [];
  assert.ok(entries.length > 0, 'Projects index must not be empty');

  const orders = entries.map((entry) => entry.order);
  assert.deepEqual(
    [...orders].sort((a, b) => a - b),
    orders,
    'Projects must be sorted by order',
  );

  for (const entry of entries) {
    const contentPayload = await readJson(path.join(publicContentDir, `${entry.id.slug}.${entry.id.lang}.json`));
    const imagePaths = [...contentPayload.content.matchAll(/!\[[^\]]*\]\((\/[^)]+)\)/g)].map((match) => match[1]);
    for (const shot of entry.shots || []) {
      imagePaths.push(shot.src);
    }
    for (const imagePath of imagePaths) {
      await assert.doesNotReject(
        readFile(path.join(rootDir, 'public', imagePath.replace(/^\//, ''))),
        `Missing image referenced by ${entry.id.slug}: ${imagePath}`,
      );
    }
  }
});

test('public and src project indexes contain the same payload', async () => {
  const [srcIndex, publicIndex] = await Promise.all([readJson(srcIndexPath), readJson(publicIndexPath)]);

  assert.deepEqual(publicIndex, srcIndex);
});
