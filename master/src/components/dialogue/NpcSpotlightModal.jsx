/* NpcSpotlightModal.jsx — Master modal to broadcast cinematic NPC & Creature dialogues */
import { useState, useEffect } from 'react'
import { MessageSquare, Send, X, User, Sparkles, Volume2 } from 'lucide-react'
import { getEntityName } from '@shared/utils/entityFormatting.js'
import { db } from '../../services/database.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function NpcSpotlightModal({
  isOpen,
  onClose,
  initialEntity = null,
  onBroadcastDialogue,
}) {
  const [entities, setEntities] = useState([])
  const [selectedEntityId, setSelectedEntityId] = useState(initialEntity?.id || '')
  const [speechText, setSpeechText] = useState('')
  const [speakerEmotion, setSpeakerEmotion] = useState('neutral') // neutral, angry, mysterious, friendly

  useEffect(() => {
    async function loadEntities() {
      const npcs = await db.npcs.toArray()
      const creatures = await db.creatures.toArray()
      const characters = await db.characters.toArray()
      const all = [
        ...npcs.map(n => ({ ...n, entityType: 'npc' })),
        ...creatures.map(c => ({ ...c, entityType: 'creature' })),
        ...characters.map(h => ({ ...h, entityType: 'hero' })),
      ]
      setEntities(all)
    }
    if (isOpen) loadEntities()
  }, [isOpen])

  if (!isOpen) return null

  const effectiveId = selectedEntityId || initialEntity?.id || (entities[0]?.id ?? '')
  const selectedEntity = entities.find(e => e.id === effectiveId) || initialEntity

  const handleSend = () => {
    if (!speechText.trim() || !selectedEntity) return
    sfx.init()
    sfx.play('notification')

    const payload = {
      speakerId: selectedEntity.id,
      speakerName: getEntityName(selectedEntity.name),
      speakerAvatar: selectedEntity.avatar || selectedEntity.tokenImage || null,
      speakerType: selectedEntity.entityType || 'npc',
      speakerRole: selectedEntity.species || selectedEntity.element || selectedEntity.role || 'Personagem',
      text: speechText.trim(),
      emotion: speakerEmotion,
      timestamp: new Date().toISOString(),
    }

    onBroadcastDialogue?.(payload)
    setSpeechText('')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, width: '100%', maxWidth: 540, padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7',
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Diálogo Cinemático de NPC (Spotlight)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Projeta a fala com o retrato do personagem na tela dos jogadores
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Speaker Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Selecione o Locutor:
          </label>
          <select
            className="input select"
            value={selectedEntityId}
            onChange={e => setSelectedEntityId(e.target.value)}
            style={{ width: '100%' }}
          >
            {entities.map(e => (
              <option key={e.id} value={e.id}>
                [{e.entityType?.toUpperCase()}] {getEntityName(e.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Speaker Preview Card */}
        {selectedEntity && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 10,
            background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: '#3B82F6', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: 16, overflow: 'hidden', flexShrink: 0,
            }}>
              {selectedEntity.avatar ? (
                <img src={selectedEntity.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getEntityName(selectedEntity.name)[0]
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {getEntityName(selectedEntity.name)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedEntity.species || selectedEntity.element || selectedEntity.role || 'NPC Canônico da Coalizão'}
              </div>
            </div>
          </div>
        )}

        {/* Speech Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Texto da Fala ou Narração:
          </label>
          <textarea
            className="input textarea"
            rows={3}
            value={speechText}
            onChange={e => setSpeechText(e.target.value)}
            placeholder="Digite as palavras proferidas pelo personagem..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Emotion Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'neutral', label: '😐 Neutro' },
            { id: 'friendly', label: '😊 Amigável' },
            { id: 'angry', label: '😠 Ameaçador' },
            { id: 'mysterious', label: '🔮 Misterioso' },
          ].map(em => (
            <button
              key={em.id}
              className={`btn btn-sm ${speakerEmotion === em.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSpeakerEmotion(em.id)}
              style={{ fontSize: '0.75rem' }}
            >
              {em.label}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!speechText.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={15} /> Projetar Fala
          </button>
        </div>
      </div>
    </div>
  )
}
