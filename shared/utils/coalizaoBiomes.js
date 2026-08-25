/* coalizaoBiomes.js — Canonical biomes and environmental climate conditions from Coalizão RPG database */

export const COALIZAO_BIOMES = {
  ash_forest: {
    id: 'ash_forest',
    name: 'Floresta de Cinzas (Ash Forest)',
    icon: '🌋',
    weather: 'embers',
    color: '#F97316',
    visionLimitMeters: 8,
    desc: 'Atmosfera carregada de cinzas vulcânicas e brasas. Visão máxima limitada a 8m (5 células) e dano de fogo ampliado.',
  },
  deep_purple_forest: {
    id: 'deep_purple_forest',
    name: 'Floresta Roxa Profunda (Deep Purple)',
    icon: '🟣',
    weather: 'acid_rain',
    color: '#A855F7',
    desc: 'Miasma tóxico e chuva ácida constante. Criaturas devem resistir a efeitos de envenenamento e corrosão.',
  },
  desert: {
    id: 'desert',
    name: 'Deserto Tórrido da Coalizão',
    icon: '☀️',
    weather: 'none',
    color: '#EAB308',
    desc: 'Calor escaldante e dunas instáveis. Movimentação rápida consome 1 ponto adicional de Energia (ENR).',
  },
  blue_stone_forest: {
    id: 'blue_stone_forest',
    name: 'Floresta das Pedras Azuis (Blue Stone)',
    icon: '💎',
    weather: 'fog',
    color: '#06B6D4',
    desc: 'Cristais azulados que ressoam com energia pura. Habilidades mágicas e de energia recebem +1 de dano.',
  },
}

/**
 * Gets environmental effects of a biome
 * @param {string} biomeId
 * @returns {object} Biome info
 */
export function getBiomeEffects(biomeId = 'ash_forest') {
  return COALIZAO_BIOMES[biomeId] || COALIZAO_BIOMES.ash_forest
}
