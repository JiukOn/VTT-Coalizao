const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_DOMAINS = Object.values(glob).map(m => m.default || m).map(item => ({
  ...item,
  name: item.name?.['pt-br'] || item.name || '',
  description: item.description?.['pt-br'] || item.description || ''
}));
export default BASE_DOMAINS;
