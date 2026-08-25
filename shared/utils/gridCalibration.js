/**
 * gridCalibration.js — Physical Grid Calibration for Tabletop TV Displays
 *
 * Converts physical target dimensions (e.g. 25.4mm for 1-inch mini bases)
 * into Canvas scale factors based on display PPI.
 */

export const STANDARD_MINI_SIZE_MM = 25.4 // 1 inch standard base
export const DEFAULT_SCREEN_PPI = 96      // Standard desktop monitor reference

/**
 * Calculates the exact Canvas scale needed so that 1 grid square measures `targetMm` on a display with `ppi`.
 * @param {number} targetSquareMm - Desired physical square size in millimeters (default: 25.4)
 * @param {number} mapGridSizePx - Digital grid square size in pixels (e.g. 50px)
 * @param {number} screenPpi - Pixels per inch of the physical TV/monitor (default: 96)
 * @returns {number} Scale multiplier for the Canvas viewport
 */
export function calculatePhysicalGridScale(
  targetSquareMm = STANDARD_MINI_SIZE_MM,
  mapGridSizePx = 50,
  screenPpi = DEFAULT_SCREEN_PPI
) {
  if (mapGridSizePx <= 0 || screenPpi <= 0 || targetSquareMm <= 0) return 1

  // 1 inch = 25.4 mm
  const targetPixels = (targetSquareMm / 25.4) * screenPpi
  const scale = targetPixels / mapGridSizePx

  return Number(Math.max(0.1, Math.min(5.0, scale)).toFixed(3))
}

/**
 * Calculates the estimated PPI based on a known physical reference width measured in millimeters.
 * (e.g., user measures a 100px bar on their TV screen with a physical ruler to be 26.5mm)
 * @param {number} testBarPx - Width of the test bar on screen in pixels
 * @param {number} measuredMm - Measured physical length in millimeters
 * @returns {number} Calculated PPI
 */
export function calculatePpiFromMeasurement(testBarPx = 200, measuredMm = 52.9) {
  if (measuredMm <= 0) return DEFAULT_SCREEN_PPI
  const inches = measuredMm / 25.4
  return Number((testBarPx / inches).toFixed(1))
}
