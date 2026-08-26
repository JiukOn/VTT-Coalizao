/* SessionRecapModal.jsx — Post-session analytics dashboard, combat stats and markdown export */
import { useState } from 'react'
import { BarChart3, Swords, Award, Dices, Copy, Send, Check, X, ShieldAlert, Sparkles } from 'lucide-react'
import { generateSessionMarkdownReport } from '@shared/utils/sessionRecap.js'
import { sfx } from '@shared/utils/sfxPlayer.js'
import { copyToClipboard } from '@shared/utils/clipboard.js'

export default function SessionRecapModal({
  isOpen,
  onClose,
  sessionStats,
  onBroadcastRecap,
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const stats = sessionStats || {
    startTime: new Date().toISOString(),
    totalDamageDealt: 142,
    highestCrit: { damage: 28, attacker: 'Aurelio', target: 'Líder Mutante' },
    totalRollsCount: 38,
    totalCritsCount: 4,
    totalFumblesCount: 1,
    totalXpAwarded: 450,
    totalCreditsLooted: 280,
  }

  const markdownReport = generateSessionMarkdownReport(stats)

  const handleCopy = async () => {
    await copyToClipboard(markdownReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBroadcast = () => {
    sfx.init()
    sfx.play('turn_alert')
    onBroadcastRecap?.(markdownReport)
    onClose()
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
        maxWidth: 500,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Resumo da Sessão & Estatísticas
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Métricas e desempenho do grupo na sessão
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Swords size={22} style={{ color: '#EF4444' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dano Total do Grupo</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.totalDamageDealt} <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>pts</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Sparkles size={22} style={{ color: '#F59E0B' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maior Golpe Crítico</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F59E0B' }}>
                {stats.highestCrit.damage > 0 ? `${stats.highestCrit.damage} pts` : '—'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Dices size={22} style={{ color: '#38BDF8' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rolagens Realizadas</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.totalRollsCount} <span style={{ fontSize: '0.7rem', color: '#10B981' }}>({stats.totalCritsCount} Nat 20)</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Award size={22} style={{ color: '#A855F7' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>XP Distribuído</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#A855F7' }}>
                +{stats.totalXpAwarded} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar Relatório'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleBroadcast}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={14} /> Transmitir no Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
