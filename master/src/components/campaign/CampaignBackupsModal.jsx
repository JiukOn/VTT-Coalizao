/* CampaignBackupsModal.jsx — 1-Click Campaign Snapshots and Atomic Backups */
import { useState, useEffect, useCallback } from 'react'
import {
  Save, RefreshCw, CheckCircle2, ShieldAlert,
  HardDrive, Clock, FileCheck, Loader2
} from 'lucide-react'

export default function CampaignBackupsModal({ isOpen, onClose }) {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchBackups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/engine/storage/backups')
      if (!res.ok) throw new Error('Falha ao carregar lista de backups do servidor.')
      const data = await res.json()
      setBackups(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchBackups()
    }
  }, [isOpen, fetchBackups])

  if (!isOpen) return null

  const handleCreateSnapshot = async () => {
    setCreating(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/engine/storage/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: 'coalizao',
          campaign_name: 'Campanha Oficial da Coalizão',
        }),
      })
      if (!res.ok) throw new Error('Erro ao gerar snapshot no disco.')
      const data = await res.json()
      setSuccessMsg(`Snapshot criado com sucesso: ${data.filename} (${data.size_kb} KB)`)
      fetchBackups()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

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
          borderRadius: 12, padding: 24, width: 560, maxWidth: '92vw',
          display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--accent-primary-subtle, rgba(155, 89, 232, 0.15))',
              padding: 8, borderRadius: 8, color: 'var(--accent-primary)',
            }}>
              <HardDrive size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Snapshots & Backups de Campanha
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gravação atômica segura anti-corrupção com verificação SHA-256
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem',
            background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid #EF4444',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem',
            background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid #10B981',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle2 size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 8,
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Gera um arquivo <code>.vttpack</code> completo com mapas, fichas e histórico.
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreateSnapshot}
            disabled={creating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            {creating ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
            {creating ? 'Salvando...' : 'Criar Snapshot Agora'}
          </button>
        </div>

        {/* Backups List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Snapshots Salvos em Disco ({backups.length})
            </span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={fetchBackups}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={11} className={loading ? 'spin' : ''} /> Atualizar
            </button>
          </div>

          <div style={{
            maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-subtle)',
            borderRadius: 8, background: 'var(--bg-primary)',
          }}>
            {backups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Nenhum snapshot encontrado. Clique em "Criar Snapshot Agora" para salvar o estado atual.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {backups.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderBottom: idx < backups.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileCheck size={14} style={{ color: '#10B981' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {b.filename}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> {b.created_at ? new Date(b.created_at).toLocaleString() : 'Recente'}
                        </span>
                        <span>·</span>
                        <span>{b.size_kb} KB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
