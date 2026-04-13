/* Sidebar.jsx — Left panel with contextual entity lists */
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, User, Skull, Zap, Swords, Users, Search } from 'lucide-react'
import { db } from '../../services/database.js'
import { useCampaign } from '../../context/CampaignContext.jsx'

const TAB_CONFIG = {
  personagens: { label: 'Personagens', icon: User, table: 'characters', nameField: 'name', subField: 'classId' },
  npcs:        { label: 'NPCs', icon: Users, table: 'npcs', nameField: 'name', subField: 'location' },
  bestiario:   { label: 'Criaturas', icon: Skull, table: 'creatures', nameField: 'name', subField: 'type' },
  habilidades: { label: 'Habilidades', icon: Zap, table: 'abilities', nameField: 'name', subField: 'category' },
  itens:       { label: 'Itens', icon: Swords, table: 'items', nameField: 'name', subField: 'type' },
}

export default function Sidebar({ isOpen, onToggle, activeTab, onSelectEntity }) {
  const [entities, setEntities] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { activeCampaign } = useCampaign()

  const config = TAB_CONFIG[activeTab]

  useEffect(() => {
    if (!config || !isOpen) return
    setLoading(true)
    setSearch('')

    const load = async () => {
      try {
        let data = []
        const table = db[config.table]
        if (table) {
          if (config.table === 'characters' && activeCampaign?.id) {
            data = await table.where({ campaignId: activeCampaign.id }).toArray()
          } else {
            data = await table.toArray()
          }
        }
        setEntities(data)
      } catch (err) {
        console.error('[Sidebar] Failed to load:', err)
        setEntities([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTab, isOpen, activeCampaign])

  const filtered = entities.filter(e =>
    (e[config?.nameField] || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      {isOpen ? (
        <>
          <div className="sidebar-header">
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>
              {config ? config.label : 'Entidades'}
            </h4>
            <button className="btn btn-ghost btn-icon" onClick={onToggle} title="Recolher">
              <ChevronLeft size={16} />
            </button>
          </div>

          {config && (
            <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  placeholder="Filtrar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 26, fontSize: '0.8rem', padding: '5px 8px 5px 26px', width: '100%' }}
                />
              </div>
            </div>
          )}

          <div className="sidebar-content">
            {!config ? (
              <p className="text-muted" style={{ padding: '12px', fontSize: '0.8rem', textAlign: 'center' }}>
                Selecione uma aba para ver as entidades.
              </p>
            ) : loading ? (
              <p className="text-muted" style={{ padding: '12px', fontSize: '0.8rem', textAlign: 'center' }}>Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px', fontSize: '0.8rem', textAlign: 'center' }}>Nenhum item encontrado.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filtered.map((entity, idx) => {
                  const Icon = config.icon
                  const name = entity[config.nameField] || 'Sem nome'
                  const sub = entity[config.subField] || ''
                  return (
                    <li
                      key={entity.id || idx}
                      onClick={() => onSelectEntity?.(entity)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icon size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name}
                        </div>
                        {sub && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onToggle}
            title="Expandir sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
