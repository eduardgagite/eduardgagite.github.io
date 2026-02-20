import { materialKey, type MaterialMeta, type MaterialsCategory, type MaterialsSection, type MaterialsTree } from '../../materials/loader';
import type { FilterCriteria, FilterOptions } from './types';

interface FilterCategoriesArgs {
  categories: MaterialsCategory[];
  criteria: FilterCriteria;
}

interface FilterOptionsArgs {
  categories: MaterialsCategory[];
}

interface MaterialMatchArgs {
  material: MaterialMeta;
  criteria: FilterCriteria;
}

export function filterCategoriesTree({ categories, criteria }: FilterCategoriesArgs): MaterialsCategory[] {
  const normalizedQuery = criteria.query.trim().toLowerCase();
  const hasFilters = !!normalizedQuery || !!criteria.tag || !!criteria.level;
  if (!hasFilters) return categories;

  const normalizedCriteria: FilterCriteria = {
    query: normalizedQuery,
    tag: criteria.tag,
    level: criteria.level,
  };

  return categories
    .map((category) => {
      const sections = category.sections
        .map((section) => {
          const materials = section.materials.filter((material) =>
            materialMatches({ material, criteria: normalizedCriteria }),
          );
          if (!materials.length) return null;
          return { ...section, materials };
        })
        .filter((section): section is MaterialsSection => !!section);
      if (!sections.length) return null;
      return { ...category, sections };
    })
    .filter((category): category is MaterialsCategory => !!category);
}

export function deriveFilterOptions({ categories }: FilterOptionsArgs): FilterOptions {
  const tags = new Set<string>();
  const levels = new Set<string>();

  categories.forEach((category) => {
    category.sections.forEach((section) => {
      section.materials.forEach((material) => {
        material.tags?.forEach((tag) => {
          if (tag) tags.add(tag);
        });
        if (material.level) levels.add(material.level);
      });
    });
  });

  return {
    tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    levels: Array.from(levels).sort((a, b) => a.localeCompare(b)),
  };
}

export function findMaterial(tree: MaterialsTree, categoryId: string, sectionId: string, slug: string) {
  const key = materialKey({ category: categoryId, section: sectionId, slug, lang: 'ru' });
  return tree.byId[key];
}

function materialMatches({ material, criteria }: MaterialMatchArgs): boolean {
  if (criteria.level && material.level !== criteria.level) return false;
  if (criteria.tag && !material.tags?.includes(criteria.tag)) return false;
  if (!criteria.query) return true;
  const haystack = `${material.title} ${material.subtitle || ''}`.toLowerCase();
  return haystack.includes(criteria.query);
}
