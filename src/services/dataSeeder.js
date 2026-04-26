/* ============================================================
   VTP COALIZÃO — Data Seeder
   Populates IndexedDB with base data from JSON files on first load
   or when CURRENT_SEED_VERSION changes.
   ============================================================ */

import db from './database.js'
import { BASE_CREATURES } from '@data/creatures/index.js'
import { BASE_ABILITIES } from '@data/skills/index.js'
import { BASE_ITEMS } from '@data/items/index.js'
import { BASE_MODIFICATIONS } from '@data/modifications/index.js'
import { BASE_NPCS } from '@data/npcs/index.js'
import { BASE_HEROES } from '@data/heroes/index.js'
import { BASE_ELEMENTS } from '@data/elements/index.js'
import { BASE_DOMAINS } from '@data/ambients/index.js'

const SEED_VERSION_KEY = 'vtp-seed-version'
const CURRENT_SEED_VERSION = '7.2.0' // Bump: 133 new/updated item JSON files (stubs filled + missing equipment items)

/** Base sessions extracted from campaign reference documents */
const BASE_SESSIONS = [
  {
    campaignId: 'coalizao',
    sessionNumber: 1,
    title: 'A Chegada & O Macaco Alado',
    date: '2025-01',
    content: 'Após serem misteriosamente teletransportados de seus cotidianos na Terra para um deserto plano e desconhecido, os heróis (Polaris, Akali, Violet, Ethan e Ravi) se reúnem e encontram uma mensagem do sistema pedindo para protegerem o mundo. Eles exploram a floresta vizinha, onde encontram macacos voadores agressivos após uma interação desastrosa de Ethan, e fogem até se depararem com o terrível Rei Undino.',
    events: ['Teletransporte para o deserto', 'Sistema anuncia missão dos heróis', 'Ethan agita um macaco alado', 'Fuga até o Rei Undino']
  },
  {
    campaignId: 'coalizao',
    sessionNumber: 2,
    title: 'Coliseu, Lobos e Apolo',
    date: '2025-02',
    content: 'Fifo, Freya e Eddard encontram-se teleportados a um Coliseu, onde enfrentam três lobos (um de fogo). O grupo lida com a queda de um castelo. O Mório de Fifo cruza o caminho do cavaleiro Aleo e do Vice-Lorde Carter, culminando num resgate feito por Apolo, que os leva voando para a Academia Rebelde.',
    events: ['Coliseu com três lobos', 'Negociação com Aleo e Vice-Lorde', 'Ravi fere Aleo', 'Apolo resgata o grupo em bolha de água']
  },
  {
    campaignId: 'coalizao',
    sessionNumber: 3,
    title: 'Tutorial 2 e a Cidade dos Porcos',
    date: '2025-03',
    content: 'Fifo entra na segunda fase do Tutorial reencarnando como o próprio Mório. Logo depois, Apolo lidera o grupo para a Cidade dos Porcos para se juntarem a uma guerra massiva, impedindo a reencarnação de Ukhel da Guilda Thanatos. Mório evolui e se torna um Ceifeiro formidável.',
    events: ['Fifo revive perspectiva de Mório', 'Batalha na Cidade dos Porcos', 'Mório vira Ceifeiro Dourado/Roxo', 'Resgate de Abigail']
  },
  {
    campaignId: 'coalizao',
    sessionNumber: 4,
    title: 'Taverna Byron e a Maldição de Cayro',
    date: '2025-04',
    content: 'Chegando à taverna de Deco Byron, o grupo tenta adquirir montarias (Cornara e Equiliz). Sem dinheiro, aceitam curar o irmão Cayro de uma maldição vegetal. Edgar usa alquimia sinistra e transfere a alma de Cayro para o corpo do Vice-Lorde Carter.',
    events: ['Chegada à Taverna Byron', 'Negociação por Cornara e Equiliz', 'Edgar transplanta alma de Cayro', 'Partida para área de treinamento']
  }
]

/**
 * Maps a hero JSON → DB-compatible character record.
 * Actual format: { id, name, classId, species1, level, age, stats.stats_base, stats.multipliers, ... }
 * DB:            { id, name, classId, species, level, attributes:{vit,...}, multipliers:{vit,...}, ... }
 */
function mapHero(h) {
  const base = h.stats?.stats_base || {}
  // Support both 'multipliers' (current actual format) and 'stats_multiplier' (old template format)
  const mult = h.stats?.multipliers || h.stats?.stats_multiplier || {}
  const attrs = {}
  const mults = {}
  const keys = ['VIT','DEX','CRM','FRC','INT','RES','PRE','ENR']
  keys.forEach(k => {
    attrs[k.toLowerCase()] = base[k] || 0
    mults[k.toLowerCase()] = mult[k] || 1
  })
  return {
    id:          h.id,
    name:        h.name,
    classId:     h.class_id || h.classId || '',
    species:     h.specie1_id || h.species1 || h.species || '',
    species2:    h.specie2_id || h.species2 || '',
    level:       h.level || 1,
    age:         h.age || 0,
    ouris:       h.ouris || 0,
    attributes:  attrs,
    multipliers: mults,
    aura:        h.aura_id || h.auraId || h.aura || '',
    personality: h.personality_id || h.personalityId || h.personality || '',
    tendencies:  h.tendencies_id || h.tendencies || [],
    catchphrase: h.catchphrase || '',
    history:     h.history || '',
    avatar:      h.avatar || '',
    abilities:   h.habilities_id || h.abilities || {},
    equipment:   h.equipament_id || h.equipment || {},
    inventory:   h.inventory_id || h.inventory || {},
    isCustom:    0,
  }
}

/**
 * Maps a creature JSON (template format) → DB-compatible creature record.
 * Template: { id, name, stats_value:{VIT,...}, element, size, core_size, diet, ... }
 * DB:       { id, name, vit, dex, ..., element, size, coreSize, diet, ... }
 */
function mapCreature(c) {
  const sv = c.stats_value || c.attributes || {}
  return {
    id:          c.id,
    name:        c.name,
    description: c.description || '',
    element:     c.element || '',
    size:        c.size || '',
    coreSize:    c.core_size || c.coreSize || '',
    diet:        c.diet || '',
    imagePath:   c.imagePath || '',
    level:       c.level || 1,
    vit: sv.VIT ?? c.vit ?? 0,
    dex: sv.DEX ?? c.dex ?? 0,
    crm: sv.CRM ?? c.crm ?? 0,
    frc: sv.FRC ?? c.frc ?? 0,
    int: sv.INT ?? c.int ?? 0,
    res: sv.RES ?? c.res ?? 0,
    pre: sv.PRE ?? c.pre ?? 0,
    enr: sv.ENR ?? c.enr ?? 0,
    abilities: c.habilities_id || c.abilities || {},
    equipment: c.equipament_id || c.equipment || {},
    drops:     c.item_drops || c.drops || {},
    isCustom:  0,
  }
}

/**
 * Maps an NPC JSON (template format) → DB-compatible NPC record.
 */
function mapNPC(n) {
  const sv = n.stats?.stats_value || n.stats?.attributes || {}
  return {
    id:              n.id,
    name:            n.name,
    description:     n.description || '',
    age:             n.age || 0,
    level:           n.level || 1,
    classId:         n.class_id || n.classId || '',
    species:         n.specie1_id || n.species1 || n.species || '',
    location:        n.location_id || n.locationId || n.location || '',
    type:            n.type || 'Neutro',
    personality:     n.personality_id || n.personalityId || n.personality || '',
    possibleBenefit: n.possibleBenefit || '',
    possibleHarm:    n.possibleHarm || '',
    avatar:          n.avatar || '',
    ouris:           n.ouris || 0,
    species2:        n.specie2_id || n.species2 || '',
    auraId:          n.aura_id || n.auraId || '',
    abilities:       n.habilities_id || n.abilities || {},
    equipment:       n.equipament_id || n.equipment || {},
    inventory:       n.inventory_id || n.inventory || {},
    vit: sv.VIT ?? n.vit ?? 0,
    dex: sv.DEX ?? n.dex ?? 0,
    crm: sv.CRM ?? n.crm ?? 0,
    frc: sv.FRC ?? n.frc ?? 0,
    int: sv.INT ?? n.int ?? 0,
    res: sv.RES ?? n.res ?? 0,
    pre: sv.PRE ?? n.pre ?? 0,
    enr: sv.ENR ?? n.enr ?? 0,
    isCustom:        0,
  }
}

/**
 * Seeds the database with all base Coalizão data.
 * Only runs if CURRENT_SEED_VERSION has changed or never seeded.
 * @returns {Promise<void>}
 */
export async function seedDatabase() {
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY)

  if (storedVersion === CURRENT_SEED_VERSION) {
    console.log('[Seeder] Database already seeded with version', CURRENT_SEED_VERSION)
    return
  }

  console.log('[Seeder] Seeding database with base Coalizão data (v' + CURRENT_SEED_VERSION + ')...')

  try {
    await db.transaction('rw',
      [db.creatures, db.abilities, db.items, db.modifications, db.npcs, db.characters, db.sessionNotes, db.elements, db.domains],
      async () => {
        // Creatures
        await db.creatures.where('isCustom').equals(0).delete()
        await db.creatures.bulkAdd(BASE_CREATURES.map(mapCreature))
        console.log(`[Seeder] ✓ ${BASE_CREATURES.length} criaturas`)

        // Abilities
        await db.abilities.where('isCustom').equals(0).delete()
        const abilitiesWithFlag = BASE_ABILITIES.map(a => ({ ...a, isCustom: 0 }))
        await db.abilities.bulkAdd(abilitiesWithFlag)
        console.log(`[Seeder] ✓ ${BASE_ABILITIES.length} habilidades`)

        // Items
        await db.items.where('isCustom').equals(0).delete()
        const itemsWithFlag = BASE_ITEMS.map(i => ({ ...i, isCustom: 0 }))
        await db.items.bulkAdd(itemsWithFlag)
        console.log(`[Seeder] ✓ ${BASE_ITEMS.length} itens`)

        // Modifications
        await db.modifications.clear()
        await db.modifications.bulkAdd(BASE_MODIFICATIONS)
        console.log(`[Seeder] ✓ ${BASE_MODIFICATIONS.length} modificações`)

        // NPCs
        await db.npcs.where('isCustom').equals(0).delete()
        await db.npcs.bulkAdd(BASE_NPCS.map(mapNPC))
        console.log(`[Seeder] ✓ ${BASE_NPCS.length} NPCs`)

        // Elements
        await db.elements.clear()
        await db.elements.bulkAdd(BASE_ELEMENTS.map(e => ({ ...e, isCustom: 0 })))
        console.log(`[Seeder] ✓ ${BASE_ELEMENTS.length} elementos`)

        // Domains
        await db.domains.clear()
        await db.domains.bulkAdd(BASE_DOMAINS.map(d => ({ ...d, isCustom: 0 })))
        console.log(`[Seeder] ✓ ${BASE_DOMAINS.length} domínios`)

        // Heroes (as characters)
        await db.characters.where('isCustom').equals(0).delete()
        const heroesForDB = BASE_HEROES.map(h => ({
          ...mapHero(h),
          type: 'hero',
          campaignId: 'coalizao',
        }))
        await db.characters.bulkAdd(heroesForDB)
        console.log(`[Seeder] ✓ ${BASE_HEROES.length} heróis`)

        // Sessions
        const existingSessions = await db.sessionNotes.where({ campaignId: 'coalizao' }).count()
        if (existingSessions === 0) {
          await db.sessionNotes.bulkAdd(BASE_SESSIONS)
          console.log(`[Seeder] ✓ ${BASE_SESSIONS.length} sessões`)
        }
      }
    )

    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION)
    console.log('[Seeder] ✅ Database seeding complete!')
  } catch (err) {
    console.error('[Seeder] ❌ Failed to seed database:', err)
  }
}

export default seedDatabase
