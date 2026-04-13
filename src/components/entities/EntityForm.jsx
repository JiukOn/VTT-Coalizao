/* EntityForm.jsx — Universal form for creating NPC or Creature */
import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { db } from '../../services/database.js'
import { useCampaign } from '../../context/CampaignContext.jsx'

const NPC_TYPES = ['Aliado', 'Neutro', 'Hostil', 'Comerciante', 'Nobre', 'Guarda', 'Outro']
const CREATURE_TYPES = ['terrestre', 'aquatico', 'voador', 'semi-aquatico']
const CREATURE_SIZES = ['pequeno', 'medio', 'grande', 'colossal']
const CREATURE_DIETS = ['carnivoro', 'herbivoro', 'onivoro']
const ELEMENTS = ['—', 'fogo', 'agua', 'gelo', 'eletrico', 'madeira', 'areia', 'maligno']

export default function EntityForm({ entityType = 'npc', entity = null, onSave, onCancel }) {
  const { activeCampaign } = useCampaign()
  const isEdit = !!entity

  const [form, setForm] = useState(() => {
    if (entity) return { ...entity }
    if (entityType === 'npc') {
      return { name: '', location: '', type: 'Neutro', description: '', notes: '', isCustom: 1 }
    }
    return { name: '', type: 'terrestre', size: 'medio', diet: 'onivoro', element: '', description: '', behavior: 'Territorial', isCustom: 1 }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      if (entityType === 'npc') {
        const data = {
          ...form,
          campaignId: activeCampaign?.id ?? 'coalizao',
          isCustom: 1,
        }
        if (isEdit) {
          await db.npcs.update(entity.id, data)
        } else {
          await db.npcs.add(data)
        }
      } else {
        const data = { ...form, isCustom: 1, element: form.element || null }
        if (isEdit) {
          await db.creatures.update(entity.id, data)
        } else {
          await db.creatures.add(data)
        }
      }
      onSave?.()
    } catch (err) {
      setError('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const isNPC = entityType === 'npc'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 4 }}>
      <div className="form-group">
        <label className="input-label">Nome *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={isNPC ? 'Ex: Guarda Jaya' : 'Ex: Areat'} />
      </div>

      {isNPC ? (
        <>
          <div className="form-group">
            <label className="input-label">Localização</label>
            <input className="input" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Capital dos Elfos, Cidade Caída..." />
          </div>
          <div className="form-group">
            <label className="input-label">Tipo / Relação</label>
            <select className="input select" value={form.type || ''} onChange={e => set('type', e.target.value)}>
              {NPC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="input-label">Tipo</label>
              <select className="input select" value={form.type} onChange={e => set('type', e.target.value)}>
                {CREATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Tamanho</label>
              <select className="input select" value={form.size} onChange={e => set('size', e.target.value)}>
                {CREATURE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Dieta</label>
              <select className="input select" value={form.diet} onChange={e => set('diet', e.target.value)}>
                {CREATURE_DIETS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Elemento</label>
              <select className="input select" value={form.element || ''} onChange={e => set('element', e.target.value === '—' ? '' : e.target.value)}>
                {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label className="input-label">Descrição</label>
        <textarea
          className="input"
          value={form.description || ''}
          onChange={e => set('description', e.target.value)}
          rows={4}
          placeholder="Descrição da entidade..."
          style={{ resize: 'vertical', minHeight: 80 }}
        />
      </div>

      {isNPC && (
        <div className="form-group">
          <label className="input-label">Notas do Mestre</label>
          <textarea
            className="input"
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Notas privadas do Mestre..."
            style={{ resize: 'vertical', minHeight: 60 }}
          />
        </div>
      )}

      {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          <X size={14} /> Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar')}
        </button>
      </div>
    </div>
  )
}
