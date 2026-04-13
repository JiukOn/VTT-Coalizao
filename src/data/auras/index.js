/* ============================================================
   VTP COALIZÃO — Auras Data
   Extracted from Reference/Doc/Ficha.txt
   ============================================================ */

export const BASE_AURAS = [
  { id: 'pesar', name: 'Aura do Pesar', description: 'Emana tristeza. Causa Medo e fortalece traumas. Teste: 1d20 < RES/2 do alvo.', effect: 'Medo + Traumas' },
  { id: 'desordem', name: 'Aura da Desordem', description: 'Irradia imprevisibilidade. Causa Confusão em todos no alcance. Teste: 1d20 < RES/2 do alvo.', effect: 'Confusão' },
  { id: 'tirano', name: 'Aura do Tirano', description: 'Autoridade sombria. Amplifica debuffs e maldições. +2 ataque com armas. Teste com prejuízo.', effect: 'Amplifica debuffs + Ataque' },
  { id: 'opressor', name: 'Aura do Opressor', description: 'Presença esmagadora. Causa Fraqueza e Lentidão. Teste: 1d20 < max(RES/2, FRC/2) com prejuízo.', effect: 'Fraqueza + Lentidão' },
  { id: 'inspiracao', name: 'Aura da Inspiração', description: 'Confiança e carisma. +2 em todos os testes por 2 turnos. Se falhar RES: -1 FRC ou DEX.', effect: '+2 testes (risco)' },
  { id: 'ocultacao', name: 'Aura da Ocultação', description: 'Mistura-se ao ambiente. -3 PRE de todos no alcance. +2 Furtividade para o usuário.', effect: '-3 PRE / +2 Furtividade' },
  { id: 'harmonia', name: 'Aura da Harmonia', description: 'Paz e equilíbrio. Reduz hostilidade. +3 CRM social. -1 ataques iniciais na área.', effect: '+3 CRM / -1 ataques' },
  { id: 'revelacao', name: 'Aura da Revelação', description: 'Revela verdades ocultas. +3 INT/PRE investigação. Usuário: -1 RES temporário.', effect: '+3 investigação / -1 RES' },
  { id: 'regeneracao', name: 'Aura da Regeneração', description: 'Irradia vitalidade. Todos restauram 1 VIT/turno. Usuário perde 2 ENR/turno.', effect: '+1 VIT/turno / -2 ENR' },
  { id: 'caos', name: 'Aura do Caos', description: 'Força imprevisível. Desvantagem em todos os testes D20 no alcance. Usuário: +2 em ações. Magias gastam +1 ENR.', effect: 'Desvantagem geral / +2 usuário' },
]

export const AURA_RULES = {
  activationVoluntary: '1d4 XP (limite XP >= 0)',
  activationInvoluntary: 'Momentos de tensão (Mestre), teste 1d20 > 12',
  range: '6 + Nível do personagem (metros)',
  duration: '2 turnos',
}

export default BASE_AURAS
