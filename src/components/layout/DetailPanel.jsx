/* DetailPanel.jsx — Right panel showing selected entity details */
import { useState } from 'react'
import { X, Heart, Shield, Zap, Swords, User, Eye, Activity } from 'lucide-react'
import EffectManager from '../effects/EffectManager.jsx'

const ATTR_LABELS = {
  vit: 'VIT', dex: 'DES', crm: 'CRM', frc: 'FRC',
  int: 'INT', res: 'RES', pre: 'PRE', enr: 'ENR',
}

function getBonus(val) {
  const n = parseInt(val) || 0
  return Math.floor(n / 5)
}

export default function DetailPanel({ isOpen, onToggle, entity, onAddToTable, tableEntities = [], onUpdateTableEntity }) {
  const [activeTab, setActiveTab] = useState('info')

  // Find if entity is currently on the table (for effects tab)
  const tableEntity = entity
    ? (tableEntities.find(e => e.tableId === entity.tableId || e.id === entity.id) ?? entity)
    : null

  const activeEffects = tableEntity?.effects || []

  const removeEffect = (index) => {
    if (!tableEntity || !onUpdateTableEntity) return
    const updated = activeEffects.filter((_, i) => i !== index)
    onUpdateTableEntity(tableEntity.tableId || tableEntity.id, { effects: updated })
  }

  const applyEffect = (effect) => {
    if (!tableEntity || !onUpdateTableEntity) return
    // Don't add duplicates
    if (activeEffects.some(e => e.id === effect.id)) return
    onUpdateTableEntity(tableEntity.tableId || tableEntity.id, {
      effects: [...activeEffects, effect],
    })
  }

  const tabs = ['info', 'atributos', 'efeitos']
  const tabLabels = { info: 'Info', atributos: 'Atributos', efeitos: `Efeitos${activeEffects.length > 0 ? ` (${activeEffects.length})` : ''}` }

  return (
    <aside className={`detail-panel ${!isOpen ? 'collapsed' : ''}`}>
      {isOpen && (
        <>
          <div className="detail-panel-header">
            <h4>{entity?.name || 'Detalhes'}</h4>
            <button className="btn btn-ghost btn-icon" onClick={onToggle}>
              <X size={16} />
            </button>
          </div>

          {entity ? (
            <>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      fontSize: '0.72rem',
                      fontWeight: activeTab === tab ? 700 : 400,
                      background: 'none',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-primary)' : 'transparent'}`,
                      color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              <div className="detail-panel-content">
                {/* INFO TAB */}
                {activeTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <div className="entity-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                        {entity.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{entity.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {entity.class || entity.type || '—'} {entity.level ? `· Nível ${entity.level}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                      {entity.species && (
                        <div className="detail-info-row">
                          <span className="stat-label">Espécie</span>
                          <span style={{ fontSize: '0.85rem' }}>{entity.species}</span>
                        </div>
                      )}
                      {entity.personality && (
                        <div className="detail-info-row">
                          <span className="stat-label">Personalidade</span>
                          <span style={{ fontSize: '0.85rem' }}>{entity.personality}</span>
                        </div>
                      )}
                      {entity.size && (
                        <div className="detail-info-row">
                          <span className="stat-label">Tamanho</span>
                          <span style={{ fontSize: '0.85rem' }}>{entity.size}</span>
                        </div>
                      )}
                      {entity.behavior && (
                        <div className="detail-info-row">
                          <span className="stat-label">Comportamento</span>
                          <span style={{ fontSize: '0.85rem' }}>{entity.behavior}</span>
                        </div>
                      )}
                      {entity.element && entity.element !== '—' && (
                        <div className="detail-info-row">
                          <span className="stat-label">Elemento</span>
                          <span className="badge badge-accent">{entity.element}</span>
                        </div>
                      )}
                      {(entity.hp != null || entity.vitMax != null) && (
                        <div className="detail-info-row">
                          <span className="stat-label">HP</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>
                            {entity.hp ?? '?'} / {entity.maxHp ?? entity.vitMax ?? '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      <button className="btn btn-secondary btn-sm w-full">
                        <Eye size={14} /> Ver Ficha Completa
                      </button>
                      <button className="btn btn-secondary btn-sm w-full" onClick={() => onAddToTable?.(entity)}>
                        <Swords size={14} /> Adicionar ao Mapa
                      </button>
                    </div>
                  </div>
                )}

                {/* ATRIBUTOS TAB */}
                {activeTab === 'atributos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {entity.attributes ? (
                      Object.entries(ATTR_LABELS).map(([key, label]) => {
                        const val = entity.attributes[key] ?? 0
                        const bonus = getBonus(val)
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 32 }}>{label}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, (val / 20) * 100)}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minWidth: 20, textAlign: 'right' }}>{val}</span>
                            <span style={{ fontSize: '0.7rem', color: bonus >= 0 ? 'var(--color-success)' : 'var(--color-danger)', minWidth: 28, textAlign: 'right' }}>
                              {bonus >= 0 ? `+${bonus}` : bonus}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      // Flat attribute structure (creatures/NPCs)
                      Object.entries(ATTR_LABELS).map(([key, label]) => {
                        const val = entity[key] ?? 0
                        const bonus = getBonus(val)
                        if (!val) return null
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 32 }}>{label}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, (val / 20) * 100)}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minWidth: 20, textAlign: 'right' }}>{val}</span>
                            <span style={{ fontSize: '0.7rem', color: bonus >= 0 ? 'var(--color-success)' : 'var(--color-danger)', minWidth: 28, textAlign: 'right' }}>
                              {bonus >= 0 ? `+${bonus}` : bonus}
                            </span>
                          </div>
                        )
                      })
                    )}
                    {!entity.attributes && !Object.keys(ATTR_LABELS).some(k => entity[k]) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: 16 }}>
                        Sem atributos registrados.
                      </div>
                    )}
                  </div>
                )}

                {/* EFEITOS TAB */}
                {activeTab === 'efeitos' && (
                  <EffectManager
                    activeEffects={activeEffects}
                    onApplyEffect={onUpdateTableEntity ? applyEffect : undefined}
                    onRemoveEffect={onUpdateTableEntity ? removeEffect : undefined}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="detail-panel-content">
                <div className="empty-state">
                  <div className="empty-state-icon"><User size={24} /></div>
                  <p className="empty-state-text" style={{ fontSize: '0.8rem' }}>
                    Selecione uma entidade para ver seus detalhes.
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}
