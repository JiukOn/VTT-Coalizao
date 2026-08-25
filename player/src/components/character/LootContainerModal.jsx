/* LootContainerModal.jsx — Interactive looting modal for map chests and containers */
import { useState } from 'react'
import { Package, Coins, Hand, Sparkles, X, Check, Lock } from 'lucide-react'
import { lootItemFromContainer, lootAllFromContainer } from '@shared/utils/lootContainers.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function LootContainerModal({
  isOpen,
  onClose,
  container,
  playerEntity,
  onUpdateContainer,
  onUpdatePlayer,
  addLog,
  wsSend,
}) {
  const [currentContainer, setCurrentContainer] = useState(container)

  if (!isOpen || !currentContainer || !playerEntity) return null

  const items = currentContainer.items || []
  const credits = currentContainer.credits || 0
  const isEmpty = items.length === 0 && credits === 0

  const handleLootItem = (index) => {
    sfx.init()
    sfx.play('turn_alert')

    const { updatedContainer, updatedPlayer, lootedItem } = lootItemFromContainer(
      currentContainer,
      index,
      playerEntity
    )

    if (lootedItem) {
      setCurrentContainer(updatedContainer)
      onUpdateContainer?.(updatedContainer)
      onUpdatePlayer?.(updatedPlayer)

      const logMsg = `🎁 **${playerEntity.name}** saqueou **${lootedItem.name}** do ${currentContainer.title}.`
      addLog?.(logMsg)
      if (wsSend) wsSend('chat_message', { text: logMsg, timestamp: new Date().toISOString() })
    }
  }

  const handleLootAll = () => {
    sfx.init()
    sfx.play('turn_alert')

    const { updatedContainer, updatedPlayer, lootedItemsCount, lootedCredits } = lootAllFromContainer(
      currentContainer,
      playerEntity
    )

    setCurrentContainer(updatedContainer)
    onUpdateContainer?.(updatedContainer)
    onUpdatePlayer?.(updatedPlayer)

    const details = []
    if (lootedCredits > 0) details.push(`+${lootedCredits} Cr$`)
    if (lootedItemsCount > 0) details.push(`${lootedItemsCount} ite${lootedItemsCount > 1 ? 'ns' : 'm'}`)

    const logMsg = `🏆 **${playerEntity.name}** saqueou todos os espólios do ${currentContainer.title} (${details.join(', ')}).`
    addLog?.(logMsg)
    if (wsSend) wsSend('chat_message', { text: logMsg, timestamp: new Date().toISOString() })

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
        maxWidth: 460,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
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
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {currentContainer.title}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Espólios saqueáveis encontrados
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Currency Banner (if credits available) */}
        {credits > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={18} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F59E0B' }}>
                {credits} Créditos (Cr$)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Moeda Corrente</span>
          </div>
        )}

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
          {items.length === 0 && credits === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Este recipiente está vazio.
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon || '📦'}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    {item.damage && (
                      <span style={{ fontSize: '0.7rem', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                        ⚔️ Dano: {item.damage}
                      </span>
                    )}
                    {item.defense && (
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                        🛡️ CA: +{item.defense}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-xs btn-secondary"
                  onClick={() => handleLootItem(idx)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Hand size={11} /> Pegar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>

          {!isEmpty && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleLootAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                border: 'none',
              }}
            >
              <Sparkles size={14} /> Saquear Tudo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
