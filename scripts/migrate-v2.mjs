import fs from 'fs';
import path from 'path';

const DATA_DIR = 'D:/Repositorios/Projeto VTP/src/data';

function migrateFolder(folder, transformer) {
  const dir = path.join(DATA_DIR, folder);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  console.log(`Migrating ${files.length} files in ${folder}...`);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const newData = transformer(data);
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf-8');
  }
}

const toI18n = (val) => (typeof val === 'string' ? { "pt-br": val, "en-us": "" } : val);

// ── NPCs ──────────────────────────────────────────────────────────────────────
migrateFolder('npcs', (npc) => {
  const newNpc = {
    id: npc.id,
    name: toI18n(npc.name),
    description: toI18n(npc.description || npc.role || ""),
    location: npc.location || "",
    personalities: [], // New field
    possibleBenefit: { "pt-br": "", "en-us": "" },
    possibleHarm: { "pt-br": "", "en-us": "" },
    isCustom: npc.isCustom ?? false
  };
  return newNpc;
});

// ── Creatures ─────────────────────────────────────────────────────────────────
migrateFolder('creatures', (c) => {
  return {
    ...c,
    name: toI18n(c.name),
    description: toI18n(c.description),
    core: "medio", // Default
    size: "medio", // Default
    elements: [],   // New field
  };
});

// ── Heroes ────────────────────────────────────────────────────────────────────
migrateFolder('heroes', (h) => {
  return {
    ...h,
    name: toI18n(h.name),
    history: toI18n(h.history),
  };
});

// ── Items ─────────────────────────────────────────────────────────────────────
// Items are nested in subfolders like armas, armaduras
function migrateRecursive(folder, transformer) {
    const dir = path.join(DATA_DIR, folder);
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            migrateRecursive(path.join(folder, item.name), transformer);
        } else if (item.name.endsWith('.json')) {
            const filePath = path.join(dir, item.name);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const newData = transformer(data);
            fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf-8');
        }
    }
}

migrateRecursive('items', (i) => ({
    ...i,
    name: toI18n(i.name),
    description: toI18n(i.description)
}));

migrateRecursive('abilities', (a) => ({
    ...a,
    name: toI18n(a.name),
    description: toI18n(a.description)
}));

console.log("Migration to V2 Bilingual Schemas complete!");
