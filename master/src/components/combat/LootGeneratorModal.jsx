/* LootGeneratorModal.jsx — Master modal to generate and distribute post-combat loot */
import { useState } from 'react'
import { Coins, Sparkles, X, RefreshCw, Send, Package } from 'lucide-react'
import { generateLoot } from '@shared/utils/encounterUtils.js'

export default function LootGeneratorModal({ isOpen, onClose, onBroadcastChatMessage }) {
  const [enemyCount, setEnemyCount] = useState(3)
  const [threatTier, setThreatTier] = useState('moderate')
  const [currentLoot, setCurrentLoot] = useState(() => generateLoot(3, 'moderate'))

  if (!isOpen) return null

  const handleReroll = () => {
    setCurrentLoot(generateLoot(enemyCount, threatTier))
  }

  const handleDistribute = () => {
    if (!currentLoot) return
    const itemsText = currentLoot.items.map(it => `• ${it.name} (${it.rarity})`).join('\n')
    const chatMsg = `💎 **Pilhagem de Batalha Conquistada!**\n💰 **${currentLoot.gold} $** (Moedas)\n⚡ **+${currentLoot.enrCells} Células de Energia**\n📦 **Itens Coletados:**\n${itemsText}`

    onBroadcastChatMessage?.(chatMsg)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
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
        borderRadius: 12,
        width: '100%',
        maxWidth: 480,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#F59E0B20', color: '#F59E0B', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Gerador de Pilhagem & Tesouros</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Espólios e recompensas pós-combate</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--bg-primary)', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inimigos Derrotados</label>
            <input
              type="number"
              min="1"
              max="20"
              className="input"
              value={enemyCount}
              onChange={e => setEnemyCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nível de Perigo</label>
            <select
              className="input"
              value={threatTier}
              onChange={e => setThreatTier(e.target.value)}
            >
              <option value="trivial">Trivial</option>
              <option value="moderate">Moderado</option>
              <option value="challenging">Desafiador</option>
              <option value="deadly">Mortal</option>
            </select>
          </div>
        </div>

        {/* Loot Display */}
        {currentLoot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-primary)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#F59E0B15', border: '1px solid #F59E0B44', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Moedas ($)</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                  +{currentLoot.gold} $
                </span>
              </div>

              <div style={{ flex: 1, background: '#38BDF815', border: '1px solid #38BDF844', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Células de ENR</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                  +{currentLoot.enrCells} ⚡
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Itens & Consumíveis</span>
              {currentLoot.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '4px 6px', background: 'var(--bg-secondary)', borderRadius: 4 }}>
                  <Package size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{it.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 3 }}>
                    {it.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleReroll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} /> Sortear Novamente
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleDistribute}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={13} /> Distribuir no Chat
          </button>
        </div>
      </div>
    </div>
  )
}
