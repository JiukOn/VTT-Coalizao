const glob = import.meta.glob('./*.json', { eager: true });
export const CLASS_DATA = Object.values(glob).map(m => m.default || m);
export default CLASS_DATA;
