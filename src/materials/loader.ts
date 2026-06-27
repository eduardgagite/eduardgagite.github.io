export interface MaterialFrontmatter {
  title: string;
  subtitle?: string;
  datePublished?: string;
  dateModified?: string;
  level?: string;
  category: string;
  categoryTitle: string;
  section: string;
  sectionTitle: string;
  sectionOrder?: number;
  order?: number;
  tags?: string[];
}

export interface MaterialId {
  category: string;
  section: string;
  slug: string;
  lang: 'ru' | 'en';
}

export interface MaterialMeta extends MaterialFrontmatter {
  id: MaterialId;
  path: string;
  contentPath: string;
}

export interface MaterialWithContent extends MaterialMeta {
  content: string;
}

export interface MaterialsSection {
  id: string;
  title: string;
  order: number;
  materials: MaterialMeta[];
}

export interface MaterialsCategory {
  id: string;
  title: string;
  sections: MaterialsSection[];
}

export interface MaterialsTree {
  categories: MaterialsCategory[];
  byId: Record<string, MaterialMeta>;
  availableLanguages: Record<string, Array<'ru' | 'en'>>;
}

export interface GeneratedMaterialsFile {
  entries: MaterialMeta[];
}

const MATERIALS_INDEX_PATH = '/materials-index.json';
let materialsIndexPromise: Promise<GeneratedMaterialsFile> | null = null;
const materialsTreeCache = new Map<'ru' | 'en', Promise<MaterialsTree>>();

function resolvePublicAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

async function loadMaterialsIndex(): Promise<GeneratedMaterialsFile> {
  if (materialsIndexPromise) return materialsIndexPromise;

  materialsIndexPromise = fetch(resolvePublicAssetPath(MATERIALS_INDEX_PATH), { cache: 'default' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load materials index: ${response.status}`);
      }
      return parseMaterialsIndexPayload(await response.json());
    })
    .catch((error) => {
      materialsIndexPromise = null;
      throw error;
    });

  return materialsIndexPromise;
}

export function buildMaterialsTree(entries: MaterialMeta[], preferredLang: 'ru' | 'en'): MaterialsTree {
  const byCanonical: Record<string, MaterialMeta[]> = {};
  for (const entry of entries) {
    const key = `${entry.id.category}/${entry.id.section}/${entry.id.slug}`;
    if (!byCanonical[key]) byCanonical[key] = [];
    byCanonical[key].push(entry);
  }

  const picked: MaterialMeta[] = [];
  const byId: Record<string, MaterialMeta> = {};
  const availableLanguages: Record<string, Array<'ru' | 'en'>> = {};

  Object.entries(byCanonical).forEach(([canonicalKey, variants]) => {
    let chosen = variants.find((v) => v.id.lang === preferredLang);
    if (!chosen) chosen = variants[0];
    picked.push(chosen);
    const key = materialKey(chosen.id);
    byId[key] = chosen;
    availableLanguages[canonicalKey] = sortMaterialLanguages(variants.map((variant) => variant.id.lang));
  });

  const categoriesMap = new Map<string, MaterialsCategory>();
  for (const m of picked) {
    let category = categoriesMap.get(m.category);
    if (!category) {
      category = {
        id: m.category,
        title: m.categoryTitle,
        sections: [],
      };
      categoriesMap.set(m.category, category);
    }

    let section = category.sections.find((s) => s.id === m.section);
    if (!section) {
      section = {
        id: m.section,
        title: m.sectionTitle,
        order: m.sectionOrder ?? 0,
        materials: [],
      };
      category.sections.push(section);
    } else {
      if (m.sectionOrder !== undefined && (section.order === undefined || m.sectionOrder < section.order)) {
        section.order = m.sectionOrder;
      }
    }

    section.materials.push(m);
  }

  const categories = Array.from(categoriesMap.values()).map((cat) => ({
    ...cat,
    sections: cat.sections
      .map((section) => ({
        ...section,
        materials: section.materials
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title)),
  }));

  categories.sort((a, b) => a.title.localeCompare(b.title));

  return { categories, byId, availableLanguages };
}

export async function loadMaterialsTree(preferredLang: 'ru' | 'en'): Promise<MaterialsTree> {
  const cached = materialsTreeCache.get(preferredLang);
  if (cached) return cached;

  const pending = loadMaterialsIndex()
    .then((file) => buildMaterialsTree(file.entries, preferredLang))
    .catch((error) => {
      materialsTreeCache.delete(preferredLang);
      throw error;
    });

  materialsTreeCache.set(preferredLang, pending);
  return pending;
}

export function materialKey(id: MaterialId): string {
  return `${id.category}/${id.section}/${id.slug}`;
}

const materialContentCache = new Map<string, Promise<MaterialWithContent>>();

export async function loadMaterialContent(material: MaterialMeta): Promise<MaterialWithContent> {
  const cacheKey = `${materialKey(material.id)}:${material.id.lang}`;
  const cached = materialContentCache.get(cacheKey);
  if (cached) return cached;

  const pending = fetch(resolvePublicAssetPath(material.contentPath), { cache: 'default' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load material content: ${response.status}`);
      }
      return {
        ...material,
        content: parseMaterialContentPayload(await response.json()),
      };
    })
    .catch((error) => {
      materialContentCache.delete(cacheKey);
      throw error;
    });

  materialContentCache.set(cacheKey, pending);
  return pending;
}

export function parseMaterialsIndexPayload(payload: unknown): GeneratedMaterialsFile {
  if (!isRecord(payload) || !Array.isArray(payload.entries)) {
    throw new Error('Invalid materials index payload');
  }

  return {
    entries: payload.entries.map(parseMaterialMeta),
  };
}

export function parseMaterialContentPayload(payload: unknown): string {
  if (!isRecord(payload) || typeof payload.content !== 'string') {
    throw new Error('Invalid material content payload');
  }
  return payload.content;
}

function parseMaterialMeta(value: unknown): MaterialMeta {
  if (!isRecord(value)) {
    throw new Error('Invalid material index entry');
  }

  const id = parseMaterialId(value.id);
  const category = readRequiredString(value, 'category');
  const section = readRequiredString(value, 'section');
  if (id.category !== category || id.section !== section) {
    throw new Error('Material id does not match material frontmatter');
  }

  const meta: MaterialMeta = {
    title: readRequiredString(value, 'title'),
    category,
    categoryTitle: readRequiredString(value, 'categoryTitle'),
    section,
    sectionTitle: readRequiredString(value, 'sectionTitle'),
    id,
    path: readRequiredString(value, 'path'),
    contentPath: readRequiredString(value, 'contentPath'),
  };

  const subtitle = readOptionalString(value, 'subtitle');
  const datePublished = readOptionalString(value, 'datePublished');
  const dateModified = readOptionalString(value, 'dateModified');
  const level = readOptionalString(value, 'level');
  const sectionOrder = readOptionalNumber(value, 'sectionOrder');
  const order = readOptionalNumber(value, 'order');
  const tags = readOptionalStringArray(value, 'tags');

  if (subtitle !== undefined) meta.subtitle = subtitle;
  if (datePublished !== undefined) meta.datePublished = datePublished;
  if (dateModified !== undefined) meta.dateModified = dateModified;
  if (level !== undefined) meta.level = level;
  if (sectionOrder !== undefined) meta.sectionOrder = sectionOrder;
  if (order !== undefined) meta.order = order;
  if (tags !== undefined) meta.tags = tags;

  return meta;
}

function parseMaterialId(value: unknown): MaterialId {
  if (!isRecord(value)) {
    throw new Error('Invalid material id');
  }

  const lang = value.lang;
  if (lang !== 'ru' && lang !== 'en') {
    throw new Error('Invalid material language');
  }

  return {
    category: readRequiredString(value, 'category'),
    section: readRequiredString(value, 'section'),
    slug: readRequiredString(value, 'slug'),
    lang,
  };
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new Error(`Invalid material field: ${key}`);
  }
  return value;
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Invalid material field: ${key}`);
  }
  return value;
}

function readOptionalNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid material field: ${key}`);
  }
  return value;
}

function readOptionalStringArray(source: Record<string, unknown>, key: string): string[] | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Invalid material field: ${key}`);
  }
  return value;
}

function sortMaterialLanguages(languages: Array<'ru' | 'en'>): Array<'ru' | 'en'> {
  return [...new Set(languages)].sort((a, b) => languageOrder(a) - languageOrder(b));
}

function languageOrder(lang: 'ru' | 'en') {
  return lang === 'ru' ? 0 : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
