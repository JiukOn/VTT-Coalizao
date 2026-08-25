/* PhysicalTVModal.jsx — Tabletop Physical TV Calibration & Settings */
import { useState } from 'react'
import { Tv, Sliders, Check, Maximize2, ShieldCheck, EyeOff } from 'lucide-react'
import {
  calculatePhysicalGridScale,
  calculatePpiFromMeasurement,
  STANDARD_MINI_SIZE_MM,
  DEFAULT_SCREEN_PPI,
} from '@shared/utils/gridCalibration.js'

export default function PhysicalTVModal({
  isOpen,
  onClose,
  gridSizePx = 50,
  onApplyTVMode,
  hidePlayerTokens = false,
  onToggleHidePlayerTokens = null,
}) {
  const [measuredMm, setMeasuredMm] = useState(53) // Reference 200px bar length
  const [miniSizeMm, setMiniSizeMm] = useState(STANDARD_MINI_SIZE_MM)
  const [usePpiDirect, setUsePpiDirect] = useState(false)
  const [customPpi, setCustomPpi] = useState(DEFAULT_SCREEN_PPI)

  if (!isOpen) return null

  const currentPpi = usePpiDirect ? customPpi : calculatePpiFromMeasurement(200, measuredMm)
  const calculatedScale = calculatePhysicalGridScale(miniSizeMm, gridSizePx, currentPpi)

  const handleStartTVMode = () => {
    onApplyTVMode({
      scale: calculatedScale,
      hidePlayerTokens,
      ppi: currentPpi,
    })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 350,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 24, width: 540, maxWidth: '94vw',
          display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--accent-primary-subtle, rgba(155, 89, 232, 0.15))',
              padding: 8, borderRadius: 8, color: 'var(--accent-primary)',
            }}>
              <Tv size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Modo TV & Grade Física (Mesa Presencial)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Calibre o grid digital para bater 1:1 com miniaturas físicas de plástico/metal
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>&times;</button>
        </div>

        {/* Ruler Calibration Section */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              📏 Régua Virtual de Calibração (200px)
            </span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setUsePpiDirect(!usePpiDirect)}
              style={{ fontSize: '0.72rem' }}
            >
              <Sliders size={11} /> {usePpiDirect ? 'Usar Régua' : 'Digitar PPI Direto'}
            </button>
          </div>

          {!usePpiDirect ? (
            <>
              {/* Visual 200px Calibration Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <div style={{
                  width: 200, height: 16, background: 'linear-gradient(90deg, #9B59E8 0%, #3B82F6 100%)',
                  borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  BARRA DE 200 PIXELS
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Coloque uma régua física na tela da sua TV e meça a barra colorida acima em milímetros (mm).
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                  Comprimento Medido na TV:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    value={measuredMm}
                    onChange={e => setMeasuredMm(parseFloat(e.target.value) || 53)}
                    style={{ width: 70, height: 28, textAlign: 'center', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>mm</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                PPI da Tela / TV:
              </label>
              <input
                type="number"
                className="input"
                value={customPpi}
                onChange={e => setCustomPpi(parseFloat(e.target.value) || 96)}
                style={{ width: 80, height: 28, textAlign: 'center', fontSize: '0.82rem' }}
              />
            </div>
          )}

          {/* Miniature base size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
              Tamanho da Base da Miniatura:
            </label>
            <select
              className="input"
              value={miniSizeMm}
              onChange={e => setMiniSizeMm(parseFloat(e.target.value))}
              style={{ width: 140, height: 28, fontSize: '0.78rem' }}
            >
              <option value="25.4">Padrão: 25.4mm (1")</option>
              <option value="28">28mm (Heróico)</option>
              <option value="30">30mm</option>
              <option value="50.8">50.8mm (Grande / 2")</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={hidePlayerTokens}
              onChange={e => onToggleHidePlayerTokens?.(e.target.checked)}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
              Ocultar tokens virtuais dos jogadores (para colocar miniaturas físicas em cima)
            </span>
          </label>
        </div>

        {/* Scale summary box */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: '0.82rem', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>Escala Calculada: <strong>{calculatedScale}x</strong> ({Math.round(currentPpi)} PPI)</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1q digital = {miniSizeMm}mm real</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleStartTVMode}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Maximize2 size={13} /> Ativar Modo TV
          </button>
        </div>
      </div>
    </div>
  )
}
