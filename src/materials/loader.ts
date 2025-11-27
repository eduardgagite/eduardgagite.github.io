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

import generated from './generated-materials.json';

interface GeneratedMaterialsFile {
  entries: MaterialWithContent[];
}

export function loadMaterialsTree(preferredLang: 'ru' | 'en'): MaterialsTree {
  const file = generated as GeneratedMaterialsFile;
  const entries = file.entries;

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

