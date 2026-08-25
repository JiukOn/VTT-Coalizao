/**
 * chatParser.js — Slash Commands Parser for VTT Chat
 *
 * Supported commands:
 *  /r, /roll [dice_formula]  → Parses and rolls dice (e.g. 1d20+3, 1d4, 2d20)
 *  /w, /whisper [target] [msg] → Sends a private whisper to a player/master
 *  /help                     → Shows available slash commands
 *  /clear                    → Clears the local chat/log history
 *  /ping                     → Tests connection latency
 */

import { rollDice } from '../../master/src/utils/diceRoller.js'

/**
 * Parses a chat text input to determine if it's a slash command.
 * @param {string} text - Raw input from chat textarea/input
 * @param {string} sender - Name of the user sending the message
 * @returns {{
 *   isCommand: boolean,
 *   type: 'roll' | 'whisper' | 'help' | 'clear' | 'ping' | 'message',
 *   data: any,
 *   formattedText?: string,
 *   error?: string
 * }}
 */
export function parseChatMessage(text, sender = 'Jogador') {
  if (!text || typeof text !== 'string') {
    return { isCommand: false, type: 'message', data: { text: '' } }
  }

  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) {
    return {
      isCommand: false,
      type: 'message',
      data: { text: trimmed, sender },
    }
  }

  const parts = trimmed.slice(1).split(/\s+/)
  const command = parts[0]?.toLowerCase()

  // ── /r ou /roll ────────────────────────────────────────────────────────────
  if (command === 'r' || command === 'roll') {
    const formula = parts.slice(1).join('')
    if (!formula) {
      return {
        isCommand: true,
        type: 'roll',
        error: 'Formato inválido. Use: /r 1d20, /r 1d4+2, /r 1d20-1',
      }
    }

    const match = formula.match(/^(\d+)?d(20|4)([+-]\d+)?$/i)
    if (!match) {
      return {
        isCommand: true,
        type: 'roll',
        error: `Fórmula "${formula}" não suportada. O sistema Coalizão utiliza dados D20 e D4 (ex: 1d20+3, 1d4+1).`,
      }
    }

    const count = parseInt(match[1] || '1', 10)
    const sides = parseInt(match[2], 10)
    const bonus = parseInt(match[3] || '0', 10)

    const rawRolls = rollDice(Math.min(count, 10), sides)
    const sum = rawRolls.reduce((a, b) => a + b, 0)
    const total = sum + bonus

    const bonusStr = bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''
    const formattedText = `🎲 **${sender}** rolou **${count}d${sides}${bonusStr}**: [${rawRolls.join(', ')}]${bonusStr} = **${total}**`

    return {
      isCommand: true,
      type: 'roll',
      data: {
        formula: `${count}d${sides}${bonusStr}`,
        diceType: `1d${sides}`,
        raw: rawRolls,
        bonus,
        total,
        formattedText,
      },
      formattedText,
    }
  }

  // ── /w ou /whisper ─────────────────────────────────────────────────────────
  if (command === 'w' || command === 'whisper') {
    const target = parts[1]
    const whisperMsg = parts.slice(2).join(' ')

    if (!target || !whisperMsg) {
      return {
        isCommand: true,
        type: 'whisper',
        error: 'Uso: /w [Nome] [Mensagem] (ex: /w Mestre Encontrei a chave secreta)',
      }
    }

    return {
      isCommand: true,
      type: 'whisper',
      data: {
        target,
        text: whisperMsg,
        sender,
        isWhisper: true,
      },
      formattedText: `🤫 *(Sussurro para ${target})*: ${whisperMsg}`,
    }
  }

  // ── /help ──────────────────────────────────────────────────────────────────
  if (command === 'help' || command === 'ajuda') {
    const helpText = [
      '📖 **Comandos de Barra Disponíveis**:',
      '• `/r 1d20+3` ou `/roll 1d4` — Rola dados do sistema Coalizão',
      '• `/w [Nome] [Mensagem]` — Envia um sussurro privado',
      '• `/clear` — Limpa o histórico de mensagens local',
      '• `/ping` — Testa a latência de conexão com o servidor',
      '• `/help` — Exibe esta lista de ajuda',
    ].join('\n')

    return {
      isCommand: true,
      type: 'help',
      data: { helpText },
      formattedText: helpText,
    }
  }

  // ── /clear ─────────────────────────────────────────────────────────────────
  if (command === 'clear' || command === 'limpar') {
    return {
      isCommand: true,
      type: 'clear',
      data: {},
      formattedText: '🧹 Histórico de log limpo.',
    }
  }

  // ── /ping ──────────────────────────────────────────────────────────────────
  if (command === 'ping') {
    return {
      isCommand: true,
      type: 'ping',
      data: {},
      formattedText: '🏓 Pong! Medindo latência...',
    }
  }

  // Comando desconhecido
  return {
    isCommand: true,
    type: 'message',
    error: `Comando desconhecido "/${command}". Digite /help para ver os comandos válidos.`,
  }
}
