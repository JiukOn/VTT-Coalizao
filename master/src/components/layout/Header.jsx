import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { Download, Upload, Settings, Wifi, Volume2, VolumeX, QrCode, Radio, Scroll, Target, Image as ImageIcon, Tv, MessageSquareQuote, BarChart3, BookOpen, Layers, Activity, Trees, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react'
import { sfx } from '@shared/utils/sfxPlayer.js'
import '../../styles/layout.css'
import ShareSessionModal from '../server/ShareSessionModal.jsx'
import AmbientSoundModal from '../audio/AmbientSoundModal.jsx'
import HandoutModal from '../campaign/HandoutModal.jsx'
import QuestLogModal from '../campaign/QuestLogModal.jsx'
import ScenePresentationModal from '../campaign/ScenePresentationModal.jsx'
import RumorsModal from '../generators/RumorsModal.jsx'
import SessionRecapModal from '../campaign/SessionRecapModal.jsx'
import JournalModal from '../campaign/JournalModal.jsx'
import InitiativeDeckModal from '../combat/InitiativeDeckModal.jsx'
import InjuryModal from '../combat/InjuryModal.jsx'
import AuraEmitterModal from '../combat/AuraEmitterModal.jsx'
import BiomeModal from '../map/BiomeModal.jsx'
import ConditionManagerModal from '../combat/ConditionManagerModal.jsx'
import NpcSpotlightModal from '../dialogue/NpcSpotlightModal.jsx'
import { useServer } from '../../context/ServerContext.jsx'
import { db } from '@services/database.js'
import { createCampaignPackage, downloadCampaignPackage, validateCampaignPackage, restoreCampaignPackage } from '@shared/utils/campaignPackage.js'
import { dynamicMusic, MUSIC_MOODS } from '@shared/utils/ambientMusicSynth.js'
import SettingsModal from '@shared/components/SettingsModal.jsx'

export default function Header({ tabs, activeTab, onTabChange, serverOnline = false, onToggleTvMode, onOpenGenerator }) {
  const { t } = useLanguage()
  const [isMuted, setIsMuted] = useState(sfx.isMuted())
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [ambientModalOpen, setAmbientModalOpen] = useState(false)
  const [currentAmbientTheme, setCurrentAmbientTheme] = useState('none')
  const [handoutModalOpen, setHandoutModalOpen] = useState(false)
  const [questModalOpen, setQuestModalOpen] = useState(false)
  const [sceneModalOpen, setSceneModalOpen] = useState(false)
  const [rumorsModalOpen, setRumorsModalOpen] = useState(false)
  const [recapModalOpen, setRecapModalOpen] = useState(false)
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [initDeckModalOpen, setInitDeckModalOpen] = useState(false)
  const [injuryModalOpen, setInjuryModalOpen] = useState(false)
  const [auraModalOpen, setAuraModalOpen] = useState(false)
  const [biomeModalOpen, setBiomeModalOpen] = useState(false)
  const [conditionModalOpen, setConditionModalOpen] = useState(false)
  const [spotlightModalOpen, setSpotlightModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [dynamicMusicMood, setDynamicMusicMood] = useState('off')
  const [narrativeDropdownOpen, setNarrativeDropdownOpen] = useState(false)
  const [tacticsDropdownOpen, setTacticsDropdownOpen] = useState(false)

  const [handouts, setHandouts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_campaign_handouts') || '[]')
    } catch { return [] }
  })

  const [quests, setQuests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_campaign_quests') || '[]')
    } catch { return [] }
  })

  const { sessionCode, wsUrl, serverIps, broadcast } = useServer()

  useEffect(() => {
    try {
      localStorage.setItem('vtt_campaign_handouts', JSON.stringify(handouts))
    } catch { /* ignore */ }
  }, [handouts])

  useEffect(() => {
    try {
      localStorage.setItem('vtt_campaign_quests', JSON.stringify(quests))
    } catch { /* ignore */ }
  }, [quests])

  const fileInputRef = useRef(null)

  const handleMuteToggle = () => {
    sfx.init()
    const next = sfx.toggleMute()
    setIsMuted(next)
  }

  const handleExportCampaign = async () => {
    try {
      const maps = await db.maps.toArray()
      const characters = await db.characters.toArray()
      const creatures = await db.creatures.toArray()
      const pkg = createCampaignPackage({ maps, characters, creatures, campaignName: 'Campanha Coalizão' })
      downloadCampaignPackage(pkg)
      sfx.init()
      sfx.play('turn_alert')
    } catch (err) {
      alert('Erro ao exportar campanha: ' + err.message)
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const pkg = JSON.parse(reader.result)
        const validation = validateCampaignPackage(pkg)
        if (!validation.valid) {
          alert('Erro no arquivo: ' + validation.error)
          return
        }
        const { summary } = validation
        const confirmMsg = `Deseja restaurar esta campanha?\n\n• Mapas: ${summary.mapsCount}\n• Heróis: ${summary.charactersCount}\n• Criaturas: ${summary.creaturesCount}\n• Missões: ${summary.questsCount}\n• Documentos: ${summary.handoutsCount}\n• Cenários: ${summary.scenesCount}\n\nAviso: Seus dados atuais serão atualizados.`
        if (window.confirm(confirmMsg)) {
          await restoreCampaignPackage(pkg, db)
          sfx.init()
          sfx.play('turn_alert')
          alert('Campanha importada com sucesso! A página será recarregada.')
          window.location.reload()
        }
      } catch (err) {
        alert('Falha ao importar pacote: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".coalizao,.json"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      <header className="header">
        <div className="header-logo">
          ⚔️ VTT Coalizao
          {serverOnline && (
            <span title="Servidor online" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              marginLeft: 8, fontSize: '0.65rem', fontFamily: 'var(--font-body)',
              color: 'var(--color-success)', fontWeight: 600,
            }}>
              <Wifi size={10} /> Online
            </span>
          )}
        </div>

        <nav className="header-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {t(tab.label)}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          {/* Quick NPC Generator */}
          {onOpenGenerator && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onOpenGenerator}
              title="Gerador Rápido de NPC & Criaturas da Coalizão"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 28,
                fontSize: '0.75rem',
                border: '1px solid var(--accent-primary)',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} />
              <span>Gerador Rápido</span>
            </button>
          )}

          {/* Quick Access: Share / QR Code */}
          <button 
            className="btn btn-ghost btn-icon" 
            title="Compartilhar Sessão / QR Code" 
            aria-label="Compartilhar Sessão / QR Code"
            onClick={() => setShareModalOpen(true)}
          >
            <QrCode size={17} />
          </button>

          {/* Narrative & Storytelling Tools Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setNarrativeDropdownOpen(v => !v); setTacticsDropdownOpen(false) }}
              title="Ferramentas Narrativas, Missões e Cenários"
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, fontSize: '0.75rem' }}
            >
              <Scroll size={14} color="#38BDF8" />
              <span>Narrativa</span>
              <ChevronDown size={12} />
            </button>

            {narrativeDropdownOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, padding: 6, width: 220, zIndex: 1000,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setHandoutModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Scroll size={14} color="#38BDF8" /> Documentos & Pistas
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setQuestModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Target size={14} color="#F59E0B" /> Quadro de Missões
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setSceneModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <ImageIcon size={14} color="#10B981" /> Cenas Cinematográficas
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setSpotlightModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <MessageSquareQuote size={14} color="#C084FC" /> Diálogo de NPC (Spotlight)
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setRumorsModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <MessageSquareQuote size={14} color="#38BDF8" /> Rumores de Taverna
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setJournalModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <BookOpen size={14} color="#A855F7" /> Diário de Campanha
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setRecapModalOpen(true); setNarrativeDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <BarChart3 size={14} color="#10B981" /> Resumo da Sessão
                </button>
              </div>
            )}
          </div>

          {/* Tactical & Rules Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setTacticsDropdownOpen(v => !v); setNarrativeDropdownOpen(false) }}
              title="Ferramentas Táticas, Auras e Condições"
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, fontSize: '0.75rem' }}
            >
              <Layers size={14} color="#F59E0B" />
              <span>Tática</span>
              <ChevronDown size={12} />
            </button>

            {tacticsDropdownOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, padding: 6, width: 220, zIndex: 1000,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setInitDeckModalOpen(true); setTacticsDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Layers size={14} color="#F59E0B" /> Baralho de Iniciativa
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setInjuryModalOpen(true); setTacticsDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Activity size={14} color="#EF4444" /> Sequelas de Combate
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setAuraModalOpen(true); setTacticsDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Sparkles size={14} color="#38BDF8" /> Auras da Coalizão
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setBiomeModalOpen(true); setTacticsDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <Trees size={14} color="#10B981" /> Biomas & Clima
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setConditionModalOpen(true); setTacticsDropdownOpen(false) }}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.75rem', height: 28 }}
                >
                  <ShieldAlert size={14} color="#DC2626" /> Condições & Efeitos
                </button>
              </div>
            )}
          </div>

          {/* TV Mode */}
          {onToggleTvMode && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={onToggleTvMode}
              title="Modo Telão / TV Tabletop"
              aria-label="Modo Telão"
            >
              <Tv size={17} />
            </button>
          )}

          {/* Import / Export Package */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Importar Pacote de Campanha (.coalizao)"
            aria-label="Importar Campanha"
          >
            <Upload size={17} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleExportCampaign}
            title="Exportar Pacote de Campanha (.coalizao)"
            aria-label="Exportar Campanha"
          >
            <Download size={17} />
          </button>

          {/* Ambient Audio & Music */}
          <button
            className={`btn btn-ghost btn-icon ${currentAmbientTheme !== 'none' ? 'active' : ''}`}
            onClick={() => setAmbientModalOpen(true)}
            title="Trilha Sonora & Ambiência da Sessão"
            aria-label="Trilha Sonora & Ambiência da Sessão"
            style={{ color: currentAmbientTheme !== 'none' ? 'var(--accent-primary)' : 'inherit' }}
          >
            <Radio size={17} />
          </button>

          {/* Dynamic Adaptive Music Mood Selector */}
          <select
            className="input select"
            value={dynamicMusicMood}
            onChange={e => {
              const newMood = e.target.value
              setDynamicMusicMood(newMood)
              dynamicMusic.setMood(newMood)
              if (serverOnline && broadcast) {
                broadcast('ambient_music_change', { mood: newMood })
              }
            }}
            title="Música Ambiente Adaptativa Procedural"
            style={{
              height: 28,
              fontSize: '0.72rem',
              padding: '2px 4px',
              background: dynamicMusicMood !== 'off' ? 'rgba(155, 89, 232, 0.2)' : 'var(--bg-tertiary)',
              borderColor: dynamicMusicMood !== 'off' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: dynamicMusicMood !== 'off' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            {Object.values(MUSIC_MOODS).map(m => (
              <option key={m.id} value={m.id}>
                {m.label || m.name}
              </option>
            ))}
          </select>

          {/* SFX Mute Button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleMuteToggle}
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
            aria-label="Controle de Áudio"
            style={{ color: isMuted ? 'var(--color-danger)' : 'inherit' }}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* General Settings */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSettingsModalOpen(true)}
            title="Configurações Gerais (Tema, Cores, Idioma, Áudio)"
            aria-label="Configurações Gerais"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {shareModalOpen && (
        <ShareSessionModal 
          onClose={() => setShareModalOpen(false)} 
          sessionCode={sessionCode}
          serverUrl={wsUrl || window.location.origin.replace(/^http/, 'ws')}
          serverIps={serverIps}
        />
      )}

      {ambientModalOpen && (
        <AmbientSoundModal
          isOpen={ambientModalOpen}
          onClose={() => setAmbientModalOpen(false)}
          currentTheme={currentAmbientTheme}
          onBroadcastTheme={(theme, vol) => {
            setCurrentAmbientTheme(theme)
            if (serverOnline && broadcast) {
              broadcast('ambient_change', { theme, volume: vol })
            }
          }}
        />
      )}

      {handoutModalOpen && (
        <HandoutModal
          isOpen={handoutModalOpen}
          onClose={() => setHandoutModalOpen(false)}
          handouts={handouts}
          onSaveHandouts={setHandouts}
          onRevealToPlayers={(handout) => {
            if (serverOnline && broadcast) {
              broadcast('handout_reveal', handout)
            }
          }}
        />
      )}

      {questModalOpen && (
        <QuestLogModal
          isOpen={questModalOpen}
          onClose={() => setQuestModalOpen(false)}
          quests={quests}
          onSaveQuests={setQuests}
          onBroadcastQuests={(updatedQuests) => {
            if (serverOnline && broadcast) {
              broadcast('quest_update', { quests: updatedQuests })
            }
          }}
        />
      )}

      {sceneModalOpen && (
        <ScenePresentationModal
          isOpen={sceneModalOpen}
          onClose={() => setSceneModalOpen(false)}
          onBroadcastScene={(scene) => {
            if (serverOnline && broadcast) {
              broadcast('scene_reveal', scene)
            }
          }}
        />
      )}

      {rumorsModalOpen && (
        <RumorsModal
          isOpen={rumorsModalOpen}
          onClose={() => setRumorsModalOpen(false)}
          onBroadcastMessage={(text) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text, sender: 'Narrador' })
            }
          }}
        />
      )}

      {recapModalOpen && (
        <SessionRecapModal
          isOpen={recapModalOpen}
          onClose={() => setRecapModalOpen(false)}
          onBroadcastRecap={(report) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text: report, sender: 'Mestre' })
            }
          }}
        />
      )}

      {journalModalOpen && (
        <JournalModal
          isOpen={journalModalOpen}
          onClose={() => setJournalModalOpen(false)}
        />
      )}

      {initDeckModalOpen && (
        <InitiativeDeckModal
          isOpen={initDeckModalOpen}
          onClose={() => setInitDeckModalOpen(false)}
          onBroadcastRoundCards={(summary) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text: summary, sender: 'Mestre' })
            }
          }}
        />
      )}

      {injuryModalOpen && (
        <InjuryModal
          isOpen={injuryModalOpen}
          onClose={() => setInjuryModalOpen(false)}
          onApplyInjury={(summary) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text: summary, sender: 'Mestre' })
            }
          }}
        />
      )}

      {auraModalOpen && (
        <AuraEmitterModal
          isOpen={auraModalOpen}
          onClose={() => setAuraModalOpen(false)}
          onBroadcastAura={(summary) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text: summary, sender: 'Mestre' })
            }
          }}
        />
      )}

      {biomeModalOpen && (
        <BiomeModal
          isOpen={biomeModalOpen}
          onClose={() => setBiomeModalOpen(false)}
          onSelectBiome={(biome, summary) => {
            if (serverOnline && broadcast) {
              broadcast('weather_change', { weather: biome.weather })
              broadcast('chat_message', { text: summary, sender: 'Narrador' })
            }
          }}
        />
      )}

      {conditionModalOpen && (
        <ConditionManagerModal
          isOpen={conditionModalOpen}
          onClose={() => setConditionModalOpen(false)}
          onBroadcastCondition={(summary) => {
            if (serverOnline && broadcast) {
              broadcast('chat_message', { text: summary, sender: 'Mestre' })
            }
          }}
        />
      )}

      {spotlightModalOpen && (
        <NpcSpotlightModal
          isOpen={spotlightModalOpen}
          onClose={() => setSpotlightModalOpen(false)}
          onBroadcastDialogue={(payload) => {
            if (serverOnline && broadcast) {
              broadcast('npc_dialogue', payload)
            }
            window.dispatchEvent(new CustomEvent('vtt:npc_dialogue', { detail: payload }))
          }}
        />
      )}
    </>
  )
}
