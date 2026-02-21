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
  availableLanguages: Record<string, Array<'ru' | 'en'>>; // Maps canonical key to available languages
}

interface GeneratedMaterialsFile {
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
      const payload = (await response.json()) as { entries?: unknown };
      if (!payload || !Array.isArray(payload.entries)) {
        throw new Error('Invalid materials index payload');
      }
      return payload as GeneratedMaterialsFile;
    })
    .catch((error) => {
      materialsIndexPromise = null;
      throw error;
    });

  return materialsIndexPromise;
}

function buildMaterialsTree(entries: MaterialMeta[], preferredLang: 'ru' | 'en'): MaterialsTree {

  // Group by canonical id (category/section/slug) and choose best lang
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
    
    // Track available languages for this material
    availableLanguages[canonicalKey] = variants.map(v => v.id.lang);
  });

  // Build categories/sections
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
      // Update order if this material has a sectionOrder (sections use sectionOrder from their materials)
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
      const payload = (await response.json()) as { content?: unknown };
      if (typeof payload.content !== 'string') {
        throw new Error('Invalid material content payload');
      }
      return {
        ...material,
        content: payload.content,
      };
    })
    .catch((error) => {
      materialContentCache.delete(cacheKey);
      throw error;
    });

  materialContentCache.set(cacheKey, pending);
  return pending;
}
