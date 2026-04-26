/* ============================================================
   VTP COALIZÃO — IndexedDB Database Schema (via Dexie.js)
   All local data storage for the application
   ============================================================ */

import Dexie from 'dexie'

export const db = new Dexie('VTPCoalizao')

// Schema versioning — increment version number when changing schema
db.version(1).stores({
  // Campaign management
  campaigns: '++id, name, createdAt',

  // Player Characters (Heroes)
  characters: '++id, campaignId, name, species, classId, level',

  // NPCs
  npcs: '++id, campaignId, name, location, type',

  // Creatures (monsters/beasts)
  creatures: '++id, name, type, size, element, isCustom',

  // Abilities
  abilities: '++id, name, category, classLink, isCustom',

  // Items (weapons, armor, consumables, etc.)
  items: '++id, name, type, subtype, rarity, isCustom',

  // Item Modifications
  modifications: '++id, name, category',

  // Maps
  maps: '++id, campaignId, name, createdAt',

  // Combat encounters
  encounters: '++id, campaignId, mapId, name, status',

  // Dice roll history
  diceLog: '++id, campaignId, timestamp, roller, diceType, results',

  // Session notes
  sessionNotes: '++id, campaignId, sessionNumber, date, content',
})

// v2 — add isCustom index to npcs and characters (required for seeder WHERE queries)
db.version(2).stores({
  characters: '++id, campaignId, name, species, classId, level, isCustom',
  npcs: '++id, campaignId, name, location, type, isCustom',
})

// v3 — add elements and domains (ambients) tables
db.version(3).stores({
  elements: '++id, name',
  domains: '++id, name, type',
})

// v4 — add classes, species, auras, ambients tables
db.version(4).stores({
  classes: '++id, &classId, name, isCustom',
  species: '++id, &speciesId, name, isCustom',
  auras: '++id, &auraId, name, isCustom',
  ambients: '++id, &ambientId, name, category',
})

// Export for use across the app
export default db
