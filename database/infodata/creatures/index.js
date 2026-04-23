const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_CREATURES = Object.values(glob).map(m => m.default || m);
export default BASE_CREATURES;
