const glob = import.meta.glob('./*.json', { eager: true });
const RAW_EFFECTS = Object.values(glob).map(m => m.default || m);

export const BASE_EFFECTS = {
  psicologicosAtivos: RAW_EFFECTS.filter(e => e.category === 'psicologico_ativo'),
  psicologicosPassivos: RAW_EFFECTS.filter(e => e.category === 'psicologico_passivo'),
  doencas: RAW_EFFECTS.filter(e => e.category === 'doenca'),
  condicoes: RAW_EFFECTS.filter(e => e.category === 'condicao'),
  maldicoes: RAW_EFFECTS.filter(e => e.category === 'maldicao'),
  efeitosUnicos: RAW_EFFECTS.filter(e => e.category === 'efeito_unico'),
};
export const ALL_EFFECTS = RAW_EFFECTS;
export default BASE_EFFECTS;
