/* AbilityList.jsx — Filterable list of abilities with category tabs */
import { useState, useMemo } from 'react'
import { Search, Zap } from 'lucide-react'
import AbilityCard from './AbilityCard.jsx'

const CAT_COLORS = {
  legado: '#C084FC', ativa: '#F87171', passiva: '#4ADE80',
  mito: '#FBBF24', unica: '#60A5FA', descendencia: '#FB923C',
}
const CAT_LABELS = {
  legado: 'Legado', ativa: 'Ativas', passiva: 'Passivas',
  mito: 'Mito', unica: 'Uso Único', descendencia: 'Descendência',
}

export default function AbilityList({ abilities = [], onSelect, onContextMenu }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = useMemo(() => {
    const counts = {}
    abilities.forEach(a => {
      const k = (a.category || '').toLowerCase().replace(/\s/g, '')
      counts[k] = (counts[k] || 0) + 1
    })
    return [{ id: 'all', label: 'Todas', count: abilities.length }, ...Object.entries(counts).map(([id, count]) => ({ id, label: CAT_LABELS[id] || id, count }))]
  }, [abilities])

  const filtered = useMemo(() => abilities.filter(a => {
    const matchSearch = (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (a.description || '').toLowerCase().includes(search.toLowerCase()) ||
                        (a.classLink || '').toLowerCase().includes(search.toLowerCase())
    const catKey = (a.category || '').toLowerCase().replace(/\s/g, '')
    const matchCat = activeCategory === 'all' || catKey === activeCategory
    return matchSearch && matchCat
  }), [abilities, search, activeCategory])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const color = CAT_COLORS[cat.id]
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(cat.id)}
              style={isActive ? {} : { borderColor: color || 'var(--border-subtle)', color: color || 'inherit' }}
            >
              {cat.label} <span className="badge badge-accent" style={{ marginLeft: 4 }}>{cat.count}</span>
            </button>
          )
        })}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Buscar habilidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Zap size={28} /></div>
          <p className="empty-state-text">Nenhuma habilidade encontrada.</p>
        </div>
      ) : (
        <div className="entity-grid">
          {filtered.map(ability => (
            <AbilityCard key={ability.id || ability.name} ability={ability} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </div>
      )}
    </div>
  )
}
