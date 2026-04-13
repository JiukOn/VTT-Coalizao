/* NPCsPage.jsx — NPC database page */
import { useState, useEffect, useMemo } from 'react'
import { Users, Plus } from 'lucide-react'
import { db } from '../services/database.js'
import EntityForm from '../components/entities/EntityForm.jsx'
import Modal from '../components/common/Modal.jsx'

const TYPE_COLORS = {
  Aliado:       'var(--color-success)',
  Neutro:       'var(--text-muted)',
  Hostil:       'var(--color-danger)',
  Comerciante:  'var(--color-warning)',
  Nobre:        '#C084FC',
  Guarda:       'var(--accent-primary)',
  Outro:        'var(--text-secondary)',
}

export default function NPCsPage({ onSelectEntity, onEntityContextMenu }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('Todas')
  const [npcs, setNpcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadNPCs = async () => {
    try {
      const data = await db.npcs.toArray()
      setNpcs(data)
    } catch (err) {
      console.error('Failed to load NPCs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNPCs() }, [])

  const locations = useMemo(() => {
    const locs = Array.from(new Set(npcs.map(npc => npc.location).filter(Boolean)))
    return ['Todas', ...locs.sort()]
  }, [npcs])

  const filteredNPCs = useMemo(() => {
    return npcs.filter(npc => {
      const matchSearch = (npc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (npc.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchLoc = selectedLocation === 'Todas' || npc.location === selectedLocation
      return matchSearch && matchLoc
    })
  }, [npcs, searchTerm, selectedLocation])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Users size={24} /> NPCs</h2>
          <p className="page-subtitle">Personagens do mundo de Coalizão. ({filteredNPCs.length}/{npcs.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Novo NPC
        </button>
      </div>

      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            placeholder="Buscar NPC..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
        <select
          className="input select"
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">Carregando...</p></div>
      ) : (
        <div className="entity-grid">
          {filteredNPCs.map(npc => (
            <div
              key={npc.id}
              className="entity-card"
              onClick={() => onSelectEntity?.({ ...npc, entityType: 'npc' })}
              onContextMenu={e => onEntityContextMenu?.(e, { ...npc, entityType: 'npc' })}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {npc.name}
                </h3>
                {npc.type && (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px',
                    borderRadius: 4, border: `1px solid ${TYPE_COLORS[npc.type] || 'var(--border-subtle)'}`,
                    color: TYPE_COLORS[npc.type] || 'var(--text-secondary)', flexShrink: 0,
                  }}>
                    {npc.type}
                  </span>
                )}
              </div>

              {npc.location && (
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: 6 }}>
                  📍 {npc.location}
                </p>
              )}

              {(npc.description || npc.role) && (
                <p style={{
                  fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {npc.description || npc.role}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredNPCs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} /></div>
          <p className="empty-state-text">Nenhum NPC encontrado.</p>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Novo NPC">
        <EntityForm
          entityType="npc"
          onSave={() => { setShowForm(false); loadNPCs() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
