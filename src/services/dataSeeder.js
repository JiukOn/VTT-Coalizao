/* ============================================================
   VTP COALIZÃO — Data Seeder
   Populates IndexedDB with base data from JSON files on first load
   or when CURRENT_SEED_VERSION changes.
   ============================================================ */

import db from './database.js'
import { BASE_CREATURES } from '../data/creatures/index.js'
import { BASE_ABILITIES } from '../data/abilities/index.js'
import { BASE_ITEMS } from '../data/items/index.js'
import { BASE_MODIFICATIONS } from '../data/modifications/index.js'
import { BASE_NPCS } from '../data/npcs/index.js'
import { BASE_HEROES } from '../data/heroes/index.js'

const SEED_VERSION_KEY = 'vtp-seed-version'
const CURRENT_SEED_VERSION = '2.0.0' // Bump to re-seed with updated data

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
    // Clear old seed data and re-seed
    await db.transaction('rw',
      [db.creatures, db.abilities, db.items, db.modifications, db.npcs, db.characters, db.sessionNotes],
      async () => {
        // Creatures
        await db.creatures.where('isCustom').equals(0).delete()
        const creaturesWithFlag = BASE_CREATURES.map(c => ({ ...c, isCustom: 0 }))
        await db.creatures.bulkAdd(creaturesWithFlag)
        console.log(`[Seeder] ✓ ${BASE_CREATURES.length} creaturas`)

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
        await db.npcs.clear()
        await db.npcs.bulkAdd(BASE_NPCS)
        console.log(`[Seeder] ✓ ${BASE_NPCS.length} NPCs`)

        // Heroes (as characters)
        const existingHeroes = await db.characters.where('isCustom').equals(0).count()
        if (existingHeroes === 0) {
          const heroesForDB = BASE_HEROES.map(h => ({
            ...h,
            type: 'hero',
            campaignId: 'coalizao',
            isCustom: 0
          }))
          await db.characters.bulkAdd(heroesForDB)
          console.log(`[Seeder] ✓ ${BASE_HEROES.length} heróis`)
        }

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
