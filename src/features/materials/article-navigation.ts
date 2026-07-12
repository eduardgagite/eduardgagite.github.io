import { materialKey, type MaterialMeta, type MaterialsCategory, type MaterialsTree } from '../../materials/loader';

export interface AdjacentMaterials {
  currentIndex: number;
  previous?: MaterialMeta;
  next?: MaterialMeta;
}

export function buildMaterialRoutePath(material: MaterialMeta): string {
  return `/materials/${material.id.category}/${material.id.section}/${material.id.slug}`;
}

export function buildMaterialCanonicalKey(material: MaterialMeta): string {
  return `${material.id.category}/${material.id.section}/${material.id.slug}`;
}

export function getAvailableMaterialLanguages({
  material,
  tree,
}: {
  material: MaterialMeta;
  tree: MaterialsTree;
}): Array<'ru' | 'en'> {
  return tree.availableLanguages[buildMaterialCanonicalKey(material)] || [material.id.lang];
}

export function getAdjacentCourseMaterials(category: MaterialsCategory, material: MaterialMeta): AdjacentMaterials {
  const materials = category.sections.flatMap((section) => section.materials);
  const currentKey = materialKey(material.id);
  const currentIndex = materials.findIndex((item) => materialKey(item.id) === currentKey);

  if (currentIndex === -1) {
    return { currentIndex };
  }

  return {
    currentIndex,
    previous: currentIndex > 0 ? materials[currentIndex - 1] : undefined,
    next: currentIndex < materials.length - 1 ? materials[currentIndex + 1] : undefined,
  };
}
