/* elementalAffinities.js — Canonical elemental relationships and damage multipliers for Coalizão RPG */

export const COALIZAO_ELEMENTS = {
  fire: {
    id: 'fire',
    name: 'Fogo',
    icon: '🔥',
    weakAgainst: 'water',
    strongAgainst: ['wood', 'ice'],
    color: '#EF4444',
  },
  water: {
    id: 'water',
    name: 'Água',
    icon: '💧',
    weakAgainst: 'lightning',
    strongAgainst: ['fire'],
    color: '#3B82F6',
  },
  lightning: {
    id: 'lightning',
    name: 'Raio',
    icon: '⚡',
    weakAgainst: 'earth',
    strongAgainst: ['water'],
    color: '#F59E0B',
  },
  earth: {
    id: 'earth',
    name: 'Terra',
    icon: '🌍',
    weakAgainst: 'wood',
    strongAgainst: ['lightning'],
    color: '#D97706',
  },
  wood: {
    id: 'wood',
    name: 'Madeira',
    icon: '🌿',
    weakAgainst: 'fire',
    strongAgainst: ['earth'],
    color: '#10B981',
  },
  ice: {
    id: 'ice',
    name: 'Gelo',
    icon: '❄️',
    weakAgainst: 'fire',
    strongAgainst: ['wood'],
    color: '#38BDF8',
  },
  void: {
    id: 'void',
    name: 'Vazio',
    icon: '🌌',
    weakAgainst: null,
    strongAgainst: [],
    color: '#8B5CF6',
  },
}

/**
 * Calculates damage multiplier based on elemental matchups
 * @param {string} attackElement Element of the incoming attack
 * @param {string} targetAffinity Innate element or protection of the target
 * @returns {{ multiplier: number, effectiveness: 'super_effective'|'not_effective'|'neutral', message: string }}
 */
export function calculateElementalDamageMultiplier(attackElement, targetAffinity) {
  if (!attackElement || !targetAffinity || attackElement === targetAffinity) {
    return { multiplier: 1.0, effectiveness: 'neutral', message: 'Dano neutro.' }
  }

  const atk = COALIZAO_ELEMENTS[attackElement]
  const def = COALIZAO_ELEMENTS[targetAffinity]

  if (!atk || !def) {
    return { multiplier: 1.0, effectiveness: 'neutral', message: 'Elemento não reconhecido.' }
  }

  // Super effective
  if (atk.strongAgainst.includes(targetAffinity) || def.weakAgainst === attackElement) {
    return {
      multiplier: 1.5,
      effectiveness: 'super_effective',
      message: `💥 **Super Efetivo!** (${atk.icon} ${atk.name} vs ${def.icon} ${def.name}: +50% de dano).`,
    }
  }

  // Not very effective
  if (def.strongAgainst.includes(attackElement) || atk.weakAgainst === targetAffinity) {
    return {
      multiplier: 0.5,
      effectiveness: 'not_effective',
      message: `🛡️ **Pouco Efetivo!** (${atk.icon} ${atk.name} vs ${def.icon} ${def.name}: -50% de dano).`,
    }
  }

  return { multiplier: 1.0, effectiveness: 'neutral', message: 'Dano normal.' }
}
