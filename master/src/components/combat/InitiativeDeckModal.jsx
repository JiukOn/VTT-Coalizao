/* InitiativeDeckModal.jsx — Master modal for drawing tactical action cards for initiative rounds */
import { useState } from 'react'
import { Layers, Shuffle, Send, X, Sparkles, Shield, Zap } from 'lucide-react'
import { drawInitiativeCards, ACTION_CARDS } from '@shared/utils/initiativeDeck.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function InitiativeDeckModal({
  isOpen,
  onClose,
  onBroadcastRoundCards,
}) {
  const [drawnCards, setDrawnCards] = useState(() => drawInitiativeCards(3))

  if (!isOpen) return null

  const handleShuffle = () => {
    sfx.init()
    sfx.play('dice_roll')
    setDrawnCards(drawInitiativeCards(3))
  }

  const handleBroadcast = () => {
    sfx.init()
    sfx.play('turn_alert')
    const summary = drawnCards.map(c => `• **${c.icon} ${c.title}** (${c.initBonus >= 0 ? `+${c.initBonus}` : c.initBonus} Init): ${c.effect}`).join('\n')
    const chatMsg = `🃏 **Cartas Táticas de Iniciativa da Rodada**:\n${summary}`
    onBroadcastRoundCards?.(chatMsg)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        width: '100%',
        maxWidth: 520,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Baralho de Iniciativa Tática
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Cartas de ação com modificadores dinâmicos para a rodada
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawn Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drawnCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-primary)',
                borderLeft: `4px solid ${card.color}`,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                borderRadius: '0 8px 8px 0',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {card.effect}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: card.color,
                background: `${card.color}20`,
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${card.color}44`,
                whiteSpace: 'nowrap',
              }}>
                {card.initBonus >= 0 ? `+${card.initBonus}` : card.initBonus} Init
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleShuffle}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shuffle size={14} /> Sortear Novas Cartas
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleBroadcast}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} /> Anunciar no Chat
          </button>
        </div>
      </div>
    </div>
  )
}
