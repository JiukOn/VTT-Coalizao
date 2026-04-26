/* DashboardPage.jsx — Main landing page with summary cards and quick actions */
import { useState, useEffect } from 'react'
import {
  Map, Users, Skull, Zap, Swords, BookOpen,
  Dices, Shield, Heart, Star, Trophy, Compass
} from 'lucide-react'
import { db } from '../services/database.js'
import BASE_EFFECTS from '@data/effects/index.js'
import MasterToolsPanel from '../components/campaign/MasterToolsPanel.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const QUICK_STATS = [
  { icon: Users, label: 'Heroes', color: '#4ADE80', table: 'characters' },
  { icon: Skull, label: 'Creatures', color: '#F87171', table: 'creatures' },
  { icon: Zap, label: 'Abilities', color: '#FBBF24', table: 'abilities' },
  { icon: Swords, label: 'Items', color: '#60A5FA', table: 'items' },
  { icon: Shield, label: 'NPCs', color: '#C084FC', table: 'npcs' },
  { icon: Map, label: 'Maps', color: '#34D399', table: 'maps' },
]

const TIPS = [
  '💡 Use Ctrl+D for a quick D20 roll.',
  '💡 Right-click a token for quick options.',
  '💡 Export your campaign frequently as a backup.',
  '💡 The Coalizao system only uses D20 and D4.',
  '💡 Tendencies grant an Advantage die in related checks.',
  '💡 Activate a character\'s Aura by clicking the aura icon on their sheet.',
  '💡 Attribute bonus is +1 for every 5 final points.',
]

export default function DashboardPage({ onSelectEntity, onEntityContextMenu, tableEntities = [], setTableEntities, onUpdateTableEntity }) {
  const { t } = useLanguage()
  const [counts, setCounts] = useState({})
  const [tipIndex, setTipIndex] = useState(0)
  const [campaignName, setCampaignName] = useState('New Campaign')

  // Effects System State
  const [addingEffectTo, setAddingEffectTo] = useState(null)
  const [effectSelectValue, setEffectSelectValue] = useState('')
  const [effectDurationValue, setEffectDurationValue] = useState(3)

  // Flatten effects for the select dropdown
  const allEffects = Object.values(BASE_EFFECTS).flat()

  const handleAddEffect = (tableId) => {
    if (!effectSelectValue) return
    const eff = allEffects.find(e => e.id === effectSelectValue)
    if (!eff) return

    setTableEntities?.(prev => prev.map(ent => {
      if (ent.tableId !== tableId) return ent
      const newEffects = [...(ent.effects || []), { id: eff.id, name: eff.name, duration: parseInt(effectDurationValue) || 1 }]
      return { ...ent, effects: newEffects }
    }))
    setAddingEffectTo(null)
    setEffectSelectValue('')
    setEffectDurationValue(3)
  }

  const updateEffectDuration = (tableId, effectIdx, delta) => {
    setTableEntities?.(prev => prev.map(ent => {
      if (ent.tableId !== tableId) return ent
      const newEffects = [...(ent.effects || [])]
      newEffects[effectIdx] = { ...newEffects[effectIdx], duration: Math.max(0, newEffects[effectIdx].duration + delta) }
      return { ...ent, effects: newEffects }
    }))
  }

  const removeEffect = (tableId, effectIdx) => {
    setTableEntities?.(prev => prev.map(ent => {
      if (ent.tableId !== tableId) return ent
      const newEffects = [...(ent.effects || [])]
      newEffects.splice(effectIdx, 1)
      return { ...ent, effects: newEffects }
    }))
  }

  useEffect(() => {
    async function loadCounts() {
      try {
        const results = {}
        for (const stat of QUICK_STATS) {
          try {
            const table = db[stat.table]
            if (table) {
              results[stat.label] = await table.count()
            } else {
              results[stat.label] = 0
            }
          } catch {
            results[stat.label] = 0
          }
        }
        setCounts(results)
      } catch {
        // DB not ready yet
      }
    }
    loadCounts()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-page">
      {/* Welcome banner */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          <h1 className="dashboard-title">⚔️ VTT Coalizao</h1>
          <p className="dashboard-subtitle">Virtual Tabletop for the Coalizao RPG System</p>
          <div className="dashboard-tip">{TIPS[tipIndex]}</div>
        </div>
        <div className="dashboard-banner-decoration">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="dashboard-stats-grid">
        {QUICK_STATS.map(stat => {
          const Icon = stat.icon
          const count = counts[stat.label] ?? '—'
          return (
            <div key={stat.label} className="dashboard-stat-card" style={{ '--stat-color': stat.color }}>
              <div className="stat-card-icon">
                <Icon size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-value">{count}</span>
                <span className="stat-card-label">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Quick Actions</h3>
        <div className="dashboard-actions-grid">
          <button className="dashboard-action-btn">
            <Dices size={20} />
            <span>Roll D20</span>
          </button>
          <button className="dashboard-action-btn">
            <Users size={20} />
            <span>New Hero</span>
          </button>
          <button className="dashboard-action-btn">
            <Skull size={20} />
            <span>New Creature</span>
          </button>
          <button className="dashboard-action-btn">
            <Map size={20} />
            <span>Import Map</span>
          </button>
          <button className="dashboard-action-btn">
            <Trophy size={20} />
            <span>Roll Initiative</span>
          </button>
          <button className="dashboard-action-btn">
            <BookOpen size={20} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Table Entities (Initiative Tracker / Active Combatants) */}
      {tableEntities.length > 0 && (
        <div className="dashboard-section" style={{ border: '1px solid var(--border-color)', padding: 'var(--space-md)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="dashboard-section-title" style={{ margin: 0 }}>Combat Table (Initiative Tracker)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-sm btn-primary" 
                onClick={() => {
                  setTableEntities?.(prev => {
                    const next = [...prev].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0))
                    return next
                  })
                }}
              >
                Sort Initiative
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setTableEntities?.([])}>Clear Table</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '12px 0' }}>
            {tableEntities.map(entity => (
              <div 
                key={entity.tableId}
                className="entity-card" 
                style={{ width: 160, flexShrink: 0, padding: 8, display: 'flex', flexDirection: 'column', gap: '6px' }}
                onContextMenu={(e) => onEntityContextMenu?.(e, entity)}
              >
                <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onSelectEntity?.(entity)}>
                  <div className="entity-avatar" style={{ margin: '0 auto 8px auto', fontSize: '1.2rem', width: 40, height: 40, backgroundImage: entity.avatar ? `url(${entity.avatar})` : 'none', backgroundSize: 'cover' }}>
                    {!entity.avatar && (entity.name ? entity.name[0] : '?')}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }} className="line-clamp-1">{entity.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entity.type || entity.class || entity.category}</div>
                </div>
                
                {/* Tracker Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>INIC</span>
                    <input 
                      className="input" 
                      style={{ padding: '2px 4px', fontSize: '0.8rem', height: '24px' }}
                      type="number" 
                      value={entity.initiative || ''} 
                      onChange={(e) => {
                        setTableEntities?.(prev => prev.map(ent => ent.tableId === entity.tableId ? { ...ent, initiative: e.target.value } : ent))
                      }} 
                    />
                  </label>
                  <label style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#ef4444' }}>HP</span>
                    <input 
                      className="input" 
                      style={{ padding: '2px 4px', fontSize: '0.8rem', height: '24px', borderColor: '#ef444455' }}
                      type="text" 
                      value={entity.hp || ''} 
                      onChange={(e) => {
                        setTableEntities?.(prev => prev.map(ent => ent.tableId === entity.tableId ? { ...ent, hp: e.target.value } : ent))
                      }} 
                    />
                  </label>
                  <label style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#3b82f6' }}>DP</span>
                    <input 
                      className="input" 
                      style={{ padding: '2px 4px', fontSize: '0.8rem', height: '24px', borderColor: '#3b82f655' }}
                      type="text" 
                      value={entity.dp || ''} 
                      onChange={(e) => {
                        setTableEntities?.(prev => prev.map(ent => ent.tableId === entity.tableId ? { ...ent, dp: e.target.value } : ent))
                      }} 
                    />
                  </label>
                  <label style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#eab308' }}>AURA</span>
                    <input 
                      className="input" 
                      style={{ padding: '2px 4px', fontSize: '0.8rem', height: '24px', borderColor: '#eab30855' }}
                      type="text" 
                      value={entity.aura || ''} 
                      onChange={(e) => {
                        setTableEntities?.(prev => prev.map(ent => ent.tableId === entity.tableId ? { ...ent, aura: e.target.value } : ent))
                      }} 
                    />
                  </label>
                </div>

                {/* Effects System */}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {entity.effects?.map((eff, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 4px', border: '1px solid var(--border-subtle)', width: '100%', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }} className="line-clamp-1">{t(eff.name)}</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button className="btn btn-ghost" style={{ padding: 0, width: 14, height: 14, minHeight: 0 }} onClick={() => updateEffectDuration(entity.tableId, idx, -1)}>-</button>
                        <span style={{ fontFamily: 'var(--font-mono)', minWidth: 10, textAlign: 'center' }}>{eff.duration}</span>
                        <button className="btn btn-ghost" style={{ padding: 0, width: 14, height: 14, minHeight: 0 }} onClick={() => updateEffectDuration(entity.tableId, idx, 1)}>+</button>
                        <button className="btn btn-ghost" style={{ padding: 0, width: 14, height: 14, minHeight: 0, marginLeft: '4px', color: '#ef4444' }} onClick={() => removeEffect(entity.tableId, idx)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                {addingEffectTo === entity.tableId ? (
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <select className="input" style={{ fontSize: '0.7rem', padding: '2px 4px', height: '24px' }} value={effectSelectValue} onChange={e => setEffectSelectValue(e.target.value)}>
                      <option value="">Selecione...</option>
                      {allEffects.map(e => <option key={e.id} value={e.id}>{t(e.name)}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input className="input" type="number" style={{ width: '40px', fontSize: '0.7rem', padding: '2px', height: '24px' }} value={effectDurationValue} onChange={e => setEffectDurationValue(e.target.value)} title="Duração (Turnos)" />
                      <button className="btn btn-primary" style={{ flex: 1, padding: '2px', fontSize: '0.7rem', height: '24px', minHeight: 0 }} onClick={() => handleAddEffect(entity.tableId)}>Add</button>
                      <button className="btn btn-ghost" style={{ flex: 1, padding: '2px', fontSize: '0.7rem', height: '24px', minHeight: 0 }} onClick={() => setAddingEffectTo(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', fontSize: '0.7rem', marginTop: '4px', padding: '2px', minHeight: '24px' }} onClick={() => setAddingEffectTo(entity.tableId)}>
                    + Efeito
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Tools: Investigation, Stealth, Rest */}
      <MasterToolsPanel tableEntities={tableEntities} onUpdateTableEntity={onUpdateTableEntity} />

      {/* System info card */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Sistema Coalizão — Referência Rápida</h3>
        <div className="dashboard-reference-grid">
          <div className="reference-card">
            <h4>🎲 Dados</h4>
            <p>Apenas <strong>D20</strong> (testes) e <strong>D4</strong> (efeitos/dano).</p>
            <div className="reference-table">
              <div className="ref-row ref-critical">20: Crítico</div>
              <div className="ref-row ref-good">13-19: Bom</div>
              <div className="ref-row ref-normal">10-12: Normal</div>
              <div className="ref-row ref-bad">2-9: Ruim</div>
              <div className="ref-row ref-disaster">1: Desastre</div>
            </div>
          </div>
          <div className="reference-card">
            <h4>⚔️ Combate</h4>
            <p>Turno: <strong>Ação Principal</strong> + <strong>Cognitiva</strong> + <strong>Movimento</strong>.</p>
            <ul className="reference-list">
              <li>Corpo a corpo: 1d20 + FRC</li>
              <li>Distância: 1d20 + PRE</li>
              <li>Mágico: 1d20 + ENR</li>
              <li>Esquiva: 1d20 + DEX</li>
            </ul>
          </div>
          <div className="reference-card">
            <h4>📊 Atributos</h4>
            <p>8 atributos, bônus = <strong>⌊valor/5⌋</strong>.</p>
            <div className="attribute-chips">
              <span className="attr-chip">VIT</span>
              <span className="attr-chip">DEX</span>
              <span className="attr-chip">CRM</span>
              <span className="attr-chip">FRC</span>
              <span className="attr-chip">INT</span>
              <span className="attr-chip">RES</span>
              <span className="attr-chip">PRE</span>
              <span className="attr-chip">ENR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
