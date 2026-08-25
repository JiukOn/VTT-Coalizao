/* CreatureForgeModal.jsx — Interactive Creature & Monster Creator for Master */
import { useState, useMemo } from 'react'
import {
  Skull, Sparkles, Shield, Heart, Zap, Swords,
  Save, Dices, Plus, CheckCircle2, ChevronRight
} from 'lucide-react'
import {
  ARCHETYPES,
  calculateCreatureBaseStats,
} from '@shared/utils/creatureForgeUtils.js'
import { db } from '../../services/database.js'

const NAME_PREFIXES = ['Devorador', 'Sentinela', 'Constructo', 'Cérbero', 'Predador', 'Espírito', 'Gárgula', 'Titã', 'Mutante', 'Sombra']
const NAME_SUFFIXES = ['de Plasma', 'do Vazio', 'Sombrio', 'de Cinzas', 'Blindado', 'das Profundezas', 'Ancestral', 'Radioativo', 'do Caos']

export default function CreatureForgeModal({
  isOpen,
  onClose,
  onCreatureCreated = null,
  onInjectToTable = null,
}) {
  const [name, setName] = useState('Predador das Profundezas')
  const [nd, setNd] = useState(2)
  const [archetype, setArchetype] = useState('bruto')
  const [species, setSpecies] = useState('Monstroide')
  const [specialAbility, setSpecialAbility] = useState('Mordida Venenosa (Dano contínuo 1d4)')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const stats = useMemo(() => {
    return calculateCreatureBaseStats(nd, archetype)
  }, [nd, archetype])

  if (!isOpen) return null

  const handleRandomize = () => {
    const p = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]
    const s = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]
    setName(`${p} ${s}`)
    const archKeys = Object.keys(ARCHETYPES)
    setArchetype(archKeys[Math.floor(Math.random() * archKeys.length)])
    setSavedSuccess(false)
  }

  const handleSaveToBestiary = async () => {
    try {
      const creatureObj = {
        name,
        type: 'creature',
        nd: stats.nd,
        xp: stats.xp,
        species,
        archetype: stats.archetype,
        hp: stats.hp,
        maxHp: stats.maxHp,
        energy: stats.energy,
        maxEnergy: stats.maxEnergy,
        defense: stats.defense,
        attributes: stats.attributes,
        attack: stats.attack,
        specialAbility,
        createdAt: new Date().toISOString(),
      }

      const id = await db.creatures.add(creatureObj)
      setSavedSuccess(true)
      onCreatureCreated?.({ id, ...creatureObj })
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.error('Erro ao salvar criatura:', err)
    }
  }

  const handleInject = () => {
    const entity = {
      id: `forge_${Date.now()}`,
      tableId: `token_${Date.now()}`,
      name,
      entityType: 'creature',
      hp: stats.hp,
      maxHp: stats.maxHp,
      energy: stats.energy,
      maxEnergy: stats.maxEnergy,
      defense: stats.defense,
      attributes: stats.attributes,
      nd: stats.nd,
    }
    onInjectToTable?.(entity)
    onClose()
  }

  const threatColor = nd <= 1 ? '#10B981' : nd <= 4 ? '#F59E0B' : nd <= 8 ? '#EF4444' : '#9B59E8'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 350,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 24, width: 620, maxWidth: '94vw', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              padding: 8, borderRadius: 8, color: '#EF4444',
            }}>
              <Skull size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🧙‍♂️ Forja de Criaturas & Monstros (Creature Forge)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Crie e balanceie ameaças para o sistema Coalizão com 1 clique
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>&times;</button>
        </div>

        {/* Basic Info Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <div>
            <label className="input-label">Nome do Monstro / Ameaça</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Titã de Plasma"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary btn-icon"
                onClick={handleRandomize}
                title="Sortear Nome e Arquétipo"
              >
                <Dices size={15} />
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Tipo / Espécie</label>
            <input
              className="input"
              value={species}
              onChange={e => setSpecies(e.target.value)}
              placeholder="Ex: Mutante"
            />
          </div>
        </div>

        {/* Challenge Rating (ND) Slider */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Nível de Desafio (ND)
            </span>
            <div style={{
              background: threatColor, color: '#fff', padding: '2px 8px', borderRadius: 4,
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px',
            }}>
              ND {nd} · {stats.xp} XP
            </div>
          </div>
          <input
            type="range"
            min="0.25"
            max="15"
            step="0.25"
            value={nd}
            onChange={e => setNd(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: threatColor }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>ND 1/4 (Iniciante)</span>
            <span>ND 5 (Veterano)</span>
            <span>ND 10 (Lendário)</span>
            <span>ND 15+ (Colosso)</span>
          </div>
        </div>

        {/* Archetype Selector */}
        <div>
          <label className="input-label">Arquétipo Tático</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
            {Object.values(ARCHETYPES).map(arch => (
              <button
                key={arch.id}
                onClick={() => setArchetype(arch.id)}
                className={`btn btn-sm ${archetype === arch.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '6px 4px', textAlign: 'center' }}
              >
                {arch.name}
              </button>
            ))}
          </div>
        </div>

        {/* Balanced Stats Display */}
        <div style={{
          background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
              <Heart size={13} /> PV
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.hp}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>
              <Zap size={13} /> PE
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.energy}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
              <Shield size={13} /> Defesa
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.defense}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600 }}>
              <Swords size={13} /> Ataque
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              +{stats.attack.bonus} ({stats.attack.damage})
            </div>
          </div>
        </div>

        {/* 8 Attributes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, textAlign: 'center' }}>
          {Object.entries(stats.attributes).map(([attr, val]) => (
            <div
              key={attr}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, padding: '4px 2px',
              }}
            >
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                {attr}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Special Ability Input */}
        <div>
          <label className="input-label">Habilidade Especial ou Magia</label>
          <input
            className="input"
            value={specialAbility}
            onChange={e => setSpecialAbility(e.target.value)}
            placeholder="Ex: Rugido Esmagador (Aterroriza em cone de 6m)"
          />
        </div>

        {savedSuccess && (
          <div style={{
            padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
            background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid #10B981',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle2 size={14} />
            <span>Monstro salvo com sucesso no Bestiário!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Fechar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSaveToBestiary}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={13} /> Salvar no Bestiário
            </button>
            {onInjectToTable && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleInject}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={13} /> Injetar no Combate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
