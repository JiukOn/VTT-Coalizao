/* BottomBar.jsx — Modern LitRPG Floating HUD Dock (Dice, Initiative, Combat, Chat, Log) */
import { useState } from 'react'
import { Dices, ScrollText, Zap, Swords, MessageSquare, X, ChevronUp, ChevronDown } from 'lucide-react'
import DiceRollerWidget from '../widgets/DiceRollerWidget.jsx'
import InitiativeTracker from '../combat/InitiativeTracker.jsx'
import CombatResolver from '../combat/CombatResolver.jsx'
import ActionHotbar from '@shared/components/ActionHotbar.jsx'
import MasterChatWidget from '../chat/MasterChatWidget.jsx'
import { getI18nText } from '@shared/utils/entityFormatting.js'

export default function BottomBar({ tableEntities = [], onUpdateTableEntity }) {
  const [activeTab, setActiveTab] = useState(null) // null | 'dice' | 'initiative' | 'combat' | 'chat' | 'log'
  const [logEntries, setLogEntries] = useState([])

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogEntries(prev => [{ id: Date.now() + Math.random(), timestamp, message }, ...prev].slice(0, 150))
  }

  const clearLog = () => setLogEntries([])

  // Toggle tab behavior: clicking the active tab collapses it
  const handleTabClick = (tabKey) => {
    setActiveTab(prev => prev === tabKey ? null : tabKey)
  }

  // Apply damage to a table entity (called by CombatResolver after a hit)
  const handleApplyDamage = (defenderId, damage) => {
    const entity = tableEntities.find(e =>
      String(e.tableId) === String(defenderId) || String(e.id) === String(defenderId)
    )
    if (!entity || !onUpdateTableEntity) return
    const currentHp = entity.hp ?? entity.vitMax ?? entity.attributes?.vit ?? entity.vit ?? 0
    const newHp = Math.max(0, currentHp - damage)
    onUpdateTableEntity(entity.tableId || entity.id, { hp: newHp })
    addLogEntry(`🩸 ${getI18nText(entity.name)}: HP ${currentHp} → ${newHp} (−${damage})`)
  }

  const isOpen = Boolean(activeTab)

  return (
    <div className="bottom-bar-wrapper">
      {/* Floating Action Hotbar (Slots 1-9) */}
      <div style={{
        position: 'absolute',
        top: -46,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
      }}>
        <ActionHotbar
          onExecuteCommand={(cmd) => {
            addLogEntry(`⚡ Macro: ${cmd}`)
          }}
        />
      </div>

      <div
        className="bottom-bar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: isOpen ? 250 : 36,
          width: '100%',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
      >
        {/* Navigation Dock (Always visible on top of bar) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 12px',
            background: 'rgba(10, 10, 18, 0.95)',
            borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
            flexShrink: 0,
            height: 36,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className={`btn btn-sm ${activeTab === 'dice' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabClick('dice')}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Dices size={13} />
              <span>Dados & Testes</span>
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'initiative' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabClick('initiative')}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Zap size={13} />
              <span>Iniciativa</span>
              {tableEntities.length > 0 && (
                <span className="badge badge-accent" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                  {tableEntities.length}
                </span>
              )}
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'combat' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabClick('combat')}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Swords size={13} />
              <span>Resolução de Combate</span>
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabClick('chat')}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <MessageSquare size={13} />
              <span>Chat da Mesa</span>
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'log' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTabClick('log')}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <ScrollText size={13} />
              <span>Log da Sessão</span>
            </button>
          </div>

          {/* Quick Collapse / Expand Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isOpen ? (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setActiveTab(null)}
                style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
                title="Recolher painel"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setActiveTab('dice')}
                style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
                title="Abrir painel de ferramentas"
              >
                <ChevronUp size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content Area (Dedicated view per tool) */}
        {isOpen && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', width: '100%', height: 'calc(100% - 36px)', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
            {activeTab === 'dice' && (
              <DiceRollerWidget onLogEntry={addLogEntry} />
            )}

            {activeTab === 'initiative' && (
              <div style={{ flex: 1, minHeight: 0, padding: '8px 16px', overflowY: 'auto', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                <InitiativeTracker
                  entities={tableEntities}
                  onLogEntry={addLogEntry}
                  onUpdateEntity={onUpdateTableEntity}
                />
              </div>
            )}

            {activeTab === 'combat' && (
              <div style={{ flex: 1, minHeight: 0, padding: '8px 16px', overflowY: 'auto', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                <CombatResolver
                  entities={tableEntities}
                  onLogEntry={addLogEntry}
                  onApplyDamage={handleApplyDamage}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div style={{ flex: 1, minHeight: 0, height: '100%', padding: '4px 16px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                <MasterChatWidget onDiceRoll={addLogEntry} />
              </div>
            )}

            {activeTab === 'log' && (
              <div style={{ flex: 1, minHeight: 0, padding: '8px 16px', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>📜 Registro Histórico da Mesa</span>
                  {logEntries.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={clearLog} style={{ fontSize: '0.72rem' }}>
                      Limpar Log
                    </button>
                  )}
                </div>
                <div className="combat-log" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 8, border: '1px solid var(--border-subtle)' }}>
                  {logEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: '0.82rem' }}>
                      Nenhum evento registrado nesta sessão ainda.
                    </div>
                  ) : (
                    logEntries.map(e => (
                      <div key={e.id} className="log-entry">
                        <span className="log-timestamp">{e.timestamp}</span>
                        <span className="log-message">{e.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
