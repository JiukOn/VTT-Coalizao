/* DomainPage.jsx — Domains/Ambients listing page */
import { useState, useEffect, useMemo } from 'react'
import { Map } from 'lucide-react'
import { db } from '../services/database.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function DomainPage() {
  const { t, ui } = useLanguage()
  const [search, setSearch] = useState('')
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDomains = async () => {
    try {
      const data = await db.domains.toArray()
      setDomains(data)
    } catch (err) {
      console.error('Failed to load domains:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDomains() }, [])

  const filtered = useMemo(() => domains.filter(d => {
    const name = t(d.name) || ''
    const desc = t(d.description) || ''
    const query = search.toLowerCase()
    return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query)
  }), [domains, search, t])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Map size={24} /> {ui('dominios') || 'Domínios'}</h2>
          <p className="page-subtitle">{ui('ambientes') || 'Ambientes'} ({filtered.length}/{domains.length})</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            placeholder={`${ui('buscar') || 'Buscar'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 12 }}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p className="empty-state-text">{ui('carregando') || 'Carregando...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Map size={28} /></div>
          <p className="empty-state-text">{ui('nenhum_encontrado') || 'Nenhum domínio encontrado.'}</p>
        </div>
      ) : (
        <div className="entity-grid">
          {filtered.map(domain => (
            <div key={domain.id} className="entity-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t(domain.name) || domain.name}
                </span>
                {domain.type && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {t(domain.type) || domain.type}
                  </span>
                )}
              </div>
              {domain.description && (
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {t(domain.description) || domain.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
