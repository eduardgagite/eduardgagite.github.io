import type { MaterialMeta, MaterialsCategory } from '../../materials/loader';

export interface MaterialHit {
  material: MaterialMeta;
  categoryTitle: string;
  sectionTitle: string;
  /** 0 — совпало название материала, 1 — название раздела, 2 — курс или slug. */
  rank: 0 | 1 | 2;
}

const MIN_QUERY_LENGTH = 2;

/** «06-worker-pool» → «worker pool»: в поиске люди пишут словами, а не слагами. */
export function normalizeSlug(slug: string): string {
  return slug.replace(/^\d+-/, '').replace(/-/g, ' ');
}

function rankMaterial(
  material: MaterialMeta,
  categoryTitle: string,
  sectionTitle: string,
  query: string,
): MaterialHit['rank'] | null {
  const title = `${material.title} ${material.subtitle || ''}`.toLowerCase();
  if (title.includes(query)) return 0;

  if (sectionTitle.toLowerCase().includes(query)) return 1;

  const wide = `${categoryTitle} ${normalizeSlug(material.id.slug)} ${(material.tags || []).join(' ')}`.toLowerCase();
  if (wide.includes(query)) return 2;

  return null;
}

export function searchMaterials(categories: MaterialsCategory[], rawQuery: string): MaterialHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < MIN_QUERY_LENGTH) return [];

  const hits: MaterialHit[] = [];

  categories.forEach((category) => {
    category.sections.forEach((section) => {
      section.materials.forEach((material) => {
        const rank = rankMaterial(material, category.title, section.title, query);
        if (rank === null) return;
        hits.push({ material, categoryTitle: category.title, sectionTitle: section.title, rank });
      });
    });
  });

  // Стабильная сортировка сохраняет исходный порядок курс → раздел → материал внутри ранга.
  return hits.sort((a, b) => a.rank - b.rank);
}
