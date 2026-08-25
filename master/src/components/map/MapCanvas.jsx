/**
 * MapCanvas.jsx — Map canvas integration component
 *
 * NOTE: The full tactical map implementation is in src/pages/MapPage.jsx
 * (HTML5 Canvas, grid, tokens, fog of war, walls, vision, pan/zoom, tools).
 * This component exists as an integration point for embedding map
 * views in alternate layouts without loading the full MapPage.
 */
import MapPage from '../../pages/MapPage.jsx'

export default function MapCanvas() {
  // Delegates to the full MapPage implementation
  return <MapPage />
}
