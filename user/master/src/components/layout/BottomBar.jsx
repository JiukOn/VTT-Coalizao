/* BottomBar.jsx — Bottom panel with Dice Roller, Combat Log, Initiative Tracker, Combat Resolver */
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import DiceRollerWidget from '../widgets/DiceRollerWidget.jsx'
import InitiativeTracker from '../combat/InitiativeTracker.jsx'
import CombatResolver from '../combat/CombatResolver.jsx'

export default function BottomBar({ tableEntities = [], onUpdateTableEntity }) {
  const [collapsed, setCollapsed] = useState(false)
  const [logEntries, setLogEntries] = useState([])

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogEntries(prev => [{ id: Date.now() + Math.random(), timestamp, message }, ...prev].slice(0, 150))
  }

  const clearLog = () => setLogEntries([])

  // Apply damage to a table entity (called by CombatResolver after a hit)
  const handleApplyDamage = (defenderId, damage) => {
    const entity = tableEntities.find(e =>
      String(e.tableId) === String(defenderId) || String(e.id) === String(defenderId)
    )
    if (!entity || !onUpdateTableEntity) return
    // currentHp: prefer explicit hp field, fallback to VIT attribute, fallback to 0
    const currentHp = entity.hp ?? entity.vitMax ?? entity.attributes?.vit ?? entity.vit ?? 0
    const newHp = Math.max(0, currentHp - damage)
    onUpdateTableEntity(entity.tableId || entity.id, { hp: newHp })
    addLogEntry(`🩸 ${entity.name}: HP ${currentHp} → ${newHp} (−${damage})`)
  }

  return (
    <div className={`bottom-bar ${collapsed ? 'collapsed' : ''}`}>
      {/* Section 1: Dice Roller */}
      <div className="bottom-bar-section">
        <div className="bottom-bar-section-header">
          <span>🎲 Dados</span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: 22, height: 22 }}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {!collapsed && <DiceRollerWidget onLogEntry={addLogEntry} />}
      </div>

      {/* Section 2: Combat Log */}
      <div className="bottom-bar-section">
        <div className="bottom-bar-section-header">
          <span>📜 Log</span>
          {logEntries.length > 0 && (
            <button className="btn btn-ghost btn-icon" onClick={clearLog} title="Limpar" style={{ width: 20, height: 20 }}>
              ✕
            </button>
          )}
        </div>
        {!collapsed && (
          <div className="combat-log" style={{ flex: 1, overflowY: 'auto' }}>
            {logEntries.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Nenhuma ação registrada.
              </div>
            ) : (
              logEntries.map(entry => (
                <div key={entry.id} className="log-entry">
                  <span className="log-timestamp">{entry.timestamp}</span>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Section 3: Initiative Tracker */}
      <div className="bottom-bar-section">
        <div className="bottom-bar-section-header">
          <span>⚡ Iniciativa</span>
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <InitiativeTracker entities={tableEntities} onLogEntry={addLogEntry} onUpdateEntity={onUpdateTableEntity} />
          </div>
        )}
      </div>

      {/* Section 4: Combat Resolver */}
      <div className="bottom-bar-section">
        <div className="bottom-bar-section-header">
          <span>⚔️ Combate</span>
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CombatResolver
              entities={tableEntities}
              onLogEntry={addLogEntry}
              onApplyDamage={handleApplyDamage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
