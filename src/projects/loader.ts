export type ProjectStatus = 'production' | 'active' | 'done';
export type ProjectCode = 'private' | 'public';
export type ProjectKind = 'work' | 'personal';

export interface ProjectShot {
  src: string;
  caption: string;
}

export interface ProjectId {
  slug: string;
  lang: 'ru' | 'en';
}

export interface ProjectMeta {
  title: string;
  summary: string;
  order: number;
  status: ProjectStatus;
  code: ProjectCode;
  kind: ProjectKind;
  stack: string[];
  period?: string;
  role?: string;
  codeUrl?: string;
  liveUrl?: string;
  shots?: ProjectShot[];
  id: ProjectId;
  contentPath: string;
}

export interface ProjectWithContent extends ProjectMeta {
  content: string;
}

export interface ProjectsList {
  projects: ProjectMeta[];
  availableLanguages: Record<string, Array<'ru' | 'en'>>;
}

export interface GeneratedProjectsFile {
  entries: ProjectMeta[];
}

const PROJECTS_INDEX_PATH = '/projects-index.json';
let projectsIndexPromise: Promise<GeneratedProjectsFile> | null = null;
const projectsListCache = new Map<'ru' | 'en', Promise<ProjectsList>>();

function resolvePublicAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

async function loadProjectsIndex(): Promise<GeneratedProjectsFile> {
  if (projectsIndexPromise) return projectsIndexPromise;

  projectsIndexPromise = fetch(resolvePublicAssetPath(PROJECTS_INDEX_PATH), { cache: 'default' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load projects index: ${response.status}`);
      }
      return parseProjectsIndexPayload(await response.json());
    })
    .catch((error) => {
      projectsIndexPromise = null;
      throw error;
    });

  return projectsIndexPromise;
}

export function buildProjectsList(entries: ProjectMeta[], preferredLang: 'ru' | 'en'): ProjectsList {
  const bySlug = new Map<string, ProjectMeta[]>();
  for (const entry of entries) {
    const variants = bySlug.get(entry.id.slug) || [];
    variants.push(entry);
    bySlug.set(entry.id.slug, variants);
  }

  const projects: ProjectMeta[] = [];
  const availableLanguages: Record<string, Array<'ru' | 'en'>> = {};

  for (const [slug, variants] of bySlug) {
    const chosen = variants.find((variant) => variant.id.lang === preferredLang) || variants[0];
    projects.push(chosen);
    availableLanguages[slug] = [...new Set(variants.map((variant) => variant.id.lang))].sort((a, b) =>
      a === 'ru' ? -1 : b === 'ru' ? 1 : 0,
    );
  }

  projects.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  return { projects, availableLanguages };
}

export async function loadProjectsList(preferredLang: 'ru' | 'en'): Promise<ProjectsList> {
  const cached = projectsListCache.get(preferredLang);
  if (cached) return cached;

  const pending = loadProjectsIndex()
    .then((file) => buildProjectsList(file.entries, preferredLang))
    .catch((error) => {
      projectsListCache.delete(preferredLang);
      throw error;
    });

  projectsListCache.set(preferredLang, pending);
  return pending;
}

const projectContentCache = new Map<string, Promise<ProjectWithContent>>();

export async function loadProjectContent(project: ProjectMeta): Promise<ProjectWithContent> {
  const cacheKey = `${project.id.slug}:${project.id.lang}`;
  const cached = projectContentCache.get(cacheKey);
  if (cached) return cached;

  const pending = fetch(resolvePublicAssetPath(project.contentPath), { cache: 'default' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load project content: ${response.status}`);
      }
      const payload: unknown = await response.json();
      if (!isRecord(payload) || typeof payload.content !== 'string') {
        throw new Error('Invalid project content payload');
      }
      return {
        ...project,
        content: payload.content,
      };
    })
    .catch((error) => {
      projectContentCache.delete(cacheKey);
      throw error;
    });

  projectContentCache.set(cacheKey, pending);
  return pending;
}

export function parseProjectsIndexPayload(payload: unknown): GeneratedProjectsFile {
  if (!isRecord(payload) || !Array.isArray(payload.entries)) {
    throw new Error('Invalid projects index payload');
  }

  return {
    entries: payload.entries.map(parseProjectMeta),
  };
}

function parseProjectMeta(value: unknown): ProjectMeta {
  if (!isRecord(value)) {
    throw new Error('Invalid project index entry');
  }

  const id = parseProjectId(value.id);
  const status = value.status;
  if (status !== 'production' && status !== 'active' && status !== 'done') {
    throw new Error('Invalid project status');
  }
  const code = value.code;
  if (code !== 'private' && code !== 'public') {
    throw new Error('Invalid project code visibility');
  }
  const kind = value.kind;
  if (kind !== 'work' && kind !== 'personal') {
    throw new Error('Invalid project kind');
  }

  const stack = value.stack;
  if (!Array.isArray(stack) || stack.length === 0 || !stack.every((item) => typeof item === 'string')) {
    throw new Error('Invalid project stack');
  }

  const order = value.order;
  if (typeof order !== 'number' || !Number.isFinite(order)) {
    throw new Error('Invalid project order');
  }

  const meta: ProjectMeta = {
    title: readRequiredString(value, 'title'),
    summary: readRequiredString(value, 'summary'),
    order,
    status,
    code,
    kind,
    stack,
    id,
    contentPath: readRequiredString(value, 'contentPath'),
  };

  const period = readOptionalString(value, 'period');
  const role = readOptionalString(value, 'role');
  const codeUrl = readOptionalString(value, 'codeUrl');
  const liveUrl = readOptionalString(value, 'liveUrl');

  if (period !== undefined) meta.period = period;
  if (role !== undefined) meta.role = role;
  if (codeUrl !== undefined) meta.codeUrl = codeUrl;
  if (liveUrl !== undefined) meta.liveUrl = liveUrl;

  if (value.shots !== undefined) {
    if (!Array.isArray(value.shots)) {
      throw new Error('Invalid project shots');
    }
    meta.shots = value.shots.map((shot) => {
      if (!isRecord(shot)) {
        throw new Error('Invalid project shot');
      }
      return {
        src: readRequiredString(shot, 'src'),
        caption: readRequiredString(shot, 'caption'),
      };
    });
  }

  return meta;
}

function parseProjectId(value: unknown): ProjectId {
  if (!isRecord(value)) {
    throw new Error('Invalid project id');
  }

  const lang = value.lang;
  if (lang !== 'ru' && lang !== 'en') {
    throw new Error('Invalid project language');
  }

  return {
    slug: readRequiredString(value, 'slug'),
    lang,
  };
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new Error(`Invalid project field: ${key}`);
  }
  return value;
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Invalid project field: ${key}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
