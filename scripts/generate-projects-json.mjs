import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const PROJECTS_DIR = path.join(ROOT_DIR, 'content', 'projects');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'projects', 'generated-projects.json');
const PUBLIC_INDEX_FILE = path.join(ROOT_DIR, 'public', 'projects-index.json');
const CONTENT_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'projects-content');

const STATUS_VALUES = ['production', 'active', 'done'];
const CODE_VALUES = ['private', 'public'];
const KIND_VALUES = ['work', 'personal'];

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function deriveIdFromFileName(fileName) {
  const match = fileName.match(/^(.*)\.(ru|en)\.md$/);
  if (!match) return null;
  const [, slug, lang] = match;
  if (!slug) return null;
  return { slug, lang };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
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

function validateFrontmatter({ frontmatter, filePath }) {
  const errors = [];
  const fm = frontmatter || {};

  for (const field of ['title', 'summary']) {
    if (!isNonEmptyString(fm[field])) {
      errors.push(`${filePath}: frontmatter "${field}" must be a non-empty string`);
    }
  }

  if (!Number.isInteger(fm.order) || fm.order < 0) {
    errors.push(`${filePath}: frontmatter "order" must be an integer >= 0`);
  }

  if (!STATUS_VALUES.includes(fm.status)) {
    errors.push(`${filePath}: frontmatter "status" must be one of ${STATUS_VALUES.join(', ')}`);
  }

  if (!CODE_VALUES.includes(fm.code)) {
    errors.push(`${filePath}: frontmatter "code" must be one of ${CODE_VALUES.join(', ')}`);
  }

  if (!KIND_VALUES.includes(fm.kind)) {
    errors.push(`${filePath}: frontmatter "kind" must be one of ${KIND_VALUES.join(', ')}`);
  }

  if (!Array.isArray(fm.stack) || fm.stack.length === 0 || fm.stack.some((item) => !isNonEmptyString(item))) {
    errors.push(`${filePath}: frontmatter "stack" must be a non-empty array of strings`);
  }

  for (const field of ['period', 'role', 'codeUrl', 'liveUrl']) {
    if (fm[field] !== undefined && !isNonEmptyString(fm[field])) {
      errors.push(`${filePath}: frontmatter "${field}" must be a non-empty string when provided`);
    }
  }

  if (fm.code === 'public' && !isNonEmptyString(fm.codeUrl)) {
    errors.push(`${filePath}: frontmatter "codeUrl" is required when "code" is public`);
  }

  if (fm.metrics !== undefined) {
    errors.push(`${filePath}: frontmatter "metrics" is no longer supported — remove it`);
  }

  if (fm.shots !== undefined) {
    const isValidShot = (shot) =>
      shot &&
      typeof shot === 'object' &&
      !Array.isArray(shot) &&
      isNonEmptyString(shot.src) &&
      isNonEmptyString(shot.caption);
    if (!Array.isArray(fm.shots) || fm.shots.length === 0 || fm.shots.some((shot) => !isValidShot(shot))) {
      errors.push(`${filePath}: frontmatter "shots" must be a non-empty array of { src, caption } strings`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalized = {
    title: fm.title.trim(),
    summary: fm.summary.trim(),
    order: fm.order,
    status: fm.status,
    code: fm.code,
    kind: fm.kind,
    stack: fm.stack.map((item) => item.trim()),
    ...(fm.period !== undefined ? { period: fm.period.trim() } : {}),
    ...(fm.role !== undefined ? { role: fm.role.trim() } : {}),
    ...(fm.codeUrl !== undefined ? { codeUrl: fm.codeUrl.trim() } : {}),
    ...(fm.liveUrl !== undefined ? { liveUrl: fm.liveUrl.trim() } : {}),
    ...(fm.shots !== undefined
      ? { shots: fm.shots.map((shot) => ({ src: shot.src.trim(), caption: shot.caption.trim() })) }
      : {}),
  };

  return { ok: true, value: normalized };
}

async function main() {
  const entries = [];
  const errors = [];
  const seenIds = new Set();

  await rm(CONTENT_OUTPUT_DIR, { recursive: true, force: true });

  const dirEntries = await readdir(PROJECTS_DIR, { withFileTypes: true });
  for (const dirEntry of dirEntries) {
    if (!dirEntry.isFile() || !dirEntry.name.endsWith('.md')) continue;

    const filePath = path.join(PROJECTS_DIR, dirEntry.name);
    const relativePath = toPosixPath(path.relative(ROOT_DIR, filePath));
    const raw = await readFile(filePath, 'utf8');
    if (!raw.trim()) {
      errors.push(`${relativePath}: file is empty`);
      continue;
    }

    let parsed;
    try {
      parsed = parseMarkdownWithFrontmatter(raw);
    } catch (error) {
      errors.push(`${relativePath}: invalid frontmatter: ${error.message}`);
      continue;
    }

    const { data, content } = parsed;
    if (!content.trim()) {
      errors.push(`${relativePath}: markdown content is empty`);
      continue;
    }

    const id = deriveIdFromFileName(dirEntry.name);
    if (!id) {
      errors.push(`${relativePath}: invalid project file name. Expected <slug>.<ru|en>.md`);
      continue;
    }

    const projectId = `${id.slug}/${id.lang}`;
    if (seenIds.has(projectId)) {
      errors.push(`${relativePath}: duplicate project id "${projectId}"`);
      continue;
    }
    seenIds.add(projectId);

    const validated = validateFrontmatter({ frontmatter: data || {}, filePath: relativePath });
    if (!validated.ok) {
      errors.push(...validated.errors);
      continue;
    }

    const contentRelativePath = `${id.slug}.${id.lang}.json`;
    const contentPath = `/projects-content/${contentRelativePath}`;
    const contentOutputFile = path.join(CONTENT_OUTPUT_DIR, contentRelativePath);

    await mkdir(path.dirname(contentOutputFile), { recursive: true });
    await writeFile(contentOutputFile, JSON.stringify({ content }), 'utf8');

    entries.push({
      ...validated.value,
      id,
      contentPath,
    });
  }

  if (errors.length > 0) {
    console.error('Project generation failed with validation errors:');
    errors.forEach((entry) => {
      console.error(`- ${entry}`);
    });
    process.exit(1);
  }

  entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const payload = { entries };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  await mkdir(path.dirname(PUBLIC_INDEX_FILE), { recursive: true });
  await writeFile(PUBLIC_INDEX_FILE, JSON.stringify(payload), 'utf8');

  console.log(
    `Generated ${entries.length} projects into ${path.relative(ROOT_DIR, OUTPUT_FILE)} and ${path.relative(ROOT_DIR, PUBLIC_INDEX_FILE)}`,
  );
}

main().catch((error) => {
  console.error('Failed to generate projects JSON:', error);
  process.exit(1);
});
