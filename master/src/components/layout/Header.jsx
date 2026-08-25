import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { Sun, Moon, Download, Upload, Settings, Wifi, Volume2, VolumeX, QrCode, Radio, Scroll, Target, Image as ImageIcon, Tv, MessageSquareQuote, BarChart3, BookOpen, Layers, Activity, Trees, ShieldAlert, Sparkles } from 'lucide-react'
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

export default function Header({ tabs, activeTab, onTabChange, serverOnline = false, onToggleTvMode }) {
  const { theme, toggleTheme } = useTheme()
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
  const [dynamicMusicMood, setDynamicMusicMood] = useState('off')

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
          <button 
            className="btn btn-ghost btn-icon" 
            title="Compartilhar Sessão / QR Code" 
            aria-label="Compartilhar Sessão / QR Code"
            onClick={() => setShareModalOpen(true)}
          >
            <QrCode size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setHandoutModalOpen(true)}
            title="Documentos, Cartas e Pistas (Handouts)"
            aria-label="Documentos, Cartas e Pistas"
          >
            <Scroll size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setQuestModalOpen(true)}
            title="Quadro de Missões & Objetivos"
            aria-label="Quadro de Missões"
          >
            <Target size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSceneModalOpen(true)}
            title="Teatro da Mente & Cenários Cinematográficos"
            aria-label="Cenários Cinematográficos"
          >
            <ImageIcon size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setRumorsModalOpen(true)}
            title="Gerador de Rumores de Taverna & Ganchos Narrativos"
            aria-label="Rumores de Taverna"
            style={{ color: '#38BDF8' }}
          >
            <MessageSquareQuote size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setRecapModalOpen(true)}
            title="Resumo da Sessão & Estatísticas Pós-Jogo"
            aria-label="Resumo da Sessão"
            style={{ color: '#10B981' }}
          >
            <BarChart3 size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setJournalModalOpen(true)}
            title="Diário de Campanha & Linha do Tempo"
            aria-label="Diário da Campanha"
            style={{ color: '#A855F7' }}
          >
            <BookOpen size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setInitDeckModalOpen(true)}
            title="Baralho de Iniciativa Tática & Cartas de Ação"
            aria-label="Baralho de Iniciativa"
            style={{ color: '#F59E0B' }}
          >
            <Layers size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setInjuryModalOpen(true)}
            title="Sequelas de Combate & Ferimentos Persistentes"
            aria-label="Sequelas de Combate"
            style={{ color: '#EF4444' }}
          >
            <Activity size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setAuraModalOpen(true)}
            title="Auras Táticas da Coalizão"
            aria-label="Auras da Coalizão"
            style={{ color: '#38BDF8' }}
          >
            <Sparkles size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setBiomeModalOpen(true)}
            title="Biomas & Climas Canônicos da Coalizão"
            aria-label="Biomas da Coalizão"
            style={{ color: '#10B981' }}
          >
            <Trees size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setConditionModalOpen(true)}
            title="Condições, Maldições & Doenças Canônicas"
            aria-label="Condições da Coalizão"
            style={{ color: '#DC2626' }}
          >
            <ShieldAlert size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSpotlightModalOpen(true)}
            title="Diálogo Cinemático de NPC & Narração (Spotlight)"
            aria-label="Diálogo de NPC"
            style={{ color: '#C084FC' }}
          >
            <MessageSquareQuote size={18} />
          </button>
          {onToggleTvMode && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={onToggleTvMode}
              title="Modo Telão / TV Tabletop"
              aria-label="Modo Telão"
            >
              <Tv size={18} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Importar Pacote de Campanha (.coalizao)"
            aria-label="Importar Campanha"
          >
            <Upload size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleExportCampaign}
            title="Exportar Pacote de Campanha (.coalizao)"
            aria-label="Exportar Campanha"
          >
            <Download size={18} />
          </button>
          <button
            className={`btn btn-ghost btn-icon ${currentAmbientTheme !== 'none' ? 'active' : ''}`}
            onClick={() => setAmbientModalOpen(true)}
            title="Trilha Sonora & Ambiência da Sessão"
            aria-label="Trilha Sonora & Ambiência da Sessão"
            style={{ color: currentAmbientTheme !== 'none' ? 'var(--accent-primary)' : 'inherit' }}
          >
            <Radio size={18} />
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
              fontSize: '0.75rem',
              padding: '2px 6px',
              background: dynamicMusicMood !== 'off' ? 'rgba(155, 89, 232, 0.2)' : 'var(--bg-tertiary)',
              borderColor: dynamicMusicMood !== 'off' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: dynamicMusicMood !== 'off' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {Object.values(MUSIC_MOODS).map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-icon" onClick={handleMuteToggle} title="Toggle Sound" aria-label="Toggle Sound">
            {!isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle Theme" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-ghost btn-icon" title="Settings" aria-label="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

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
