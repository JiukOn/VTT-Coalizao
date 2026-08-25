/**
 * entityFormatting.js — Universal Polymorphic Entity Formatting & Name Sanitizer
 * 
 * Guarantees 100% crash-free string manipulation for entities with multilingual objects,
 * nullish values, numbers, or complex records.
 */

const STOP_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'of', 'the', 'and', 'in'])

/**
 * Extracts a clean string name from any entity name value (string, multilingual object, or undefined).
 * @param {string|object|null|undefined} name
 * @param {string} [lang='pt'] - Preferred language ('pt' or 'en')
 * @returns {string}
 */
export function getEntityName(name, lang = 'pt') {
  if (!name) return 'Sem Nome'
  if (typeof name === 'string') return name.trim() || 'Sem Nome'
  if (typeof name === 'number') return String(name)
  if (typeof name === 'object') {
    if (name[lang] && typeof name[lang] === 'string' && name[lang].trim()) return name[lang].trim()
    if (name.pt && typeof name.pt === 'string' && name.pt.trim()) return name.pt.trim()
    if (name.en && typeof name.en === 'string' && name.en.trim()) return name.en.trim()
    if (name.name && typeof name.name === 'string' && name.name.trim()) return name.name.trim()
    // Fallback: take the first non-empty string value in object
    for (const val of Object.values(name)) {
      if (typeof val === 'string' && val.trim()) return val.trim()
    }
    return 'Sem Nome'
  }
  return 'Sem Nome'
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
  if (!desc) return ''
  if (typeof desc === 'string') return desc.trim()
  if (typeof desc === 'object') {
    if (desc[lang]) return String(desc[lang]).trim()
    if (desc.pt) return String(desc.pt).trim()
    if (desc.en) return String(desc.en).trim()
  }
  return String(desc)
}
