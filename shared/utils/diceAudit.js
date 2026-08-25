/* diceAudit.js — Audit logs and CSV export utility for session dice rolls */

/**
 * Converts a list of dice roll logs into CSV format
 * @param {Array<object>} rollHistory
 * @returns {string} CSV formatted string
 */
export function exportRollsToCsv(rollHistory = []) {
  const headers = ['ID', 'Horário', 'Jogador', 'Tipo de Dado', 'Resultado', 'Bônus', 'Rolagens Brutas', 'Classificação']
  const rows = (rollHistory || []).map(r => [
    r.id || '',
    r.time || r.timestamp || '',
    `"${(r.playerName || r.rollerName || 'Jogador').replace(/"/g, '""')}"`,
    `"${(r.diceType || `1d${r.sides || 20}`).replace(/"/g, '""')}"`,
    r.result ?? r.used ?? '',
    r.modifier ?? 0,
    `"${Array.isArray(r.raw || r.results) ? (r.raw || r.results).join(', ') : ''}"`,
    `"${(r.label || r.classification?.label || '').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}
