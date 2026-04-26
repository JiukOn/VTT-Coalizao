/* ============================================================
   VTP COALIZÃO — Language / i18n Context
   Provides locale state and translation helpers.
   ============================================================ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UI_STRINGS } from '../i18n/ui.js'

const LanguageContext = createContext()

const STORAGE_KEY = 'vtp-locale'
const SUPPORTED_LOCALES = ['pt-br', 'en-us']

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return SUPPORTED_LOCALES.includes(stored) ? stored : 'pt-br'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.setAttribute('data-locale', locale)
  }, [locale])

  /** Resolve an i18n object or passthrough a plain string */
  const t = useCallback((value) => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') return value[locale] || value['pt-br'] || ''
    return String(value)
  }, [locale])

  /** Lookup a UI label from the static dictionary */
  const ui = useCallback((key) => {
    const dict = UI_STRINGS[locale] || UI_STRINGS['pt-br']
    return dict[key] || key
  }, [locale])

  const toggleLocale = useCallback(() => {
    setLocale(prev => prev === 'pt-br' ? 'en-us' : 'pt-br')
  }, [])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t, ui }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export default LanguageContext
