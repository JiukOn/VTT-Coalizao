import { describe, it, expect } from 'vitest'
import { parseChatMessage } from '@shared/utils/chatParser.js'

describe('chatParser', () => {
  it('identifies standard plain chat messages', () => {
    const res = parseChatMessage('Olá grupo!', 'Kael')
    expect(res.isCommand).toBe(false)
    expect(res.type).toBe('message')
    expect(res.data.text).toBe('Olá grupo!')
  })

  it('parses /r 1d20+3 correctly', () => {
    const res = parseChatMessage('/r 1d20+3', 'Lyra')
    expect(res.isCommand).toBe(true)
    expect(res.type).toBe('roll')
    expect(res.data.bonus).toBe(3)
    expect(res.data.total).toBeGreaterThanOrEqual(4)
    expect(res.data.total).toBeLessThanOrEqual(23)
  })

  it('parses /roll 1d4 damage roll correctly', () => {
    const res = parseChatMessage('/roll 1d4', 'Torin')
    expect(res.isCommand).toBe(true)
    expect(res.type).toBe('roll')
    expect(res.data.bonus).toBe(0)
    expect(res.data.total).toBeGreaterThanOrEqual(1)
    expect(res.data.total).toBeLessThanOrEqual(4)
  })

  it('parses /w whisper command with target and message', () => {
    const res = parseChatMessage('/w Mestre Achei uma porta secreta', 'Kael')
    expect(res.isCommand).toBe(true)
    expect(res.type).toBe('whisper')
    expect(res.data.target).toBe('Mestre')
    expect(res.data.text).toBe('Achei uma porta secreta')
    expect(res.data.isWhisper).toBe(true)
  })

  it('handles /help command', () => {
    const res = parseChatMessage('/help', 'Kael')
    expect(res.isCommand).toBe(true)
    expect(res.type).toBe('help')
    expect(res.formattedText).toContain('Comandos de Barra Disponíveis')
  })

  it('handles /clear command', () => {
    const res = parseChatMessage('/clear', 'Kael')
    expect(res.isCommand).toBe(true)
    expect(res.type).toBe('clear')
  })

  it('rejects unsupported dice forms according to Coalizão rules', () => {
    const res = parseChatMessage('/r 1d100', 'Kael')
    expect(res.isCommand).toBe(true)
    expect(res.error).toContain('não suportada')
  })
})
