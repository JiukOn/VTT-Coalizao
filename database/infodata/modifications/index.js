const glob = import.meta.glob('./*.json', { eager: true });
export const BASE_MODIFICATIONS = Object.values(glob).map(m => m.default || m);
export default BASE_MODIFICATIONS;
