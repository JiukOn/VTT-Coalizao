/* QuestLogModal.jsx — Master quest board manager and player synchronization */
import { useState } from 'react'
import { Target, CheckCircle2, Circle, Plus, Trash2, X, Award, Coins } from 'lucide-react'

export default function QuestLogModal({ isOpen, onClose, quests = [], onSaveQuests, onBroadcastQuests }) {
  const [selectedId, setSelectedId] = useState(quests[0]?.id || null)
  const [editing, setEditing] = useState(null)

  if (!isOpen) return null

  const current = editing || quests.find(q => q.id === selectedId) || null

  const handleCreate = () => {
    const newQuest = {
      id: crypto.randomUUID(),
      title: 'Nova Missão',
      description: 'Descrição dos objetivos desta missão...',
      status: 'active', // 'active' | 'completed' | 'failed'
      rewardXp: 100,
      rewardGold: 50,
      objectives: [
        { id: crypto.randomUUID(), text: 'Primeiro objetivo', completed: false },
      ],
    }
    const updated = [...quests, newQuest]
    onSaveQuests(updated)
    if (onBroadcastQuests) onBroadcastQuests(updated)
    setSelectedId(newQuest.id)
    setEditing(newQuest)
  }

  const handleDelete = (id) => {
    const updated = quests.filter(q => q.id !== id)
    onSaveQuests(updated)
    if (onBroadcastQuests) onBroadcastQuests(updated)
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || null)
      setEditing(null)
    }
  }

  const handleSaveEdit = () => {
    if (!editing) return
    const updated = quests.map(q => q.id === editing.id ? editing : q)
    onSaveQuests(updated)
    if (onBroadcastQuests) onBroadcastQuests(updated)
    setEditing(null)
  }

  const handleToggleObjective = (questId, objId) => {
    const updated = quests.map(q => {
      if (q.id !== questId) return q
      const objs = (q.objectives || []).map(o => o.id === objId ? { ...o, completed: !o.completed } : o)
      const allDone = objs.length > 0 && objs.every(o => o.completed)
      return { ...q, objectives: objs, status: allDone ? 'completed' : q.status }
    })
    onSaveQuests(updated)
    if (onBroadcastQuests) onBroadcastQuests(updated)
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
        maxWidth: 840,
        height: '80vh',
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
            <Target size={20} style={{ color: '#F59E0B' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Quadro de Missões & Objetivos da Campanha</h3>
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Missões Ativas</span>
              <button className="btn btn-sm btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '2px 8px' }}>
                <Plus size={12} /> Nova
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {quests.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhuma missão registrada.</span>
              ) : (
                quests.map(q => {
                  const isSel = q.id === selectedId
                  const isDone = q.status === 'completed'
                  return (
                    <div
                      key={q.id}
                      onClick={() => { setSelectedId(q.id); setEditing(null) }}
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
                        <span style={{ fontSize: '0.82rem', fontWeight: isSel ? 700 : 500, color: isDone ? '#10B981' : isSel ? 'var(--accent-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {isDone ? '✓ ' : ''}{q.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {q.objectives?.filter(o => o.completed).length || 0}/{q.objectives?.length || 0} objetivos
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id) }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!editing ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ ...current })}>
                        Editar Missão
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600 }}>
                      <Award size={14} /> {current.rewardXp || 0} XP
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FBBF24', fontSize: '0.8rem', fontWeight: 600 }}>
                      <Coins size={14} /> {current.rewardGold || 0} $
                    </span>
                  </div>
                </div>

                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        className="input"
                        value={editing.title}
                        onChange={e => setEditing({ ...editing, title: e.target.value })}
                        placeholder="Título da Missão"
                      />
                      <input
                        type="number"
                        className="input"
                        value={editing.rewardXp || 0}
                        onChange={e => setEditing({ ...editing, rewardXp: parseInt(e.target.value) || 0 })}
                        placeholder="Recompensa XP"
                      />
                      <input
                        type="number"
                        className="input"
                        value={editing.rewardGold || 0}
                        onChange={e => setEditing({ ...editing, rewardGold: parseInt(e.target.value) || 0 })}
                        placeholder="Recompensa Moedas"
                      />
                    </div>

                    <textarea
                      className="input"
                      rows={4}
                      value={editing.description || ''}
                      onChange={e => setEditing({ ...editing, description: e.target.value })}
                      placeholder="Descrição detalhada..."
                    />

                    {/* Objective Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Objetivos</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditing({
                            ...editing,
                            objectives: [...(editing.objectives || []), { id: crypto.randomUUID(), text: '', completed: false }],
                          })}
                        >
                          <Plus size={12} /> Adicionar Objetivo
                        </button>
                      </div>

                      {(editing.objectives || []).map((obj, i) => (
                        <div key={obj.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="text"
                            className="input"
                            style={{ flex: 1 }}
                            value={obj.text}
                            onChange={e => {
                              const nextObjs = [...editing.objectives]
                              nextObjs[i] = { ...nextObjs[i], text: e.target.value }
                              setEditing({ ...editing, objectives: nextObjs })
                            }}
                            placeholder={`Objetivo #${i + 1}`}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const nextObjs = editing.objectives.filter((_, idx) => idx !== i)
                              setEditing({ ...editing, objectives: nextObjs })
                            }}
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Viewer */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem' }}>{current.title}</h2>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {current.description || 'Sem descrição.'}
                      </p>
                    </div>

                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Lista de Objetivos</span>
                      {(current.objectives || []).map(obj => (
                        <div
                          key={obj.id}
                          onClick={() => handleToggleObjective(current.id, obj.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            padding: '4px 0',
                          }}
                        >
                          {obj.completed ? (
                            <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                          ) : (
                            <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: '0.88rem',
                            color: obj.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: obj.completed ? 'line-through' : 'none',
                          }}>
                            {obj.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Selecione ou crie uma missão para visualizar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
