const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_AURAS = Object.values(glob).map(m => m.default || m);
export const AURA_RULES = {
  activationVoluntary: '1d4 XP (limite XP >= 0)',
  activationInvoluntary: 'Momentos de tensão (Mestre), teste 1d20 > 12',
  range: '6 + Nível do personagem (metros)',
  duration: '2 turnos',
};
export default BASE_AURAS;
