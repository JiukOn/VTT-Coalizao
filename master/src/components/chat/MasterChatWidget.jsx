/* MasterChatWidget.jsx — Master Chat & Communications console with whisper and dice support */
import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Trash2 } from 'lucide-react'
import { useServer } from '../../context/ServerContext.jsx'
import { parseChatDiceCommand, formatDiceResult } from '@shared/utils/chatParser.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function MasterChatWidget() {
  const { broadcast, players = [], serverOnline } = useServer()
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_master_chat') || '[]')
    } catch {
      return []
    }
  })
  const [inputText, setInputText] = useState('')
  const [whisperTarget, setWhisperTarget] = useState('all') // 'all' | playerName
  const chatEndRef = useRef(null)

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vtt_master_chat', JSON.stringify(messages.slice(-100)))
    } catch { /* ignore */ }
  }, [messages])

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for incoming messages from ServerContext custom events
  useEffect(() => {
    const handleIncoming = (e) => {
      const msg = e.detail
      if (!msg) return
      const isRoll = msg.type === 'dice_roll'
      const isChat = msg.type === 'chat_message'

      if (isChat) {
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          sender: msg.sender || msg.from || 'Jogador',
          text: msg.text || '',
          isWhisper: msg.isWhisper || false,
          target: msg.target || null,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'chat',
        }])
      } else if (isRoll) {
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          sender: msg.from || msg.data?.playerName || 'Jogador',
          text: `🎲 Rolou ${msg.data?.diceType || 'd20'}: ${msg.data?.result || '?'}${msg.data?.advantage ? ' (vantagem)' : ''}`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'roll',
          result: msg.data?.result,
        }])
      }
    }

    window.addEventListener('vtp:chat_message', handleIncoming)
    window.addEventListener('vtp:dice_roll', handleIncoming)
    return () => {
      window.removeEventListener('vtp:chat_message', handleIncoming)
      window.removeEventListener('vtp:dice_roll', handleIncoming)
    }
  }, [])

  const handleSend = (e) => {
    e?.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    // 1. Check for dice roll command (/r 1d20, /roll 1d4, etc.)
    const parsedDice = parseChatDiceCommand(trimmed)
    if (parsedDice) {
      sfx.play('dice_roll')
      const formatted = formatDiceResult(parsedDice)
      const rollMsg = {
        id: Date.now() + Math.random(),
        sender: 'Mestre',
        text: `🎲 ${formatted.fullText}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'roll',
      }
      setMessages(prev => [...prev, rollMsg])
      if (serverOnline) {
        broadcast('chat_message', {
          sender: 'Mestre',
          text: `🎲 ${formatted.fullText}`,
          timestamp: new Date().toISOString(),
        })
      }
      setInputText('')
      return
    }

    // 2. Regular message or whisper
    const isWhisper = whisperTarget !== 'all' || trimmed.startsWith('/w ') || trimmed.startsWith('/whisper ')
    let cleanText = trimmed
    let target = whisperTarget !== 'all' ? whisperTarget : null

    if (trimmed.startsWith('/w ') || trimmed.startsWith('/whisper ')) {
      const parts = trimmed.split(' ')
      target = parts[1]
      cleanText = parts.slice(2).join(' ')
    }

    const newMsg = {
      id: Date.now() + Math.random(),
      sender: 'Mestre',
      text: cleanText,
      isWhisper,
      target,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'chat',
    }

    setMessages(prev => [...prev, newMsg])

    if (serverOnline) {
      broadcast('chat_message', {
        sender: 'Mestre',
        text: cleanText,
        isWhisper,
        target,
        timestamp: new Date().toISOString(),
      })
    }

    setInputText('')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        fontWeight: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={13} color="var(--accent-primary)" />
          <span>Chat & Comunicações</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Target selector */}
          <select
            className="input select"
            style={{ fontSize: '0.7rem', padding: '2px 6px', height: 22 }}
            value={whisperTarget}
            onChange={e => setWhisperTarget(e.target.value)}
          >
            <option value="all">📢 Todos (Público)</option>
            {players.map(p => (
              <option key={p.name} value={p.name}>🤫 Sussurrar para {p.name}</option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-icon"
            style={{ width: 20, height: 20 }}
            onClick={() => setMessages([])}
            title="Limpar mensagens"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: '0.78rem',
      }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '0.75rem' }}>
            Nenhuma mensagem enviada ou recebida ainda.<br />
            Digite abaixo ou use <code>/r 1d20+bonus</code> para rolagens no chat.
          </div>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                background: m.isWhisper ? 'rgba(168, 85, 247, 0.12)' : m.type === 'roll' ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-tertiary)',
                borderLeft: `3px solid ${m.isWhisper ? '#A855F7' : m.type === 'roll' ? '#FBBF24' : m.sender === 'Mestre' ? 'var(--accent-primary)' : '#38BDF8'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: m.sender === 'Mestre' ? 'var(--accent-primary)' : '#38BDF8',
                }}>
                  {m.isWhisper && '🤫 '}{m.sender}
                  {m.target && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> → {m.target}</span>}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.time}</span>
              </div>
              <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', padding: 6, gap: 4, background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1, fontSize: '0.75rem', height: 26, padding: '2px 8px' }}
          placeholder={whisperTarget === 'all' ? 'Mensagem pública ou /r 1d20...' : `Sussurrar para ${whisperTarget}...`}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0 8px', height: 26 }} title="Enviar">
          <Send size={12} />
        </button>
      </form>
    </div>
  )
}
