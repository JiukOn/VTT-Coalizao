/* journalUtils.js — Campaign chronicles journal entries and world lore timeline */

/**
 * Creates a new session journal entry
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.content
 * @param {string} [params.author]
 * @param {Array<string>} [params.tags]
 * @param {string} [params.inGameDate]
 * @returns {object}
 */
export function createJournalEntry({
  title = 'Crônica da Sessão',
  content = '',
  author = 'Narrador',
  tags = [],
  inGameDate = '',
} = {}) {
  return {
    id: `jrn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: (title || '').trim() || 'Nova Entrada',
    content: (content || '').trim(),
    author: (author || '').trim() || 'Narrador',
    tags: Array.isArray(tags) ? [...tags] : [],
    inGameDate: (inGameDate || '').trim() || new Date().toLocaleDateString('pt-BR'),
    createdAt: new Date().toISOString(),
  }
}

/**
 * Creates a new historical timeline event
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.yearOrDate
 * @param {'pre_colapso'|'colapso'|'reconstrucao'|'atual'} [params.era]
 * @param {'baixa'|'media'|'alta'} [params.importance]
 * @returns {object}
 */
export function createTimelineEvent({
  title = '',
  description = '',
  yearOrDate = 'Ano 128 P.C.',
  era = 'atual',
  importance = 'media',
} = {}) {
  return {
    id: `tml_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: (title || '').trim() || 'Evento Histórico',
    description: (description || '').trim(),
    yearOrDate: (yearOrDate || '').trim(),
    era,
    importance,
    createdAt: new Date().toISOString(),
  }
}
