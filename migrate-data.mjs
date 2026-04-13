/**
 * VTP Coalizao - Data Migration Script
 * Splits monolithic JSON files into individual entity files
 * and creates proper index.js re-exports.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

const DATA = 'D:/Repositorios/Projeto VTP/src/data'

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

function safeVarName(id) {
  // Convert id to a valid JS variable name
  return id
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/__+/g, '_')
    .replace(/_+$/, '')
}

function safeFileName(id) {
  // Make id safe for file paths (replace slashes and other problematic chars)
  return id
    .replace(/\//g, '_')
    .replace(/\\/g, '_')
    .replace(/[<>:"|?*]/g, '_')
}

// ============================================================
// 1. CREATURES
// ============================================================
function migrateCreatures() {
  console.log('Migrating creatures...')
  const creaturesJSON = readJSON(join(DATA, 'creatures.json'))

  // Data from creatures/index.js (manually mapped)
  const indexData = {
    'areat': { type: 'terrestre', size: 'medio', diet: 'onivoro', element: null, imagePath: 'Areat.jpeg', behavior: null },
    'beezle': { type: 'voador', size: 'pequeno', diet: 'herbivoro', element: null, imagePath: 'Beezle.jpeg', behavior: null },
    'blobin': { type: 'terrestre', size: 'grande', diet: 'onivoro', element: 'metal', imagePath: 'Blobin.jpeg', behavior: null },
    'caopus': { type: 'semi-aquatico', size: 'medio', diet: 'onivoro', element: 'agua', imagePath: 'Caopus.jpeg', behavior: null },
    'conara': { type: 'terrestre', size: 'grande', diet: 'herbivoro', element: 'fogo', imagePath: 'Cornara.jpeg', behavior: null },
    'crocohog': { type: 'terrestre', size: 'medio', diet: 'onivoro', element: null, imagePath: 'Crocohog.jpeg', behavior: null },
    'dostle': { type: 'aquatico', size: 'medio', diet: 'onivoro', element: 'luz', imagePath: 'Dostle.jpeg', behavior: null },
    'dunce': { type: 'terrestre', size: 'medio', diet: 'onivoro', element: null, imagePath: 'Dunce.jpeg', behavior: null },
    'enbarr': { type: 'terrestre', size: 'grande', diet: 'herbivoro', element: 'gelo', imagePath: 'Enbarr.jpeg', behavior: null },
    'equiliz': { type: 'aquatico', size: 'medio', diet: 'onivoro', element: 'agua', imagePath: 'Equiliz.png', behavior: null },
    'esfinge': { type: 'terrestre', size: 'grande', diet: 'onivoro', element: null, imagePath: 'Esfinge.jpeg', behavior: null },
    'fabarr': { type: 'terrestre', size: 'grande', diet: 'herbivoro', element: null, imagePath: 'Fabarr.jpeg', behavior: null },
    'fafagi': { type: 'terrestre', size: 'medio', diet: 'herbivoro', element: 'veneno', imagePath: 'Fafagi.jpeg', behavior: null },
    'faiguim': { type: 'voador', size: 'pequeno', diet: 'onivoro', element: 'magia', imagePath: 'Faiguin.jpeg', behavior: null },
    'flonec': { type: 'terrestre', size: 'medio', diet: 'herbivoro', element: 'madeira', imagePath: 'Flonnec.jpeg', behavior: null },
    'manuk': { type: 'voador', size: 'medio', diet: 'onivoro', element: 'fogo', imagePath: 'Frango Manuk.jpg', behavior: null },
    'ganlan': { type: 'terrestre', size: 'grande', diet: 'carnivoro', element: 'metal', imagePath: 'Ganlan.png', behavior: null },
    'gayutu': { type: 'voador', size: 'pequeno', diet: 'onivoro', element: 'fogo', imagePath: 'Gatuyu.jpeg', behavior: null },
    'golroise': { type: 'terrestre', size: 'grande', diet: 'mineral', element: 'terra', imagePath: 'Golroise.jpeg', behavior: null },
    'hienco': { type: 'terrestre', size: 'medio', diet: 'carnivoro', element: 'agua', imagePath: 'Hienco.jpeg', behavior: null },
    'hopopis': { type: 'terrestre', size: 'grande', diet: 'carnivoro', element: 'fogo', imagePath: 'Hopópis.jpeg', behavior: null },
    'horrotus': { type: 'voador', size: 'grande', diet: 'onivoro', element: null, imagePath: 'Horrotus.jpeg', behavior: null },
    'inoue': { type: 'terrestre', size: 'grande', diet: 'onivoro', element: null, imagePath: 'Inoue.jpeg', behavior: null },
    'izoceras': { type: 'semi-aquatico', size: 'colossal', diet: 'herbivoro', element: 'agua', imagePath: 'Izoceras.jpeg', behavior: null },
    'jefus': { type: 'semi-aquatico', size: 'medio', diet: 'carnivoro', element: 'agua', imagePath: 'Jefus.jpeg', behavior: null },
    'jocara': { type: 'terrestre', size: 'pequeno', diet: 'herbivoro', element: null, imagePath: 'Jocara.jpeg', behavior: null },
    'jopopis': { type: 'semi-aquatico', size: 'grande', diet: 'herbivoro', element: 'madeira', imagePath: 'Jopópis.jpeg', behavior: null },
  }

  const dir = join(DATA, 'creatures')
  ensureDir(dir)

  const imports = []
  const names = []

  for (const creature of creaturesJSON) {
    const extra = indexData[creature.id] || {}
    const merged = {
      ...creature,
      type: extra.type || creature.type || null,
      size: extra.size || null,
      diet: extra.diet || null,
      element: extra.element !== undefined ? extra.element : null,
      imagePath: extra.imagePath || null,
      isCustom: false,
    }

    writeJSON(join(dir, `${creature.id}.json`), merged)
    const varName = safeVarName(creature.id)
    imports.push(`import ${varName} from './${creature.id}.json'`)
    names.push(varName)
  }

  const indexContent = `${imports.join('\n')}

const creatures = [${names.join(', ')}]
export default creatures
export { creatures }
`
  writeFileSync(join(dir, 'index.js'), indexContent, 'utf-8')
  console.log(`  Created ${creaturesJSON.length} creature files`)
}

// ============================================================
// 2. ABILITIES
// ============================================================
function migrateAbilities() {
  console.log('Migrating abilities...')
  const abilitiesJSON = readJSON(join(DATA, 'abilities.json'))

  // Data from abilities/index.js - keyed by name
  const indexDataByName = {
    'Acorde': { classLink: 'Bardo', cost: null, test: '1d20 > 16 (reativação)', duration: '2 turnos', cooldown: 'Teste após efeito', requirements: '' },
    'Apuração': { classLink: 'Pesquisador', cost: null, test: '1d20 + INT > 14', duration: 'Instantâneo', cooldown: null, requirements: '' },
    'Contrato de Sangue': { classLink: 'Domador', cost: '10 XP', test: 'Comparativo INT/CRM', duration: 'Permanente', cooldown: null, requirements: '' },
    'Corpo Endurecido': { classLink: 'Defensor', cost: null, test: '1d20 > 16 (reativação)', duration: '3 turnos', cooldown: 'Teste após efeito', requirements: '' },
    'Furto': { classLink: 'Ladino', cost: null, test: '1d20 + DEX vs 1d20 + PRE', duration: 'Instantâneo', cooldown: null, requirements: '' },
    'Evocar Energia': { classLink: 'Evocador', cost: null, test: '1d20 > 16 (efeito extra)', duration: 'Instantâneo', cooldown: null, requirements: '' },
    'Esgrima Avançada': { classLink: 'Espadachim', cost: null, test: '1d20 > 16 (reativação)', duration: '3 turnos', cooldown: 'Teste', requirements: '' },
    'Passos Silenciosos': { classLink: 'Sombra', cost: null, test: '1d20 > 16 (reativação)', duration: '2 turnos', cooldown: 'Teste', requirements: '' },
    'Tiro ao Alvo': { classLink: 'Atirador', cost: null, test: '1d20 > 16 (reativação)', duration: '2 turnos', cooldown: 'Teste', requirements: '' },
    'Mãos Pesadas': { classLink: 'Lutador', cost: null, test: '1d20 > 16 (reativação)', duration: '2 turnos', cooldown: 'Teste', requirements: '' },
    'Chamas': { classLink: null, cost: null, test: null, duration: 'Instantâneo', cooldown: '1 turno', requirements: 'ENR 4' },
    'Berserk': { classLink: null, cost: null, test: null, duration: '4 turnos', cooldown: '3 turnos', requirements: 'VIT 10' },
    'Voar': { classLink: null, cost: null, test: null, duration: '2 turnos', cooldown: '1 turno', requirements: 'ENR 5' },
    'Acelerar': { classLink: null, cost: null, test: '1d20 > 16 (reativação)', duration: '3 turnos', cooldown: 'Teste', requirements: 'DEX 4' },
    'Regeneração': { classLink: null, cost: null, test: '1d20 > 14', duration: 'Instantâneo', cooldown: null, requirements: 'ENR 6, VIT 12' },
    'Furtividade': { classLink: null, cost: null, test: null, duration: 'Permanente', cooldown: null, requirements: '' },
    'Resistência Elemental': { classLink: null, cost: null, test: null, duration: 'Permanente', cooldown: null, requirements: 'RES 1' },
    'Sorte': { classLink: null, cost: null, test: null, duration: 'Permanente', cooldown: null, requirements: '' },
    'Barreira Mental': { classLink: null, cost: null, test: null, duration: 'Permanente', cooldown: null, requirements: '' },
    'Olhos Afiados': { classLink: null, cost: null, test: null, duration: 'Permanente', cooldown: null, requirements: '' },
  }

  // Category mapping for subdirectories
  function getCategoryDir(category) {
    const cat = category.toLowerCase()
    if (cat.includes('legado')) return 'legado'
    if (cat.includes('ativa')) return 'ativas'
    if (cat.includes('passiva')) return 'passivas'
    if (cat.includes('mito')) return 'mito'
    if (cat.includes('uso')) return 'uso-unico'
    if (cat.includes('descend')) return 'descendencia'
    return 'ativas' // fallback
  }

  const abilitiesDir = join(DATA, 'abilities')
  const subdirs = ['legado', 'ativas', 'passivas', 'mito', 'uso-unico', 'descendencia']
  for (const sd of subdirs) {
    ensureDir(join(abilitiesDir, sd))
  }

  // Track imports per subdir
  const importsByDir = {}
  for (const sd of subdirs) {
    importsByDir[sd] = []
  }

  for (const ability of abilitiesJSON) {
    const catDir = getCategoryDir(ability.category)
    const extra = indexDataByName[ability.name] || {}

    const merged = {
      ...ability,
      classLink: extra.classLink !== undefined ? extra.classLink : (ability.class || null),
      cost: extra.cost || null,
      test: extra.test || null,
      duration: extra.duration || null,
      cooldown: extra.cooldown || null,
      requirements: extra.requirements !== undefined ? extra.requirements : '',
      isCustom: false,
    }

    const fileName = safeFileName(ability.id)
    writeJSON(join(abilitiesDir, catDir, `${fileName}.json`), merged)

    const varName = safeVarName(ability.id)
    importsByDir[catDir].push({ varName, fileName })
  }

  // Create index.js that imports from all subdirs
  const allImports = []
  const allNames = []

  for (const sd of subdirs) {
    for (const entry of importsByDir[sd]) {
      allImports.push(`import ${entry.varName} from './${sd}/${entry.fileName}.json'`)
      allNames.push(entry.varName)
    }
  }

  const indexContent = `${allImports.join('\n')}

const abilities = [${allNames.join(', ')}]
export default abilities
export { abilities }
`
  writeFileSync(join(abilitiesDir, 'index.js'), indexContent, 'utf-8')

  let total = 0
  for (const sd of subdirs) total += importsByDir[sd].length
  console.log(`  Created ${total} ability files across ${subdirs.length} subdirectories`)
}

// ============================================================
// 3. ITEMS
// ============================================================
function migrateItems() {
  console.log('Migrating items...')
  const itemsJSON = readJSON(join(DATA, 'items.json'))

  function getCategoryDir(category) {
    const cat = category.toLowerCase()
    if (cat.includes('arma') || cat.includes('distância') || cat.includes('distancia')) return 'armas'
    if (cat.includes('defesa') || cat.includes('escudo')) return 'escudos'
    if (cat.includes('cabeça') || cat.includes('pescoço') || cat.includes('corpo') || cat.includes('perna') || cat.includes('pé') || cat.includes('mãos') || cat.includes('acessório')) return 'vestimentas'
    if (cat.includes('consumív') || cat.includes('consumiv') || cat.includes('veneno')) return 'consumiveis'
    if (cat.includes('projét') || cat.includes('projet')) return 'projeteis'
    return 'diversos'
  }

  // Data from items/index.js - keyed by approximate name match
  const indexDataByName = {
    'Adaga de Aço': { type: 'arma', subtype: 'proximidade', rarity: 'comum', damage: '1d4 - 1', defense: null, dp: 15, dpMax: 15, modifications: ['Afiado'], bonuses: { pre: 1 }, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
    'Adaga de Cobre': { type: 'arma', subtype: 'proximidade', rarity: 'comum', damage: '1d4 - 2', defense: null, dp: 10, dpMax: 10, modifications: ['Frágil'], bonuses: {}, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
    'Espada do Vazio': { type: 'arma', subtype: 'proximidade', rarity: 'especial', damage: '2d4 + 4', defense: null, dp: 20, dpMax: 20, modifications: ['Energizador'], bonuses: { frc: 8 }, penalties: { dex: -4 }, range: null, requirements: { frc: 20 }, weight: 'pesado', price: 0 },
    'Martelo Kilicêkan': { type: 'arma', subtype: 'proximidade', rarity: 'especial', damage: '1d4 + 3', defense: null, dp: 25, dpMax: 25, modifications: ['Imbuídor'], bonuses: { enr: 3, frc: 1 }, penalties: {}, range: null, requirements: {}, weight: 'pesado', price: 0 },
    'Arco de Guerra': { type: 'arma', subtype: 'distancia', rarity: 'comum', damage: null, defense: null, dp: 18, dpMax: 18, modifications: ['Perceptivo'], bonuses: { pre: 3 }, penalties: {}, range: 16, requirements: {}, weight: 'medio', price: 0 },
    'Core Beast': { type: 'arma', subtype: 'distancia', rarity: 'especial', damage: null, defense: null, dp: 20, dpMax: 20, modifications: ['Leve'], bonuses: { pre: 2, enr: 3 }, penalties: {}, range: 20, requirements: {}, weight: 'leve', price: 0 },
    'Escudo do Vazio': { type: 'escudo', subtype: 'defesa', rarity: 'especial', damage: null, defense: '1d4 + 2', dp: 25, dpMax: 25, modifications: ['Energizador'], bonuses: { frc: 2 }, penalties: { dex: -2 }, range: null, requirements: {}, weight: 'pesado', price: 0 },
    'Peitoral de Aço': { type: 'vestimenta', subtype: 'corpo', rarity: 'comum', damage: null, defense: null, dp: 8, dpMax: 8, modifications: ['Blindado'], bonuses: { frc: 1 }, penalties: {}, range: null, requirements: {}, weight: 'pesado', price: 0 },
    'Botas Sombras Abaixo': { type: 'vestimenta', subtype: 'pe', rarity: 'especial', damage: null, defense: null, dp: 15, dpMax: 15, modifications: ['Camuflado'], bonuses: { dex: 2 }, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
    'Flechas Leves': { type: 'projetil', subtype: 'projetil', rarity: 'comum', damage: '1d4', defense: null, dp: null, dpMax: null, modifications: [], bonuses: {}, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
    'Flechas Pesadas': { type: 'projetil', subtype: 'projetil', rarity: 'comum', damage: '1d4 + 4', defense: null, dp: null, dpMax: null, modifications: [], bonuses: {}, penalties: {}, range: null, requirements: {}, weight: 'pesado', price: 0 },
    'Chá de Bati': { type: 'consumivel', subtype: 'consumivel', rarity: 'comum', damage: null, defense: null, dp: null, dpMax: null, modifications: ['Cura'], bonuses: {}, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
    'Elixir da Vida': { type: 'consumivel', subtype: 'consumivel', rarity: 'especial', damage: null, defense: null, dp: null, dpMax: null, modifications: [], bonuses: {}, penalties: {}, range: null, requirements: {}, weight: 'leve', price: 0 },
  }

  const itemsDir = join(DATA, 'items')
  const subdirs = ['armas', 'escudos', 'vestimentas', 'consumiveis', 'projeteis', 'diversos']
  for (const sd of subdirs) {
    ensureDir(join(itemsDir, sd))
  }

  const importsByDir = {}
  for (const sd of subdirs) {
    importsByDir[sd] = []
  }

  for (const item of itemsJSON) {
    const catDir = getCategoryDir(item.category)

    // Try to find matching index data by extracting base name
    const baseName = item.name.replace(/\s*\(.*\)\s*$/, '')
    const extra = indexDataByName[baseName] || {}

    const merged = {
      ...item,
      type: extra.type || null,
      subtype: extra.subtype || null,
      rarity: extra.rarity || null,
      damage: extra.damage || null,
      defense: extra.defense || null,
      dp: extra.dp || null,
      dpMax: extra.dpMax || null,
      modifications: extra.modifications || [],
      bonuses: extra.bonuses || {},
      penalties: extra.penalties || {},
      range: extra.range || null,
      requirements: extra.requirements || {},
      weight: extra.weight || null,
      price: extra.price !== undefined ? extra.price : 0,
      isCustom: false,
    }

    const fileName = safeFileName(item.id)
    writeJSON(join(itemsDir, catDir, `${fileName}.json`), merged)

    const varName = safeVarName(item.id)
    importsByDir[catDir].push({ varName, fileName })
  }

  // Create index.js
  const allImports = []
  const allNames = []

  for (const sd of subdirs) {
    for (const entry of importsByDir[sd]) {
      allImports.push(`import ${entry.varName} from './${sd}/${entry.fileName}.json'`)
      allNames.push(entry.varName)
    }
  }

  const indexContent = `${allImports.join('\n')}

const items = [${allImports.length > 0 ? allNames.join(', ') : ''}]
export default items
export { items }
`
  writeFileSync(join(itemsDir, 'index.js'), indexContent, 'utf-8')

  let total = 0
  for (const sd of subdirs) total += importsByDir[sd].length
  console.log(`  Created ${total} item files across ${subdirs.length} subdirectories`)
}

// ============================================================
// 4. NPCs
// ============================================================
function migrateNPCs() {
  console.log('Migrating NPCs...')
  const npcsJSON = readJSON(join(DATA, 'npcs.json'))

  // Data from npcs/index.js keyed by name
  const indexDataByName = {
    'Guarda Jaya': { type: 'npc', role: 'Guarda Elfo' },
    'Guarda Real Xyaner': { type: 'npc', role: 'Guarda Real' },
    'Milur': { type: 'npc', role: '' },
    'Patriarca Yagamor': { type: 'npc', role: 'Patriarca' },
    'Príncipe Hiundmor': { type: 'npc', role: 'Príncipe' },
    'Rainha Tutsa': { type: 'npc', role: 'Rainha' },
    'Rei Yaggnar': { type: 'npc', role: 'Rei' },
    'Tundra': { type: 'npc', role: '' },
    'Almirante das Chamas, Gaiman': { type: 'npc', role: 'Almirante das Chamas' },
    'Bozo': { type: 'npc', role: 'O Palhaço Raivoso' },
    'Margarita Magna': { type: 'npc', role: 'Rainha (antiga)' },
    'Mek, O necromante': { type: 'npc', role: 'Necromante' },
    'Tomoe': { type: 'npc', role: 'General Kyoto' },
    'Victorius Magna': { type: 'npc', role: 'Rei (antigo)' },
    'Cavaleira Sina': { type: 'npc', role: 'Cavaleira' },
    'Lorde Roan Unsato': { type: 'npc', role: 'Lorde' },
    'Sacerdote Delfo': { type: 'npc', role: 'Sacerdote' },
    'Grande Mérti': { type: 'npc', role: 'Grande' },
    'Grande Vein': { type: 'npc', role: 'Grande' },
    'Pequeno Ocoa Unsato, O excluso': { type: 'npc', role: 'O Excluso' },
    'Chefe Noma': { type: 'npc', role: 'Chefe' },
    'General Milianu': { type: 'npc', role: 'General' },
    'Vendedora Vinja': { type: 'npc', role: 'Vendedora' },
    'Taverneiro, Deco Byron': { type: 'npc', role: 'Taverneiro' },
    'O leitor, Muru': { type: 'npc', role: 'O Leitor' },
    'Viconde Gord Unsato': { type: 'npc', role: 'Viconde' },
    'Ferreira Mágica, Tunee': { type: 'npc', role: 'Ferreira Mágica' },
    'A granda maga, Mirk': { type: 'npc', role: 'A Grande Maga' },
    'Mercante Kurk': { type: 'npc', role: 'Mercante' },
    'Baronesa Riz Unsato': { type: 'npc', role: 'Baronesa' },
    'Fray, O bom rei': { type: 'npc', role: 'O Bom Rei' },
    'Blake, O rei tirano': { type: 'npc', role: 'O Rei Tirano' },
    'Ding, O rei eterno': { type: 'npc', role: 'O Rei Eterno' },
  }

  const npcsDir = join(DATA, 'npcs')
  ensureDir(npcsDir)

  const imports = []
  const names = []
  let viceCount = 0

  for (const npc of npcsJSON) {
    let id = npc.id

    // Fix duplicate "vice" IDs
    if (id === 'vice') {
      viceCount++
      if (viceCount === 2) {
        id = 'vice_lina'
      }
    }

    const extra = indexDataByName[npc.name] || {}

    const merged = {
      ...npc,
      id: id,
      type: extra.type || 'npc',
      role: extra.role || '',
      isCustom: false,
    }

    writeJSON(join(npcsDir, `${id}.json`), merged)

    const varName = safeVarName(id)
    imports.push(`import ${varName} from './${id}.json'`)
    names.push(varName)
  }

  const indexContent = `${imports.join('\n')}

const npcs = [${names.join(', ')}]
export default npcs
export { npcs }
`
  writeFileSync(join(npcsDir, 'index.js'), indexContent, 'utf-8')
  console.log(`  Created ${npcsJSON.length} NPC files (fixed duplicate vice -> vice_lina)`)
}

// ============================================================
// 5. HEROES
// ============================================================
function migrateHeroes() {
  console.log('Migrating heroes...')
  const heroesJSON = readJSON(join(DATA, 'heroes.json'))

  const heroesDir = join(DATA, 'heroes')
  ensureDir(heroesDir)

  const imports = []
  const names = []

  for (const hero of heroesJSON) {
    const merged = {
      ...hero,
      isCustom: false,
    }

    writeJSON(join(heroesDir, `${hero.id}.json`), merged)

    const varName = safeVarName(hero.id)
    imports.push(`import ${varName} from './${hero.id}.json'`)
    names.push(varName)
  }

  const indexContent = `${imports.join('\n')}

const heroes = [${names.join(', ')}]
export default heroes
export { heroes }
`
  writeFileSync(join(heroesDir, 'index.js'), indexContent, 'utf-8')
  console.log(`  Created ${heroesJSON.length} hero files`)
}

// ============================================================
// 6. SESSIONS
// ============================================================
function migrateSessions() {
  console.log('Migrating sessions...')
  const sessionsJSON = readJSON(join(DATA, 'sessions.json'))

  const sessionsDir = join(DATA, 'sessions')
  ensureDir(sessionsDir)

  const imports = []
  const names = []

  for (const session of sessionsJSON) {
    const id = `session_${session.id}`
    const merged = {
      ...session,
      isCustom: false,
    }

    writeJSON(join(sessionsDir, `${id}.json`), merged)

    const varName = safeVarName(id)
    imports.push(`import ${varName} from './${id}.json'`)
    names.push(varName)
  }

  const indexContent = `${imports.join('\n')}

const sessions = [${names.join(', ')}]
export default sessions
export { sessions }
`
  writeFileSync(join(sessionsDir, 'index.js'), indexContent, 'utf-8')
  console.log(`  Created ${sessionsJSON.length} session files`)
}

// ============================================================
// 7. MODIFICATIONS (move from items/modifications.js)
// ============================================================
function migrateModifications() {
  console.log('Setting up modifications...')
  const modsDir = join(DATA, 'modifications')
  ensureDir(modsDir)

  // Read existing modifications.js content and copy it
  const modsContent = readFileSync(join(DATA, 'items', 'modifications.js'), 'utf-8')
  writeFileSync(join(modsDir, 'index.js'), modsContent, 'utf-8')
  console.log('  Created modifications/index.js')
}

// ============================================================
// 8. CLEANUP
// ============================================================
function cleanup() {
  console.log('Cleaning up old files...')

  const filesToDelete = [
    join(DATA, 'creatures.json'),
    join(DATA, 'abilities.json'),
    join(DATA, 'items.json'),
    join(DATA, 'npcs.json'),
    join(DATA, 'heroes.json'),
    join(DATA, 'sessions.json'),
    join(DATA, 'items', 'modifications.js'),
  ]

  for (const f of filesToDelete) {
    if (existsSync(f)) {
      rmSync(f)
      console.log(`  Deleted ${f}`)
    }
  }

  // Remove empty directories
  const dirsToRemove = [
    join(DATA, 'characters'),
    join(DATA, 'maps'),
  ]

  for (const d of dirsToRemove) {
    if (existsSync(d)) {
      try {
        rmSync(d, { recursive: true })
        console.log(`  Removed directory ${d}`)
      } catch (e) {
        console.log(`  Could not remove ${d}: ${e.message}`)
      }
    }
  }
}

// ============================================================
// RUN
// ============================================================
try {
  migrateCreatures()
  migrateAbilities()
  migrateItems()
  migrateNPCs()
  migrateHeroes()
  migrateSessions()
  migrateModifications()
  cleanup()
  console.log('\nMigration complete!')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
