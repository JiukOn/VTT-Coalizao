/* EquipmentSlots.jsx — Visual active equipment slots for character sheet */
import { Swords, Shield, Shirt, Sparkles, X } from 'lucide-react'

const SLOTS = [
  { key: 'mainHand',  label: 'Mão Principal (Arma)', icon: Swords, color: '#38BDF8', defaultDesc: 'Mãos Livres / Desarmado' },
  { key: 'offHand',   label: 'Mão Secundária (Escudo/Foco)', icon: Shield, color: '#818CF8', defaultDesc: 'Vazio' },
  { key: 'armor',     label: 'Traje / Armadura', icon: Shirt, color: '#34D399', defaultDesc: 'Roupas Comuns (CA 10)' },
  { key: 'accessory', label: 'Acessório / Relíquia', icon: Sparkles, color: '#FBBF24', defaultDesc: 'Nenhum' },
]

export default function EquipmentSlots({ equipment = {}, onUnequipSlot }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Equipamento Ativo
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        {SLOTS.map(slot => {
          const item = equipment[slot.key]
          const Icon = slot.icon

          return (
            <div
              key={slot.key}
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${item ? slot.color : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div style={{
                  background: `${slot.color}18`,
                  color: slot.color,
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{slot.label}</span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: item ? 700 : 500,
                    color: item ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item?.name || slot.defaultDesc}
                  </span>
                  {item && (
                    <span style={{ fontSize: '0.68rem', color: slot.color }}>
                      {item.damage ? `Dano: ${item.damage}` : item.ac ? `CA: ${item.ac}` : item.desc || ''}
                    </span>
                  )}
                </div>
              </div>

              {item && onUnequipSlot && (
                <button
                  onClick={() => onUnequipSlot(slot.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Desequipar"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
