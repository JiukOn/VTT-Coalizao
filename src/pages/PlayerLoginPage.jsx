/* PlayerLoginPage.jsx — Player entry screen (Fase 7A + 7B) */
import { useState } from 'react'
import { Wifi, User, Hash, Server, LogIn, AlertCircle, Globe, Network } from 'lucide-react'

export default function PlayerLoginPage({ onConnect }) {
  const [playerName,   setPlayerName]   = useState('')
  const [campaignCode, setCampaignCode] = useState('')
  const [connecting,   setConnecting]   = useState(false)
  const [error,        setError]        = useState('')

  // Mode: 'local' = LAN/VPN direct, 'relay' = online relay server
  const [mode,        setMode]        = useState('local')
  const [hostAddress, setHostAddress] = useState('localhost')
  const [serverPort,  setServerPort]  = useState('3001')
  const [relayUrl,    setRelayUrl]    = useState('')

  function handleCodeInput(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCampaignCode(val)
  }

  function buildWsUrl() {
    if (mode === 'relay') {
      return relayUrl.trim()
    }
    return `ws://${hostAddress.trim()}:${serverPort}`
  }

  async function handleConnect(e) {
    e.preventDefault()
    setError('')

    if (!playerName.trim()) { setError('Informe seu nome de jogador.'); return }
    if (campaignCode.length !== 6) { setError('O código da campanha deve ter 6 caracteres.'); return }

    if (mode === 'relay') {
      if (!relayUrl.trim()) { setError('Informe a URL do relay (ex: wss://meu-relay.railway.app).'); return }
      if (!/^wss?:\/\/.+/.test(relayUrl.trim())) { setError('URL do relay inválida. Use o formato wss://... ou ws://...'); return }
    } else {
      if (!hostAddress.trim()) { setError('Informe o endereço do servidor.'); return }
    }

    const wsUrl = buildWsUrl()
    setConnecting(true)

    try {
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl)
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error('Tempo limite de conexão atingido.'))
        }, 10000)

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'join',
            playerName: playerName.trim(),
            campaignCode,
          }))
        }

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'pong') return  // ignore keepalive responses
            clearTimeout(timeout)
            if (msg.type === 'welcome') {
              resolve({ ws, msg })
            } else if (msg.type === 'error') {
              ws.close()
              reject(new Error(msg.message || 'Erro ao conectar.'))
            }
          } catch {
            reject(new Error('Resposta inválida do servidor.'))
          }
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error(
            mode === 'relay'
              ? 'Não foi possível conectar ao relay. Verifique a URL e se o servidor está online.'
              : 'Não foi possível conectar. Verifique o endereço e se o servidor está rodando.'
          ))
        }
      }).then(({ ws, msg }) => {
        onConnect({
          ws,
          wsUrl,
          playerId:    msg.playerId,
          playerName:  playerName.trim(),
          campaignCode,
          gameState:   msg.gameState || null,
        })
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8, color: 'var(--accent-primary)' }}>
            ⚔️
          </div>
          <h1 style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.8rem',
            color: 'var(--text-primary)',
            margin: '0 0 4px',
          }}>
            VTP Coalizão
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Modo Jogador — Conecte-se à sessão do Mestre
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => { setMode('local'); setError('') }}
            style={{
              flex: 1, padding: '10px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: mode === 'local' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'local' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
              fontWeight: mode === 'local' ? 700 : 400,
              fontSize: '0.85rem',
              transition: 'background 0.15s',
            }}
          >
            <Network size={14} /> Local (LAN/VPN)
          </button>
          <button
            type="button"
            onClick={() => { setMode('relay'); setError('') }}
            style={{
              flex: 1, padding: '10px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: mode === 'relay' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'relay' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
              fontWeight: mode === 'relay' ? 700 : 400,
              fontSize: '0.85rem',
              transition: 'background 0.15s',
            }}
          >
            <Globe size={14} /> Online (Relay)
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleConnect}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">
              <User size={13} style={{ marginRight: 5 }} />
              Seu Nome
            </label>
            <input
              className="input"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Nome do personagem"
              autoFocus
              maxLength={40}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">
              <Hash size={13} style={{ marginRight: 5 }} />
              Código da Campanha
            </label>
            <input
              className="input"
              value={campaignCode}
              onChange={handleCodeInput}
              placeholder="Ex: GH4K9X"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.3rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
              maxLength={6}
            />
          </div>

          {mode === 'relay' ? (
            /* Online: relay URL */
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">
                <Globe size={13} style={{ marginRight: 5 }} />
                URL do Relay
              </label>
              <input
                className="input"
                type="url"
                value={relayUrl}
                onChange={e => setRelayUrl(e.target.value)}
                placeholder="wss://meu-relay.railway.app"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Peça ao Mestre a URL do relay.
              </span>
            </div>
          ) : (
            /* Local: host address + port */
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="input-label">
                  <Server size={13} style={{ marginRight: 5 }} />
                  Endereço do Mestre
                </label>
                <input
                  className="input"
                  value={hostAddress}
                  onChange={e => setHostAddress(e.target.value)}
                  placeholder="192.168.0.10"
                />
              </div>
              <div className="form-group" style={{ width: 80, margin: 0 }}>
                <label className="input-label">Porta</label>
                <input
                  className="input"
                  type="number"
                  value={serverPort}
                  onChange={e => setServerPort(e.target.value)}
                  min={1024}
                  max={65535}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 12px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 6,
              color: 'var(--color-danger)',
              fontSize: '0.82rem',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={connecting}
            style={{ marginTop: 4, fontSize: '0.95rem', padding: '10px' }}
          >
            {connecting
              ? '⏳ Conectando…'
              : <><LogIn size={16} /> Entrar na Sessão</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {mode === 'relay'
            ? 'Peça a URL do relay e o código ao Mestre da campanha.'
            : 'Peça o endereço e o código ao Mestre da campanha.'}
        </p>
      </div>
    </div>
  )
}
