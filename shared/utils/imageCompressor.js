/**
 * imageCompressor.js — Client-side image compression to WebP
 *
 * Compresses images before storing in IndexedDB to reduce storage usage.
 * Uses OffscreenCanvas where available, falls back to regular Canvas.
 */

/**
 * Compresses an image source to WebP format
 * @param {string|Blob} source - Image source (data URL string or Blob)
 * @param {object} options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 3000)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 3000)
 * @param {number} options.quality - WebP quality 0-1 (default: 0.75)
 * @returns {Promise<string>} WebP data URL
 */
export async function compressToWebP(source, { maxWidth = 3000, maxHeight = 3000, quality = 0.75 } = {}) {
  const img = await loadImage(source)

  // Calculate scaled dimensions maintaining aspect ratio
  let { width, height } = img
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // Draw to canvas and export as WebP
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  // Try WebP first, fall back to JPEG if not supported
  const webpUrl = canvas.toDataURL('image/webp', quality)
  if (webpUrl.startsWith('data:image/webp')) {
    return webpUrl
  }
  // Fallback: some browsers don't support WebP canvas export
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Compresses an image to WebP and returns as Blob
 * @param {string|Blob} source
 * @param {object} options - Same as compressToWebP
 * @returns {Promise<Blob>}
 */
export async function compressToWebPBlob(source, options = {}) {
  const dataUrl = await compressToWebP(source, options)
  return dataUrlToBlob(dataUrl)
}

/**
 * Estimates compression ratio by comparing original and compressed sizes
 * @param {string} originalDataUrl
 * @param {string} compressedDataUrl
 * @returns {{ originalKB: number, compressedKB: number, ratio: number, savings: string }}
 */
export function getCompressionStats(originalDataUrl, compressedDataUrl) {
  const originalKB = Math.round((originalDataUrl.length * 3) / 4 / 1024)
  const compressedKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024)
  const ratio = originalKB > 0 ? (1 - compressedKB / originalKB) : 0
  return {
    originalKB,
    compressedKB,
    ratio,
    savings: `${Math.round(ratio * 100)}%`,
  }
}

// ── Helpers ──

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    if (source instanceof Blob) {
      const reader = new FileReader()
      reader.onload = () => { img.src = reader.result }
      reader.onerror = () => reject(new Error('Failed to read Blob'))
      reader.readAsDataURL(source)
    } else {
      img.src = source
    }
  })
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/webp'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
