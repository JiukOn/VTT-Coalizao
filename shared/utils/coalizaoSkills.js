/* coalizaoSkills.js — Canonical skills and legacy class abilities from the Coalizão RPG database */

export const COALIZAO_SKILLS = {
  energy_blade: {
    id: 'energy_blade',
    name: 'Lâmina de Energia',
    icon: '⚡',
    element: 'void',
    category: 'active',
    enrCost: 1,
    turnsDuration: 3,
    desc: 'O usuário molda sua energia em uma lâmina de energia. Fornece +1 PRE e dano elemental por 3 turnos.',
  },
  seismic_shockwave: {
    id: 'seismic_shockwave',
    name: 'Onda de Choque Sísmica',
    icon: '💥',
    element: 'earth',
    category: 'active',
    enrCost: 2,
    turnsDuration: 1,
    desc: 'Golpeia o solo causando impacto em área. Inimigos a até 3m sofrem 1d8 de dano e devem superar teste de RES ou caem Derrubados.',
  },
  draconic_flames: {
    id: 'draconic_flames',
    name: 'Chamas Dracônicas',
    icon: '🔥',
    element: 'fire',
    category: 'active',
    enrCost: 2,
    turnsDuration: 2,
    desc: 'Emite um sopro de chamas ardentes em cone de 4m. Causa 1d10 de dano de Fogo e queima por 2 turnos.',
  },
  thorn_barrier: {
    id: 'thorn_barrier',
    name: 'Barreira de Espinhos',
    icon: '🌿',
    element: 'wood',
    category: 'active',
    enrCost: 1,
    turnsDuration: 3,
    desc: 'Ergue uma parede de raízes e espinhos grossos, concedendo Meia Cobertura (+2 Defesa) e causando 2 de dano a quem se aproximar.',
  },
  blade_skill: {
    id: 'blade_skill',
    name: 'Esgrima Avançada',
    icon: '⚔️',
    element: null,
    category: 'legacy',
    classId: 'swordsman',
    enrCost: 1,
    turnsDuration: 3,
    desc: 'Ao utilizar lâminas, o usuário causa +1 de dano por 3 turnos (Habilidade Legado do Espadachim).',
  },
  aimed_shot: {
    id: 'aimed_shot',
    name: 'Tiro ao Alvo',
    icon: '🎯',
    element: null,
    category: 'legacy',
    classId: 'archer',
    enrCost: 1,
    turnsDuration: 2,
    desc: 'Aumenta 1 de dano a longa distância utilizando armas com munição por 2 turnos (Habilidade Legado do Arqueiro).',
  },
}

/**
 * Casts a Coalizão skill, checking ENR and applying effects
 * @param {object} playerEntity
 * @param {string} skillId
 * @returns {{ updatedPlayer: object, success: boolean, message: string }}
 */
export function castCoalizaoSkill(playerEntity, skillId) {
  if (!playerEntity) return { updatedPlayer: playerEntity, success: false, message: 'Personagem inválido.' }

  const skill = COALIZAO_SKILLS[skillId]
  if (!skill) return { updatedPlayer: playerEntity, success: false, message: 'Habilidade não encontrada.' }

  const currentEnr = playerEntity.enr ?? 0
  const cost = skill.enrCost || 0

  if (currentEnr < cost) {
    return {
      updatedPlayer: playerEntity,
      success: false,
      message: `⚡ Energia insuficiente! Você precisa de ${cost} ENR (Possui ${currentEnr} ENR).`,
    }
  }

  const nextEnr = currentEnr - cost

  // Add active effect
  const activeEffects = Array.isArray(playerEntity.effects) ? [...playerEntity.effects] : []
  activeEffects.push({
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    turnsRemaining: skill.turnsDuration || 1,
    element: skill.element || null,
  })

  const updatedPlayer = {
    ...playerEntity,
    enr: nextEnr,
    effects: activeEffects,
  }

  return {
    updatedPlayer,
    success: true,
    message: `🔮 **${playerEntity.name || 'Herói'}** conjurou **${skill.icon} ${skill.name}** (-${cost} ENR ➔ ${nextEnr} restantes)! *${skill.desc}*`,
  }
}
