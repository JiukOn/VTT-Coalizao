/* CharacterSheet.jsx — Full character sheet display */
import { useState } from 'react'
import {
  Heart, Shield, Zap, Swords, Star, Sparkles, Eye,
  Crown, Shirt, Hand, Footprints, CircleDot, Package,
  Clock, ToggleLeft, ToggleRight
} from 'lucide-react'
import { ATTRIBUTES, getBonus } from '../../utils/characterUtils'
import { BASE_AURAS, AURA_RULES } from '@data/auras/index'

const EQUIP_SLOTS = [
  { key: 'cabeca',      label: 'Cabeça',   icon: Crown },
  { key: 'pescoco',     label: 'Pescoço',  icon: CircleDot },
  { key: 'corpo',       label: 'Corpo',    icon: Shirt },
  { key: 'maoDireita',  label: 'Mão Dta',  icon: Swords },
  { key: 'maoEsquerda', label: 'Mão Esq',  icon: Shield },
  { key: 'cintura',     label: 'Cintura',  icon: Hand },
  { key: 'pernas',      label: 'Pernas',   icon: Footprints },
  { key: 'pes',         label: 'Pés',      icon: Footprints },
]

export default function CharacterSheet({ character, onUpdate }) {
  if (!character) return null

  const xpPercent = character.xpMax > 0
    ? Math.min((character.xp / character.xpMax) * 100, 100)
    : 0

  const auraData = BASE_AURAS.find(a => a.id === character.aura || a.name === character.aura)

  function togglePoint(field) {
    onUpdate?.({ ...character, [field]: !character[field] })
  }

  return (
    <div className="character-sheet">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="cs-header">
        <div className="cs-avatar" style={{ background: character.tokenColor || 'var(--accent-primary)' }}>
          {character.tokenImage
            ? <img src={character.tokenImage} alt={character.name} />
            : <span>{character.name?.[0] || '?'}</span>
          }
        </div>
        <div className="cs-identity">
          <h2 className="cs-name">{character.name} {character.surname}</h2>
          <div className="cs-meta">
            {character.classId && <span className="badge badge-accent">{character.classId}</span>}
            {character.species && <span className="badge badge-info">{character.species}</span>}
            <span className="badge badge-warning">Nível {character.level}</span>
          </div>
          <div className="cs-xp-bar">
            <div className="cs-xp-fill" style={{ width: `${xpPercent}%` }} />
            <span className="cs-xp-text">{character.xp}/{character.xpMax} XP</span>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── NPC / Creature Specials ────────────────────── */}
      {character.type === 'npc' && (
        <section className="cs-section bg-soft-info" style={{ borderRadius: '8px', padding: '10px' }}>
          <h3 className="cs-section-title"><Star size={16} /> Detalhes do NPC</h3>
          <div className="cs-npc-details">
            <div className="cs-detail-box">
              <strong>Benefício:</strong> {character.possibleBenefit?.['pt-br'] || character.possibleBenefit || 'Nenhum'}
            </div>
            <div className="cs-detail-box">
              <strong>Malefício:</strong> {character.possibleHarm?.['pt-br'] || character.possibleHarm || 'Nenhum'}
            </div>
          </div>
        </section>
      )}

      {character.type === 'creature' && (
        <section className="cs-section bg-soft-accent" style={{ borderRadius: '8px', padding: '10px' }}>
          <h3 className="cs-section-title"><Zap size={16} /> Dados da Criatura</h3>
          <div className="cs-creature-meta">
            <div className="badge badge-warning">Núcleo: {character.core} (+{
              character.core === 'pequeno' ? 1 : 
              character.core === 'medio' ? 2 : 
              character.core === 'grande' ? 3 : 
              character.core === 'colossal' ? 4 : 0
            } Energia)</div>
            <div className="badge badge-info">Tamanho: {character.size}</div>
            {character.elements?.length > 0 && (
              <div className="cs-elements-list" style={{ marginTop: '5px' }}>
                {character.elements.map(el => <span key={el} className="badge badge-secondary">{el}</span>)}
              </div>
            )}
          </div>
        </section>
      )}

      {(character.type === 'npc' || character.type === 'creature') && <div className="divider" />}

      {/* ── Attributes Grid ─────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Zap size={16} /> Atributos</h3>
        <div className="cs-attr-grid">
          {ATTRIBUTES.map(attr => {
            const base = character.attributes?.[attr.key] || 0
            const mult = character.multipliers?.[attr.key] || 1
            const temp = character.tempModifiers?.[attr.key] || 0
            const final_ = Math.floor(base * mult) + temp
            const bonus = getBonus(final_)
            return (
              <div key={attr.key} className="cs-attr-card">
                <div className="cs-attr-abbr">{attr.abbr}</div>
                <div className="cs-attr-final stat-value">{final_}</div>
                <div className="cs-attr-detail">
                  <span className="text-muted">{base}</span>
                  {mult !== 1 && <span className="text-muted">x{mult}</span>}
                  {temp !== 0 && <span className={temp > 0 ? 'text-success' : 'text-danger'}>{temp > 0 ? '+' : ''}{temp}</span>}
                </div>
                <div className="cs-attr-bonus">+{bonus}</div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ── Special Points ──────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Star size={16} /> Pontos Especiais</h3>
        <div className="cs-special-row">
          <button
            className={`cs-point-toggle ${character.stylePoint ? 'cs-point-active' : ''}`}
            onClick={() => togglePoint('stylePoint')}
            title="Ponto de Estilo"
          >
            {character.stylePoint ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>Ponto de Estilo</span>
            <span className="badge badge-accent">{character.stylePoint ? '1/1' : '0/1'}</span>
          </button>
          <button
            className={`cs-point-toggle ${character.creativityPoint ? 'cs-point-active' : ''}`}
            onClick={() => togglePoint('creativityPoint')}
            title="Ponto de Criatividade"
          >
            {character.creativityPoint ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>Ponto de Criatividade</span>
            <span className="badge badge-accent">{character.creativityPoint ? '1/1' : '0/1'}</span>
          </button>
        </div>
      </section>

      <div className="divider" />

      {/* ── Equipment ───────────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Shield size={16} /> Equipamento</h3>
        <div className="cs-equip-grid">
          {EQUIP_SLOTS.map(slot => {
            const item = character.equipment?.[slot.key]
            const Icon = slot.icon
            return (
              <div key={slot.key} className={`cs-equip-slot ${item ? 'cs-equip-filled' : ''}`}>
                <Icon size={18} />
                <span className="cs-equip-label">{slot.label}</span>
                <span className="cs-equip-item">{item?.name || '—'}</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ── Abilities ───────────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Sparkles size={16} /> Habilidades</h3>
        {character.abilities?.length > 0 ? (
          <div className="cs-ability-list">
            {character.abilities.map((ab, i) => (
              <div key={i} className="cs-ability-item card">
                <div className="cs-ability-name">{ab.name || ab}</div>
                {ab.description && <div className="cs-ability-desc text-muted">{ab.description}</div>}
                {ab.category && <span className="badge badge-accent">{ab.category}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhuma habilidade vinculada.</p>
        )}
      </section>

      <div className="divider" />

      {/* ── Active Effects ──────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Clock size={16} /> Efeitos Ativos</h3>
        {character.activeEffects?.length > 0 ? (
          <div className="cs-effects-list">
            {character.activeEffects.map((ef, i) => (
              <div key={i} className="cs-effect-item">
                <span className="cs-effect-name">{ef.name || ef}</span>
                {ef.duration != null && (
                  <span className="badge badge-warning">{ef.duration} turno{ef.duration !== 1 ? 's' : ''}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhum efeito ativo.</p>
        )}
      </section>

      <div className="divider" />

      {/* ── Inventory ───────────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Package size={16} /> Inventário</h3>
        {character.inventory?.length > 0 ? (
          <div className="cs-inventory-grid">
            {character.inventory.map((item, i) => (
              <div key={i} className="cs-inv-item card">
                <span>{item.name || item}</span>
                {item.quantity > 1 && <span className="badge badge-info">x{item.quantity}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Inventário vazio.</p>
        )}
        <div className="cs-ouris">
          <span className="stat-label">Ouris</span>
          <span className="stat-value">{character.ouris || 0}</span>
        </div>
      </section>

      {/* ── Aura ────────────────────────────────────────── */}
      {(character.aura || auraData) && (
        <>
          <div className="divider" />
          <section className="cs-section">
            <h3 className="cs-section-title"><Eye size={16} /> Aura</h3>
            {auraData ? (
              <div className="cs-aura card">
                <div className="cs-aura-name">{auraData.name}</div>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{auraData.description}</p>
                <div className="cs-aura-meta">
                  <span className="badge badge-accent">{auraData.effect}</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Alcance: {6 + character.level}m | Duração: {AURA_RULES.duration}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>{character.aura}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
