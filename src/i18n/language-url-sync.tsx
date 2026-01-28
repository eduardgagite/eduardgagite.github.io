import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

export function LanguageUrlSync() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const appLang = normalizeLang(i18n.resolvedLanguage || 'ru')

  const urlLang = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('lang')
    if (!raw) return null
    return normalizeLang(raw)
  }, [location.search])

  useEffect(() => {
    if (!urlLang) return
    if (urlLang === appLang) return
    i18n.changeLanguage(urlLang)
  }, [appLang, i18n, urlLang])

  useEffect(() => {
    if (urlLang) return
    const params = new URLSearchParams(location.search)
    params.set('lang', appLang)
    const nextSearch = `?${params.toString()}`
    navigate({ pathname: location.pathname, search: nextSearch, hash: location.hash }, { replace: true })
  }, [appLang, location.hash, location.pathname, location.search, navigate, urlLang])

  return null
}

function normalizeLang(value: string): 'ru' | 'en' {
  return value === 'ru' ? 'ru' : 'en'
}




