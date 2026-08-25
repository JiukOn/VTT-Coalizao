/* ActionHotbar.jsx — 9-Slot Action Hotbar (Keys 1-9) for Coalizão RPG */
import { useState, useEffect, useCallback } from 'react'
import { Swords, Crosshair, Zap, Shield, Eye, MessageCircle, Flame, Skull, Dices, Edit3 } from 'lucide-react'
import { loadHotbar, saveHotbar, resolveMacroCommand } from '@shared/utils/actionHotbar.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

const ICON_MAP = {
  swords: Swords,
  crosshair: Crosshair,
  zap: Zap,
  shield: Shield,
  eye: Eye,
  'message-circle': MessageCircle,
  flame: Flame,
  skull: Skull,
  dices: Dices,
}

export default function ActionHotbar({ entity = null, onExecuteCommand }) {
  const [slots, setSlots] = useState(() => loadHotbar())
  const [editingSlot, setEditingSlot] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editCommand, setEditCommand] = useState('')
  const [editColor, setEditColor] = useState('#3B82F6')

  const triggerSlot = useCallback((slot) => {
    if (!slot || !slot.command) return
    sfx.init()
    sfx.play('dice_roll')
    const resolved = resolveMacroCommand(slot.command, entity)
    onExecuteCommand?.(resolved)
  }, [entity, onExecuteCommand])

  // Keyboard shortcut listener 1-9
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        return
      }
      const keyNum = parseInt(e.key, 10)
      if (keyNum >= 1 && keyNum <= 9) {
        e.preventDefault()
        const slot = slots.find(s => s.id === keyNum)
        if (slot) triggerSlot(slot)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slots, triggerSlot])

  const openEditor = (slot) => {
    setEditingSlot(slot)
    setEditLabel(slot.label)
    setEditCommand(slot.command)
    setEditColor(slot.color || '#3B82F6')
  }

  const saveSlotEdit = () => {
    if (!editingSlot) return
    const updated = slots.map(s => s.id === editingSlot.id ? {
      ...s,
      label: editLabel.trim() || `Slot ${s.id}`,
      command: editCommand.trim(),
      color: editColor,
    } : s)
    setSlots(updated)
    saveHotbar(updated)
    setEditingSlot(null)
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'rgba(18, 18, 26, 0.85)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '4px 6px',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
    }}>
      {slots.map((slot) => {
        const IconComponent = ICON_MAP[slot.icon] || Dices
        return (
          <button
            key={slot.id}
            onClick={() => triggerSlot(slot)}
            onContextMenu={(e) => {
              e.preventDefault()
              openEditor(slot)
            }}
            title={`[${slot.key}] ${slot.label}: ${slot.command} (Clique direito para editar)`}
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${slot.color || 'var(--border-subtle)'}66`,
              backgroundColor: `${slot.color || '#3B82F6'}18`,
              color: slot.color || 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              padding: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 2,
              left: 4,
              fontSize: '0.62rem',
              fontWeight: 800,
              opacity: 0.6,
              color: 'var(--text-muted)',
            }}>
              {slot.key}
            </span>
            <IconComponent size={16} style={{ marginTop: 4 }} />
          </button>
        )
      })}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999,
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Edit3 size={18} style={{ color: 'var(--accent-primary)' }} />
              Editar Atalho [{editingSlot.key}]
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Rótulo do Botão:
              </label>
              <input
                type="text"
                className="input"
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Comando / Macro (use +frc, +dex, +int, +vit, +res, +pre, +crm, +enr):
              </label>
              <input
                type="text"
                className="input"
                value={editCommand}
                onChange={e => setEditCommand(e.target.value)}
                placeholder="/r 1d20+frc [Ataque]"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Cor do Slot:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316', '#6B7280'].map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      backgroundColor: c, border: editColor === c ? '2px solid #FFFFFF' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button className="btn btn-ghost" onClick={() => setEditingSlot(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={saveSlotEdit}>
                Salvar Atalho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
