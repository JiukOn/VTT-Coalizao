/* tavernRumors.js — Procedural tavern rumors, urban gossip and adventure hooks for Coalizão */

export const RUMOR_CATEGORIES = [
  { id: 'all', label: 'Todos os Rumores' },
  { id: 'urban', label: 'Subterrâneo & Urbano' },
  { id: 'wasteland', label: 'Ermos & Mutantes' },
  { id: 'faction', label: 'Intrigas de Facções' },
  { id: 'ancient', label: 'Ruínas & Tecnologia Antiga' },
]

const RUMORS_DB = [
  // Urban
  {
    category: 'urban',
    text: 'Dizem que o Sindicato dos Dutores desviou uma carga de estimulantes neurais que sumiu nos túneis de esgoto do Setor 4.',
    veracity: 'Verdadeiro',
    hook: 'Recuperar o carregamento antes que caia nas mãos de viciados da Zona Baixa.',
    rewardEstimate: '150-250 Cr$ + Estimulantes',
  },
  {
    category: 'urban',
    text: 'Um mercador do Mercado Negro jura que comprou um cartão de acesso criptografado para o cofre da antiga Prefeitura.',
    veracity: 'Exagerado',
    hook: 'O cartão precisa de um decodificador que está guardado numa delegacia abandonada.',
    rewardEstimate: '300 Cr$',
  },
  {
    category: 'urban',
    text: 'O dono da Taverna do Pistão Enferrujado está oferecendo comida grátis para quem descobrir quem está envenenando os barris de destilado sintético.',
    veracity: 'Verdadeiro',
    hook: 'Investigação noturna na adega contra sabotadores de uma gangue rival.',
    rewardEstimate: '80 Cr$ + Estadia',
  },

  // Wasteland
  {
    category: 'wasteland',
    text: 'Batedores avistaram uma alcateia de Canídeos Radioativos migrando para o vale ao sul da cratera.',
    veracity: 'Verdadeiro',
    hook: 'Proteger uma caravana de suprimentos que passará pela rota nas próximas 24h.',
    rewardEstimate: '200 Cr$ + Peles',
  },
  {
    category: 'wasteland',
    text: 'Contam que existe uma fonte de água purificada jorrando no meio de uma floresta de fungos fosforescentes.',
    veracity: 'Exagerado',
    hook: 'A água é limpa, mas a clareira é o ninho de um Aracnídeo Blindado colossal.',
    rewardEstimate: 'Filtros de Água + 180 Cr$',
  },

  // Faction
  {
    category: 'faction',
    text: 'Um tenente da Guarda da Coalizão foi visto recebendo maletas de créditos de um emissário dos Renegados da Cinza.',
    veracity: 'Verdadeiro',
    hook: 'Chantagear o oficial ou denunciá-lo ao Comando Central por uma recompensa oficial.',
    rewardEstimate: '350 Cr$',
  },
  {
    category: 'faction',
    text: 'A Corporação Nexo está recrutando mercenários sem perguntas para uma operação de "limpeza biológica" num laboratório selado.',
    veracity: 'Verdadeiro',
    hook: 'Contrato de alto risco com pagamento adiantado, mas com cláusula de silêncio mortal.',
    rewardEstimate: '500 Cr$ por agente',
  },

  // Ancient
  {
    category: 'ancient',
    text: 'Uma tempestade de areia revelou a cúpula de um antigo búnker militar pré-colapso que nunca foi saqueado.',
    veracity: 'Verdadeiro',
    hook: 'Corrida contra saqueadores rivais para romper as portas blindadas.',
    rewardEstimate: 'Armas de Energia + Baterias Nucleares',
  },
  {
    category: 'ancient',
    text: 'Um androide com defeito de memória está vagando pelas dunas repetindo uma sequência de coordenadas de satélite.',
    veracity: 'Falso/Emboscada',
    hook: 'O androide é uma isca criada por piratas cibernéticos para atrair curiosos.',
    rewardEstimate: 'Sucata + Componentes Eletrônicos',
  },
]

/**
 * Generates a random rumor based on category
 * @param {string} category
 * @returns {object}
 */
export function generateRandomRumor(category = 'all') {
  const pool = category === 'all'
    ? RUMORS_DB
    : RUMORS_DB.filter(r => r.category === category)

  const selectedList = pool.length > 0 ? pool : RUMORS_DB
  const chosen = selectedList[Math.floor(Math.random() * selectedList.length)]

  return {
    id: `rumor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...chosen,
    generatedAt: new Date().toISOString(),
  }
}
