/* MerchantModal.jsx — Interactive NPC merchant shop modal for buying and selling equipment */
import { useState } from 'react'
import { Store, Coins, ShoppingCart, Tag, X, Plus, Sparkles, Check, ArrowRightLeft } from 'lucide-react'
import { MERCHANT_CATALOGS, buyItemFromMerchant, sellItemToMerchant } from '@shared/utils/merchantShop.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function MerchantModal({
  isOpen,
  onClose,
  playerEntity,
  onUpdatePlayer,
  addLog,
  wsSend,
}) {
  const [activeCatalogKey, setActiveCatalogKey] = useState('weaponsmith')
  const [activeMode, setActiveMode] = useState('buy') // 'buy' | 'sell'

  if (!isOpen || !playerEntity) return null

  const catalog = MERCHANT_CATALOGS[activeCatalogKey] || MERCHANT_CATALOGS.weaponsmith
  const currentCredits = playerEntity.money ?? playerEntity.credits ?? 0
  const inventory = Array.isArray(playerEntity.inventory) ? playerEntity.inventory : []

  const handleBuy = (item) => {
    sfx.init()
    const res = buyItemFromMerchant(playerEntity, item)

    if (res.success) {
      sfx.play('turn_alert')
      onUpdatePlayer?.(res.updatedPlayer)
      addLog?.(res.message)
      if (wsSend) {
        wsSend('token_move', {
          data: {
            id: playerEntity.tableId || playerEntity.id,
            changes: {
              credits: res.updatedPlayer.credits,
              money: res.updatedPlayer.money,
              inventory: res.updatedPlayer.inventory,
            },
          },
        })
        wsSend('chat_message', { text: res.message, timestamp: new Date().toISOString() })
      }
    } else {
      sfx.play('combat_miss')
      addLog?.(`⚠️ ${res.message}`)
    }
  }

  const handleSell = (index) => {
    sfx.init()
    sfx.play('turn_alert')
    const res = sellItemToMerchant(playerEntity, index, 0.5)

    if (res.success) {
      onUpdatePlayer?.(res.updatedPlayer)
      addLog?.(res.message)
      if (wsSend) {
        wsSend('token_move', {
          data: {
            id: playerEntity.tableId || playerEntity.id,
            changes: {
              credits: res.updatedPlayer.credits,
              money: res.updatedPlayer.money,
              inventory: res.updatedPlayer.inventory,
            },
          },
        })
        wsSend('chat_message', { text: res.message, timestamp: new Date().toISOString() })
      }
    }
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
        maxHeight: '90vh',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        overflow: 'hidden',
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
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {catalog.name}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {catalog.desc}
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Currency & Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={16} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F59E0B' }}>
              Seu Saldo: {currentCredits} Cr$
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`btn btn-xs ${activeMode === 'buy' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveMode('buy')}
            >
              Comprar
            </button>
            <button
              className={`btn btn-xs ${activeMode === 'sell' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveMode('sell')}
            >
              Vender ({inventory.length})
            </button>
          </div>
        </div>

        {/* Catalog Tabs (Only in buy mode) */}
        {activeMode === 'buy' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(MERCHANT_CATALOGS).map(([k, c]) => (
              <button
                key={k}
                className={`btn btn-xs ${activeCatalogKey === k ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setActiveCatalogKey(k)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
          {activeMode === 'buy' ? (
            catalog.items.map(item => (
              <div
                key={item.id}
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
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.damage && <span style={{ color: '#EF4444' }}>⚔️ Dano: {item.damage}</span>}
                      {item.healHp && <span style={{ color: '#10B981' }}>💚 Cura: +{item.healHp} HP</span>}
                      {item.healEnr && <span style={{ color: '#3B82F6' }}>⚡ Energia: +{item.healEnr}</span>}
                      <span>⚖️ {item.weight} kg</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => handleBuy(item)}
                  disabled={currentCredits < item.cost}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                >
                  <ShoppingCart size={11} /> {item.cost} Cr$
                </button>
              </div>
            ))
          ) : (
            inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sua mochila não possui itens para vender.
              </div>
            ) : (
              inventory.map((item, idx) => {
                const sellValue = Math.max(1, Math.floor((item.cost || 20) * 0.5))
                return (
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
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Valor de Venda (50%)
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => handleSell(idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981' }}
                    >
                      <Coins size={11} /> +{sellValue} Cr$
                    </button>
                  </div>
                )
              })
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar Loja
          </button>
        </div>
      </div>
    </div>
  )
}
