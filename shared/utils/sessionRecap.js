/* sessionRecap.js — Post-session statistics, metrics aggregation and markdown report generator */

/**
 * Creates a new session metrics tracker
 * @returns {object}
 */
export function createSessionTracker() {
  return {
    startTime: new Date().toISOString(),
    totalDamageDealt: 0,
    highestCrit: { damage: 0, attacker: null, target: null },
    totalRollsCount: 0,
    totalCritsCount: 0,
    totalFumblesCount: 0,
    totalXpAwarded: 0,
    totalCreditsLooted: 0,
    events: [],
  }
}

/**
 * Records a dice roll in the session tracker
 * @param {object} tracker
 * @param {object} roll
 */
export function recordSessionRoll(tracker, roll) {
  if (!tracker || !roll) return
  tracker.totalRollsCount += 1
  if (roll.result === 20 || roll.classification?.id === 'crit') {
    tracker.totalCritsCount += 1
  }
  if (roll.result === 1 || roll.classification?.id === 'fumble') {
    tracker.totalFumblesCount += 1
  }
}

/**
 * Records damage dealt in the session tracker
 * @param {object} tracker
 * @param {number} damage
 * @param {string} attacker
 * @param {string} target
 */
export function recordSessionDamage(tracker, damage, attacker = 'Herói', target = 'Inimigo') {
  if (!tracker || typeof damage !== 'number' || damage <= 0) return
  tracker.totalDamageDealt += damage

  if (damage > tracker.highestCrit.damage) {
    tracker.highestCrit = { damage, attacker, target }
  }
}

/**
 * Generates a structured markdown recap report of the session
 * @param {object} tracker
 * @returns {string}
 */
export function generateSessionMarkdownReport(tracker) {
  if (!tracker) return '# Resumo da Sessão\nNenhum dado registrado.'

  const dateStr = new Date(tracker.startTime).toLocaleDateString('pt-BR')

  return `# 📜 Ata & Resumo da Sessão — ${dateStr}

## 📊 Estatísticas de Combate & Desempenho
- **Dano Total Infligido**: ${tracker.totalDamageDealt} pts
- **Maior Golpe da Noite**: ${tracker.highestCrit.damage > 0 ? `${tracker.highestCrit.damage} de dano (${tracker.highestCrit.attacker || 'Alguém'} ➔ ${tracker.highestCrit.target || 'Inimigo'})` : 'Nenhum'}
- **Total de Rolagens de Dados**: ${tracker.totalRollsCount}
- **Acertos Críticos (Nat 20)**: 🎯 ${tracker.totalCritsCount}
- **Falhas Críticas (Nat 1)**: 💀 ${tracker.totalFumblesCount}

## 🏆 Recompensas & Conquistas
- **XP Total Distribuído**: ${tracker.totalXpAwarded} XP
- **Créditos/Recursos Saqueados**: ${tracker.totalCreditsLooted} Cr$

---
*Gerado automaticamente pelo VTT Coalizão.*`
}
