/**
 * entityFormatting.js — Universal Polymorphic Entity Formatting & Name Sanitizer
 * 
 * Guarantees 100% crash-free string manipulation for entities with multilingual objects,
 * nullish values, numbers, or complex records.
 */

const STOP_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'of', 'the', 'and', 'in'])

/**
 * Universal safe string extractor for any value (string, multilingual object {pt-br, en-us}, number, array, or undefined).
 * NEVER returns an object literal, completely preventing React 19 child errors.
 * 
 * @param {any} val - Value to convert to safe renderable string
 * @param {string} [lang='pt'] - Preferred language ('pt' or 'en')
 * @returns {string}
 */
export function getI18nText(val, lang = 'pt') {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) {
    return val.map(item => getI18nText(item, lang)).filter(Boolean).join(', ')
  }
  if (typeof val === 'object') {
    const isPt = lang === 'pt' || lang.toLowerCase().startsWith('pt')
    // Primary matches
    if (isPt) {
      if (typeof val['pt-br'] === 'string' && val['pt-br'].trim()) return val['pt-br'].trim()
      if (typeof val['pt_BR'] === 'string' && val['pt_BR'].trim()) return val['pt_BR'].trim()
      if (typeof val.pt === 'string' && val.pt.trim()) return val.pt.trim()
    } else {
      if (typeof val['en-us'] === 'string' && val['en-us'].trim()) return val['en-us'].trim()
      if (typeof val['en_US'] === 'string' && val['en_US'].trim()) return val['en_US'].trim()
      if (typeof val.en === 'string' && val.en.trim()) return val.en.trim()
    }
    // Cross-language fallback
    if (typeof val['pt-br'] === 'string' && val['pt-br'].trim()) return val['pt-br'].trim()
    if (typeof val['en-us'] === 'string' && val['en-us'].trim()) return val['en-us'].trim()
    if (typeof val.pt === 'string' && val.pt.trim()) return val.pt.trim()
    if (typeof val.en === 'string' && val.en.trim()) return val.en.trim()
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim()
    if (typeof val.label === 'string' && val.label.trim()) return val.label.trim()
    if (typeof val.title === 'string' && val.title.trim()) return val.title.trim()
    if (typeof val.text === 'string' && val.text.trim()) return val.text.trim()

    // Deep search in object values
    for (const subVal of Object.values(val)) {
      if (typeof subVal === 'string' && subVal.trim()) return subVal.trim()
      if (typeof subVal === 'number') return String(subVal)
    }
    return ''
  }
  return String(val)
}

/**
 * Extracts a clean string name from any entity name value (string, multilingual object, or undefined).
 * @param {string|object|null|undefined} name
 * @param {string} [lang='pt'] - Preferred language ('pt' or 'en')
 * @returns {string}
 */
export function getEntityName(name, lang = 'pt') {
  const result = getI18nText(name, lang)
  return result || 'Sem Nome'
}

/**
 * Returns safe uppercase single letter or 2-letter initials for tokens and avatars.
 * @param {string|object|null|undefined} name
 * @param {number} [count=1] - Number of initial characters (default 1)
 * @param {string} [lang='pt']
 * @returns {string}
 */
export function getEntityInitials(name, count = 1, lang = 'pt') {
  const cleanName = getEntityName(name, lang)
  if (!cleanName || cleanName === 'Sem Nome') return '?'
  
  if (count === 2) {
    const rawWords = cleanName.trim().split(/\s+/)
    const meaningfulWords = rawWords.filter(w => !STOP_WORDS.has(w.toLowerCase()))
    const words = meaningfulWords.length >= 2 ? meaningfulWords : rawWords
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
  }
  
  return cleanName.slice(0, count).toUpperCase() || '?'
}

/**
 * Safely checks if an entity name contains a search query (case-insensitive and multilingual).
 * @param {string|object|null|undefined} name
 * @param {string} query
 * @returns {boolean}
 */
export function entityNameMatches(name, query) {
  if (!query) return true
  const q = query.toLowerCase().trim()
  if (!name) return false
  if (typeof name === 'string') return name.toLowerCase().includes(q)
  if (typeof name === 'object') {
    return Object.values(name).some(val => 
      typeof val === 'string' && val.toLowerCase().includes(q)
    )
  }
  return false
}

/**
 * Sanitizes entity description (multilingual or string).
 * @param {string|object|null|undefined} desc
 * @param {string} [lang='pt']
 * @returns {string}
 */
export function getEntityDescription(desc, lang = 'pt') {
  return getI18nText(desc, lang)
}
