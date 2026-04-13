import fs from 'fs';
import path from 'path';

const DATA_DIR = 'D:/Repositorios/Projeto VTP/src/data';

function writeIndex(folder, content) {
  const dirPath = path.join(DATA_DIR, folder);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, 'index.js');
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
}

console.log("Rebuilding index.js files with I18N React Fallbacks...");

// 1. Personalities
writeIndex('personalities', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_PERSONALITIES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_PERSONALITIES;
`);

// 2. Classes
writeIndex('classes', `
const glob = import.meta.glob('./*.json', { eager: true });
export const CLASS_DATA = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || '',
  legacyAbilityName: item.legacyAbilityName?.['pt-br'] || item.legacyAbilityName || ''
}));
export default CLASS_DATA;
`);

// 3. Auras
writeIndex('auras', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_AURAS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || '',
  effect: item.effectDetails?.['pt-br'] || item.effectDetails || ''
}));
export const AURA_RULES = {
  activationVoluntary: '1d4 XP (limite XP >= 0)',
  activationInvoluntary: 'Momentos de tensão (Mestre), teste 1d20 > 12',
  range: '6 + Nível do personagem (metros)',
  duration: '2 turnos',
};
export default BASE_AURAS;
`);

// 4. Modifications
writeIndex('modifications', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_MODIFICATIONS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_MODIFICATIONS;
`);

// 5. Environments
writeIndex('environments', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_ENVIRONMENTS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_ENVIRONMENTS;
`);

// 6. Tendencies
writeIndex('tendencies', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_TENDENCIES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_TENDENCIES;
`);

// 7. Species
writeIndex('species', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_SPECIES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_SPECIES;
`);

// 8. Effects
writeIndex('effects', `
const glob = import.meta.glob('./*.json', { eager: true });
const RAW_EFFECTS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));

export const BASE_EFFECTS = {
  psicologicosAtivos: RAW_EFFECTS.filter(e => e.category === 'psicologico_ativo'),
  psicologicosPassivos: RAW_EFFECTS.filter(e => e.category === 'psicologico_passivo'),
  doencas: RAW_EFFECTS.filter(e => e.category === 'doenca'),
  condicoes: RAW_EFFECTS.filter(e => e.category === 'condicao'),
  maldicoes: RAW_EFFECTS.filter(e => e.category === 'maldicao'),
  efeitosUnicos: RAW_EFFECTS.filter(e => e.category === 'efeito_unico'),
};
export default BASE_EFFECTS;
`);

// 9. Domains Placeholder
writeIndex('domains', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_DOMAINS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_DOMAINS;
`);

// 10. Elements
writeIndex('elements', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_ELEMENTS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_ELEMENTS;
`);

// 11. Creatures
writeIndex('creatures', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_CREATURES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_CREATURES;
`);

// 12. NPCs
writeIndex('npcs', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_NPCS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_NPCS;
`);

// 13. Heroes
writeIndex('heroes', `
const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_HEROES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_HEROES;
`);

// 14. Items
writeIndex('items', `
const glob = import.meta.glob('./**/*.json', { eager: true });
export const BASE_ITEMS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_ITEMS;
`);

// 15. Abilities
writeIndex('abilities', `
const glob = import.meta.glob('./**/*.json', { eager: true });
export const BASE_ABILITIES = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_ABILITIES;
`);


console.log("Indices rebuilt properly with React fallbacks!");
