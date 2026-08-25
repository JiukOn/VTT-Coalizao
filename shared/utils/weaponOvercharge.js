/* weaponOvercharge.js — High-risk weapon overcharge and overheating mechanics for energy weapons */

/**
 * Resolves an overcharged attack roll
 * Overcharge adds extra damage (+1d6 plasma), but if d20 rolls <= 3, the weapon overheats.
 * @param {number} d20Roll The raw d20 result (1-20)
 * @param {number} [d6Roll] The raw d6 result for extra damage (1-6)
 * @returns {{ isOverheated: boolean, extraDamage: number, enrDamageToUser: number, message: string }}
 */
export function resolveOvercharge(d20Roll, d6Roll = null) {
  const extraDamage = d6Roll !== null ? d6Roll : Math.floor(Math.random() * 6) + 1
  const isOverheated = (d20Roll ?? 10) <= 3

  if (isOverheated) {
    return {
      isOverheated: true,
      extraDamage: 0,
      enrDamageToUser: 2,
      message: '💥 **SUPERAQUECIMENTO!** A bobina de plasma falhou (d20 <= 3): você sofreu 2 de dano de ENR e a arma precisa resfriar por 1 rodada!',
    }
  }

  return {
    isOverheated: false,
    extraDamage,
    enrDamageToUser: 0,
    message: `⚡ **Sobrecarga Estável!** (+${extraDamage} de dano de Plasma extra).`,
  }
}
