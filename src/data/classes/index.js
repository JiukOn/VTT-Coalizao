const glob = import.meta.glob('./*.json', { eager: true });
export const CLASS_DATA = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || '',
  legacyAbilityName: item.legacyAbilityName?.['pt-br'] || item.legacyAbilityName || ''
}));
export default CLASS_DATA;
