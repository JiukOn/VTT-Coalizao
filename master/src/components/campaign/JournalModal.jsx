/* JournalModal.jsx — Campaign chronicle journal and world lore timeline modal */
import { useState } from 'react'
import { BookOpen, Calendar, Plus, Trash2, Tag, X, FileText, Sparkles, Clock, Compass } from 'lucide-react'
import { createJournalEntry, createTimelineEvent } from '@shared/utils/journalUtils.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function JournalModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('journal') // 'journal' | 'timeline'

  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_campaign_journal') || '[]')
    } catch {
      return []
    }
  })

  const [timeline, setTimeline] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_campaign_timeline') || '[]')
    } catch {
      return [
        { id: 't1', title: 'O Grande Colapso', yearOrDate: 'Ano 0 P.C.', description: 'Queda das antigas megacorporações e contaminação em massa.', era: 'colapso', importance: 'alta' },
        { id: 't2', title: 'Fundação da Coalizão', yearOrDate: 'Ano 42 P.C.', description: 'Aliança dos três maiores assentamentos sobreviventes.', era: 'reconstrucao', importance: 'alta' },
      ]
    }
  })

  // Form states
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDate, setNewDate] = useState('')

  if (!isOpen) return null

  const handleAddJournalEntry = () => {
    if (!newTitle.trim()) return
    sfx.init()
    sfx.play('turn_alert')

    const entry = createJournalEntry({
      title: newTitle,
      content: newContent,
      inGameDate: newDate,
    })

    const updated = [entry, ...entries]
    setEntries(updated)
    try { localStorage.setItem('vtt_campaign_journal', JSON.stringify(updated)) } catch { /* ignore */ }

    setNewTitle('')
    setNewContent('')
    setNewDate('')
  }

  const handleDeleteJournalEntry = (id) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    try { localStorage.setItem('vtt_campaign_journal', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  const handleAddTimelineEvent = () => {
    if (!newTitle.trim()) return
    sfx.init()
    sfx.play('turn_alert')

    const event = createTimelineEvent({
      title: newTitle,
      description: newContent,
      yearOrDate: newDate || 'Ano 128 P.C.',
    })

    const updated = [...timeline, event]
    setTimeline(updated)
    try { localStorage.setItem('vtt_campaign_timeline', JSON.stringify(updated)) } catch { /* ignore */ }

    setNewTitle('')
    setNewContent('')
    setNewDate('')
  }

  const handleDeleteTimelineEvent = (id) => {
    const updated = timeline.filter(t => t.id !== id)
    setTimeline(updated)
    try { localStorage.setItem('vtt_campaign_timeline', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
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
        borderRadius: 14,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#A855F7',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Diário de Campanha & Linha do Tempo
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Crônicas, memórias e eventos históricos da Coalizão
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
          <button
            className={`btn btn-sm ${activeTab === 'journal' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('journal')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={14} /> Diário de Sessões ({entries.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('timeline')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Clock size={14} /> Linha do Tempo ({timeline.length})
          </button>
        </div>

        {/* Create Form */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <input
              type="text"
              className="input input-sm"
              placeholder={activeTab === 'journal' ? 'Título da Crônica / Sessão...' : 'Nome do Evento Histórico...'}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <input
              type="text"
              className="input input-sm"
              placeholder={activeTab === 'journal' ? 'Data no Jogo...' : 'Ano / Era...'}
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
            />
          </div>

          <textarea
            className="input input-sm"
            rows={2}
            placeholder={activeTab === 'journal' ? 'O que aconteceu nesta sessão? Resumo dos fatos...' : 'Descrição do impacto histórico...'}
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={activeTab === 'journal' ? handleAddJournalEntry : handleAddTimelineEvent}
              disabled={!newTitle.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Adicionar {activeTab === 'journal' ? 'Entrada' : 'Evento'}
            </button>
          </div>
        </div>

        {/* Content Lists */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {activeTab === 'journal' ? (
            entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhuma crônica registrada no diário ainda.
              </div>
            ) : (
              entries.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {entry.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        📅 {entry.inGameDate}
                      </span>
                      <button
                        onClick={() => handleDeleteJournalEntry(entry.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                    {entry.content}
                  </p>
                </div>
              ))
            )
          ) : (
            timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum evento registrado na linha do tempo.
              </div>
            ) : (
              timeline.map(event => (
                <div
                  key={event.id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderLeft: '3px solid #A855F7',
                    borderRadius: '0 8px 8px 0',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A855F7', fontFamily: 'var(--font-mono)' }}>
                        [{event.yearOrDate}]
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {event.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTimelineEvent(event.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {event.description}
                  </p>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}
