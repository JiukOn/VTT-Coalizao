/* campaignPackage.js — Full export and import utility for VTT Coalizao campaign packages (.coalizao) */

/**
 * Validates the structure and integrity of a campaign package
 * @param {object} pkg The parsed campaign package object
 * @returns {{ valid: boolean, error?: string, summary?: object }}
 */
export function validateCampaignPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, error: 'Arquivo inválido ou corrompido.' }
  }

  if (pkg.app !== 'VTT Coalizao' && pkg.app !== 'vtt-coalizao') {
    return { valid: false, error: 'Este arquivo não é um pacote válido do VTT Coalizão.' }
  }

  if (!pkg.data || typeof pkg.data !== 'object') {
    return { valid: false, error: 'O pacote não contém dados de campanha válidos.' }
  }

  const { maps = [], characters = [], creatures = [], quests = [], handouts = [], scenes = [] } = pkg.data

  return {
    valid: true,
    summary: {
      mapsCount: Array.isArray(maps) ? maps.length : 0,
      charactersCount: Array.isArray(characters) ? characters.length : 0,
      creaturesCount: Array.isArray(creatures) ? creatures.length : 0,
      questsCount: Array.isArray(quests) ? quests.length : 0,
      handoutsCount: Array.isArray(handouts) ? handouts.length : 0,
      scenesCount: Array.isArray(scenes) ? scenes.length : 0,
      exportDate: pkg.exportDate,
      version: pkg.version || '1.0.0',
    },
  }
}

/**
 * Creates a complete campaign export package from database tables and local storage
 * @param {object} options
 * @param {Array} options.maps Map records from IndexedDB
 * @param {Array} options.characters Character records from IndexedDB
 * @param {Array} options.creatures Creature records from IndexedDB
 * @param {string} options.campaignName Name of the campaign
 * @returns {object} Full campaign package ready to be saved
 */
export function createCampaignPackage({
  maps = [],
  characters = [],
  creatures = [],
  campaignName = 'Campanha Coalizão',
} = {}) {
  let quests = []
  let handouts = []
  let scenes = []
  let macros = []

  try {
    quests = JSON.parse(localStorage.getItem('vtt_campaign_quests') || '[]')
  } catch { /* ignore */ }

  try {
    handouts = JSON.parse(localStorage.getItem('vtt_campaign_handouts') || '[]')
  } catch { /* ignore */ }

  try {
    scenes = JSON.parse(localStorage.getItem('vtt_scenes') || '[]')
  } catch { /* ignore */ }

  try {
    macros = JSON.parse(localStorage.getItem('vtt_player_macros') || '[]')
  } catch { /* ignore */ }

  return {
    app: 'VTT Coalizao',
    version: '1.0.0',
    campaignName,
    exportDate: new Date().toISOString(),
    data: {
      maps,
      characters,
      creatures,
      quests,
      handouts,
      scenes,
      macros,
    },
  }
}

/**
 * Triggers a browser file download of the campaign package (.coalizao)
 * @param {object} packageData
 * @param {string} filename Optional custom filename
 */
export function downloadCampaignPackage(packageData, filename) {
  const jsonStr = JSON.stringify(packageData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (packageData.campaignName || 'campanha_coalizao').toLowerCase().replace(/\s+/g, '_')
  a.download = filename || `${safeName}_${new Date().toISOString().slice(0, 10)}.coalizao`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Restores a campaign package into localStorage and IndexedDB stores
 * @param {object} packageData The validated campaign package
 * @param {object} db Dexie database instance
 * @returns {Promise<boolean>} True if restored successfully
 */
export async function restoreCampaignPackage(packageData, db) {
  const validation = validateCampaignPackage(packageData)
  if (!validation.valid) throw new Error(validation.error)

  const { maps = [], characters = [], creatures = [], quests = [], handouts = [], scenes = [], macros = [] } = packageData.data

  // Restore LocalStorage items
  if (Array.isArray(quests)) {
    localStorage.setItem('vtt_campaign_quests', JSON.stringify(quests))
  }
  if (Array.isArray(handouts)) {
    localStorage.setItem('vtt_campaign_handouts', JSON.stringify(handouts))
  }
  if (Array.isArray(scenes)) {
    localStorage.setItem('vtt_scenes', JSON.stringify(scenes))
  }
  if (Array.isArray(macros)) {
    localStorage.setItem('vtt_player_macros', JSON.stringify(macros))
  }

  // Restore IndexedDB records if db instance is provided
  if (db) {
    if (db.maps && Array.isArray(maps) && maps.length > 0) {
      await db.maps.clear()
      await db.maps.bulkAdd(maps)
    }
    if (db.characters && Array.isArray(characters) && characters.length > 0) {
      await db.characters.clear()
      await db.characters.bulkAdd(characters)
    }
    if (db.creatures && Array.isArray(creatures) && creatures.length > 0) {
      await db.creatures.clear()
      await db.creatures.bulkAdd(creatures)
    }
  }

  return true
}
