/* NpcQuickGeneratorModal.jsx — Quick procedural NPC and creature generator for Master improvisation */
import { useState } from 'react'
import { Sparkles, Plus, RefreshCw, X, Shield, Swords, Heart, Zap, User } from 'lucide-react'

const ARCHETYPES = [
  {
    id: 'guard',
    name: 'Guarda da Coalizão',
    icon: Shield,
    color: '#3B82F6',
    baseHp: 24,
    baseEnr: 12,
    baseAc: 14,
    type: 'creature',
    category: 'Humanoide',
    attributes: { frc: 14, dex: 12, res: 14, int: 10, crm: 10, vit: 12, pre: 10, enr: 12 },
    action: { name: 'Lança de Energia', type: 'melee', attr: 'frc', bonus: 2, desc: 'Dano 1d4 + 2' },
  },
  {
    id: 'technomage',
    name: 'Tecnomago Renegado',
    icon: Zap,
    color: '#8B5CF6',
    baseHp: 18,
    baseEnr: 22,
    baseAc: 11,
    type: 'creature',
    category: 'Místico',
    attributes: { frc: 8, dex: 14, res: 10, int: 16, crm: 12, vit: 10, pre: 14, enr: 22 },
    action: { name: 'Disparo de Plasma', type: 'ranged', attr: 'int', bonus: 3, desc: 'Dano 1d4 + 3 (Alcance 12m)' },
  },
  {
    id: 'mercenary',
    name: 'Mercenário do Subsolo',
    icon: Swords,
    color: '#F59E0B',
    baseHp: 22,
    baseEnr: 14,
    baseAc: 13,
    type: 'creature',
    category: 'Humanoide',
    attributes: { frc: 12, dex: 16, res: 12, int: 10, crm: 8, vit: 12, pre: 12, enr: 14 },
    action: { name: 'Adagas Duplas', type: 'melee', attr: 'dex', bonus: 3, desc: 'Dano 1d4 + 3' },
  },
  {
    id: 'beast',
    name: 'Fera Mutante',
    icon: Heart,
    color: '#EF4444',
    baseHp: 28,
    baseEnr: 8,
    baseAc: 12,
    type: 'creature',
    category: 'Monstro',
    attributes: { frc: 16, dex: 14, res: 14, int: 4, crm: 6, vit: 14, pre: 8, enr: 8 },
    action: { name: 'Garras Dilacerantes', type: 'melee', attr: 'frc', bonus: 3, desc: 'Dano 1d4 + 3' },
  },
  {
    id: 'informant',
    name: 'Informante / Plebeu',
    icon: User,
    color: '#10B981',
    baseHp: 12,
    baseEnr: 10,
    baseAc: 10,
    type: 'npc',
    category: 'Civil',
    attributes: { frc: 10, dex: 10, res: 10, int: 12, crm: 14, vit: 10, pre: 10, enr: 10 },
    action: { name: 'Soco Desarmado', type: 'melee', attr: 'frc', bonus: 0, desc: 'Dano 1d4' },
  },
]

const FIRST_NAMES = ['Kael', 'Drakar', 'Lyra', 'Vane', 'Torin', 'Zarek', 'Mira', 'Boran', 'Sarix', 'Nyx', 'Orin', 'Corvus']
const SURNAMES = ['Sombra', 'Ferro', 'Cinzento', 'Vórtice', 'Vanguard', 'Nox', 'Lâmina', 'Rift', 'Valt', 'Prisma']

function generateNpc(archetypeId) {
  const arch = ARCHETYPES.find(a => a.id === archetypeId) || ARCHETYPES[0]
  const fname = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const sname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
  const fullName = `${fname} ${sname}`

  // Small random stat variance (+/- 1)
  const variance = Math.floor(Math.random() * 3) - 1
  const hp = Math.max(8, arch.baseHp + variance * 2)
  const enr = Math.max(6, arch.baseEnr + variance)

  return {
    id: crypto.randomUUID(),
    name: `${fullName} (${arch.name})`,
    title: arch.category,
    type: arch.type,
    hp,
    maxHp: hp,
    enr,
    maxEnr: enr,
    ac: arch.baseAc,
    attributes: { ...arch.attributes },
    actions: [{ ...arch.action }],
    conditions: [],
    notes: `Gerado automaticamente pelo Arquétipo: ${arch.name}`,
    mapX: 5,
    mapY: 5,
  }
}

export default function NpcQuickGeneratorModal({ isOpen, onClose, onAddEntity }) {
  const [selectedArch, setSelectedArch] = useState('guard')
  const [generatedNpc, setGeneratedNpc] = useState(() => generateNpc('guard'))

  if (!isOpen) return null

  const handleSelectArch = (id) => {
    setSelectedArch(id)
    setGeneratedNpc(generateNpc(id))
  }

  const handleRegenerate = async () => {
    try {
      const res = await fetch('/api/engine/npc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: Math.floor(Math.random() * 5) + 1 }),
      })
      if (res.ok) {
        const pyNpc = await res.json()
        setGeneratedNpc({
          id: crypto.randomUUID(),
          name: `${pyNpc.name} (${pyNpc.species} ${pyNpc.character_class} Nv ${pyNpc.level})`,
          title: `${pyNpc.species} · ${pyNpc.character_class}`,
          type: 'npc',
          hp: pyNpc.hp_max,
          maxHp: pyNpc.hp_max,
          enr: pyNpc.sp_max,
          maxEnr: pyNpc.sp_max,
          ac: 10 + (pyNpc.attribute_bonuses?.res || 2),
          attributes: pyNpc.attributes,
          actions: [{ name: 'Ataque Padrão', type: 'melee', attr: 'frc', bonus: pyNpc.attribute_bonuses?.frc || 2, desc: `Dano 1d4 + ${pyNpc.attribute_bonuses?.frc || 2}` }],
          conditions: [],
          notes: `${pyNpc.personality}. Tendência: ${pyNpc.tendency}. ${pyNpc.notes}`,
          mapX: 5,
          mapY: 5,
        })
        return
      }
    } catch {
      // Fallback local
    }
    setGeneratedNpc(generateNpc(selectedArch))
  }

  const handleAdd = () => {
    if (onAddEntity) {
      onAddEntity(generatedNpc)
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 580,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: '#F59E0B' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Gerador Rápido de NPCs & Monstros</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Archetype Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Escolha o Arquétipo:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 6 }}>
              {ARCHETYPES.map(arch => {
                const Icon = arch.icon
                const isSel = arch.id === selectedArch
                return (
                  <button
                    key={arch.id}
                    onClick={() => handleSelectArch(arch.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 4px',
                      borderRadius: 6,
                      border: isSel ? `2px solid ${arch.color}` : '1px solid var(--border-subtle)',
                      background: isSel ? `${arch.color}22` : 'var(--bg-primary)',
                      color: isSel ? '#FFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: isSel ? 700 : 500,
                      textAlign: 'center',
                    }}
                  >
                    <Icon size={16} style={{ color: arch.color }} />
                    <span>{arch.name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generated Card Preview */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <input
                  type="text"
                  className="input"
                  value={generatedNpc.name}
                  onChange={e => setGeneratedNpc({ ...generatedNpc, name: e.target.value })}
                  style={{ fontWeight: 700, fontSize: '1rem', width: '100%', marginBottom: 4 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {generatedNpc.title} · {generatedNpc.type === 'creature' ? 'Monstro/Criatura' : 'NPC Civil'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleRegenerate}
                title="Sortear novo nome e variações"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}
              >
                <RefreshCw size={12} /> Sortear
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 6, textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Vida (HP)</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444' }}>{generatedNpc.hp}/{generatedNpc.maxHp}</span>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 6, textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Energia (ENR)</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>{generatedNpc.enr}/{generatedNpc.maxEnr}</span>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 6, textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Armadura (CA)</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>{generatedNpc.ac}</span>
              </div>
            </div>

            {/* Action preview */}
            <div style={{ background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>⚔️ {generatedNpc.actions[0]?.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{generatedNpc.actions[0]?.desc}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Adicionar à Mesa
          </button>
        </div>
      </div>
    </div>
  )
}
