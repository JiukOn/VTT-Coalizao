import { useState, useEffect } from 'react'
import { Terminal, Plus, Trash2, X, Play } from 'lucide-react'
import { generateUUID } from '@shared/utils/uuid.js'

const DEFAULT_MACROS = [
  { id: 'm1', label: 'Percepção', command: '/r 1d20+int [Teste de Percepção]', color: '#38BDF8' },
  { id: 'm2', label: 'Furtividade', command: '/r 1d20+dex [Teste de Furtividade]', color: '#A855F7' },
  { id: 'm3', label: 'Atletismo', command: '/r 1d20+frc [Teste de Atletismo]', color: '#F59E0B' },
]

export default function QuickMacrosBar({ onExecuteCommand }) {
  const [macros, setMacros] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_player_macros') || JSON.stringify(DEFAULT_MACROS))
    } catch {
      return DEFAULT_MACROS
    }
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editCommand, setEditCommand] = useState('')
  const [editColor, setEditColor] = useState('#38BDF8')

  useEffect(() => {
    try {
      localStorage.setItem('vtt_player_macros', JSON.stringify(macros))
    } catch { /* ignore */ }
  }, [macros])

  const handleAddMacro = (e) => {
    e.preventDefault()
    if (!editLabel.trim() || !editCommand.trim()) return
    const newMacro = {
      id: generateUUID(),
      label: editLabel.trim(),
      command: editCommand.trim(),
      color: editColor,
    }
    setMacros(prev => [...prev, newMacro])
    setEditLabel('')
    setEditCommand('')
    setIsEditing(false)
  }

  const handleDeleteMacro = (id) => {
    setMacros(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '4px 8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, paddingRight: 4, borderRight: '1px solid var(--border-subtle)' }}>
        <Terminal size={12} />
        <span>Macros</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {macros.map(macro => (
          <button
            key={macro.id}
            onClick={() => onExecuteCommand?.(macro.command)}
            style={{
              background: `${macro.color}15`,
              border: `1px solid ${macro.color}55`,
              color: 'var(--text-primary)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'transform 0.1s ease',
            }}
            title={macro.command}
          >
            <Play size={10} style={{ color: macro.color }} />
            <span>{macro.label}</span>
          </button>
        ))}

        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: 'none',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
          title="Adicionar ou gerenciar macros"
        >
          <Plus size={11} /> Nova
        </button>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '16px 20px',
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Gerenciar Macros Rápidas</h4>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* List existing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {macros.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: m.color }}>{m.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.command}</span>
                  </div>
                  <button onClick={() => handleDeleteMacro(m.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Create new */}
            <form onSubmit={handleAddMacro} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nova Macro:</span>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
                <input
                  type="text"
                  className="input"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  placeholder="Nome do botão (ex: Furtividade)"
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  style={{ width: '100%', height: 34, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
                />
              </div>

              <input
                type="text"
                className="input"
                value={editCommand}
                onChange={e => setEditCommand(e.target.value)}
                placeholder="Comando (ex: /r 1d20+3 [Ataque])"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                  Fechar
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={!editLabel.trim() || !editCommand.trim()}>
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
