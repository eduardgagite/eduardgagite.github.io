type MaterialsLang = 'ru' | 'en'

const MATERIALS_LAST_PATH_PREFIX = 'materials.lastPath'

export function readLastMaterialsPath({ lang }: { lang: MaterialsLang }): string | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(buildKey({ lang }))
    if (!raw) return null
    if (!isValidMaterialsPath(raw)) return null
    return raw
  } catch {
    return null
  }
}

export function writeLastMaterialsPath({ lang, path }: { lang: MaterialsLang; path: string }) {
  if (typeof window === 'undefined') return
  if (!isValidMaterialsPath(path)) return

  try {
    window.localStorage.setItem(buildKey({ lang }), path)
  } catch {
    // noop
  }
}

function buildKey({ lang }: { lang: MaterialsLang }) {
  return `${MATERIALS_LAST_PATH_PREFIX}.${lang}`
}

function isValidMaterialsPath(path: string) {
  if (!path.startsWith('/materials')) return false
  if (path.includes('://')) return false
  if (path.includes('\n') || path.includes('\r')) return false
  return true
}




