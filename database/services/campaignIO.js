/* ============================================================
   VTP COALIZÃO — Campaign Import/Export Service
   JSON serialization for full campaign backup
   ============================================================ */

import db from './database.js'

/**
 * Exports the entire campaign (or all data) as a JSON object
 */
export async function exportCampaign(campaignId = null) {
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    campaigns: campaignId
      ? [await db.campaigns.get(campaignId)]
      : await db.campaigns.toArray(),
    characters: campaignId
      ? await db.characters.where('campaignId').equals(campaignId).toArray()
      : await db.characters.toArray(),
    npcs: await db.npcs.toArray(),
    creatures: await db.creatures.toArray(),
    abilities: await db.abilities.toArray(),
    items: await db.items.toArray(),
    modifications: await db.modifications.toArray(),
    maps: campaignId
      ? await db.maps.where('campaignId').equals(campaignId).toArray()
      : await db.maps.toArray(),
    encounters: campaignId
      ? await db.encounters.where('campaignId').equals(campaignId).toArray()
      : await db.encounters.toArray(),
    sessionNotes: campaignId
      ? await db.sessionNotes.where('campaignId').equals(campaignId).toArray()
      : await db.sessionNotes.toArray(),
  }

  return data
}

/**
 * Downloads the exported data as a .json file
 */
export function downloadJSON(data, filename = 'vtp-coalizao-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Imports campaign data from a JSON object.
 * Strategy: upsert (put) all records — new ones are added, existing ones are replaced.
 * Custom entities (isCustom=1) are preserved even when re-seeding.
 */
export async function importCampaign(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Arquivo JSON inválido.')
  }

  const version = jsonData.version
  console.log(`[Import] Importing campaign backup v${version} from ${jsonData.exportedAt}`)

  await db.transaction('rw',
    [db.campaigns, db.characters, db.npcs, db.creatures, db.abilities,
     db.items, db.modifications, db.maps, db.encounters, db.sessionNotes],
    async () => {
      if (jsonData.campaigns?.length) {
        for (const c of jsonData.campaigns.filter(Boolean)) await db.campaigns.put(c)
        console.log(`[Import] ✓ ${jsonData.campaigns.filter(Boolean).length} campanhas`)
      }
      if (jsonData.characters?.length) {
        for (const c of jsonData.characters) await db.characters.put(c)
        console.log(`[Import] ✓ ${jsonData.characters.length} personagens`)
      }
      if (jsonData.npcs?.length) {
        for (const n of jsonData.npcs) await db.npcs.put(n)
        console.log(`[Import] ✓ ${jsonData.npcs.length} NPCs`)
      }
      if (jsonData.creatures?.length) {
        for (const c of jsonData.creatures) await db.creatures.put(c)
        console.log(`[Import] ✓ ${jsonData.creatures.length} criaturas`)
      }
      if (jsonData.abilities?.length) {
        for (const a of jsonData.abilities) await db.abilities.put(a)
        console.log(`[Import] ✓ ${jsonData.abilities.length} habilidades`)
      }
      if (jsonData.items?.length) {
        for (const i of jsonData.items) await db.items.put(i)
        console.log(`[Import] ✓ ${jsonData.items.length} itens`)
      }
      if (jsonData.modifications?.length) {
        for (const m of jsonData.modifications) await db.modifications.put(m)
        console.log(`[Import] ✓ ${jsonData.modifications.length} modificações`)
      }
      if (jsonData.maps?.length) {
        for (const m of jsonData.maps) await db.maps.put(m)
        console.log(`[Import] ✓ ${jsonData.maps.length} mapas`)
      }
      if (jsonData.encounters?.length) {
        for (const e of jsonData.encounters) await db.encounters.put(e)
        console.log(`[Import] ✓ ${jsonData.encounters.length} encontros`)
      }
      if (jsonData.sessionNotes?.length) {
        for (const s of jsonData.sessionNotes) await db.sessionNotes.put(s)
        console.log(`[Import] ✓ ${jsonData.sessionNotes.length} sessões`)
      }
    }
  )

  console.log('[Import] ✅ Import complete!')
}
