/* PlayerDashboard.jsx — Restricted player view (Fase 7A + 7B)
   Tabs: Dados | Iniciativa | Ficha | Combate | Mapa | Notas | Log
   Receives game state via WebSocket; sends dice rolls, token moves, notes.
*/
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dices, Activity, User, Swords, FileText, ScrollText,
  LogOut, Wifi, WifiOff, ChevronRight, Map,
  Target, Scroll, CheckCircle2, Circle, Award, Coins, Moon, Store, Wrench, Sparkles
} from 'lucide-react'
import { rollDice, classifyD20, classifyD4 } from '../utils/diceRoller.js'
import { getBonus } from '../utils/characterUtils.js'
import { resolveMeleeAttack, resolveRangedAttack, resolveMagicAttack } from '../utils/combatUtils.js'
import PlayerMap from '../components/map/PlayerMap.jsx'
import ActionBar from '../components/hud/ActionBar.jsx'
import RollCard from '@shared/components/RollCard.jsx'
import DiceThrowOverlay from '@shared/components/DiceThrowOverlay.jsx'
import PlayerHandoutOverlay from '../components/handouts/PlayerHandoutOverlay.jsx'
import PlayerSceneOverlay from '../components/scenes/PlayerSceneOverlay.jsx'
import NpcSpotlightOverlay from '@shared/components/NpcSpotlightOverlay.jsx'
import ActionHotbar from '@shared/components/ActionHotbar.jsx'
import EquipmentSlots from '../components/character/EquipmentSlots.jsx'
import InventoryList from '../components/character/InventoryList.jsx'
import QuickMacrosBar from '../components/hud/QuickMacrosBar.jsx'
import VoiceStatusBar from '../components/hud/VoiceStatusBar.jsx'
import LevelUpModal from '../components/character/LevelUpModal.jsx'
import RestModal from '../components/character/RestModal.jsx'
import MerchantModal from '../components/character/MerchantModal.jsx'
import CraftingModal from '../components/character/CraftingModal.jsx'
import SkillCastModal from '../components/character/SkillCastModal.jsx'
import { calculateEquippedBonuses } from '@shared/utils/inventoryUtils.js'
import { resolveOpposedCheck } from '@shared/utils/opposedRolls.js'
import { calculateLevelFromXp } from '@shared/utils/levelProgression.js'
import { calculateCover } from '@shared/utils/coverUtils.js'
import { sfx } from '@shared/utils/sfxPlayer.js'
import { ambientSynth } from '@shared/utils/ambientSynth.js'
import { dynamicMusic } from '@shared/utils/ambientMusicSynth.js'
import { parseChatMessage } from '@shared/utils/chatParser.js'
// ── Types ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'dados',      label: 'Dados',      icon: Dices },
  { id: 'iniciativa', label: 'Iniciativa', icon: Activity },
  { id: 'ficha',      label: 'Ficha',      icon: User },
  { id: 'combate',    label: 'Combate',    icon: Swords },
  { id: 'mapa',       label: 'Mapa',       icon: Map },
  { id: 'missoes',    label: 'Missões',    icon: Target },
  { id: 'notas',      label: 'Notas',      icon: FileText },
  { id: 'log',        label: 'Log',        icon: ScrollText },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function PlayerDashboard({ session, onDisconnect }) {
  const { ws, playerName, playerId, gameState: initialGameState } = session

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState('dados')
  const [wsStatus, setWsStatus]     = useState('connected')
  const [logEntries, setLogEntries] = useState([])
  const [notes, setNotes]           = useState('')
  const notesSaveTimer              = useRef(null)

  // Game state received from host
  const [order, setOrder]         = useState(initialGameState?.order || [])
  const [round, setRound]         = useState(initialGameState?.round || 1)
  const [currentIdx, setCurrentIdx] = useState(initialGameState?.currentIndex || 0)
  const [entityMap, setEntityMap] = useState(initialGameState?.entityMap || {})
  const [mapData, setMapData]     = useState(session.mapState || null)
  const [mapPings, setMapPings]                 = useState([])
  const [targetedEntityId, setTargetedEntityId] = useState(null)
  const [activeDiceThrow, setActiveDiceThrow]   = useState(null) // { diceType, result, raw } | null
  const [activeHandout, setActiveHandout]       = useState(null) // Handout object | null
  const [activeScene, setActiveScene]           = useState(null) // Fullscreen scene object | null
  const [quests, setQuests]                     = useState([])
  const [discoveredHandouts, setDiscoveredHandouts] = useState([])
  const [activeVoiceUsers, setActiveVoiceUsers] = useState([])
  const [isMyVoiceSpeaking, setIsMyVoiceSpeaking] = useState(false)
  const [weather, setWeather]                   = useState('none')
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false)
  const [restModalOpen, setRestModalOpen]       = useState(false)
  const [merchantModalOpen, setMerchantModalOpen] = useState(false)
  const [craftingModalOpen, setCraftingModalOpen] = useState(false)
  const [skillModalOpen, setSkillModalOpen]       = useState(false)
  const [activeDialogue, setActiveDialogue]       = useState(null)
  const [latencyMs, setLatencyMs]                 = useState(null)
  const pingTimestampRef                          = useRef(0)

  useEffect(() => {
    if (!ws) return
    const interval = setInterval(() => {
      pingTimestampRef.current = Date.now()
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: pingTimestampRef.current }))
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [ws])

  // Local character data (from entityMap, keyed by playerName)
  const myEntity = Object.values(entityMap).find(
    e => e.name?.toLowerCase() === playerName.toLowerCase() ||
         e.tableId === playerId
  ) || null

  // Targeted entity
  const targetedEntity = targetedEntityId ? entityMap[targetedEntityId] || Object.values(entityMap).find(e => e.tableId === targetedEntityId || e.id === targetedEntityId) : null

  // Target distance and tactical cover
  let targetDistance = null
  let targetCover = null
  if (myEntity && targetedEntity && mapData?.gridConfig?.size) {
    const dx = (targetedEntity.mapX ?? 0) - (myEntity.mapX ?? 0)
    const dy = (targetedEntity.mapY ?? 0) - (myEntity.mapY ?? 0)
    const squares = Math.hypot(dx, dy) / mapData.gridConfig.size
    targetDistance = squares * 1.5 // 1.5m per square

    if (mapData.wallSegments?.length > 0) {
      targetCover = calculateCover(
        { x: myEntity.mapX ?? 0, y: myEntity.mapY ?? 0 },
        { x: targetedEntity.mapX ?? 0, y: targetedEntity.mapY ?? 0 },
        mapData.wallSegments,
        mapData.gridConfig.size
      )
    }
  }

  // ── WebSocket send helper ──────────────────────────────────────────────────
  const wsSend = useCallback((type, payload) => {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ type, ...payload }))
    }
  }, [ws])

  // ── WebSocket event handler ───────────────────────────────────────────────
  const addLog = useCallback((msg, chatData = null, rollData = null) => {
    const id = crypto.randomUUID()
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (rollData) {
      setLogEntries(prev => [{ id, time, msg: msg || '', rollData }, ...prev].slice(0, 100))
    } else if (chatData) {
      setLogEntries(prev => [{ id, time, msg: chatData.text, chatData }, ...prev].slice(0, 100))
    } else {
      setLogEntries(prev => [{ id, time, msg }, ...prev].slice(0, 100))
    }
  }, [])

  const handleApplyDamage = useCallback((targetId, amount, targetName) => {
    if (!targetId && !targetName) return
    const target = Object.values(entityMap).find(e => e.tableId === targetId || e.id === targetId || e.name === targetName)
    if (!target) return
    const currentHp = target.hp ?? 0
    const nextHp = Math.max(0, currentHp - amount)
    wsSend('token_move', {
      data: {
        id: target.tableId || target.id,
        changes: { hp: nextHp },
      },
    })
    sfx.init()
    sfx.play('combat_hit')
    const logText = `💥 ${playerName} causou ${amount} de dano a ${target.name} (HP: ${nextHp})`
    addLog(logText)
    wsSend('chat_message', { text: logText, timestamp: new Date().toISOString() })
  }, [entityMap, wsSend, playerName, addLog])

  const handleServerMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'game_state':
        setOrder(msg.data?.order || [])
        setRound(msg.data?.round || 1)
        setCurrentIdx(msg.data?.currentIndex || 0)
        setEntityMap(msg.data?.entityMap || {})
        break
      case 'turn_change':
        setOrder(prev => msg.data?.order || prev)
        setRound(prev => msg.data?.round || prev)
        setCurrentIdx(prev => msg.data?.currentIndex ?? prev)
        addLog(`▶️ Turno: ${msg.data?.currentEntityName || '?'} — Rodada ${msg.data?.round}`)
        sfx.init()
        sfx.play('turn_alert')
        break
      case 'entity_update':
        setEntityMap(prev => ({ ...prev, [msg.data?.id]: { ...(prev[msg.data?.id] || {}), ...msg.data?.changes } }))
        break
      case 'map_update':
        setMapData(msg.data)
        break
      case 'map_ping':
        setMapPings(prev => [...(prev || []), { id: Date.now() + Math.random(), ...msg.data, startTime: Date.now() }])
        break
      case 'combat_event':
        addLog(`⚔️ ${msg.data?.summary || 'Evento de combate'}`)
        break
      case 'resync':
        setOrder(msg.gameState?.order || [])
        setRound(msg.gameState?.round || 1)
        setCurrentIdx(msg.gameState?.currentIndex || 0)
        setEntityMap(msg.gameState?.entityMap || {})
        setMapData(msg.mapState || null)
        addLog('🔄 Estado resincronizado com o servidor')
        break
      case 'ambient_change':
        ambientSynth.play(msg.data?.theme)
        if (msg.data?.volume != null) ambientSynth.setVolume(msg.data.volume)
        break
      case 'ambient_music_change':
        if (msg.mood) {
          dynamicMusic.setMood(msg.mood)
        }
        break
      case 'dice_roll':
        if (msg.data) {
          setActiveDiceThrow({
            diceType: msg.data.diceType || '1d20',
            result: msg.data.result,
            raw: msg.data.raw || [msg.data.result],
          })
        }
        break
      case 'handout_reveal':
        if (msg.data) {
          setActiveHandout(msg.data)
          setDiscoveredHandouts(prev => prev.some(h => h.id === msg.data.id) ? prev : [...prev, msg.data])
          sfx.init()
          sfx.play('turn_alert')
          addLog(`📜 O Mestre revelou o documento: **${msg.data.title}**`)
        }
        break
      case 'scene_reveal':
        if (msg.data) {
          setActiveScene(msg.data)
          sfx.init()
          sfx.play('turn_alert')
          addLog(`🖼️ O Mestre apresentou o cenário: **${msg.data.title}**`)
        }
        break
      case 'quest_update':
        if (msg.quests) {
          setQuests(msg.quests)
          addLog('🎯 O Mestre atualizou o Quadro de Missões da Campanha.')
        }
        break
      case 'award_xp':
        if (msg.data) {
          sfx.init()
          sfx.play('turn_alert')
          addLog(`🏆 **Recompensa do Encontro**: Você recebeu **+${msg.data.amount} XP**! ${msg.data.reason ? `(${msg.data.reason})` : ''}`)
        }
        break
      case 'voice_signal':
        if (msg.data?.sender) {
          setActiveVoiceUsers(prev => {
            const filtered = prev.filter(u => u.name !== msg.data.sender)
            return [...filtered, { name: msg.data.sender, isSpeaking: !!msg.data.isSpeaking }]
          })
        }
        break
      case 'weather_change':
        if (msg.data?.weather) {
          setWeather(msg.data.weather)
        }
        break
      case 'npc_dialogue':
        if (msg.data || msg.speakerName) {
          const d = msg.data || msg
          setActiveDialogue(d)
          sfx.init()
          sfx.play('notification')
          addLog(`💬 **${d.speakerName}**: "${d.text}"`)
        }
        break
      case 'pong':
        if (pingTimestampRef.current) {
          setLatencyMs(Date.now() - pingTimestampRef.current)
        }
        break
      case 'chat_message':
        addLog('', {
          sender: msg.sender,
          text: msg.text,
          isWhisper: msg.isWhisper,
          target: msg.target,
        })
        break
      default:
        break
    }
  }, [addLog])

  useEffect(() => {
    if (!ws) return
    const onMessage = (evt) => {
      try {
        const m = JSON.parse(evt.data)
        if (m.type === 'pong') return  // ignore keepalive responses
        handleServerMessage(m)
      } catch { /* ignore */ }
    }
    const onClose = () => setWsStatus('disconnected')
    const onError = () => setWsStatus('error')

    ws.addEventListener('message', onMessage)
    ws.addEventListener('close', onClose)
    ws.addEventListener('error', onError)

    // Keepalive ping for relay (wss://) connections — prevents proxy idle-timeout
    const keepalive = setInterval(() => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }))
    }, 25_000)

    return () => {
      ws.removeEventListener('message', onMessage)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('error', onError)
      clearInterval(keepalive)
    }
  }, [ws, handleServerMessage])

  // ── Notes auto-save ───────────────────────────────────────────────────────
  function handleNotesChange(val) {
    setNotes(val)
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(() => {
      wsSend('notes_save', { notes: val })
    }, 3000)
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  function handleDisconnect() {
    ws?.close()
    onDisconnect()
  }

  // ── Tactical Keyboard Shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable) {
        return
      }

      if (e.key === 't' || e.key === 'T') {
        if (myEntity && wsSend) {
          const pingData = {
            x: myEntity.mapX ?? 200,
            y: myEntity.mapY ?? 200,
            color: '#3B82F6',
            author: playerName,
          }
          setMapPings(prev => [...(prev || []), { id: Date.now() + Math.random(), ...pingData, startTime: Date.now() }])
          wsSend('map_ping', { data: pingData })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [myEntity, playerName, wsSend])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-title)', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1rem' }}>
            ⚔️ VTT
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Modo Jogador</span>
          <span style={{
            background: 'var(--accent-subtle)', color: 'var(--accent-primary)',
            borderRadius: 4, padding: '1px 8px', fontSize: '0.78rem', fontWeight: 600,
          }}>
            {playerName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VoiceStatusBar
            activeUsers={activeVoiceUsers}
            isSpeaking={isMyVoiceSpeaking}
            onToggleMute={(muted) => {
              setIsMyVoiceSpeaking(!muted)
              wsSend('voice_signal', { data: { sender: playerName, isSpeaking: !muted } })
            }}
          />
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem',
            color: wsStatus === 'connected' ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {wsStatus === 'connected' ? `${latencyMs != null ? `${latencyMs}ms · ` : ''}Online` : 'Offline'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDisconnect}
            title="Sair da Sessão"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
          >
            <LogOut size={12} /> Sair
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Action Hotbar (Teclas 1-9) */}
      <div style={{
        padding: '6px 14px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <ActionHotbar
          entity={myEntity}
          onExecuteCommand={(cmd) => {
            if (cmd.startsWith('/r ')) {
              const rollStr = cmd.replace('/r ', '').trim()
              const match = rollStr.match(/^(\d+)d(4|20)([+-]\d+)?(\s*\[(.*)\])?$/i)
              if (match) {
                const count = parseInt(match[1], 10) || 1
                const sides = parseInt(match[2], 10) || 20
                const mod = parseInt(match[3], 10) || 0
                const label = match[5] || 'Macro'
                const res = rollDice(sides, count)
                const total = res.total + mod
                const logMsg = `🎲 **${playerName}** rolou ${count}d${sides}${mod ? (mod > 0 ? `+${mod}` : mod) : ''} [${label}]: **${total}** (dados: ${res.rolls.join(', ')})`
                addLog(logMsg, null, {
                  roller: playerName,
                  diceType: `${count}d${sides}`,
                  result: total,
                  raw: res.rolls,
                  modifier: mod,
                  label,
                })
                wsSend('dice_roll', {
                  data: {
                    diceType: `${count}d${sides}`,
                    result: total,
                    raw: res.rolls,
                    modifier: mod,
                    label,
                    author: playerName,
                  }
                })
                return
              }
            }
            wsSend('chat_message', { text: cmd, sender: playerName, timestamp: new Date().toISOString() })
          }}
        />
      </div>

      {/* Tab content — map tab is full-bleed (no padding, no scroll) */}
      <div style={{
        flex: 1,
        overflow: activeTab === 'mapa' ? 'hidden' : 'auto',
        padding: activeTab === 'mapa' ? 0 : 16,
      }}>
        {activeTab === 'dados'      && <TabDados      wsSend={wsSend} playerName={playerName} addLog={addLog} />}
        {activeTab === 'iniciativa' && <TabIniciativa order={order} round={round} currentIdx={currentIdx} playerName={playerName} />}
        {activeTab === 'ficha'      && <TabFicha      entity={myEntity} playerName={playerName} wsSend={wsSend} addLog={addLog} onOpenLevelUp={() => setLevelUpModalOpen(true)} onOpenRest={() => setRestModalOpen(true)} onOpenMerchant={() => setMerchantModalOpen(true)} onOpenCrafting={() => setCraftingModalOpen(true)} onOpenSkills={() => setSkillModalOpen(true)} />}
        {activeTab === 'combate'    && <TabCombate    myEntity={myEntity} entities={Object.values(entityMap)} wsSend={wsSend} playerName={playerName} addLog={addLog} onOpenSkills={() => setSkillModalOpen(true)} />}
        {activeTab === 'mapa'       && (
          <PlayerMap
            mapData={mapData}
            myEntity={myEntity}
            wsSend={wsSend}
            entityMap={entityMap}
            pings={mapPings}
            onPingsChange={setMapPings}
            playerName={playerName}
            targetedEntityId={targetedEntityId}
            onSelectTarget={id => setTargetedEntityId(prev => prev === id ? null : id)}
            speakingPlayerNames={activeVoiceUsers.filter(u => u.isSpeaking).map(u => u.name)}
            weather={weather}
          />
        )}
        {activeTab === 'missoes'    && <TabMissoes    quests={quests} discoveredHandouts={discoveredHandouts} onOpenHandout={setActiveHandout} />}
        {activeTab === 'notas'      && <TabNotas      notes={notes} onChange={handleNotesChange} />}
        {activeTab === 'log'        && <TabLog        entries={logEntries} wsSend={wsSend} playerName={playerName} addLog={addLog} onApplyDamage={handleApplyDamage} />}
      </div>

      {/* Floating Action Bar HUD */}
      {myEntity && (
        <ActionBar
          entity={myEntity}
          playerName={playerName}
          wsSend={wsSend}
          addLog={addLog}
          hasTarget={!!targetedEntity}
          targetName={targetedEntity?.name}
          targetDistance={targetDistance}
          targetCover={targetCover}
        />
      )}

      {/* 3D Dice Throw Animation Overlay */}
      {activeDiceThrow && (
        <DiceThrowOverlay
          diceType={activeDiceThrow.diceType}
          result={activeDiceThrow.result}
          raw={activeDiceThrow.raw}
          onFinish={() => setActiveDiceThrow(null)}
        />
      )}

      {/* Cinematic Handout Viewer Overlay */}
      {activeHandout && (
        <PlayerHandoutOverlay
          handout={activeHandout}
          onClose={() => setActiveHandout(null)}
        />
      )}

      {/* Fullscreen Cinematic Scene Overlay */}
      {activeScene && (
        <PlayerSceneOverlay
          scene={activeScene}
          onClose={() => setActiveScene(null)}
        />
      )}

      {/* Level Up Progression Wizard */}
      {levelUpModalOpen && myEntity && (
        <LevelUpModal
          isOpen={levelUpModalOpen}
          onClose={() => setLevelUpModalOpen(false)}
          entity={myEntity}
          onApply={(updated) => {
            sfx.init()
            sfx.play('turn_alert')
            if (wsSend) {
              wsSend('token_move', {
                data: {
                  id: myEntity.tableId || myEntity.id,
                  changes: {
                    level: updated.level,
                    attributes: updated.attributes,
                    maxHp: updated.maxHp,
                    hp: updated.maxHp,
                    maxEnr: updated.maxEnr,
                    enr: updated.maxEnr,
                  },
                },
              })
              const announce = `🏆 **Conquista Épica**: **${playerName}** subiu para o **Nível ${updated.level}**! (HP Max: ${updated.maxHp} | ENR Max: ${updated.maxEnr})`
              addLog(announce)
              wsSend('chat_message', { text: announce, timestamp: new Date().toISOString() })
            }
          }}
        />
      )}

      {/* Rest & Recovery Modal */}
      {restModalOpen && myEntity && (
        <RestModal
          isOpen={restModalOpen}
          onClose={() => setRestModalOpen(false)}
          entity={myEntity}
          onApplyRest={(updated, restType, details) => {
            if (wsSend) {
              wsSend('token_move', {
                data: {
                  id: myEntity.tableId || myEntity.id,
                  changes: {
                    hp: updated.hp,
                    enr: updated.enr,
                    heroicPoints: updated.heroicPoints,
                    effects: updated.effects,
                  },
                },
              })
              const label = restType === 'short' ? 'Descanso Curto (1h)' : 'Descanso Longo (8h)'
              const announce = `☕ **${playerName}** concluiu um **${label}** (Recuperou +${details.hpGained} HP, +${details.enrGained} ENR).`
              addLog(announce)
              wsSend('chat_message', { text: announce, timestamp: new Date().toISOString() })
            }
          }}
        />
      )}

      {/* NPC Merchant Shop Modal */}
      {merchantModalOpen && myEntity && (
        <MerchantModal
          isOpen={merchantModalOpen}
          onClose={() => setMerchantModalOpen(false)}
          playerEntity={myEntity}
          onUpdatePlayer={(updated) => {
            if (wsSend) {
              wsSend('token_move', {
                data: {
                  id: myEntity.tableId || myEntity.id,
                  changes: {
                    credits: updated.credits,
                    money: updated.money,
                    inventory: updated.inventory,
                  },
                },
              })
            }
          }}
          addLog={addLog}
          wsSend={wsSend}
        />
      )}

      {/* Weapon Crafting & Attachments Modal */}
      {craftingModalOpen && myEntity && (
        <CraftingModal
          isOpen={craftingModalOpen}
          onClose={() => setCraftingModalOpen(false)}
          playerEntity={myEntity}
          onUpdatePlayer={(updated) => {
            if (wsSend) {
              wsSend('token_move', {
                data: {
                  id: myEntity.tableId || myEntity.id,
                  changes: {
                    credits: updated.credits,
                    money: updated.money,
                    equipment: updated.equipment,
                  },
                },
              })
            }
          }}
          addLog={addLog}
          wsSend={wsSend}
        />
      )}

      {/* Coalizão Skills & Abilities Modal */}
      {skillModalOpen && myEntity && (
        <SkillCastModal
          isOpen={skillModalOpen}
          onClose={() => setSkillModalOpen(false)}
          playerEntity={myEntity}
          onUpdatePlayer={(updated) => {
            if (wsSend) {
              wsSend('token_move', {
                data: {
                  id: myEntity.tableId || myEntity.id,
                  changes: {
                    enr: updated.enr,
                    effects: updated.effects,
                  },
                },
              })
            }
          }}
          addLog={addLog}
          wsSend={wsSend}
        />
      )}

      {/* Cinematic NPC Dialogue Overlay */}
      {activeDialogue && (
        <NpcSpotlightOverlay
          dialogue={activeDialogue}
          onDismiss={() => setActiveDialogue(null)}
        />
      )}
    </div>
  )
}

// ── Tab: Dados ─────────────────────────────────────────────────────────────────
function TabDados({ wsSend, playerName, addLog }) {
  const [history, setHistory] = useState([])

  function roll(sides, advantage = false) {
    sfx.init()
    sfx.play('dice_roll')
    let results = rollDice(advantage ? 2 : 1, sides)
    const used  = advantage ? Math.max(...results) : results[0]
    const cl    = sides === 20 ? classifyD20(used) : null

    const id = crypto.randomUUID()
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const entry = { id, sides, results, used, label: cl?.label || '', time }
    setHistory(prev => [entry, ...prev].slice(0, 30))
    addLog(`🎲 ${playerName} rolou 1d${sides}${advantage ? ' (vantagem)' : ''}: ${used}${cl ? ` (${cl.label})` : ''}`)
    wsSend('dice_roll', { data: { playerName, diceType: `1d${sides}`, result: used, advantage, raw: results } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Rolar Dados</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { sides: 20, label: '1d20', color: 'var(--accent-primary)' },
          { sides: 4,  label: '1d4',  color: '#60A5FA' },
        ].map(({ sides, label, color }) => (
          <div key={sides} style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-title)', color, fontSize: '1rem', fontWeight: 700 }}>{label}</span>
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: color, borderColor: color }}
              onClick={() => roll(sides)}
            >
              Rolar
            </button>
            {sides === 20 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', fontSize: '0.72rem' }}
                onClick={() => roll(sides, true)}
              >
                Vantagem (maior de 2)
              </button>
            )}
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Histórico</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                fontSize: '0.82rem',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: 40 }}>{h.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', minWidth: 20 }}>
                  {h.used}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  1d{h.sides}{h.results.length > 1 ? ` (${h.results.join(', ')})` : ''}
                </span>
                {h.label && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.68rem',
                    color: h.used === 20 ? 'var(--color-success)' : h.used === 1 ? 'var(--color-danger)' : 'var(--text-muted)',
                  }}>
                    {h.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Iniciativa ────────────────────────────────────────────────────────────
function TabIniciativa({ order, round, currentIdx, playerName }) {
  if (order.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: '0.9rem' }}>
        <Activity size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
        <p>Nenhuma batalha em andamento.</p>
      </div>
    )
  }
  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Ordem de Iniciativa</h3>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
          color: 'var(--accent-primary)', fontWeight: 700,
          background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: 4,
        }}>
          RODADA {round}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {order.map((entity, idx) => {
          const isActive = idx === currentIdx
          const isMe = entity.name?.toLowerCase() === playerName.toLowerCase()
          return (
            <div key={entity.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: isActive ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              borderLeft: `4px solid ${isActive ? 'var(--accent-primary)' : isMe ? '#60A5FA' : 'transparent'}`,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                minWidth: 28, textAlign: 'right',
              }}>
                {entity.initiativeTotal ?? '?'}
              </span>
              <span style={{
                flex: 1, fontWeight: isActive || isMe ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {entity.name}
              </span>
              {isMe && (
                <span style={{
                  fontSize: '0.68rem', background: '#60A5FA22',
                  color: '#60A5FA', borderRadius: 3, padding: '1px 6px',
                }}>
                  você
                </span>
              )}
              {isActive && (
                <span style={{
                  fontSize: '0.7rem', background: 'var(--accent-primary)',
                  color: '#fff', borderRadius: 3, padding: '1px 6px',
                }}>
                  ▶ turno
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Ficha ─────────────────────────────────────────────────────────────────
const ATTR_LABELS = { vit: 'VIT', dex: 'DEX', crm: 'CRM', frc: 'FRC', int: 'INT', res: 'RES', pre: 'PRE', enr: 'ENR' }

function TabFicha({ entity, playerName, wsSend, addLog, onOpenLevelUp, onOpenRest, onOpenMerchant, onOpenCrafting, onOpenSkills }) {
  const tVal = (val) => {
    if (val == null) return ''
    if (typeof val === 'object') return val['pt-br'] || val['en-us'] || ''
    return String(val)
  }

  function handleRoll(attrKey, label, val) {
    const bonus = getBonus(val)
    sfx.init()
    sfx.play('dice_roll')
    
    const results = rollDice(1, 20)
    const d20 = results[0]
    const total = d20 + bonus
    
    wsSend('dice_roll', { data: { playerName, diceType: '1d20', result: total, raw: results } })
    const chatMsg = `🎲 rolou ${label}: 1d20 (${d20}) ${bonus >= 0 ? '+' : ''}${bonus} = **${total}**`
    addLog(chatMsg)
    wsSend('chat_message', { text: chatMsg, timestamp: new Date().toISOString() })
  }

  if (!entity) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: '0.9rem' }}>
        <User size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
        <p>Dados do personagem não recebidos ainda.<br />Aguarde o Mestre iniciar a sessão.</p>
      </div>
    )
  }

  const attrs = entity.attributes || {}
  const effects = entity.effects || []

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center',
        background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.4rem',
        }}>
          {entity.name?.[0] || '?'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{entity.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {entity.class || entity.classId || 'Sem classe'}{entity.level ? ` · Nível ${entity.level}` : ''}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {entity.hp != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                {entity.hp}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>HP</div>
            </div>
          )}
          {onOpenRest && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onOpenRest}
              title="Descanso Curto ou Longo"
              style={{ color: '#A855F7' }}
            >
              <Moon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Level & XP Progression Bar */}
      {(() => {
        const lvlInfo = calculateLevelFromXp(entity.xp || 0, entity.level || 1)
        return (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            padding: '12px 16px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Nível {entity.level || 1} ({entity.xp || 0} XP)
                </span>
              </div>
              {lvlInfo.canLevelUp && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={onOpenLevelUp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    border: 'none',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  <Award size={12} /> Evoluir Nível!
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${lvlInfo.progressPercent}%`,
                background: 'linear-gradient(90deg, #F59E0B, #10B981)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {lvlInfo.nextLevelXp && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                Próximo Nível: {entity.xp || 0} / {lvlInfo.nextLevelXp} XP ({lvlInfo.progressPercent}%)
              </span>
            )}
          </div>
        )
      })()}

      {/* Attributes */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Atributos
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Object.entries(ATTR_LABELS).map(([key, label]) => {
            const val = attrs[key] ?? entity[key] ?? 0
            const bonus = getBonus(val)
            return (
              <button key={key} onClick={() => handleRoll(key, label, val)} style={{
                textAlign: 'center', padding: '6px 4px',
                background: 'var(--bg-tertiary)', borderRadius: 6,
                border: '1px solid transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              title={`Rolar ${label}`}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: bonus > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>{bonus >= 0 ? '+' : ''}{bonus}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Effects */}
      {effects.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Efeitos Ativos
          </h4>
          {effects.map((eff, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 4,
              background: 'rgba(251,191,36,0.1)', border: '1px solid #FBBF2444',
              marginBottom: 4, fontSize: '0.82rem',
            }}>
              <span style={{ flex: 1, color: '#FBBF24', fontWeight: 600 }}>{tVal(eff.name) || eff.id}</span>
              {eff.turnsRemaining != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: eff.turnsRemaining <= 1 ? '#F87171' : '#FBBF24' }}>
                  {eff.turnsRemaining}t
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merchant, Crafting & Skills Quick Access */}
      {(onOpenMerchant || onOpenCrafting || onOpenSkills) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: -6 }}>
          {onOpenSkills && (
            <button
              className="btn btn-xs btn-secondary"
              onClick={onOpenSkills}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A855F7' }}
            >
              <Sparkles size={12} /> Habilidades (ENR)
            </button>
          )}
          {onOpenCrafting && (
            <button
              className="btn btn-xs btn-secondary"
              onClick={onOpenCrafting}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38BDF8' }}
            >
              <Wrench size={12} /> Oficina de Armas
            </button>
          )}
          {onOpenMerchant && (
            <button
              className="btn btn-xs btn-secondary"
              onClick={onOpenMerchant}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B' }}
            >
              <Store size={12} /> Mercador / Loja
            </button>
          )}
        </div>
      )}

      {/* Equipment Slots */}
      <EquipmentSlots
        equipment={entity.equipment || {}}
        onUnequipSlot={(slotKey) => {
          const updatedEquip = { ...(entity.equipment || {}) }
          const unequippedItem = updatedEquip[slotKey]
          delete updatedEquip[slotKey]
          const dexBonus = getBonus(attrs.dex ?? 0)
          const bonuses = calculateEquippedBonuses(updatedEquip, dexBonus)
          if (wsSend) {
            wsSend('token_move', {
              data: {
                id: entity.tableId || entity.id,
                changes: { equipment: updatedEquip, ac: bonuses.totalAc },
              },
            })
          }
          if (unequippedItem) {
            addLog(`🛡️ Desequipou **${unequippedItem.name}**`)
          }
        }}
      />

      {/* Backpack & Inventory */}
      <InventoryList
        items={entity.inventory || []}
        forceAttribute={attrs.frc ?? 10}
        onEquipItem={(item) => {
          const slotMap = {
            weapon: 'mainHand',
            shield: 'offHand',
            armor: 'armor',
            accessory: 'accessory',
          }
          const targetSlot = slotMap[item.type] || 'mainHand'
          const updatedEquip = { ...(entity.equipment || {}), [targetSlot]: item }
          const dexBonus = getBonus(attrs.dex ?? 0)
          const bonuses = calculateEquippedBonuses(updatedEquip, dexBonus)
          if (wsSend) {
            wsSend('token_move', {
              data: {
                id: entity.tableId || entity.id,
                changes: { equipment: updatedEquip, ac: bonuses.totalAc },
              },
            })
          }
          sfx.init()
          sfx.play('turn_alert')
          addLog(`⚔️ Equipou **${item.name}** em *${targetSlot}*`)
        }}
        onUpdateQuantity={(itemId, quantity) => {
          const curInv = entity.inventory || []
          const nextInv = curInv.map(it => it.id === itemId ? { ...it, quantity } : it)
          if (wsSend) {
            wsSend('token_move', {
              data: { id: entity.tableId || entity.id, changes: { inventory: nextInv } },
            })
          }
        }}
        onRemoveItem={(itemId) => {
          const curInv = entity.inventory || []
          const nextInv = curInv.filter(it => it.id !== itemId)
          if (wsSend) {
            wsSend('token_move', {
              data: { id: entity.tableId || entity.id, changes: { inventory: nextInv } },
            })
          }
          addLog('🗑️ Item removido do inventário.')
        }}
        onAddItem={(newItem) => {
          const curInv = entity.inventory || []
          const nextInv = [...curInv, newItem]
          if (wsSend) {
            wsSend('token_move', {
              data: { id: entity.tableId || entity.id, changes: { inventory: nextInv } },
            })
          }
          addLog(`📦 Adicionou **${newItem.name}** à mochila.`)
        }}
      />
    </div>
  )
}

// ── Tab: Combate ───────────────────────────────────────────────────────────────
function TabCombate({ myEntity, entities, wsSend, playerName, addLog, onOpenSkills }) {
  const [defenderId, setDefenderId] = useState('')
  const [attackType, setAttackType] = useState('melee')
  const [result, setResult]         = useState(null)
  const [rolling, setRolling]       = useState(false)

  function getAttr(entity, attr) {
    if (!entity) return 0
    const key = attr.toLowerCase()
    return parseInt(entity.attributes?.[key] ?? entity[key] ?? 0) || 0
  }

  function handleResolve() {
    if (!myEntity || !defenderId) return
    const defender = entities.find(e => String(e.tableId || e.id) === String(defenderId))
    if (!defender) return
    setRolling(true)
    setResult(null)

    setTimeout(() => {
      const aFRC = getAttr(myEntity, 'frc')
      const aPRE = getAttr(myEntity, 'pre')
      const aENR = getAttr(myEntity, 'enr')
      const dFRC = getAttr(defender, 'frc')
      const dDEX = getAttr(defender, 'dex')
      const dRES = getAttr(defender, 'res')

      let res
      if (attackType === 'melee')  res = { ...resolveMeleeAttack(aFRC, dFRC), typeLabel: 'Corpo a Corpo' }
      else if (attackType === 'ranged') res = { ...resolveRangedAttack(aPRE, dDEX), typeLabel: 'Distância' }
      else res = { ...resolveMagicAttack(aPRE, aENR, dRES), typeLabel: 'Mágico' }

      const [dmg] = rollDice(1, 4)
      if (res.hit) res.damage = dmg

      setResult({ ...res, defender })
      const summary = res.hit
        ? `${playerName} acertou ${defender.name} [${res.typeLabel}] — ${res.attackTotal} vs ${res.defendTotal} — 🗡️${dmg}`
        : `${playerName} errou ${defender.name} [${res.typeLabel}] — ${res.attackTotal} vs ${res.defendTotal}`
      addLog(`⚔️ ${summary}`)
      wsSend('combat_event', { data: { summary, attacker: playerName, defender: defender.name } })
      
      sfx.init()
      sfx.play(res.hit ? 'combat_hit' : 'combat_miss')
      
      setRolling(false)
    }, 350)
  }

  const others = entities.filter(e => e.name?.toLowerCase() !== playerName.toLowerCase())

  return (
    <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Atacante: <strong style={{ color: 'var(--text-primary)' }}>{myEntity?.name || playerName}</strong>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="input-label">Alvo</label>
        <select className="input select" value={defenderId} onChange={e => { setDefenderId(e.target.value); setResult(null) }}>
          <option value="">— Selecione —</option>
          {others.map(e => (
            <option key={e.tableId || e.id} value={e.tableId || e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'melee', label: '⚔️ Corpo' }, { id: 'ranged', label: '🏹 Dist.' }, { id: 'magic', label: '✨ Mágico' }].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${attackType === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setAttackType(t.id); setResult(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {onOpenSkills && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSkills}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#A855F7' }}
        >
          <Sparkles size={13} /> Usar Habilidade / Magia (ENR)
        </button>
      )}

      <button
        className="btn btn-primary"
        onClick={handleResolve}
        disabled={!myEntity || !defenderId || rolling}
      >
        {rolling ? '⏳ Rolando…' : <><ChevronRight size={14} /> Resolver Ataque</>}
      </button>

      {result && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: `1px solid ${result.hit ? 'var(--color-success)' : 'var(--color-danger)'}`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem',
        }}>
          <div style={{ fontWeight: 700, color: result.hit ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {result.hit ? `💥 ACERTO! Dano: ${result.damage} (1d4)` : '🛡️ ERROU!'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {result.attackTotal} vs {result.defendTotal} [{result.typeLabel}]
          </div>
        </div>
      )}

      {others.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>
          Nenhuma entidade disponível como alvo.
        </p>
      )}
    </div>
  )
}

// ── Tab: Notas ─────────────────────────────────────────────────────────────────
function TabNotas({ notes, onChange }) {
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Notas de Sessão</h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-salvo a cada 3s</span>
      </div>
      <textarea
        className="input"
        value={notes}
        onChange={e => onChange(e.target.value)}
        rows={14}
        placeholder="Anote aqui o que aconteceu, itens coletados, pistas encontradas..."
        style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
      />
    </div>
  )
}

// ── Tab: Log ───────────────────────────────────────────────────────────────────
function TabLog({ entries, wsSend, playerName, addLog, onApplyDamage }) {
  const [chatInput, setChatInput] = useState('')

  function handleSend(e) {
    e.preventDefault()
    if (!chatInput.trim()) return

    const text = chatInput.trim()
    
    // Command: whisper
    if (text.startsWith('/w ') || text.startsWith('/whisper ')) {
      const match = text.match(/^\/(?:w|whisper)\s+(\w+)\s+(.*)$/i)
      if (match) {
        const target = match[1]
        const msgText = match[2]
        wsSend('chat_message', { text: msgText, target, isWhisper: true, timestamp: new Date().toISOString() })
        setChatInput('')
        return
      }
    }
    
    // Command: roll (e.g. /r 1d20+3 [Ataque], /r 1d4, /r 1d20-2)
    if (text.startsWith('/r ')) {
      const match = text.match(/^\/r\s+(1d20|1d4)(?:([+-]\d+))?(?:\s*\[(.*?)\])?/i)
      if (match) {
        const diceType = match[1].toLowerCase()
        const bonus = match[2] ? parseInt(match[2], 10) : 0
        const tag = match[3] || ''
        const sides = parseInt(diceType.split('d')[1], 10)
        
        sfx.init()
        sfx.play('dice_roll')
        
        const results = rollDice(1, sides)
        const rawDie = results[0]
        const total = rawDie + bonus
        const classification = sides === 20 ? classifyD20(rawDie) : classifyD4(rawDie)
        const sign = bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''
        const formula = `${diceType}${sign}${tag ? ` (${tag})` : ''}`
        
        wsSend('dice_roll', { data: { playerName, diceType: formula, result: total, raw: results } })
        
        const rollData = {
          rollerName: playerName,
          diceType: formula,
          result: total,
          raw: results,
          modifier: bonus,
          classification,
          note: tag || undefined,
        }
        const resultText = `🎲 **${playerName}** rolou ${formula}: [${rawDie}] ${sign} = **${total}** — *${classification.label}*`
        addLog(resultText, null, rollData)
        wsSend('chat_message', { text: resultText, timestamp: new Date().toISOString() })
        setChatInput('')
        return
      }
    }

    // Command: Secret / Blind roll to Master (e.g. /gmroll 1d20+3 Percepção or /blind 1d20+2 Furtividade)
    if (text.startsWith('/gmroll ') || text.startsWith('/blind ')) {
      const expr = text.replace(/^\/(?:gmroll|blind)\s+/i, '').trim()
      const match = expr.match(/^(\d+d\d+)(?:([+-]\d+))?(?:\s+(.+))?$/i)
      if (match) {
        sfx.init()
        sfx.play('dice_roll')
        const diceType = match[1].toLowerCase()
        const bonus = match[2] ? parseInt(match[2], 10) : 0
        const tag = match[3] || 'Rolagem Secreta'
        const [, sidesStr] = diceType.split('d')
        const sides = parseInt(sidesStr, 10) || 20

        const results = rollDice(1, sides)
        const rawDie = results[0]
        const total = rawDie + bonus
        const classification = sides === 20 ? classifyD20(rawDie) : classifyD4(rawDie)
        const sign = bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''
        const formula = `${diceType}${sign} (${tag})`

        // Local player notification (hiding actual die number)
        const playerSecretText = `🎲 **[Rolagem Secreta para o Mestre]**: ${tag} enviada com sucesso.`
        addLog(playerSecretText)

        // Send secret result to Master only (isWhisper: true, target: 'Mestre')
        const masterSecretText = `🤫 **[ROLAGEM CEGA de ${playerName}]** ${formula}: [${rawDie}] ${sign} = **${total}** — *${classification.label}*`
        wsSend('chat_message', {
          text: masterSecretText,
          target: 'Mestre',
          isWhisper: true,
          timestamp: new Date().toISOString(),
        })

        setChatInput('')
        return
      }
    }

    // Command: opposed check (e.g. /oposto Aurelio +3 vs Mutante +1)
    if (text.startsWith('/oposto ') || text.startsWith('/opposed ')) {
      const parts = text.replace(/^\/(?:oposto|opposed)\s+/i, '').split(/\s+vs\s+/i)
      if (parts.length === 2) {
        const [attPart, defPart] = parts
        const attMatch = attPart.trim().match(/^(.+?)(?:\s+([+-]?\d+))?$/)
        const defMatch = defPart.trim().match(/^(.+?)(?:\s+([+-]?\d+))?$/)
        if (attMatch && defMatch) {
          const attackerName = attMatch[1]
          const attackerBonus = parseInt(attMatch[2] || '0', 10)
          const defenderName = defMatch[1]
          const defenderBonus = parseInt(defMatch[2] || '0', 10)

          sfx.init()
          sfx.play('dice_roll')

          const res = resolveOpposedCheck({
            attackerName,
            attackerBonus,
            defenderName,
            defenderBonus,
          })

          const summaryText = `${res.outcomeText}\n📊 ${attackerName}: **${res.attacker.total}** ([${res.attacker.die}] ${attackerBonus >= 0 ? '+' : ''}${attackerBonus}) vs ${defenderName}: **${res.defender.total}** ([${res.defender.die}] ${defenderBonus >= 0 ? '+' : ''}${defenderBonus})`
          addLog(summaryText)
          wsSend('chat_message', { text: summaryText, timestamp: new Date().toISOString() })
          setChatInput('')
          return
        }
      }
    }
    
    // Command: help, clear, ping via chatParser
    const parsedCmd = parseChatMessage(text, playerName)
    if (parsedCmd.isCommand) {
      if (parsedCmd.type === 'help') {
        addLog(parsedCmd.formattedText)
        setChatInput('')
        return
      }
      if (parsedCmd.type === 'clear') {
        addLog('🧹 Histórico de mensagens limpo localmente.')
        setChatInput('')
        return
      }
      if (parsedCmd.type === 'ping') {
        wsSend('ping', { timestamp: Date.now() })
        addLog('🏓 Medindo latência com o servidor...')
        setChatInput('')
        return
      }
      if (parsedCmd.error) {
        addLog(`⚠️ ${parsedCmd.error}`)
        setChatInput('')
        return
      }
    }
    
    wsSend('chat_message', { text, timestamp: new Date().toISOString() })
    setChatInput('')
  }

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Chat & Log</h3>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column-reverse' }}>
        {entries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum evento registrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.slice().reverse().map((e, idx) => {
              if (e.rollData) {
                return (
                  <RollCard
                    key={e.id || idx}
                    rollerName={e.rollData.rollerName}
                    avatar={e.rollData.avatar}
                    diceType={e.rollData.diceType}
                    result={e.rollData.result}
                    raw={e.rollData.raw}
                    modifier={e.rollData.modifier || 0}
                    classification={e.rollData.classification}
                    targetName={e.rollData.targetName}
                    targetId={e.rollData.targetId}
                    onApplyDamage={onApplyDamage}
                    time={e.time}
                    note={e.rollData.note}
                  />
                )
              }
              if (e.chatData) {
                const c = e.chatData;
                const isMe = c.sender === playerName;
                let prefix = '';
                if (c.isWhisper) {
                  prefix = isMe ? `[Sussurro para ${c.target}]: ` : `[Sussurro de ${c.sender}]: `;
                } else {
                  prefix = `${c.sender}: `;
                }
                return (
                  <div key={e.id || idx} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    background: c.isWhisper ? 'var(--accent-subtle)' : 'transparent',
                    borderRadius: c.isWhisper ? 6 : 0,
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: 42, flexShrink: 0, marginTop: 2 }}>{e.time}</span>
                    <span style={{ color: c.isWhisper ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                      <strong>{prefix}</strong>{c.text}
                    </span>
                  </div>
                )
              }
              return (
                <div key={e.id || idx} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '5px 0', borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: 42, flexShrink: 0, marginTop: 1 }}>{e.time}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{e.msg}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Macros Shortcuts Bar */}
      <div style={{ marginBottom: 8 }}>
        <QuickMacrosBar onExecuteCommand={cmd => setChatInput(cmd)} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="input"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Mensagem, /w [Nome], /r 1d20, /gmroll 1d20+2, /oposto A vs B"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!chatInput.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}

// ── Tab: Missões & Diário de Documentos ─────────────────────────────────────────
function TabMissoes({ quests = [], discoveredHandouts = [], onOpenHandout }) {
  const [activeSubTab, setActiveSubTab] = useState('quests')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
        <button
          className={`btn btn-sm ${activeSubTab === 'quests' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('quests')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Target size={14} /> Missões da Campanha ({quests.length})
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === 'handouts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('handouts')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Scroll size={14} /> Documentos Revelados ({discoveredHandouts.length})
        </button>
      </div>

      {/* Quests View */}
      {activeSubTab === 'quests' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nenhuma missão registrada no momento pelo Mestre.
            </div>
          ) : (
            quests.map(q => {
              const isDone = q.status === 'completed'
              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${isDone ? '#10B98166' : 'var(--border-subtle)'}`,
                    borderRadius: 10,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: isDone ? '#10B981' : 'var(--text-primary)' }}>
                        {isDone ? '✓ ' : ''}{q.title}
                      </h3>
                      {q.description && (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {q.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {q.rewardXp > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600, background: '#F59E0B15', padding: '2px 6px', borderRadius: 4 }}>
                          <Award size={12} /> {q.rewardXp} XP
                        </span>
                      )}
                      {q.rewardGold > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FBBF24', fontSize: '0.75rem', fontWeight: 600, background: '#FBBF2415', padding: '2px 6px', borderRadius: 4 }}>
                          <Coins size={12} /> {q.rewardGold} $
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Objectives list */}
                  {q.objectives && q.objectives.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Objetivos</span>
                      {q.objectives.map(obj => (
                        <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {obj.completed ? (
                            <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                          ) : (
                            <Circle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: '0.82rem',
                            color: obj.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: obj.completed ? 'line-through' : 'none',
                          }}>
                            {obj.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Discovered Handouts View */}
      {activeSubTab === 'handouts' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discoveredHandouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nenhum documento ou pista revelado até o momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {discoveredHandouts.map(h => (
                <div
                  key={h.id}
                  onClick={() => onOpenHandout?.(h)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)' }}>
                    <Scroll size={14} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{h.title}</span>
                  </div>
                  {h.author && (
                    <span style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Por: {h.author}</span>
                  )}
                  <p style={{
                    margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {h.content}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: 4 }}>
                    Clique para abrir em tela cheia ➔
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

