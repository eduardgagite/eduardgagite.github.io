import type { MaterialMeta, MaterialsCategory, MaterialsSection, MaterialsTree } from '../../materials/loader';

export type MaterialsRouteState =
  | { type: 'root' }
  | { type: 'redirect'; path: string }
  | { type: 'article'; category: MaterialsCategory; section: MaterialsSection; material: MaterialMeta }
  | { type: 'not-found' };

export function buildSectionStateKey(categoryId: string, sectionId: string): string {
  return `${categoryId}/${sectionId}`;
}

export function parseMaterialsSegments(value: string | null | undefined): string[] {
  return (value || '').split('/').filter(Boolean);
}

export function resolveMaterialsRoute(segments: string[], tree: MaterialsTree): MaterialsRouteState {
  if (segments.length === 0) return { type: 'root' };
  if (segments.length > 3) return { type: 'not-found' };

  const [categoryId, sectionId, slug] = segments;
  const category = tree.categories.find((item) => item.id === categoryId);
  if (!category) return { type: 'not-found' };

  if (segments.length === 1) {
    const firstSection = category.sections[0];
    const firstMaterial = firstSection?.materials[0];
    if (!firstSection || !firstMaterial) return { type: 'not-found' };
    return {
      type: 'redirect',
      path: `/materials/${category.id}/${firstSection.id}/${firstMaterial.id.slug}`,
    };
  }

  const section = category.sections.find((item) => item.id === sectionId);
  if (!section) return { type: 'not-found' };

  if (segments.length === 2) {
    const firstMaterial = section.materials[0];
    if (!firstMaterial) return { type: 'not-found' };
    return {
      type: 'redirect',
      path: `/materials/${category.id}/${section.id}/${firstMaterial.id.slug}`,
    };
  }

  const material = section.materials.find((item) => item.id.slug === slug);
  if (!material) return { type: 'not-found' };

  return { type: 'article', category, section, material };
}

export function parseStoredMaterialsPath(path: string): string[] | null {
  try {
    const url = new URL(path, 'https://eduardgagite.github.io');
    if (!url.pathname.startsWith('/materials')) return null;
    return parseMaterialsSegments(url.pathname.slice('/materials'.length));
  } catch {
    return null;
  }
}
