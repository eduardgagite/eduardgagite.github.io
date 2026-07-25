import type { MaterialMeta, MaterialsSection } from '../../materials/loader';

/**
 * Номера в разделе всегда из frontmatter (sectionOrder / order), а не из позиции
 * в массиве: они совпадают с префиксами имён файлов и не переезжают при поиске.
 */
export function sectionFolio(section: MaterialsSection): string {
  return String(section.order).padStart(2, '0');
}

export function materialFolio(section: MaterialsSection, material: MaterialMeta): string {
  if (material.order === undefined) return String(section.order);
  return `${section.order}.${material.order}`;
}
