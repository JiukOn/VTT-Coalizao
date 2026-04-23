/* BestiaryPage.jsx — Creature/Monster database page */
import { useState, useEffect, useMemo } from 'react'
import { Skull, Plus } from 'lucide-react'
import { db } from '../services/database.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import CreatureCard from '../components/entities/CreatureCard.jsx'
import EntityForm from '../components/entities/EntityForm.jsx'
import Modal from '../components/common/Modal.jsx'

export default function BestiaryPage({ onSelectEntity, onEntityContextMenu }) {
  const { t, ui } = useLanguage()
  const [search, setSearch] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterElement, setFilterElement] = useState('')
  const [creatures, setCreatures] = useState([])
  const [elements, setElements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadCreatures = async () => {
    try {
      const [data, elems] = await Promise.all([
        db.creatures.toArray(),
        db.elements.toArray(),
      ])
      setCreatures(data)
      setElements(elems)
    } catch (err) {
      console.error('Failed to load creatures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCreatures() }, [])

  const sizes = useMemo(() => Array.from(new Set(creatures.map(c => c.size).filter(Boolean))).sort(), [creatures])

  const filtered = useMemo(() => creatures.filter(c => {
    const name = t(c.name) || ''
    const desc = t(c.description) || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                        desc.toLowerCase().includes(search.toLowerCase())
    const matchSize = !filterSize || c.size === filterSize
    const matchElement = !filterElement || c.element === filterElement
    return matchSearch && matchSize && matchElement
  }), [creatures, search, filterSize, filterElement, t])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Skull size={24} /> {ui('bestiario')}</h2>
          <p className="page-subtitle">{ui('criaturas')} ({filtered.length}/{creatures.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> {ui('nova')} {ui('criatura')}
        </button>
      </div>

      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            placeholder={`${ui('buscar')}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
        <select
          className="input select"
          value={filterSize}
          onChange={e => setFilterSize(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
        >
          <option value="">{ui('todos')} {ui('tamanhos')}</option>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="input select"
          value={filterElement}
          onChange={e => setFilterElement(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
        >
          <option value="">{ui('todos')} {ui('elementos')}</option>
          {elements.map(el => (
            <option key={el.id} value={el.id}>{t(el.name)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">{ui('carregando')}</p></div>
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
          <p className="empty-state-text">{ui('nenhum_encontrado')}</p>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`${ui('nova')} ${ui('criatura')}`}>
        <EntityForm
          entityType="creature"
          onSave={() => { setShowForm(false); loadCreatures() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
