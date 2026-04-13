/* BestiaryPage.jsx — Creature/Monster database page */
import { useState, useEffect, useMemo } from 'react'
import { Skull, Plus } from 'lucide-react'
import { db } from '../services/database.js'
import CreatureCard from '../components/entities/CreatureCard.jsx'
import EntityForm from '../components/entities/EntityForm.jsx'
import Modal from '../components/common/Modal.jsx'

export default function BestiaryPage({ onSelectEntity, onEntityContextMenu }) {
  const [search, setSearch] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [creatures, setCreatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadCreatures = async () => {
    try {
      const data = await db.creatures.toArray()
      setCreatures(data)
    } catch (err) {
      console.error('Failed to load creatures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCreatures() }, [])

  const sizes = useMemo(() => Array.from(new Set(creatures.map(c => c.size).filter(Boolean))).sort(), [creatures])

  const filtered = useMemo(() => creatures.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchSize = !filterSize || c.size === filterSize
    return matchSearch && matchSize
  }), [creatures, search, filterSize])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Skull size={24} /> Bestiário</h2>
          <p className="page-subtitle">Criaturas e monstros do mundo de Coalizão. ({filtered.length}/{creatures.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nova Criatura
        </button>
      </div>

      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            placeholder="Buscar criatura..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
        <select
          className="input select"
          value={filterSize}
          onChange={e => setFilterSize(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="">Todos os tamanhos</option>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">Carregando...</p></div>
      ) : (
        <div className="entity-grid">
          {filtered.map(creature => (
            <CreatureCard
              key={creature.id}
              creature={creature}
              onSelect={onSelectEntity}
              onContextMenu={onEntityContextMenu}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Skull size={28} /></div>
          <p className="empty-state-text">Nenhuma criatura encontrada.</p>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nova Criatura">
        <EntityForm
          entityType="creature"
          onSave={() => { setShowForm(false); loadCreatures() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
