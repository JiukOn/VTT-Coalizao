import { useState } from 'react'
import { Scroll, Eye, Plus, Trash2, X, Send, Sparkles, Image as ImageIcon } from 'lucide-react'
import { compressToWebP } from '@shared/utils/imageCompressor.js'
import { generateUUID } from '@shared/utils/uuid.js'

const HANDOUT_TYPES = [
  { id: 'letter',   name: '📜 Carta / Pergaminho', bg: '#2C2018', border: '#8B5A2B', font: 'serif' },
  { id: 'doc',      name: '📄 Documento Oficial',  bg: '#1E293B', border: '#475569', font: 'sans-serif' },
  { id: 'clue',     name: '🔍 Pista Misteriosa',    bg: '#18181B', border: '#7C3AED', font: 'monospace' },
  { id: 'artifact', name: '✨ Ilustração de Item',  bg: '#0F172A', border: '#38BDF8', font: 'sans-serif' },
]

export default function HandoutModal({ isOpen, onClose, handouts = [], onSaveHandouts, onRevealToPlayers }) {
  const [selectedId, setSelectedId] = useState(handouts[0]?.id || null)
  const [editing, setEditing] = useState(null)
  const [revealedSuccess, setRevealedSuccess] = useState(false)

  if (!isOpen) return null

  const current = editing || handouts.find(h => h.id === selectedId) || null

  const handleCreate = () => {
    const newHandout = {
      id: generateUUID(),
      title: 'Novo Documento',
      type: 'letter',
      author: 'Desconhecido',
      content: 'Escreva aqui o conteúdo da carta, pista ou relatório...',
      image: null,
    }
    const updated = [...handouts, newHandout]
    onSaveHandouts(updated)
    setSelectedId(newHandout.id)
    setEditing(newHandout)
  }

  const handleDelete = (id) => {
    const updated = handouts.filter(h => h.id !== id)
    onSaveHandouts(updated)
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || null)
      setEditing(null)
    }
  }

  const handleSaveEdit = () => {
    if (!editing) return
    const updated = handouts.map(h => h.id === editing.id ? editing : h)
    onSaveHandouts(updated)
    setEditing(null)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const compressed = await compressToWebP(reader.result, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 })
        setEditing(prev => ({ ...prev, image: compressed }))
      } catch (err) {
        console.error('[Handout] Failed to compress image:', err)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleReveal = () => {
    if (!current) return
    if (onRevealToPlayers) {
      onRevealToPlayers(current)
      setRevealedSuccess(true)
      setTimeout(() => setRevealedSuccess(false), 2500)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        width: '94%',
        maxWidth: 880,
        height: '82vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scroll size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Documentos, Cartas & Pistas (Handouts)</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar List */}
          <div style={{
            width: 260,
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lista de Documentos</span>
              <button className="btn btn-sm btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '2px 8px' }}>
                <Plus size={12} /> Novo
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {handouts.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum documento criado.</span>
              ) : (
                handouts.map(h => {
                  const isSel = h.id === selectedId
                  return (
                    <div
                      key={h.id}
                      onClick={() => { setSelectedId(h.id); setEditing(null) }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: isSel ? 'var(--accent-subtle)' : 'transparent',
                        border: isSel ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: isSel ? 700 : 500, color: isSel ? 'var(--accent-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {h.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {h.author || 'Sem autor'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(h.id) }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Main Viewer / Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' }}>
            {current ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                {/* Actions bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!editing ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ ...current })}>
                        Editar
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                          Salvar Alterações
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleReveal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: revealedSuccess ? '#10B981' : undefined,
                      borderColor: revealedSuccess ? '#10B981' : undefined,
                    }}
                  >
                    <Send size={13} />
                    {revealedSuccess ? '✓ Revelado aos Jogadores!' : 'Revelar aos Jogadores'}
                  </button>
                </div>

                {/* Edit Form or Preview */}
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        className="input"
                        value={editing.title}
                        onChange={e => setEditing({ ...editing, title: e.target.value })}
                        placeholder="Título do Documento"
                      />
                      <input
                        type="text"
                        className="input"
                        value={editing.author || ''}
                        onChange={e => setEditing({ ...editing, author: e.target.value })}
                        placeholder="Autor / Origem"
                      />
                      <select
                        className="input"
                        value={editing.type || 'letter'}
                        onChange={e => setEditing({ ...editing, type: e.target.value })}
                      >
                        {HANDOUT_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      className="input"
                      rows={8}
                      value={editing.content}
                      onChange={e => setEditing({ ...editing, content: e.target.value })}
                      placeholder="Conteúdo textual..."
                      style={{ resize: 'vertical' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ImageIcon size={14} /> Anexar Imagem / Ilustração
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                      </label>
                      {editing.image && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...editing, image: null })} style={{ color: '#EF4444' }}>
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Stylized Cinematic Preview */
                  <div style={{
                    flex: 1,
                    background: current.type === 'letter' ? '#271D15' : current.type === 'clue' ? '#18181B' : '#1E293B',
                    border: `2px solid ${current.type === 'letter' ? '#8B5A2B' : current.type === 'clue' ? '#7C3AED' : '#475569'}`,
                    borderRadius: 10,
                    padding: 24,
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    overflowY: 'auto',
                  }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontFamily: current.type === 'letter' ? 'serif' : 'var(--font-heading)',
                        color: current.type === 'letter' ? '#EED9B3' : '#FFF',
                      }}>
                        {current.title}
                      </h2>
                      {current.author && (
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
                          Por: {current.author}
                        </span>
                      )}
                    </div>

                    {current.image && (
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <img
                          src={current.image}
                          alt={current.title}
                          style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                      </div>
                    )}

                    <div style={{
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      fontFamily: current.type === 'letter' ? 'serif' : current.type === 'clue' ? 'monospace' : 'var(--font-body)',
                      color: current.type === 'letter' ? '#D6C7AA' : 'var(--text-secondary)',
                    }}>
                      {current.content}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Selecione ou crie um documento para visualizar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
