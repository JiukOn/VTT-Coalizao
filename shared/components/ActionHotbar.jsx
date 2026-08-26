/* ActionHotbar.jsx — 9-Slot Draggable HUD Action Hotbar (Keys 1-9) for Coalizão RPG */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Swords, Crosshair, Zap, Shield, Eye, MessageCircle, Flame, Skull, Dices, Edit3, GripVertical } from 'lucide-react'
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
  const [hoveredSlot, setHoveredSlot] = useState(null)

  // Dragging state
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('vtt_hotbar_pos')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 })
  const containerRef = useRef(null)

  const triggerSlot = useCallback((slot) => {
    if (!slot || !slot.command) return
    sfx.init()
    sfx.play('dice_roll')
    const resolved = resolveMacroCommand(slot.command, entity)
    onExecuteCommand?.(resolved)
  }, [entity, onExecuteCommand])

  // Reset position event listener
  useEffect(() => {
    const handleReset = () => {
      setPosition(null)
      localStorage.removeItem('vtt_hotbar_pos')
    }
    window.addEventListener('vtt:reset_hotbar_pos', handleReset)
    return () => window.removeEventListener('vtt:reset_hotbar_pos', handleReset)
  }, [])

  // Persist position
  useEffect(() => {
    if (position) {
      try {
        localStorage.setItem('vtt_hotbar_pos', JSON.stringify(position))
      } catch { /* ignore */ }
    }
  }, [position])

  // Keyboard shortcut listener 1-9
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in text inputs or editable elements
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) {
        return
      }
      // Ignore if any modal is active on screen
      if (document.querySelector('.modal-backdrop, [role="dialog"], .dialog-overlay')) {
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

  // Pointer drag handlers
  const handlePointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch { /* ignore */ }

    const rect = containerRef.current?.getBoundingClientRect()
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect ? rect.left : (window.innerWidth / 2 - 190),
      initialTop: rect ? rect.top : (window.innerHeight - 100),
    }
    setIsDragging(true)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    const newX = Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.initialLeft + dx))
    const newY = Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.initialTop + dy))
    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch { /* ignore */ }
    }
  }

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
    <div
      ref={containerRef}
      style={{
        position: position ? 'fixed' : 'relative',
        left: position ? position.x : undefined,
        top: position ? position.y : undefined,
        zIndex: position ? 9999 : 40,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(12, 12, 20, 0.92)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '4px 6px',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.2)',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Arrastar barra de atalhos para qualquer posição da tela"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 2px',
          color: isDragging ? 'var(--accent-primary)' : 'var(--text-muted)',
          transition: 'color 0.15s ease',
        }}
      >
        <GripVertical size={15} />
      </div>

      {slots.map(slot => {
        const IconComponent = ICON_MAP[slot.icon] || Swords
        const isHovered = hoveredSlot === slot.id

        return (
          <div
            key={slot.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredSlot(slot.id)}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            <button
              onClick={() => triggerSlot(slot)}
              onContextMenu={(e) => {
                e.preventDefault()
                openEditor(slot)
              }}
              className="btn btn-icon"
              style={{
                width: 36,
                height: 36,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-tertiary)',
                border: `1px solid ${isHovered ? slot.color || 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                color: slot.color || 'var(--text-primary)',
                boxShadow: isHovered ? `0 0 10px ${slot.color || 'var(--accent-primary)'}55` : 'none',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <IconComponent size={16} />
              
              {/* Shortcut Key Badge */}
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 3,
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  lineHeight: 1,
                }}
              >
                {slot.id}
              </span>
            </button>

            {/* Rich LitRPG Tooltip on Hover */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(10, 10, 16, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  whiteSpace: 'nowrap',
                  zIndex: 10000,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  pointerEvents: 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  [{slot.id}] {slot.label}
                </div>
                {slot.command && (
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: 2 }}>
                    {slot.command}
                  </div>
                )}
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Clique esquerdo: Usar · Direito: Editar
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setEditingSlot(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
              width: 320,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={15} color="var(--accent-primary)" /> Configurar Macro [Slot {editingSlot.id}]
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Nome / Rótulo da Ação:
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                  placeholder="Ex: Ataque Espada, /r 1d20+frc"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Comando / Fórmula Canônica:
                </label>
                <input
                  type="text"
                  value={editCommand}
                  onChange={e => setEditCommand(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
                  placeholder="Ex: /r 1d20+frc ou 1d4+2"
                />
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Tags dinâmicas suportadas: <code>+frc</code>, <code>+dex</code>, <code>+vit</code>, <code>+int</code>, <code>+crm</code>, <code>+res</code>, <code>+pre</code>, <code>+enr</code>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Cor do Ícone:
                </label>
                <input
                  type="color"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  style={{ width: '100%', height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingSlot(null)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={saveSlotEdit}
                  style={{ flex: 1 }}
                >
                  Salvar Macro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
