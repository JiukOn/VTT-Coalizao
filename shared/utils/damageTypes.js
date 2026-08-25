/* damageTypes.js — Damage types, resistances, vulnerabilities and affinities for Coalizão RPG */

export const DAMAGE_TYPES = {
  kinetic: { id: 'kinetic', label: 'Cinético / Balístico', icon: '💥', color: '#94A3B8' },
  energy:  { id: 'energy',  label: 'Energia / Plasma',      icon: '⚡', color: '#38BDF8' },
  fire:    { id: 'fire',    label: 'Fogo / Térmico',        icon: '🔥', color: '#EF4444' },
  acid:    { id: 'acid',    label: 'Ácido / Químico',       icon: '🧪', color: '#10B981' },
  sonic:   { id: 'sonic',   label: 'Sônico / Psíquico',     icon: '🧠', color: '#A855F7' },
}

/**
 * Calculates final damage taking into account target's resistances, vulnerabilities and immunities
 * @param {number} rawDamage
 * @param {'kinetic'|'energy'|'fire'|'acid'|'sonic'} damageType
 * @param {object} affinities Target affinities object: { resistances: [], vulnerabilities: [], immunities: [] }
 * @returns {{ finalDamage: number, multiplier: number, affinityType: 'none'|'resistance'|'vulnerability'|'immunity', label: string }}
 */
export function calculateDamageWithAffinities(rawDamage, damageType = 'kinetic', affinities = {}) {
  if (typeof rawDamage !== 'number' || rawDamage <= 0) {
    return { finalDamage: 0, multiplier: 1, affinityType: 'none', label: 'Dano Normal' }
  }

  const immunities = Array.isArray(affinities?.immunities) ? affinities.immunities : []
  const resistances = Array.isArray(affinities?.resistances) ? affinities.resistances : []
  const vulnerabilities = Array.isArray(affinities?.vulnerabilities) ? affinities.vulnerabilities : []

  if (immunities.includes(damageType)) {
    return { finalDamage: 0, multiplier: 0, affinityType: 'immunity', label: '🛡️ Imunidade (0 Dano)' }
  }

  if (resistances.includes(damageType)) {
    const finalDamage = Math.max(1, Math.floor(rawDamage / 2))
    return { finalDamage, multiplier: 0.5, affinityType: 'resistance', label: '🛡️ Resistência (Metade do Dano)' }
  }

  if (vulnerabilities.includes(damageType)) {
    const finalDamage = rawDamage * 2
    return { finalDamage, multiplier: 2, affinityType: 'vulnerability', label: '⚠️ Vulnerabilidade (Dano Dobrado)' }
  }

  return { finalDamage: rawDamage, multiplier: 1, affinityType: 'none', label: 'Dano Normal' }
}
