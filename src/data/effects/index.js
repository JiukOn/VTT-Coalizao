/* ============================================================
   VTP COALIZÃO — Effects and Conditions Data
   Extracted from Reference/Doc/Mecânicas.txt
   ============================================================ */

export const BASE_EFFECTS = {
  psicologicosAtivos: [
    { id: 'medo', name: 'Medo', description: 'Teste 1d20 <= 11 no início do turno. Falha: perde o turno.', removalTest: '1d20 + RES > 1d20 + 5 (a partir do 2° turno)', category: 'psicologico_ativo' },
    { id: 'confusao', name: 'Confusão', description: 'Dado de prejuízo para acertar. Se <= 7, 1d4 de dano. Incapaz de compreender palavras.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'ansiedade', name: 'Ansiedade', description: '-1 CRM temporário. Incapaz de comunicação longa, decisões incertas.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'depressivo', name: 'Depressivo', description: 'Decisões auto-prejudiciais. -2 CRM temporário.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'afasia', name: 'Afasia', description: '-2 CRM ao falar. Se 1d4 <= 2, incapaz de compreender/entonar palavras.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'prosopagnosia', name: 'Prosopagnosia', description: 'Se 1d4 <= 2, incapaz de identificar rostos. Se falhar, -1 CRM.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'impostor', name: 'Impostor', description: 'Se 1d4 <= 2, sente-se inferior. Se 1d4 <= 2 novamente, perde turno.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'protagonista', name: 'Protagonista', description: 'Se arrisca mais. Se 1d4 <= 2, pode perder controle das ações.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'tdah', name: 'TDAH', description: 'Se 1d4 <= 2, perde controle das ações. Não compreende o que está acontecendo.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'maniaco', name: 'Maníaco', description: 'Perde controle e age por impulso se 1d4 <= 2.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
    { id: 'hiperfoco', name: 'Hiperfoco', description: 'Se 1d4 <= 2, esquece do entorno e age no automático.', removalTest: '1d20 + RES > 1d20 + 5', category: 'psicologico_ativo' },
  ],
  psicologicosPassivos: [
    { id: 'dislexia', name: 'Dislexia', description: '-2 no valor dos dados de aprendizado.', category: 'psicologico_passivo' },
    { id: 'servidao', name: 'Servidão', description: 'Teme o seu "soberano".', category: 'psicologico_passivo' },
  ],
  doencas: [
    { id: 'florada', name: 'Florada', description: '1d4 dano/turno. Não reduz VIT a 0. Se VIT = 1, efeito TRAVADO.', category: 'doenca' },
    { id: 'gripe_aco', name: 'Gripe do Aço', description: 'Se 1d20 <= 7, 1 dano/turno. Pele prateada. Transmissível pelo ar.', category: 'doenca' },
    { id: 'sangue_negro', name: 'Sangue Negro', description: 'Se 1d4 <= 2, -1 DEX -1 FRC -1 PRE. Se VIT <= 0, efeito MORTO-VIVO.', category: 'doenca' },
    { id: 'arritmia', name: 'Arritmia', description: 'Em alto esforço, se 1d4 <= 2, -1 DEX -1 VIT temporariamente.', category: 'doenca' },
  ],
  condicoes: [
    { id: 'envenenado', name: 'Envenenado', description: 'Recebe dano/efeito do veneno utilizado (consultar tabela).', category: 'condicao' },
    { id: 'desmaio', name: 'Desmaio', description: 'Incapaz de qualquer ação. Perde turno.', category: 'condicao' },
    { id: 'lentidao', name: 'Lentidão', description: 'Dado de prejuízo para ações de movimento.', category: 'condicao' },
    { id: 'travado', name: 'Travado', description: 'Incapaz de qualquer ação ou movimento.', category: 'condicao' },
    { id: 'sangramento', name: 'Sangramento', description: '1 de dano por turno.', category: 'condicao' },
    { id: 'morto_vivo', name: 'Morto-Vivo', description: 'Se 1d4 <= 2, 1 de dano. Mantém vivo 2 turnos após VIT = 0.', category: 'condicao' },
    { id: 'fraqueza', name: 'Fraqueza', description: 'Perde 1d4 de dano de ataque. -2 nos dados de FRC.', category: 'condicao' },
    { id: 'nausea', name: 'Náusea', description: '-1 dado de movimentação. -2 dados de precisão e percepção.', category: 'condicao' },
    { id: 'afogamento', name: 'Afogamento', description: '1 dano/turno. A partir do 3° turno, teste 1d4 > 1 ou Desmaio por 2 turnos.', category: 'condicao' },
    { id: 'queimadura', name: 'Queimadura', description: 'Efeito de dano de fogo contínuo.', category: 'condicao' },
    { id: 'congelamento', name: 'Congelamento', description: 'Efeito de dano de gelo contínuo.', category: 'condicao' },
    { id: 'curto', name: 'Curto', description: 'Efeito de dano elétrico contínuo.', category: 'condicao' },
  ],
  maldicoes: [
    { id: 'mald_fraqueza', name: 'Fraqueza (Maldição)', description: 'Se FRC > FRC do alvo, perde -2 FRC -1 DEX.', category: 'maldicao' },
    { id: 'azar', name: 'Azar', description: 'Incapaz de acertar crítico nos dados.', category: 'maldicao' },
    { id: 'sangralisia', name: 'Sangralisia', description: 'Com Sangramento ativo, teste 1d4 >= 2 ou incapaz de se movimentar.', category: 'maldicao' },
    { id: 'nadador', name: 'Nadador', description: 'Perde a capacidade de nadar.', category: 'maldicao' },
    { id: 'restricao', name: 'Restrição', description: 'Dado de prejuízo em qualquer uso de habilidade.', category: 'maldicao' },
  ],
  efeitosUnicos: [
    { id: 'envelhecer', name: 'Envelhecer', description: 'Efeito único de envelhecimento.', category: 'efeito_unico' },
    { id: 'rejuvelhecer', name: 'Rejuvelhecer', description: 'Efeito único de rejuvenescimento.', category: 'efeito_unico' },
  ],
}

export default BASE_EFFECTS
