/* CraftingModal.jsx — Interactive weapon workshop and attachments customization modal */
import { Wrench, Plus, Trash2, X } from 'lucide-react'
import { WEAPON_ATTACHMENTS, installWeaponAttachment, removeWeaponAttachment } from '@shared/utils/craftingWorkshop.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function CraftingModal({
  isOpen,
  onClose,
  playerEntity,
  onUpdatePlayer,
  addLog,
  wsSend,
}) {
  if (!isOpen || !playerEntity) return null

  const mainHandWeapon = playerEntity.equipment?.mainHand || null
  const currentCredits = playerEntity.money ?? playerEntity.credits ?? 0
  const attachments = Array.isArray(mainHandWeapon?.attachments) ? mainHandWeapon.attachments : []

  const handleInstall = (attachmentId) => {
    if (!mainHandWeapon) return
    const attachment = WEAPON_ATTACHMENTS[attachmentId]
    if (!attachment) return

    if (currentCredits < attachment.cost) {
      sfx.init()
      sfx.play('combat_miss')
      addLog?.(`⚠️ Créditos insuficientes para instalar ${attachment.name} (${attachment.cost} Cr$).`)
      return
    }

    sfx.init()
    sfx.play('turn_alert')
    const res = installWeaponAttachment(mainHandWeapon, attachmentId)

    if (res.success) {
      const nextCredits = currentCredits - attachment.cost
      const updatedPlayer = {
        ...playerEntity,
        money: nextCredits,
        credits: nextCredits,
        equipment: {
          ...(playerEntity.equipment || {}),
          mainHand: res.updatedWeapon,
        },
      }
      onUpdatePlayer?.(updatedPlayer)
      addLog?.(res.message)
      if (wsSend) {
        wsSend('token_move', {
          data: {
            id: playerEntity.tableId || playerEntity.id,
            changes: {
              credits: nextCredits,
              money: nextCredits,
              equipment: updatedPlayer.equipment,
            },
          },
        })
        wsSend('chat_message', { text: res.message, timestamp: new Date().toISOString() })
      }
    }
  }

  const handleRemove = (attachmentId) => {
    if (!mainHandWeapon) return
    sfx.init()
    sfx.play('turn_alert')
    const res = removeWeaponAttachment(mainHandWeapon, attachmentId)

    if (res.success) {
      const updatedPlayer = {
        ...playerEntity,
        equipment: {
          ...(playerEntity.equipment || {}),
          mainHand: res.updatedWeapon,
        },
      }
      onUpdatePlayer?.(updatedPlayer)
      addLog?.(res.message)
      if (wsSend) {
        wsSend('token_move', {
          data: {
            id: playerEntity.tableId || playerEntity.id,
            changes: {
              equipment: updatedPlayer.equipment,
            },
          },
        })
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
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Wrench size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Oficina de Armamentos & Customização
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Instalação de miras, supressores e canos táticos
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Weapon Info */}
        {!mainHandWeapon ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Nenhuma arma equipada na mão principal para customizar.
          </div>
        ) : (
          <>
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ⚔️ {mainHandWeapon.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Bônus de Ataque: +{mainHandWeapon.attackBonus || 0} | Munição: {mainHandWeapon.currentAmmo ?? 12}/{mainHandWeapon.ammoCapacity ?? 12}
                </div>
              </div>

              <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>
                {currentCredits} Cr$
              </span>
            </div>

            {/* Attachments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {Object.entries(WEAPON_ATTACHMENTS).map(([k, att]) => {
                const isInstalled = attachments.some(a => a.id === k)
                return (
                  <div
                    key={k}
                    style={{
                      background: 'var(--bg-primary)',
                      border: isInstalled ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{att.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {att.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {att.desc}
                        </div>
                      </div>
                    </div>

                    {isInstalled ? (
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => handleRemove(k)}
                        style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Trash2 size={12} /> Remover
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleInstall(k)}
                        disabled={currentCredits < att.cost}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Plus size={12} /> Instalar ({att.cost} Cr$)
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar Oficina
          </button>
        </div>
      </div>
    </div>
  )
}
