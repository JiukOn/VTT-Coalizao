/* ServerPage.jsx — Host server control panel (Fase 7A + 7B) */
import { useState } from 'react'
import {
  Wifi, WifiOff, Users, Copy, RefreshCw, Server, Check,
  AlertCircle, Loader, Globe, Network,
} from 'lucide-react'
import { useServer } from '../context/ServerContext.jsx'
import { WS_STATUS } from '../hooks/useWebSocket.js'

const STATUS_CONFIG = {
  [WS_STATUS.DISCONNECTED]: { label: 'Desconectado', color: 'var(--text-muted)',    icon: WifiOff,     cls: '' },
  [WS_STATUS.CONNECTING]:   { label: 'Conectando…',  color: 'var(--color-warning)', icon: Loader,      cls: 'spin' },
  [WS_STATUS.CONNECTED]:    { label: 'Online',        color: 'var(--color-success)', icon: Wifi,        cls: '' },
  [WS_STATUS.ERROR]:        { label: 'Erro',          color: 'var(--color-danger)',  icon: AlertCircle, cls: '' },
}

export default function ServerPage() {
  const {
    status, sessionCode, players,
    serverPort, setServerPort, connect,
    relayMode, setRelayMode, relayUrl, setRelayUrl, connectViaRelay,
    disconnect, requestNewCode,
  } = useServer()

  const [portInput,   setPortInput]   = useState(String(serverPort))
  const [relayInput,  setRelayInput]  = useState(relayUrl || '')
  const [copied,      setCopied]      = useState(false)
  const [copiedUrl,   setCopiedUrl]   = useState(false)

  const isConnected = status === WS_STATUS.CONNECTED
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG[WS_STATUS.DISCONNECTED]
  const Icon = cfg.icon

  function handleConnect() {
    if (relayMode) {
      const url = relayInput.trim()
      if (!url) return
      setRelayUrl(url)
      connectViaRelay(url)
    } else {
      const port = parseInt(portInput, 10) || 3001
      setServerPort(port)
      connect(port)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(sessionCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyPlayerUrl() {
    navigator.clipboard.writeText(playerUrl).catch(() => {})
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Player connection URL changes depending on mode
  const playerUrl = relayMode
    ? `${relayInput.replace(/^ws/, 'http')}/#/player`   // show HTTP equivalent for info
    : `http://{ip}:${portInput}/#/player`

  const relayWsLabel = relayInput.startsWith('wss://') ? relayInput
    : relayInput ? relayInput : 'wss://seu-relay.railway.app'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Server size={24} /> Servidor</h2>
          <p className="page-subtitle">
            {relayMode
              ? 'Modo Online — conecte jogadores pela internet via Relay.'
              : 'Modo Local — conecte jogadores via LAN ou VPN na mesma rede.'}
          </p>
        </div>
        {/* Status badge */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20,
          background: 'var(--bg-tertiary)',
          border: `1px solid ${cfg.color}`,
          color: cfg.color, fontWeight: 600, fontSize: '0.85rem',
        }}>
          <Icon size={14} className={cfg.cls} />
          {cfg.label}
        </span>
      </div>

      {/* ── Mode toggle ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>Modo:</span>
          <button
            className={`btn btn-sm ${!relayMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { if (relayMode) { disconnect(); setRelayMode(false) } }}
            disabled={isConnected && !relayMode}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Network size={13} /> Local (LAN/VPN)
          </button>
          <button
            className={`btn btn-sm ${relayMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { if (!relayMode) { disconnect(); setRelayMode(true) } }}
            disabled={isConnected && relayMode}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Globe size={13} /> Online (Relay)
          </button>
        </div>
      </div>

      {/* ── Connection card ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {relayMode ? '🌐 Conexão Online' : '⚙️ Conexão Local'}
          </h3>
        </div>

        {relayMode ? (
          /* Relay mode: input for WSS URL */
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 260 }}>
              <label className="input-label">URL do Relay (wss://)</label>
              <input
                className="input"
                type="url"
                value={relayInput}
                onChange={e => setRelayInput(e.target.value)}
                placeholder="wss://seu-relay.railway.app"
                disabled={isConnected}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isConnected ? (
                <button
                  className="btn btn-primary"
                  onClick={handleConnect}
                  disabled={status === WS_STATUS.CONNECTING || !relayInput.trim()}
                >
                  <Globe size={15} /> Conectar ao Relay
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={disconnect}>
                  <WifiOff size={15} /> Desconectar
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Local mode: port input */
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '0 0 140px', margin: 0 }}>
              <label className="input-label">Porta do Servidor</label>
              <input
                className="input"
                type="number"
                value={portInput}
                onChange={e => setPortInput(e.target.value)}
                disabled={isConnected}
                min={1024} max={65535}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isConnected ? (
                <button
                  className="btn btn-primary"
                  onClick={handleConnect}
                  disabled={status === WS_STATUS.CONNECTING}
                >
                  <Wifi size={15} /> Conectar ao Servidor
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={disconnect}>
                  <WifiOff size={15} /> Desconectar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Instructions when disconnected */}
        {!isConnected && (
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: 'var(--bg-tertiary)', borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            {relayMode ? (
              <>
                <strong style={{ color: 'var(--text-primary)' }}>Como usar o Relay:</strong>
                <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Faça deploy da pasta <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>relay/</code> no Railway, Render ou Fly.io</li>
                  <li>Cole a URL WebSocket acima (ex: <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>wss://meu-relay.railway.app</code>)</li>
                  <li>Compartilhe o código de sessão com os jogadores</li>
                  <li>Jogadores acessam <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>{"/#/player"}</code> em qualquer navegador</li>
                </ol>
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--text-primary)' }}>Como iniciar o servidor:</strong>
                <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Abra um terminal separado na pasta do projeto</li>
                  <li>Execute: <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>npm run server</code></li>
                  <li>Clique em "Conectar ao Servidor" acima</li>
                </ol>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Session code card ────────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔑 Código da Sessão</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={requestNewCode}
              title="Gerar novo código"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={13} /> Novo Código
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.4rem',
              fontWeight: 900,
              letterSpacing: '0.25em',
              color: 'var(--accent-primary)',
              flex: 1,
            }}>
              {sessionCode || '——'}
            </div>
            <button
              className="btn btn-secondary"
              onClick={copyCode}
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}
            >
              {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Compartilhe este código com os jogadores para que possam entrar na sessão.
          </p>
        </div>
      )}

      {/* ── Player access card ───────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🌐 Acesso dos Jogadores</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={copyPlayerUrl}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {copiedUrl ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar URL</>}
            </button>
          </div>

          {relayMode ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                Jogadores acessam o relay em qualquer navegador. Compartilhe a URL e o código:
              </p>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                background: 'var(--bg-tertiary)', padding: '10px 14px',
                borderRadius: 8, border: '1px solid var(--border-subtle)',
                color: 'var(--accent-primary)', wordBreak: 'break-all',
              }}>
                {relayWsLabel.replace(/^wss?:\/\//, 'https://')}/#/player
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                No campo "Relay URL" do login do jogador, insira: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{relayWsLabel}</strong>
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                Os jogadores devem acessar este endereço no navegador (substitua {'{ip}'} pelo IP desta máquina):
              </p>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                background: 'var(--bg-tertiary)', padding: '10px 14px',
                borderRadius: 8, border: '1px solid var(--border-subtle)',
                color: 'var(--accent-primary)', wordBreak: 'break-all',
              }}>
                {playerUrl}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Para VPN: use o IP do Hamachi/ZeroTier/Tailscale em vez do IP local.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Connected players ─────────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="dashboard-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <h3 className="dashboard-section-title" style={{ margin: 0 }}>
              <Users size={16} style={{ marginRight: 6 }} />
              Jogadores Conectados
            </h3>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700,
              background: players.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
              color: players.length > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              padding: '2px 8px', borderRadius: 12,
            }}>
              {players.length}{relayMode ? '/8' : ''}
            </span>
          </div>

          {players.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              Aguardando jogadores…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {players.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem',
                  }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.id.slice(0, 8)}…
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--color-success)',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
                    Online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Info card ─────────────────────────────────────────────────────────────── */}
      <div className="card" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="card-header">
          <h3 className="card-title">ℹ️ Informações</h3>
        </div>
        {relayMode ? (
          <ul style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>O relay server não armazena nenhum dado de campanha — é apenas um roteador de mensagens.</li>
            <li>Os dados ficam exclusivamente no seu computador (Host).</li>
            <li>Suporta até <strong>8 jogadores simultâneos</strong> por sessão.</li>
            <li>Funciona com qualquer conexão à internet, sem necessidade de VPN.</li>
            <li>O código da sessão pode ser mantido entre reconexões no mesmo relay.</li>
          </ul>
        ) : (
          <ul style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>O servidor roda localmente no seu PC — nenhum dado é enviado para a internet.</li>
            <li>Para conexões externas (fora da LAN), use <strong>Hamachi</strong>, <strong>ZeroTier</strong> ou <strong>Tailscale</strong>.</li>
            <li>O código da sessão expira quando o servidor é reiniciado.</li>
            <li>Jogadores acessam a visão restrita apenas ao próprio personagem.</li>
          </ul>
        )}
      </div>
    </div>
  )
}
