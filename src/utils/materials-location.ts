type MaterialsLang = 'ru' | 'en';

export interface MaterialsBookmark {
  path: string;
  title: string;
}

export type MaterialsBookmarks = Record<string, MaterialsBookmark>;

const MATERIALS_BOOKMARKS_PREFIX = 'materials.bookmarks';

function buildKey({ lang }: { lang: MaterialsLang }) {
  return `${MATERIALS_BOOKMARKS_PREFIX}.${lang}`;
}

export function isValidMaterialsPath(path: string) {
  if (!path.startsWith('/materials')) return false;
  if (path.includes('://')) return false;
  if (path.includes('\n') || path.includes('\r')) return false;
  return true;
}

/** Закладка на курс: где именно человек остановился в этом курсе в прошлый раз. */
export function readMaterialsBookmarks({ lang }: { lang: MaterialsLang }): MaterialsBookmarks {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(buildKey({ lang }));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: MaterialsBookmarks = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([categoryId, value]) => {
      if (!value || typeof value !== 'object') return;
      const bookmark = value as Partial<MaterialsBookmark>;
      if (typeof bookmark.path !== 'string' || !isValidMaterialsPath(bookmark.path)) return;
      if (typeof bookmark.title !== 'string' || !bookmark.title) return;
      result[categoryId] = { path: bookmark.path, title: bookmark.title };
    });
    return result;
  } catch {
    return {};
  }
}

export function writeMaterialsBookmark({
  lang,
  categoryId,
  path,
  title,
}: {
  lang: MaterialsLang;
  categoryId: string;
  path: string;
  title: string;
}) {
  if (typeof window === 'undefined') return;
  if (!isValidMaterialsPath(path)) return;

  try {
    const current = readMaterialsBookmarks({ lang });
    current[categoryId] = { path, title };
    window.localStorage.setItem(buildKey({ lang }), JSON.stringify(current));
  } catch {
    // noop
  }
}

export function clearMaterialsBookmark({ lang, categoryId }: { lang: MaterialsLang; categoryId: string }) {
  if (typeof window === 'undefined') return;

  try {
    const current = readMaterialsBookmarks({ lang });
    if (!(categoryId in current)) return;
    delete current[categoryId];
    window.localStorage.setItem(buildKey({ lang }), JSON.stringify(current));
  } catch {
    // noop
  }
}
