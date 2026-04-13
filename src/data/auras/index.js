const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_AURAS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || '',
  effect: item.effectDetails?.['pt-br'] || item.effectDetails || ''
}));
export const AURA_RULES = {
  activationVoluntary: '1d4 XP (limite XP >= 0)',
  activationInvoluntary: 'Momentos de tensão (Mestre), teste 1d20 > 12',
  range: '6 + Nível do personagem (metros)',
  duration: '2 turnos',
};
export default BASE_AURAS;
