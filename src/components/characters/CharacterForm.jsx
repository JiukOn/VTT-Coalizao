/* CharacterForm.jsx — 4-step wizard for character creation/editing (v4.1) */
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Save, User, Sliders, CheckCircle, Plus, X, Shield, Crown, Swords } from 'lucide-react'
import AttributeDistributor from './AttributeDistributor'
import { createBlankCharacter, ATTRIBUTES, getBonus, getTotalPointsForLevel } from '../../utils/characterUtils'
import { BASE_PERSONALITIES } from '../../data/personalities/index'
import { BASE_AURAS } from '../../data/auras/index'
import { CLASS_DATA } from '../../data/classes/index'
import db from '../../services/database'

// ── Species data ──────────────────────────────────────────────────────────────

const PRIMARY_SPECIES = [
  'Humano', 'Elfo', 'Anão', 'Gigante', 'Kobold', 'Goblin', 'Yomunkai', 'Demônio', 'Anjo',
]

const SECONDARY_SPECIES_EXTRA = ['Planta', 'Gran', 'Monstro', 'Bom']

// Secondary options = all primaries except Anjo + extras. Populated dynamically.
function getSecondaryOptions(primary) {
  const base = PRIMARY_SPECIES.filter(s => s !== 'Anjo' && s !== primary)
  return [...base, ...SECONDARY_SPECIES_EXTRA]
}

// ── Tendency options (Coalizão — grant advantage die) ────────────────────────

const TENDENCY_OPTIONS = [
  'Botânica', 'Estratégia', 'Forja', 'Alquimia', 'Culinária', 'Música',
  'Religião', 'Artes Marciais', 'Caça', 'Furtividade', 'Diplomacia',
  'Comércio', 'Medicina', 'Navegação', 'Herbalismo', 'História', 'Engenharia',
]

const STEP_LABELS = ['Identidade', 'Classe & Atributos', 'Equipamento', 'Revisão']

const EQUIP_SLOTS_DEF = [
  { key: 'cabeca',      label: 'Cabeça',  hint: 'Capacetes, chapéus, elmos' },
  { key: 'pescoco',     label: 'Pescoço', hint: 'Colares, amuletos' },
  { key: 'corpo',       label: 'Corpo',   hint: 'Armaduras, vestimentas' },
  { key: 'maoDireita',  label: 'Mão Dta', hint: 'Arma principal, escudo' },
  { key: 'maoEsquerda', label: 'Mão Esq', hint: 'Arma secundária, tocha' },
  { key: 'cintura',     label: 'Cintura', hint: 'Cintos, bolsas' },
  { key: 'pernas',      label: 'Pernas',  hint: 'Calças, grevas' },
  { key: 'pes',         label: 'Pés',     hint: 'Botas, sandálias' },
]

export default function CharacterForm({ campaignId, onSave, onCancel, editCharacter }) {
  const isEditing = !!editCharacter

  const [step, setStep] = useState(0)
  const [character, setCharacter] = useState(() => {
    if (editCharacter) return { ...createBlankCharacter(campaignId), ...editCharacter }
    return createBlankCharacter(campaignId)
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newAlignment, setNewAlignment] = useState('')

  const totalPoints = useMemo(() => getTotalPointsForLevel(character.level), [character.level])

  // Derived class data
  const classData = useMemo(
    () => CLASS_DATA.find(c => c.id === character.classId) || null,
    [character.classId]
  )

  function updateField(field, value) {
    setCharacter(prev => ({ ...prev, [field]: value }))
  }

  function updateAttributes(attrs) {
    setCharacter(prev => ({ ...prev, attributes: attrs }))
  }

  function handleClassChange(classId) {
    const cd = CLASS_DATA.find(c => c.id === classId)
    setCharacter(prev => ({
      ...prev,
      classId,
      multipliers: cd ? { ...cd.multipliers } : { vit:1, dex:1, crm:1, frc:1, int:1, res:1, pre:1, enr:1 },
      skill1Id: cd?.legacyAbilityId || '',
      skill2Id: '',
      // Lock ENR for Não Classificado
      attributes: cd?.lockEnr
        ? { ...prev.attributes, enr: 0 }
        : prev.attributes,
    }))
  }

  function handlePrimarySpeciesChange(value) {
    setCharacter(prev => ({
      ...prev,
      speciesPrimary: value,
      speciesSecondary: value === 'Anjo' ? '' : prev.speciesSecondary,
      species: value, // keep legacy field in sync
    }))
  }

  function toggleTendency(t) {
    setCharacter(prev => {
      const has = prev.tendencies.includes(t)
      if (has) return { ...prev, tendencies: prev.tendencies.filter(x => x !== t) }
      if (prev.tendencies.length >= 3) return prev
      return { ...prev, tendencies: [...prev.tendencies, t] }
    })
  }

  function addAlignment() {
    const trimmed = newAlignment.trim()
    if (!trimmed) return
    setCharacter(prev => ({ ...prev, alignments: [...(prev.alignments || []), trimmed] }))
    setNewAlignment('')
  }

  function removeAlignment(idx) {
    setCharacter(prev => ({ ...prev, alignments: prev.alignments.filter((_, i) => i !== idx) }))
  }

  function updateEquipSlot(slotKey, value) {
    setCharacter(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [slotKey]: value ? { name: value } : null,
      },
    }))
  }

  function canAdvance() {
    if (step === 0) return character.name.trim().length > 0
    if (step === 1) {
      if (!character.classId) return false
      const used = Object.values(character.attributes).reduce((s, v) => s + v, 0)
      return used === totalPoints
    }
    return true
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const toSave = {
        ...character,
        species: character.speciesPrimary || character.species, // keep legacy field
      }
      if (isEditing && character.id) {
        await db.characters.put(toSave)
      } else {
        await db.characters.add({ ...toSave, createdAt: new Date().toISOString() })
      }
      onSave?.()
    } catch (err) {
      console.error('Erro ao salvar personagem:', err)
      setSaveError('Falha ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="character-form">
      {/* Step indicators */}
      <div className="wizard-steps">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`wizard-step ${i === step ? 'wizard-step-active' : ''} ${i < step ? 'wizard-step-done' : ''}`}
          >
            <div className="wizard-step-dot">
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className="wizard-step-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="wizard-body">
        {step === 0 && (
          <StepIdentity
            character={character}
            updateField={updateField}
            toggleTendency={toggleTendency}
            onPrimarySpeciesChange={handlePrimarySpeciesChange}
            newAlignment={newAlignment}
            setNewAlignment={setNewAlignment}
            addAlignment={addAlignment}
            removeAlignment={removeAlignment}
          />
        )}
        {step === 1 && (
          <StepClassAttributes
            character={character}
            classData={classData}
            updateField={updateField}
            updateAttributes={updateAttributes}
            onClassChange={handleClassChange}
            totalPoints={totalPoints}
          />
        )}
        {step === 2 && (
          <StepEquipment character={character} updateEquipSlot={updateEquipSlot} />
        )}
        {step === 3 && (
          <StepReview character={character} classData={classData} totalPoints={totalPoints} />
        )}
      </div>

      <div className="divider" />
      {saveError && (
        <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', textAlign: 'center', marginBottom: 6 }}>
          ⚠ {saveError}
        </div>
      )}
      <div className="wizard-nav">
        {step > 0 ? (
          <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={16} /> Anterior
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        )}

        {step < 3 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
            Próximo <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !canAdvance()}>
            <Save size={16} /> {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Herói'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Step 1: Identity ──────────────────────────────────────────────────────── */
function StepIdentity({ character, updateField, toggleTendency, onPrimarySpeciesChange, newAlignment, setNewAlignment, addAlignment, removeAlignment }) {
  const secondaryOptions = getSecondaryOptions(character.speciesPrimary)
  const angelSelected = character.speciesPrimary === 'Anjo'

  return (
    <div className="form-grid">
      {/* Name */}
      <div className="form-group">
        <label className="input-label">Nome *</label>
        <input
          className="input"
          value={character.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="Nome do personagem"
        />
      </div>

      {/* Surname */}
      <div className="form-group">
        <label className="input-label">Sobrenome</label>
        <input
          className="input"
          value={character.surname}
          onChange={e => updateField('surname', e.target.value)}
          placeholder="Sobrenome (opcional)"
        />
      </div>

      {/* Age */}
      <div className="form-group">
        <label className="input-label">Idade</label>
        <input
          className="input"
          type="number"
          min={1}
          value={character.age}
          onChange={e => updateField('age', parseInt(e.target.value) || 18)}
        />
      </div>

      {/* Species Primary */}
      <div className="form-group">
        <label className="input-label">Espécie Primária</label>
        <select
          className="input select"
          value={character.speciesPrimary}
          onChange={e => onPrimarySpeciesChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {PRIMARY_SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Species Secondary */}
      <div className="form-group">
        <label className="input-label">
          Espécie Secundária
          {angelSelected && <span style={{ color: 'var(--color-danger)', fontSize: '0.7rem', marginLeft: 4 }}>Anjo = pura</span>}
        </label>
        <select
          className="input select"
          value={character.speciesSecondary}
          onChange={e => updateField('speciesSecondary', e.target.value)}
          disabled={angelSelected || !character.speciesPrimary}
        >
          <option value="">Nenhuma (espécie pura)</option>
          {secondaryOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Personality */}
      <div className="form-group">
        <label className="input-label">Personalidade</label>
        <select
          className="input select"
          value={character.personality}
          onChange={e => updateField('personality', e.target.value)}
        >
          <option value="">Selecione...</option>
          {BASE_PERSONALITIES.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
          ))}
        </select>
      </div>

      {/* Aura */}
      <div className="form-group">
        <label className="input-label">Aura</label>
        <select
          className="input select"
          value={character.aura}
          onChange={e => updateField('aura', e.target.value)}
        >
          <option value="">Nenhuma</option>
          {BASE_AURAS.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Tendencies */}
      <div className="form-group form-group-full">
        <label className="input-label">Tendências (até 3) — concedem dado de vantagem</label>
        <div className="tendency-chips">
          {TENDENCY_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              className={`btn btn-sm ${character.tendencies.includes(t) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleTendency(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alignments — freeform */}
      <div className="form-group form-group-full">
        <label className="input-label">Alinhamentos (personalizados)</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            value={newAlignment}
            onChange={e => setNewAlignment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlignment() } }}
            placeholder='Ex: "Leal ao Rei", "Protetor de Crianças"...'
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addAlignment}>
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(character.alignments || []).map((a, i) => (
            <span
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                borderRadius: 4, padding: '2px 8px', fontSize: '0.8rem',
              }}
            >
              {a}
              <button
                type="button"
                onClick={() => removeAlignment(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {(character.alignments || []).length === 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nenhum alinhamento adicionado.</span>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="form-group form-group-full">
        <label className="input-label">Aparência</label>
        <textarea
          className="input"
          rows={2}
          value={character.appearance}
          onChange={e => updateField('appearance', e.target.value)}
          placeholder="Descreva a aparência do personagem..."
        />
      </div>

      {/* Backstory */}
      <div className="form-group form-group-full">
        <label className="input-label">História (breve, até 2 linhas)</label>
        <textarea
          className="input"
          rows={2}
          maxLength={300}
          value={character.backstory}
          onChange={e => updateField('backstory', e.target.value)}
          placeholder="Resumo da história do personagem..."
        />
      </div>

      {/* Catchphrase */}
      <div className="form-group form-group-full">
        <label className="input-label">Frase característica</label>
        <input
          className="input"
          value={character.catchphrase}
          onChange={e => updateField('catchphrase', e.target.value)}
          placeholder='"Uma frase marcante do personagem..."'
        />
      </div>
    </div>
  )
}

/* ── Step 2: Class & Attributes ─────────────────────────────────────────────── */
function StepClassAttributes({ character, classData, updateField, updateAttributes, onClassChange, totalPoints }) {
  const isUnclassified = classData?.lockEnr === true

  return (
    <div className="step-attributes">
      {/* Class selector */}
      <div className="form-group form-group-full" style={{ marginBottom: 12 }}>
        <label className="input-label">Classe</label>
        <select
          className="input select"
          value={character.classId}
          onChange={e => onClassChange(e.target.value)}
        >
          <option value="">Selecione uma classe...</option>
          {CLASS_DATA.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Class info panel */}
      {classData && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{classData.name}</span>
            {classData.legacyAbilityName && (
              <span style={{ fontSize: '0.72rem', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', borderRadius: 4, padding: '2px 6px' }}>
                Legado: {classData.legacyAbilityName}
              </span>
            )}
            {isUnclassified && (
              <span style={{ fontSize: '0.72rem', background: '#F8717133', color: '#F87171', borderRadius: 4, padding: '2px 6px' }}>
                Sem ENR · Sem habilidades
              </span>
            )}
          </div>

          {/* Multiplier preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {ATTRIBUTES.map(attr => {
              const mult = classData.multipliers[attr.key] || 1
              const baseVal = character.attributes[attr.key] || 0
              const finalVal = Math.floor(baseVal * mult)
              const bonus = getBonus(finalVal)
              const hasBoost = mult > 1
              return (
                <div
                  key={attr.key}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '4px 6px', borderRadius: 5,
                    background: hasBoost ? 'var(--accent-subtle)' : 'transparent',
                    border: `1px solid ${hasBoost ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    opacity: isUnclassified && attr.key === 'enr' ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{attr.abbr}</span>
                  <span style={{ fontSize: '0.7rem', color: hasBoost ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    ×{mult.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {finalVal}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: bonus > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    +{bonus}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Second skill picker */}
      {classData && !isUnclassified && classData.selectableAbilities.length > 0 && (
        <div className="form-group form-group-full" style={{ marginBottom: 12 }}>
          <label className="input-label">
            2ª Habilidade Inicial
            {classData.legacyAbilityName && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                (1ª: {classData.legacyAbilityName} — automática)
              </span>
            )}
          </label>
          <select
            className="input select"
            value={character.skill2Id}
            onChange={e => updateField('skill2Id', e.target.value)}
          >
            <option value="">Selecione uma habilidade...</option>
            {classData.selectableAbilities.map(id => (
              <option key={id} value={id}>
                {id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Attribute distributor */}
      {character.classId && (
        <AttributeDistributor
          attributes={character.attributes}
          onChange={updateAttributes}
          totalPoints={totalPoints}
          lockedAttrs={isUnclassified ? ['enr'] : []}
        />
      )}

      {!character.classId && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
          Selecione uma classe para distribuir atributos.
        </div>
      )}
    </div>
  )
}

/* ── Step 3: Equipment ───────────────────────────────────────────────────────── */
function StepEquipment({ character, updateEquipSlot }) {
  return (
    <div className="step-equipment">
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
        Opcional — preencha os slots com itens iniciais. Pode ser feito a qualquer momento na ficha do personagem.
      </p>
      <div className="equip-slots-grid">
        {EQUIP_SLOTS_DEF.map(slot => {
          const current = character.equipment?.[slot.key]
          return (
            <div key={slot.key} className="equip-slot-row">
              <div className="equip-slot-label">
                <Shield size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{slot.label}</span>
              </div>
              <input
                className="input"
                style={{ fontSize: '0.82rem', height: 30, padding: '4px 8px' }}
                placeholder={slot.hint}
                value={current?.name || ''}
                onChange={e => updateEquipSlot(slot.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 4: Review ──────────────────────────────────────────────────────────── */
function StepReview({ character, classData, totalPoints }) {
  const personalityData = BASE_PERSONALITIES.find(p => p.id === character.personality)

  return (
    <div className="step-review">
      {/* Identity */}
      <div className="review-section">
        <h4 className="card-title"><User size={16} /> Identidade</h4>
        <div className="review-grid">
          <ReviewField label="Nome" value={character.name + (character.surname ? ' ' + character.surname : '')} />
          <ReviewField label="Idade" value={character.age} />
          <ReviewField label="Espécie Primária" value={character.speciesPrimary || '—'} />
          <ReviewField label="Espécie Secundária" value={character.speciesSecondary || 'Nenhuma'} />
          <ReviewField label="Personalidade" value={personalityData?.name || '—'} />
          <ReviewField label="Classe" value={classData?.name || character.classId || '—'} />
        </div>

        {/* Tendencies */}
        {character.tendencies.length > 0 && (
          <div className="review-text">
            <span className="stat-label">Tendências</span>
            <p>{character.tendencies.join(' · ')}</p>
          </div>
        )}

        {/* Alignments */}
        {(character.alignments || []).length > 0 && (
          <div className="review-text">
            <span className="stat-label">Alinhamentos</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {character.alignments.map((a, i) => (
                <span key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 7px', fontSize: '0.8rem' }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {character.catchphrase && (
          <div className="review-text">
            <span className="stat-label">Frase</span>
            <p style={{ fontStyle: 'italic' }}>"{character.catchphrase}"</p>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Attributes */}
      <div className="review-section">
        <h4 className="card-title"><Sliders size={16} /> Atributos ({totalPoints} pontos)</h4>
        <div className="review-attrs">
          {ATTRIBUTES.map(attr => {
            const base = character.attributes[attr.key] || 0
            const mult = character.multipliers[attr.key] || 1
            const final_ = Math.floor(base * mult)
            const bonus = getBonus(final_)
            const isLocked = classData?.lockEnr && attr.key === 'enr'
            return (
              <div key={attr.key} className="review-attr-item" style={{ opacity: isLocked ? 0.4 : 1 }}>
                <span className="attr-abbr">{attr.abbr}</span>
                <span className="stat-value">{base}</span>
                {mult !== 1 && <span className="text-muted">×{mult}={final_}</span>}
                <span className="badge badge-accent">+{bonus}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skills */}
      {classData && !classData.noAbilities && (
        <>
          <div className="divider" />
          <div className="review-section">
            <h4 className="card-title">Habilidades Iniciais</h4>
            <div className="review-grid">
              <ReviewField label="Legado (auto)" value={classData.legacyAbilityName || '—'} />
              <ReviewField
                label="2ª Habilidade"
                value={character.skill2Id
                  ? character.skill2Id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  : '—'}
              />
            </div>
          </div>
        </>
      )}

      {/* Equipment */}
      {Object.values(character.equipment || {}).some(v => v?.name) && (
        <>
          <div className="divider" />
          <div className="review-section">
            <h4 className="card-title"><Shield size={16} /> Equipamento Inicial</h4>
            <div className="review-grid">
              {EQUIP_SLOTS_DEF.filter(s => character.equipment?.[s.key]?.name).map(slot => (
                <ReviewField key={slot.key} label={slot.label} value={character.equipment[slot.key].name} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ReviewField({ label, value }) {
  return (
    <div className="review-field">
      <span className="stat-label">{label}</span>
      <span style={{ fontSize: '0.9rem' }}>{value}</span>
    </div>
  )
}
