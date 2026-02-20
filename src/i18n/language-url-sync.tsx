import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { isSupportedLang, normalizeLang, withLang } from './url'

export function LanguageUrlSync() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const appLang = normalizeLang(i18n.resolvedLanguage || 'ru')

  const rawUrlLang = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('lang')
  }, [location.search])
  const hasLangParam = rawUrlLang !== null
  const urlLang = isSupportedLang(rawUrlLang) ? rawUrlLang : null

  useEffect(() => {
    if (!urlLang) return
    if (urlLang === appLang) return
    i18n.changeLanguage(urlLang)
  }, [appLang, i18n, urlLang])

  useEffect(() => {
    if (hasLangParam && urlLang) return
    const currentPath = `${location.pathname}${location.search}${location.hash}`
    const nextPath = withLang(currentPath, appLang)
    if (nextPath === currentPath) return
    navigate(nextPath, { replace: true })
  }, [appLang, hasLangParam, location.hash, location.pathname, location.search, navigate, urlLang])

  return null
}


