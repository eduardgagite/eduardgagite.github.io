import { materialKey, type MaterialMeta, type MaterialsSection, type MaterialsTree } from '../../materials/loader';

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

export function getAdjacentMaterials(section: MaterialsSection, material: MaterialMeta): AdjacentMaterials {
  const currentKey = materialKey(material.id);
  const currentIndex = section.materials.findIndex((item) => materialKey(item.id) === currentKey);

  if (currentIndex === -1) {
    return { currentIndex };
  }

  return {
    currentIndex,
    previous: currentIndex > 0 ? section.materials[currentIndex - 1] : undefined,
    next: currentIndex < section.materials.length - 1 ? section.materials[currentIndex + 1] : undefined,
  };
}
