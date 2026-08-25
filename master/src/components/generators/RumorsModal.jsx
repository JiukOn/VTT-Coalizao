/* RumorsModal.jsx — Master tool to generate tavern rumors, urban gossip and adventure hooks */
import { useState } from 'react'
import { MessageSquareQuote, Shuffle, Send, X, ShieldAlert, Award, Compass } from 'lucide-react'
import { generateRandomRumor, RUMOR_CATEGORIES } from '@shared/utils/tavernRumors.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function RumorsModal({ isOpen, onClose, onBroadcastMessage }) {
  const [category, setCategory] = useState('all')
  const [currentRumor, setCurrentRumor] = useState(() => generateRandomRumor('all'))

  if (!isOpen) return null

  const handleGenerate = () => {
    sfx.init()
    sfx.play('dice_roll')
    setCurrentRumor(generateRandomRumor(category))
  }

  const handleSendToChat = (isSecret = false) => {
    sfx.init()
    sfx.play('turn_alert')
    const chatText = `📜 **Boato de Taverna**: "${currentRumor.text}"`
    onBroadcastMessage?.(chatText, isSecret)
    onClose()
  }

  const veracityColors = {
    'Verdadeiro': '#10B981',
    'Exagerado': '#F59E0B',
    'Falso/Emboscada': '#EF4444',
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
        maxWidth: 480,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageSquareQuote size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Rumores de Taverna & Ganchos
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Boatos procedurais para enriquecer o roleplay
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {RUMOR_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id)
                setCurrentRumor(generateRandomRumor(cat.id))
              }}
              className={`btn btn-xs ${category === cat.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Rumor Card */}
        {currentRumor && (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Rumor Quote */}
            <div style={{
              fontSize: '0.95rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              fontStyle: 'italic',
            }}>
              "{currentRumor.text}"
            </div>

            {/* Meta tags (Veracity & Hook) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Veracidade (Só Mestre):</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: `${veracityColors[currentRumor.veracity] || '#38BDF8'}20`,
                  color: veracityColors[currentRumor.veracity] || '#38BDF8',
                  border: `1px solid ${veracityColors[currentRumor.veracity] || '#38BDF8'}44`,
                }}>
                  {currentRumor.veracity}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Compass size={12} /> Gancho de Aventura:
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {currentRumor.hook}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Award size={12} /> Recompensa Sugerida:
                </div>
                <div style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 600 }}>
                  {currentRumor.rewardEstimate}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerate}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shuffle size={14} /> Sortear Outro
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSendToChat(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={14} /> Revelar no Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
