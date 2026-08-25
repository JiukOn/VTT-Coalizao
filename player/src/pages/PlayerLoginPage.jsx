import { useState, useEffect } from 'react'
import { Wifi, User, Hash, Server, LogIn, AlertCircle, Globe, Network, ChevronRight, ChevronDown, ChevronUp, Lock } from 'lucide-react'

export default function PlayerLoginPage({ onConnect }) {
  // Step 1: Server Info
  const [campaignCode, setCampaignCode] = useState('')
  const [connecting,   setConnecting]   = useState(false)
  const [error,        setError]        = useState('')

  // URL State
  const [hasInvite, setHasInvite] = useState(false)

  // Mode: 'local' = LAN/VPN direct, 'relay' = online relay server, 'custom' = custom
  const [mode,        setMode]        = useState('local')
  const [hostAddress, setHostAddress] = useState('localhost')
  const [serverPort,  setServerPort]  = useState('3001')
  const [relayUrl,    setRelayUrl]    = useState('')
  const [customServerUrl, setCustomServerUrl] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Step 2: Character Selection & Password
  const [step, setStep] = useState(1) // 1: Server, 2: Character Selection
  const [availableCharacters, setAvailableCharacters] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [characterPassword, setCharacterPassword] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeParam = params.get('code') || params.get('room')
    const nameParam = params.get('name')
    const serverParam = params.get('server')

    if (codeParam) {
      setCampaignCode(codeParam.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
      setHasInvite(true)
    }
    if (nameParam) {
      setPlayerName(nameParam)
    }
    if (serverParam) {
      setCustomServerUrl(serverParam)
      setMode('custom')
      setShowAdvanced(true)
    }
  }, [])

  function handleCodeInput(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCampaignCode(val)
  }

  function buildWsUrl() {
    if (mode === 'custom' && customServerUrl.trim()) {
      return customServerUrl.trim()
    }
    if (mode === 'relay') {
      return relayUrl.trim()
    }
    return `ws://${hostAddress.trim()}:${serverPort}`
  }

  // Phase 1: Connect to server to fetch available characters
  async function handleFetchCharacters(e) {
    e.preventDefault()
    setError('')

    if (campaignCode.length !== 6) { setError('O código da campanha deve ter 6 caracteres.'); return }

    if (mode === 'custom') {
      if (!customServerUrl.trim()) { setError('Informe a URL customizada do servidor.'); return }
      if (!/^wss?:\/\/.+/.test(customServerUrl.trim())) { setError('URL customizada inválida. Use o formato wss://... ou ws://...'); return }
    } else if (mode === 'relay') {
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
        }, 8000)

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'get_characters',
            campaignCode,
          }))
        }

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'pong') return
            clearTimeout(timeout)
            
            if (msg.type === 'character_list') {
              ws.close() // Close the temporary connection
              resolve(msg.characters)
            } else if (msg.type === 'error') {
              ws.close()
              reject(new Error(msg.message || 'Erro ao conectar.'))
            }
          } catch {
            ws.close()
            reject(new Error('Resposta inválida do servidor.'))
          }
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error(
            mode === 'relay' || mode === 'custom'
              ? 'Não foi possível conectar ao servidor remoto. Verifique a URL e se o servidor está online.'
              : 'Não foi possível conectar. Verifique o endereço e se o servidor está rodando.'
          ))
        }
      }).then((chars) => {
        const normalized = (chars || []).map(c => {
          if (typeof c === 'string') return { id: c, name: c, hasPassword: false }
          return c
        })
        setAvailableCharacters(normalized)
        if (normalized.length > 0) {
          setPlayerName(normalized[0].name)
          setSelectedCharacterId(normalized[0].id || '')
        }
        setStep(2)
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  // Find currently selected character object
  const activeChar = availableCharacters.find(c =>
    (selectedCharacterId && String(c.id) === String(selectedCharacterId)) ||
    c.name === playerName
  )

  // Phase 2: Actual Join
  async function handleJoin(e) {
    e.preventDefault()
    setError('')

    if (!playerName.trim()) { setError('Selecione ou informe um personagem.'); return }

    if (activeChar?.hasPassword && !characterPassword.trim()) {
      setError('Este personagem é protegido por senha. Informe a senha/PIN para continuar.')
      return
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
            characterId: selectedCharacterId || undefined,
            characterPassword: characterPassword.trim() || undefined,
          }))
        }

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'pong') return
            clearTimeout(timeout)
            if (msg.type === 'welcome') {
              resolve({ ws, msg })
            } else if (msg.type === 'error') {
              ws.close()
              reject(new Error(msg.message || 'Erro ao entrar na sessão.'))
            }
          } catch {
            reject(new Error('Resposta inválida do servidor.'))
          }
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('A conexão falhou. O servidor pode ter caído.'))
        }
      }).then(({ ws, msg }) => {
        onConnect({
          ws,
          wsUrl,
          playerId:    msg.playerId,
          playerName:  playerName.trim(),
          campaignCode,
          gameState:   msg.gameState  || null,
          mapState:    msg.mapState   || null,
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
            VTT Coalizao
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Modo Jogador — Conecte-se à sessão do Mestre
          </p>
        </div>

        {hasInvite && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            color: 'var(--text-primary)',
            textAlign: 'center',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            <Wifi size={16} style={{ color: '#3b82f6' }} />
            <span>Entrando na sessão <strong>{campaignCode}</strong> via convite</span>
          </div>
        )}

        {step === 1 ? (
          <>
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

            {/* Form Step 1 */}
            <form
              onSubmit={handleFetchCharacters}
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
              ) : mode === 'custom' ? null : (
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

              {/* Advanced Options Accordion */}
              <div style={{ marginTop: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                    fontSize: '0.85rem', padding: 0
                  }}
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Opções Avançadas
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="input-label">
                        <Server size={13} style={{ marginRight: 5 }} />
                        URL do Servidor Customizado
                      </label>
                      <input
                        className="input"
                        value={customServerUrl}
                        onChange={e => {
                          setCustomServerUrl(e.target.value)
                          if (e.target.value) setMode('custom')
                          else setMode('local') // fallback
                        }}
                        placeholder="ws://meuservidor.com:4000"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Substitui as configurações de Local ou Relay.
                      </span>
                    </div>
                  </div>
                )}
              </div>

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
                  : <>Buscar Personagens <ChevronRight size={16} /></>
                }
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {mode === 'custom' 
                ? 'Conectando-se ao servidor customizado.'
                : mode === 'relay'
                ? 'Peça ao Mestre a URL do relay e o código da sessão.'
                : 'Peça ao Mestre o endereço do servidor e o código da sessão.'}
            </p>
          </>
        ) : (
          /* Form Step 2: Select Character */
          <form
            onSubmit={handleJoin}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>Conectado a {campaignCode}</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">
                <User size={13} style={{ marginRight: 5 }} />
                Selecione seu Personagem
              </label>
              
              {availableCharacters.length > 0 ? (
                <select 
                  className="input" 
                  value={selectedCharacterId || playerName} 
                  onChange={e => {
                    const char = availableCharacters.find(c => String(c.id) === e.target.value || c.name === e.target.value)
                    if (char) {
                      setPlayerName(char.name)
                      setSelectedCharacterId(char.id || '')
                    } else {
                      setPlayerName(e.target.value)
                      setSelectedCharacterId(e.target.value)
                    }
                    setCharacterPassword('')
                    setError('')
                  }}
                  style={{ fontSize: '0.95rem', padding: '10px' }}
                >
                  {availableCharacters.map(char => (
                    <option key={char.id || char.name} value={char.id || char.name}>
                      {char.hasPassword ? '🔒 ' : '🔓 '}
                      {char.name} {char.classId ? `(${char.classId} · Nv ${char.level || 1})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Nome do Personagem (Mestre não listou nenhum)"
                  autoFocus
                  maxLength={40}
                />
              )}
            </div>

            {/* Password input when character is protected */}
            {activeChar?.hasPassword && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  <Lock size={13} style={{ marginRight: 5 }} />
                  Senha do Personagem (PIN)
                </label>
                <input
                  className="input"
                  type="password"
                  value={characterPassword}
                  onChange={e => setCharacterPassword(e.target.value)}
                  placeholder="Digite a senha deste herói"
                  autoFocus
                  style={{ fontSize: '1rem', padding: '10px' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Este herói foi protegido pelo Mestre com senha.
                </span>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setStep(1); setCharacterPassword(''); setError('') }}
                disabled={connecting}
                style={{ padding: '10px' }}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={connecting}
                style={{ flex: 1, fontSize: '0.95rem', padding: '10px' }}
              >
                {connecting
                  ? '⏳ Entrando…'
                  : <><LogIn size={16} /> Entrar na Sessão</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
