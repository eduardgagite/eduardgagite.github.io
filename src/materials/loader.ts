export interface MaterialFrontmatter {
  title: string;
  subtitle?: string;
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
  byId: Record<string, MaterialWithContent>;
}

const materialsModules = (import.meta as any).glob('/content/materials/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadMaterialsTree(preferredLang: 'ru' | 'en'): MaterialsTree {
  const entries: MaterialWithContent[] = [];

  for (const [path, raw] of Object.entries(materialsModules)) {
    if (!raw) continue;
    const parsed = parseFrontmatter(raw);
    const data = parsed.data as Partial<MaterialFrontmatter>;
    if (
      !data.title ||
      !data.category ||
      !data.categoryTitle ||
      !data.section ||
      !data.sectionTitle
    ) continue;

    const id = deriveIdFromPath(path);
    if (!id) continue;

    entries.push({
      ...(data as MaterialFrontmatter),
      id,
      path,
      content: parsed.content,
    });
  }

  // Group by canonical id (category/section/slug) and choose best lang
  const byCanonical: Record<string, MaterialWithContent[]> = {};
  for (const entry of entries) {
    const key = `${entry.id.category}/${entry.id.section}/${entry.id.slug}`;
    if (!byCanonical[key]) byCanonical[key] = [];
    byCanonical[key].push(entry);
  }

  const picked: MaterialWithContent[] = [];
  const byId: Record<string, MaterialWithContent> = {};

  Object.values(byCanonical).forEach((variants) => {
    let chosen = variants.find((v) => v.id.lang === preferredLang);
    if (!chosen) chosen = variants[0];
    picked.push(chosen);
    const key = materialKey(chosen.id);
    byId[key] = chosen;
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

  return { categories, byId };
}

export function materialKey(id: MaterialId): string {
  return `${id.category}/${id.section}/${id.slug}`;
}

function deriveIdFromPath(path: string): MaterialId | null {
  // Example: /content/materials/golang/pointers/what-are-pointers.ru.md
  const parts = path.split('/');
  const idx = parts.indexOf('materials');
  if (idx === -1 || parts.length < idx + 4) return null;
  const category = parts[idx + 1] || '';
  const section = parts[idx + 2] || '';
  const file = parts[idx + 3] || '';

  const match = file.match(/^(.*)\.(ru|en)\.md$/);
  if (!match) return null;
  const [, slug, lang] = match;
  if (lang !== 'ru' && lang !== 'en') return null;

  return { category, section, slug, lang };
}

interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  if (!raw.startsWith('---')) {
    return { data: {}, content: raw };
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return { data: {}, content: raw };
  }

  const header = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).replace(/^\s*\n/, '');
  const lines = header.split('\n');
  const data: Record<string, unknown> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [rawKey, ...rest] = trimmed.split(':');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim();
    const rawValue = rest.join(':').trim();
    const value = parseFrontmatterValue(rawValue);
    data[key] = value;
  }

  return { data, content };
}

function parseFrontmatterValue(rawValue: string): unknown {
  if (!rawValue) return '';
  const v = rawValue.trim();

  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }

  if (/^\d+$/.test(v)) return Number(v);

  if (v.startsWith('[') && v.endsWith(']')) {
    try {
      return JSON.parse(v.replace(/'/g, '"'));
    } catch {
      return [];
    }
  }

  if (v === 'true') return true;
  if (v === 'false') return false;

  return v;
}



