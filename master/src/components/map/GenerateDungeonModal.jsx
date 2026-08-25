/* GenerateDungeonModal.jsx — Procedural Dungeon Generation Modal */
import { useState } from 'react'
import { Castle, Sparkles, Loader2 } from 'lucide-react'

export default function GenerateDungeonModal({ onGenerate, onClose }) {
  const [name, setName] = useState('Masmorra Subterrânea da Coalizão')
  const [minRooms, setMinRooms] = useState(5)
  const [maxRooms, setMaxRooms] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/engine/map/generate-dungeon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dungeon_name: name,
          width: 3000,
          height: 3000,
          grid_size: 50,
          min_rooms: minRooms,
          max_rooms: maxRooms,
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao conectar com o Python Intelligence Engine. Certifique-se de que "npm run engine" está em execução.')
      }

      const data = await res.json()
      onGenerate(data)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao gerar masmorra procedural.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw',
          display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'var(--accent-primary-subtle, rgba(155, 89, 232, 0.15))',
            padding: 8, borderRadius: 8, color: 'var(--accent-primary)',
          }}>
            <Castle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Gerador Procedural de Masmorras
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Geração de salas, corredores e paredes de Linha de Visão via Python
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem',
            background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid #EF4444',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Nome da Masmorra
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Salas Mínimas: {minRooms}
              </label>
              <input
                type="range"
                min={3}
                max={8}
                value={minRooms}
                onChange={e => setMinRooms(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Salas Máximas: {maxRooms}
              </label>
              <input
                type="range"
                min={minRooms}
                max={14}
                value={maxRooms}
                onChange={e => setMaxRooms(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{
            padding: '10px 14px', borderRadius: 8, background: 'var(--bg-tertiary)',
            fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div>✨ <strong>O que será gerado automaticamente:</strong></div>
            <div>• Perímetros de paredes (LoS) e portas interativas</div>
            <div>• Tochas dinâmicas com raio de iluminação</div>
            <div>• Ponto de spawn para os heróis e monstros</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerate}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {loading ? 'Gerando...' : 'Gerar Masmorra LoS'}
          </button>
        </div>
      </div>
    </div>
  )
}
