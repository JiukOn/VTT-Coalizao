/* ============================================================
   characterSelector.jsx — Character selection screen for players
   Shown after successful login, before entering the dashboard.
   The host sends the list of available characters for the player.
   ============================================================ */

import { useState } from 'react'

/**
 * CharacterSelector — lets the player pick their character.
 *
 * @param {Object}   props
 * @param {Array}    props.characters  - [{id, name, classId, level, avatar}]
 * @param {Function} props.onSelect    - called with the chosen character
 * @param {Function} props.onCancel    - called if player cancels (disconnects)
 */
export default function CharacterSelector({ characters = [], onSelect, onCancel }) {
  const [selected, setSelected] = useState(null)

  const handleConfirm = () => {
    if (selected) onSelect(selected)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'var(--bg-primary)', color: 'var(--text-primary)',
      padding: 24, gap: 24,
    }}>
      <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent-primary)', margin: 0 }}>
        Escolha seu personagem
      </h2>

      {characters.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Aguardando o Mestre disponibilizar personagens...
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 600 }}>
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => setSelected(char)}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: selected?.id === char.id
                  ? '2px solid var(--accent-primary)'
                  : '2px solid var(--border-subtle)',
                background: selected?.id === char.id
                  ? 'var(--accent-glow)'
                  : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                minWidth: 140,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{ fontWeight: 600 }}>{char.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Lv {char.level} · {char.classId}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Voltar
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selected}
        >
          Entrar como {selected?.name || '...'}
        </button>
      </div>
    </div>
  )
}
