import fs from 'fs';
import path from 'path';

const DATA_DIR = 'D:/Repositorios/Projeto VTP/src/data';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJSON(dir, filename, data) {
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), 'utf-8');
}

// Convert common text fields to I18N
function toI18N(text) {
  return {
    'pt-br': text || "",
    'en-us': ""
  };
}

async function migratePersonalities() {
  console.log("Migrating Personalities...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'personalities/index.js').replace(/\\/g, '/');
  try {
    const { BASE_PERSONALITIES } = await import(modulePath);
    if (!BASE_PERSONALITIES) return;
    
    for (const item of BASE_PERSONALITIES) {
      const data = {
        id: item.id,
        name: toI18N(item.name),
        description: toI18N(item.description)
      };
      writeJSON(path.join(DATA_DIR, 'personalities'), `${item.id}.json`, data);
    }
  } catch(e) { console.warn("Could not import personalities", e); }
}

async function migrateClasses() {
  console.log("Migrating Classes...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'classes/index.js').replace(/\\/g, '/');
  try {
    const { CLASS_DATA } = await import(modulePath);
    if (!CLASS_DATA) return;
    
    for (const item of CLASS_DATA) {
      const data = {
        id: item.id,
        name: toI18N(item.name),
        description: toI18N(item.description || ""), // current data might missing description
        legacyAbilityId: item.legacyAbilityId,
        legacyAbilityName: toI18N(item.legacyAbilityName),
        multipliers: item.multipliers,
        selectableAbilities: item.selectableAbilities || []
      };
      writeJSON(path.join(DATA_DIR, 'classes'), `${item.id}.json`, data);
    }
  } catch(e) { console.warn("Could not import classes", e); }
}

async function migrateAuras() {
  console.log("Migrating Auras...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'auras/index.js').replace(/\\/g, '/');
  try {
    const { BASE_AURAS } = await import(modulePath);
    if (!BASE_AURAS) return;
    
    for (const item of BASE_AURAS) {
      const data = {
        id: item.id,
        name: toI18N(item.name),
        description: toI18N(item.description),
        effectDetails: toI18N(item.effect),
        activation: toI18N("") // Not explicitly in the old structure per item, but user requested "momentos em que pode ser ativado forcamente"
      };
      writeJSON(path.join(DATA_DIR, 'auras'), `${item.id}.json`, data);
    }
  } catch(e) { console.warn("Could not import auras", e); }
}

async function migrateModifications() {
  console.log("Migrating Modifications...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'modifications/index.js').replace(/\\/g, '/');
  try {
    const { BASE_MODIFICATIONS } = await import(modulePath);
    if (!BASE_MODIFICATIONS) return;
    
    for (const item of BASE_MODIFICATIONS) {
      // modifications originally didn't have an id, we create one
      const id = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');
      const data = {
        id: id,
        name: toI18N(item.name),
        description: toI18N(item.description),
        category: item.category,
        applicableTo: item.applicableTo,
        attribute_modifiers: {} // to be filled later manually based on description 
      };
      writeJSON(path.join(DATA_DIR, 'modifications'), `${id}.json`, data);
    }
  } catch(e) { console.warn("Could not import modifications", e); }
}

async function migrateEffects() {
  console.log("Migrating Effects...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'effects/index.js').replace(/\\/g, '/');
  try {
    const { BASE_EFFECTS } = await import(modulePath);
    if (!BASE_EFFECTS) return;
    
    const allEffects = [];
    Object.keys(BASE_EFFECTS).forEach(key => {
      allEffects.push(...BASE_EFFECTS[key]);
    });

    for (const item of allEffects) {
      // User requirements for effects: ativo ou passivo, temporario contagem, permanente -1, cura/desativar
      const isPassive = item.category.includes('passivo') || item.category === 'doenca';
      const type = isPassive ? 'passivo' : 'ativo';
      const duration = item.category === 'doenca' || item.category === 'maldicao' ? -1 : 0; // fallback guesses
      
      const data = {
        id: item.id,
        name: toI18N(item.name),
        description: toI18N(item.description),
        type: type,
        duration: duration,
        removalCondition: toI18N(item.removalTest || ""),
        category: item.category
      };
      writeJSON(path.join(DATA_DIR, 'effects'), `${item.id}.json`, data);
    }
  } catch(e) { console.warn("Could not import effects", e); }
}

async function migrateEnvironments() {
  console.log("Migrating Environments...");
  const modulePath = 'file:///' + path.join(DATA_DIR, 'environments/index.js').replace(/\\/g, '/');
  try {
    const { BASE_ENVIRONMENTS } = await import(modulePath);
    if (!BASE_ENVIRONMENTS) {
      // Default array if doesn't export BASE_ENVIRONMENTS
      throw new Error('Not found export');
    }
    
    for (const item of BASE_ENVIRONMENTS) {
      const data = {
        id: item.id,
        name: toI18N(item.name),
        description: toI18N(item.description)
      };
      writeJSON(path.join(DATA_DIR, 'environments'), `${item.id}.json`, data);
    }
  } catch(e) { 
    console.warn("Could not import environments, creating a placeholder."); 
    const data = {
      id: "floresta",
      name: toI18N("Floresta Aberta"),
      description: toI18N("Ambiente de mata iluminada.")
    };
    writeJSON(path.join(DATA_DIR, 'environments'), `floresta.json`, data);
  }
}

async function createPlaceholderData() {
  console.log("Creating Tendencies and Species placeholders...");
  
  // Tendencies
  const tendency = {
    id: "tendencia_1",
    name: toI18N("Caótico"),
    description: toI18N("Uso: Personagens que agem contra a ordem.")
  };
  writeJSON(path.join(DATA_DIR, 'tendencies'), `tendencia_1.json`, tendency);
  
  // Species
  const species = {
    id: "humano",
    name: toI18N("Humano"),
    description: toI18N("Raça balanceada e adaptável."),
    multipliers: {
      vit: 1.0, dex: 1.0, crm: 1.0, frc: 1.0, int: 1.0, res: 1.0, pre: 1.0, enr: 1.0
    }
  };
  writeJSON(path.join(DATA_DIR, 'species'), `humano.json`, species);
}

// ============================================

async function run() {
  await migratePersonalities();
  await migrateClasses();
  await migrateAuras();
  await migrateModifications();
  await migrateEffects();
  await migrateEnvironments();
  await createPlaceholderData();
  
  console.log("DONE");
}

run();
