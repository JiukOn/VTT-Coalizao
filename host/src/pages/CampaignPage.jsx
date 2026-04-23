/* CampaignPage.jsx — Campaign management page */
import { useState, useEffect } from 'react'
import { BookOpen, Download, Upload, Plus, ChevronDown, ChevronRight, Crown, Minus } from 'lucide-react'
import { db } from '../services/database.js'
import { useCampaign } from '../context/CampaignContext.jsx'
import { exportCampaign, downloadJSON, importCampaign } from '../services/campaignIO.js'
import { getBonus } from '../utils/characterUtils.js'

// ── 5.14 Domain System ────────────────────────────────────────────────────────

const COMMAND_ACTIONS = [
  { id: 'mobilizacao',  name: 'Mobilização de Guerra',  cost: 3, desc: 'Mobiliza tropas e recursos militares. Aumenta defesa do domínio por 3 turnos de campanha.' },
  { id: 'rede',         name: 'Rede de Informação',     cost: 2, desc: 'Ativa agentes de espionagem. Revela planos e movimentos inimigos na região.' },
  { id: 'tributo',      name: 'Tributo Energético',     cost: 2, desc: 'Convoca energia dos súditos. Recupera ENR do líder e dos aliados próximos.' },
  { id: 'ordem',        name: 'Manutenção de Ordem',    cost: 1, desc: 'Estabiliza o território. Remove 1 efeito de Desordem ou Rebelião.' },
  { id: 'producao',     name: 'Esforço de Produção',    cost: 3, desc: 'Acelera produção de recursos. Gera suprimentos e equipamentos para a coalizão.' },
  { id: 'edito',        name: 'Edito de Celebração',    cost: 1, desc: 'Proclama festividade. +2 moral para todos aliados; remove 1 efeito psicológico.' },
]

function DomainPanel({ characters }) {
  const [open, setOpen] = useState(false)
  const [leaderId, setLeaderId] = useState('')
  const [spentPc, setSpentPc] = useState(0)
  const [actionLog, setActionLog] = useState([])

  const leader = characters.find(c => c.id === leaderId) || null

  function getPC(char) {
    if (!char) return 0
    const mult = char.multipliers || {}
    const attrs = char.attributes || {}
    const intVal = Math.floor((attrs.int || 0) * (mult.int || 1))
    const crmVal = Math.floor((attrs.crm || 0) * (mult.crm || 1))
    return getBonus(intVal) + getBonus(crmVal)
  }

  const totalPC = getPC(leader)
  const availPC = Math.max(0, totalPC - spentPc)

  function useAction(action) {
    if (availPC < action.cost) return
    setSpentPc(s => s + action.cost)
    setActionLog(log => [
      { id: Date.now(), action: action.name, cost: action.cost, time: new Date().toLocaleTimeString() },
      ...log.slice(0, 9),
    ])
  }

  function resetPC() {
    setSpentPc(0)
    setActionLog([])
  }

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '2px 0' }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Crown size={16} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Sistema de Domínio (5.14)</span>
        {leader && (
          <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
            {availPC}/{totalPC} PC
          </span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Leader selector */}
          <div>
            <label className="input-label">Líder do Domínio</label>
            <select
              className="input select"
              value={leaderId}
              onChange={e => { setLeaderId(e.target.value); setSpentPc(0); setActionLog([]) }}
            >
              <option value="">Selecione um personagem...</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name} — Nv{c.level}</option>)}
            </select>
          </div>

          {leader && (
            <>
              {/* PC stats */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PC Total</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{totalPC}</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Disponível</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: availPC > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{availPC}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>
                  PC = Bônus INT ({getBonus(Math.floor((leader.attributes?.int||0)*(leader.multipliers?.int||1)))}) + Bônus CRM ({getBonus(Math.floor((leader.attributes?.crm||0)*(leader.multipliers?.crm||1)))})
                </div>
                <button className="btn btn-sm btn-secondary" onClick={resetPC}>Resetar</button>
              </div>

              {/* Command actions */}
              <div>
                <div className="input-label" style={{ marginBottom: 8 }}>Ações de Comando</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {COMMAND_ACTIONS.map(action => (
                    <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{action.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
                      </div>
                      <button
                        className={`btn btn-sm ${availPC >= action.cost ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => useAction(action)}
                        disabled={availPC < action.cost}
                        style={{ flexShrink: 0, minWidth: 56 }}
                      >
                        <Minus size={11} /> {action.cost} PC
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action log */}
              {actionLog.length > 0 && (
                <div>
                  <div className="input-label" style={{ marginBottom: 6 }}>Registro de Ações</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {actionLog.map(entry => (
                      <div key={entry.id} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{entry.time}</span>
                        <span>{entry.action}</span>
                        <span style={{ color: 'var(--color-danger)', marginLeft: 'auto' }}>−{entry.cost} PC</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coalition mechanics */}
              <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', borderRadius: 8, padding: '10px 12px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--accent-primary)' }}>Mecânicas de Coalizão</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: 'var(--text-secondary)' }}>
                  <span>🛡 Formação de Conselho — −0 PC, requer 2+ aliados</span>
                  <span>⚡ Poder de Comando Parcial — delega 1 PC a aliado</span>
                  <span>🤝 Unificação — todos ganham +1 moral por 2 turnos</span>
                  <span>⚠ Dissidência — perde 1 PC por traição detectada</span>
                </div>
              </div>
            </>
          )}

          {!leader && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
              Selecione o líder do domínio para ver os Pontos de Comando e as ações disponíveis.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function CampaignPage() {
  const { activeCampaign } = useCampaign()
  const [sessions, setSessions] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [campaignName, setCampaignName] = useState('')
  const [masterNotes, setMasterNotes] = useState('')

  useEffect(() => {
    setCampaignName(activeCampaign?.name || 'Nova Campanha')
  }, [activeCampaign])

  useEffect(() => {
    async function load() {
      try {
        let data
        if (activeCampaign?.id) {
          data = await db.sessionNotes.where({ campaignId: activeCampaign.id }).toArray()
        } else {
          data = await db.sessionNotes.toArray()
        }
        setSessions(data)
        const chars = activeCampaign?.id
          ? await db.characters.where({ campaignId: activeCampaign.id }).toArray()
          : await db.characters.toArray()
        setCharacters(chars)
      } catch (err) {
        console.error('Failed to load sessions:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCampaign])

  const handleExport = async () => {
    try {
      const data = await exportCampaign(activeCampaign?.id || null)
      downloadJSON(data, `vtp-coalizao-${campaignName.replace(/\s+/g, '-').toLowerCase()}.json`)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const jsonData = JSON.parse(text)
        await importCampaign(jsonData)
        window.location.reload()
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    input.click()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><BookOpen size={24} /> Campanha</h2>
          <p className="page-subtitle">Gerencie sua campanha, sessões e notas.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleImport}>
            <Upload size={16} /> Importar
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} /> Exportar JSON
          </button>
        </div>
      </div>

      {/* Campaign info card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📜 Informações da Campanha</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label className="input-label">Nome da Campanha</label>
            <input
              className="input"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Notas do Mestre</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Anotações secretas do Mestre para a próxima sessão..."
              value={masterNotes}
              onChange={e => setMasterNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="dashboard-section-title">Sessões</h3>
          <button className="btn btn-sm btn-secondary">
            <Plus size={14} /> Nova Sessão
          </button>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Carregando sessões...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhuma sessão registrada ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {sessions.map((session, i) => (
              <div key={session.id} className="entity-card" style={{ flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <div className="entity-avatar" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', width: 32, height: 32, fontSize: '0.9rem' }}>
                    S{session.sessionNumber || i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="entity-card-name" style={{ fontSize: '1rem' }}>{session.title || `Sessão ${session.sessionNumber || i + 1}`}</div>
                    <div className="entity-card-type">
                      {session.date}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {session.content || session.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Domain System (5.14) */}
      <DomainPanel characters={characters} />

      {/* Quick reference */}
      <div className="card" style={{ borderColor: 'var(--accent-active)' }}>
        <div className="card-header">
          <h3 className="card-title">💾 Backup & Segurança</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Seus dados são armazenados localmente no navegador (IndexedDB).
          <strong> Exporte frequentemente</strong> sua campanha em JSON para evitar perda de dados
          ao limpar cache do navegador.
        </p>
      </div>
    </div>
  )
}
