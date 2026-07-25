import type { MaterialsCategory } from '../../materials/loader';

// Порядок не алфавитный: Go — основной язык, Redis начинался из-за кэша,
// Docker дописан последним и самый короткий. По алфавиту первым вставал Docker.
export const CATEGORY_ORDER = ['golang', 'redis', 'docker'];

export function orderCategories(categories: MaterialsCategory[]): MaterialsCategory[] {
  return [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.id);
    const indexB = CATEGORY_ORDER.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.title.localeCompare(b.title);
  });
}
