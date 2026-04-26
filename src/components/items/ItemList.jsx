/* ItemList.jsx — Filterable item catalog with category tabs */
import { useState, useMemo } from 'react'
import { Search, Swords } from 'lucide-react'
import ItemCard from './ItemCard.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'

const TYPE_LABELS = {
  arma: 'Armas', escudo: 'Escudos', vestimenta: 'Vestimentas',
  consumivel: 'Consumíveis', projetil: 'Projéteis', diverso: 'Diversos',
  ferramenta: 'Ferramentas', magico: 'Mágicos', veneno: 'Venenos',
}

export default function ItemList({ items = [], onSelect, onContextMenu }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')

  const types = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      const k = (item.type || item.category || 'diverso').toLowerCase().replace(/_+$/, '')
      counts[k] = (counts[k] || 0) + 1
    })
    return [
      { id: 'all', label: 'Todos', count: items.length },
      ...Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({
        id, label: TYPE_LABELS[id] || id, count
      }))
    ]
  }, [items])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      const nameStr = t(item.name).toLowerCase()
      const descStr = t(item.description).toLowerCase()
      const matchSearch = !q || nameStr.includes(q) || descStr.includes(q)
      const typeKey = (item.type || item.category || 'diverso').toLowerCase().replace(/_+$/, '')
      const matchType = activeType === 'all' || typeKey === activeType
      return matchSearch && matchType
    })
  }, [items, search, activeType, t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeType === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveType(t.id)}
          >
            {t.label} <span className="badge badge-accent" style={{ marginLeft: 4 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Buscar item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Swords size={28} /></div>
          <p className="empty-state-text">Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="entity-grid">
          {filtered.map(item => (
            <ItemCard key={item.id || item.name} item={item} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </div>
      )}
    </div>
  )
}
