/* ============================================================
   VTP COALIZÃO — Item Modifications Data
   Extracted from Reference/Doc/Lista de Modificações de itens.txt
   ============================================================ */

export const BASE_MODIFICATIONS = [
  // ── DEFENSIVAS ──────────────────────────────────────────
  { name: 'Blindado', category: 'defensiva', description: 'Diminui em 1 o dano recebido.', applicableTo: ['vestimenta', 'escudo'] },
  { name: 'Energizador', category: 'defensiva', description: 'Uma vez por combate, anula 1 de dano elemental.', applicableTo: ['arma', 'item'] },
  { name: 'Fortificado', category: 'defensiva', description: '+1 no dado em testes de Defesa.', applicableTo: ['vestimenta', 'escudo'] },
  { name: 'Ignífugo', category: 'defensiva', description: 'Resistência Elemental ao Fogo no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Aterrado', category: 'defensiva', description: 'Resistência Elemental ao Elétrico no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Térmico', category: 'defensiva', description: 'Resistência Elemental ao Gelo no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Purificador', category: 'defensiva', description: 'Resistência Elemental ao Maligno no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Sintético', category: 'defensiva', description: 'Resistência Elemental à Madeira no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Compacto', category: 'defensiva', description: 'Resistência Elemental à Areia no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Cronal', category: 'defensiva', description: 'Resistência Elemental ao Tempo no local da vestimenta.', applicableTo: ['vestimenta'] },
  { name: 'Impermeável', category: 'defensiva', description: 'Resistência Elemental à Água no local da vestimenta.', applicableTo: ['vestimenta'] },

  // ── ELEMENTAIS ──────────────────────────────────────────
  { name: 'Amadeirado', category: 'elemental', description: 'Ações adquirem elemento Madeira. Pode causar Travado se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Aquático', category: 'elemental', description: 'Ações adquirem elemento Água. Pode causar Afogamento se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Quente', category: 'elemental', description: 'Ações adquirem elemento Fogo. Pode causar Queimadura se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Frio', category: 'elemental', description: 'Ações adquirem elemento Gelo. Pode causar Congelamento se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Elétrico', category: 'elemental', description: 'Ações adquirem elemento Elétrico. Pode causar Curto se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Malicioso', category: 'elemental', description: 'Ações adquirem elemento Maligno. Ativa efeitos psicológicos se 1d20 > 1d20+RES alvo.', applicableTo: ['arma'] },
  { name: 'Arenoso', category: 'elemental', description: 'Ações adquirem elemento Areia. Pode causar Travado se 1d20 > 1d20+FRC alvo.', applicableTo: ['arma'] },
  { name: 'Apressado', category: 'elemental', description: 'Ações adquirem elemento Tempo. Pode causar Envelhecer se 1d20 > 1d20+VIT alvo.', applicableTo: ['arma'] },
  { name: 'Atrasado', category: 'elemental', description: 'Ações adquirem elemento Tempo. Pode causar Rejuvelhecer se 1d20 > 1d20+VIT alvo.', applicableTo: ['arma'] },

  // ── ESSENCIAIS ──────────────────────────────────────────
  { name: 'Barulhento', category: 'essencial', description: 'Emite sons que podem causar confusão se 1d20 > 1d20+RES alvo.', applicableTo: ['arma', 'item'] },
  { name: 'Imbuídor', category: 'essencial', description: 'Gasta 1 ENR temporariamente por turno para +1 dano.', applicableTo: ['arma', 'item'] },
  { name: 'Camuflado', category: 'essencial', description: '+1 no dado em testes de Furtividade.', applicableTo: ['vestimenta', 'item'] },
  { name: 'Vigoroso', category: 'essencial', description: '1x/dia, teste 1d20 > 18 para remover efeito psicológico nível 1-2 permanentemente.', applicableTo: ['vestimenta', 'item'] },
  { name: 'Vínculo', category: 'essencial', description: 'Dado de vantagem em interações com criaturas não inteligentes conhecidas.', applicableTo: ['item'] },

  // ── OFENSIVAS ───────────────────────────────────────────
  { name: 'Afiado', category: 'ofensiva', description: '+1 dano cortante.', applicableTo: ['arma'] },
  { name: 'Perfurador', category: 'ofensiva', description: '+1 dano perfurante.', applicableTo: ['arma'] },
  { name: 'Feroz', category: 'ofensiva', description: 'Após crítico, próximo ataque recebe +1 no dado de dano.', applicableTo: ['arma'] },
  { name: 'Perceptivo', category: 'ofensiva', description: '1x/combate, teste PRE > 10+DEX alvo para ignorar defesa.', applicableTo: ['arma'] },

  // ── PENALIDADES ─────────────────────────────────────────
  { name: 'Frágil', category: 'penalidade', description: '+1 no dado de ataque direcionados ao item (mais fácil de quebrar).', applicableTo: ['arma', 'vestimenta', 'escudo'] },
  { name: 'Restringido', category: 'penalidade', description: 'Dado de prejuízo ao se movimentar enquanto equipado.', applicableTo: ['vestimenta', 'item'] },
  { name: 'Desgaste', category: 'penalidade', description: '-1 no dado ao usar o item até ser reparado.', applicableTo: ['arma', 'vestimenta', 'escudo', 'item'] },
  { name: 'Irremovível', category: 'penalidade', description: 'Item não pode ser removido após equipado.', applicableTo: ['arma', 'vestimenta', 'item'] },

  // ── QUALIDADE ───────────────────────────────────────────
  { name: 'Chamativo', category: 'qualidade', description: '+1 CRM em interações sociais, -1 Furtividade.', applicableTo: ['vestimenta', 'item'] },
  { name: 'Prático', category: 'qualidade', description: 'Dado de vantagem em criação/reparo de itens.', applicableTo: ['ferramenta', 'item'] },
  { name: 'Conforto', category: 'qualidade', description: 'Dado de vantagem em testes de descanso.', applicableTo: ['vestimenta'] },
  { name: 'Leve', category: 'qualidade', description: '+1 no dado em testes de ataque com PRE.', applicableTo: ['arma'] },
  { name: 'Pesado', category: 'qualidade', description: '+1 dado de ataque, -1 dado de esquiva.', applicableTo: ['arma', 'vestimenta'] },
  { name: 'Cura', category: 'qualidade', description: 'Restaura 1d4 VIT ao consumir.', applicableTo: ['consumivel'] },
  { name: 'Mochileiro', category: 'qualidade', description: 'Dado de vantagem em movimentação longa.', applicableTo: ['vestimenta'] },
  { name: 'Acelerado', category: 'qualidade', description: 'Dado de vantagem em movimentação curta.', applicableTo: ['vestimenta'] },
]

export default BASE_MODIFICATIONS
