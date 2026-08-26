import { useState, useEffect, useCallback } from 'react'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MainContent from './components/layout/MainContent.jsx'
import BottomBar from './components/layout/BottomBar.jsx'
import DetailPanel from './components/layout/DetailPanel.jsx'
import ContextMenu from './components/ui/ContextMenu.jsx'
import NpcSpotlightOverlay from '@shared/components/NpcSpotlightOverlay.jsx'

import NpcQuickGeneratorModal from './components/entities/NpcQuickGeneratorModal.jsx'
import Modal from './components/common/Modal.jsx'
import CharacterForm from './components/characters/CharacterForm.jsx'

import { useLocalStorage } from './hooks/index.js'
import { useServer } from './context/ServerContext.jsx'
import { WS_STATUS } from './hooks/useWebSocket.js'
import { db } from '@services/database.js'

// Pages
import DashboardPage    from './pages/DashboardPage.jsx'
import MapPage          from './pages/MapPage.jsx'
import CharactersPage   from './pages/CharactersPage.jsx'
import NPCsPage         from './pages/NPCsPage.jsx'
import BestiaryPage     from './pages/BestiaryPage.jsx'
import AbilitiesPage    from './pages/AbilitiesPage.jsx'
import ItemsPage        from './pages/ItemsPage.jsx'
import CampaignPage     from './pages/CampaignPage.jsx'
import ServerPage       from './pages/ServerPage.jsx'
import DomainPage      from './pages/DomainPage.jsx'
import TvDisplayPage    from './pages/TvDisplayPage.jsx'
import SessionAnalyticsPage from './pages/SessionAnalyticsPage.jsx'

const TABS = [
  { id: 'mapa',        label: 'Mapa',        icon: 'map' },
  { id: 'personagens', label: 'Personagens', icon: 'users' },
  { id: 'npcs',        label: 'NPCs',        icon: 'users' },
  { id: 'bestiario',   label: 'Bestiário',   icon: 'skull' },
  { id: 'habilidades', label: 'Habilidades', icon: 'zap' },
  { id: 'itens',       label: 'Itens',       icon: 'swords' },
  { id: 'campanha',    label: 'Campanha',    icon: 'book-open' },
  { id: 'dominios',    label: 'Domínios',    icon: 'globe' },
  { id: 'metricas',    label: 'Métricas',    icon: 'bar-chart-2' },
  { id: 'servidor',    label: 'Servidor',    icon: 'server' },
]

function App() {
  const [activeTab, setActiveTab] = useState('mapa')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [isTvMode, setIsTvMode] = useState(false)
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false)

  const [tableEntities, setTableEntities] = useLocalStorage('vtp_tableEntities', [])

  const [currentDialogue, setCurrentDialogue] = useState(null)

  useEffect(() => {
    const handleDialogue = (e) => {
      if (e.detail) setCurrentDialogue(e.detail)
    }
    window.addEventListener('vtt:npc_dialogue', handleDialogue)
    return () => window.removeEventListener('vtt:npc_dialogue', handleDialogue)
  }, [])

  // Server context (for broadcasting game state to connected players)
  const { status: serverStatus, broadcast } = useServer()
  const serverOnline = serverStatus === WS_STATUS.CONNECTED

  // ── Entity handlers ────────────────────────────────────────────────────────

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity)
    if (entity) setDetailPanelOpen(true)
  }

  const handleAddToTable = (entity) => {
    setTableEntities(prev => [...prev, { ...entity, tableId: Date.now() + Math.random() }])
  }

  const handleUpdateTableEntity = useCallback((id, updates) => {
    setTableEntities(prev => prev.map(e =>
      (e.tableId === id || e.id === id) ? { ...e, ...updates } : e
    ))
    // Broadcast HP/effect changes to connected players
    if (serverOnline) {
      broadcast('entity_update', { id, changes: updates })
    }
  }, [serverOnline, broadcast, setTableEntities])

  const [editingCharacter, setEditingCharacter] = useState(null)

  const handleEditEntity = (entity) => {
    if (!entity) return
    // If it's a character/hero, open CharacterForm in edit mode
    if (entity.classId || entity.speciesPrimary || entity.species || entity.tendencies) {
      setEditingCharacter(entity)
    } else {
      // For other entities, select and open DetailPanel
      handleSelectEntity(entity)
    }
  }

  const handleDeleteEntity = async (entity) => {
    if (!entity) return
    try {
      // Remove from active combat table
      setTableEntities(prev => prev.filter(e => e.tableId !== entity.tableId && e.id !== entity.id))
      // If it exists in characters database, delete it
      if (entity.id && db.characters) {
        await db.characters.delete(entity.id).catch(() => {})
        window.dispatchEvent(new CustomEvent('vtp:roster_changed'))
      }
    } catch (err) {
      console.error('Erro ao deletar entidade:', err)
    }
  }

  const handleEntityContextMenu = (e, entity) => {
    e.preventDefault()
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      options: [
        { label: 'Ver Detalhes / Ficha', action: () => handleSelectEntity(entity) },
        { label: 'Adicionar à Mesa',     action: () => handleAddToTable(entity) },
        { label: 'Editar',               action: () => handleEditEntity(entity) },
        { label: 'Deletar',              action: () => handleDeleteEntity(entity), danger: true },
      ],
    })
  }

  // ── Broadcast initiative/turn changes ─────────────────────────────────────
  // Exposed via window event so InitiativeTracker can trigger it without prop-drilling
  useEffect(() => {
    if (!serverOnline) return
    const handler = (evt) => broadcast('turn_change', evt.detail)
    window.addEventListener('vtp:turn_change', handler)
    return () => window.removeEventListener('vtp:turn_change', handler)
  }, [serverOnline, broadcast])

  // ── Apply player token moves from server ───────────────────────────────────
  useEffect(() => {
    const handler = (evt) => {
      const { id, changes } = evt.detail?.data || {}
      if (id && changes) handleUpdateTableEntity(id, changes)
    }
    window.addEventListener('vtp:token_move', handler)
    return () => window.removeEventListener('vtp:token_move', handler)
  }, [handleUpdateTableEntity])

  // Broadcast full state whenever table changes
  useEffect(() => {
    if (!serverOnline) return
    const entityMap = {}
    tableEntities.forEach(e => {
      entityMap[e.tableId || e.id] = e
    })
    broadcast('game_state_update', {
      order: [...tableEntities].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0)),
      round: 1, // To be implemented by a real tracker
      currentIndex: 0,
      entityMap
    })
  }, [tableEntities, serverOnline, broadcast])

  // ── Sync characters roster to server for player authentication ─────────────
  const syncRoster = useCallback(async () => {
    if (!serverOnline) return
    try {
      const heroes = await db.characters.toArray()
      broadcast('roster_update', {
        characters: heroes.map(c => {
          const charName = typeof c.name === 'string' ? c.name : (c.name?.['pt-br'] || c.name?.['en-us'] || String(c.id))
          const surname = c.surname ? ` ${c.surname}` : ''
          return {
            id: c.id,
            name: charName + surname,
            classId: c.classId || '',
            level: c.level || 1,
            avatar: c.tokenImage || c.avatar || '',
            hasPassword: Boolean(c.password && c.password.trim().length > 0),
            password: c.password || '',
          }
        })
      })
    } catch (err) {
      console.error('[App] Failed to sync roster:', err)
    }
  }, [serverOnline, broadcast])

  useEffect(() => {
    syncRoster()
    const handler = () => syncRoster()
    window.addEventListener('vtp:roster_changed', handler)
    return () => window.removeEventListener('vtp:roster_changed', handler)
  }, [syncRoster])

  // ── Page renderer ──────────────────────────────────────────────────────────

  const renderPage = () => {
    switch (activeTab) {
      case 'mesa':
        return <DashboardPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} tableEntities={tableEntities} setTableEntities={setTableEntities} onUpdateTableEntity={handleUpdateTableEntity} />
      case 'mapa':
        return <MapPage tableEntities={tableEntities} setTableEntities={setTableEntities} />
      case 'personagens':
        return <CharactersPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'npcs':
        return <NPCsPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'bestiario':
        return <BestiaryPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'habilidades':
        return <AbilitiesPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'itens':
        return <ItemsPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'campanha':
        return <CampaignPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
      case 'dominios':
        return <DomainPage />
      case 'metricas':
        return <SessionAnalyticsPage />
      case 'servidor':
        return <ServerPage />
      default:
        return <DashboardPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
    }
  }

  if (isTvMode) {
    return <TvDisplayPage onExitTvMode={() => setIsTvMode(false)} />
  }

  return (
    <div className="app-container">
      <Header
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        serverOnline={serverOnline}
        onToggleTvMode={() => setIsTvMode(true)}
        onOpenGenerator={() => setGeneratorModalOpen(true)}
      />
      <div className="app-body">
        {['personagens', 'npcs', 'bestiario', 'habilidades', 'itens'].includes(activeTab) && (
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            activeTab={activeTab}
            onSelectEntity={handleSelectEntity}
          />
        )}
        <MainContent>
          {renderPage()}
        </MainContent>
        <DetailPanel
          isOpen={detailPanelOpen}
          onToggle={() => setDetailPanelOpen(!detailPanelOpen)}
          entity={selectedEntity}
          onAddToTable={handleAddToTable}
          tableEntities={tableEntities}
          onUpdateTableEntity={handleUpdateTableEntity}
        />
      </div>
      <BottomBar
        tableEntities={tableEntities}
        setTableEntities={setTableEntities}
        onUpdateTableEntity={handleUpdateTableEntity}
      />

      {generatorModalOpen && (
        <NpcQuickGeneratorModal
          isOpen={generatorModalOpen}
          onClose={() => setGeneratorModalOpen(false)}
          onAddEntity={handleAddToTable}
        />
      )}

      {editingCharacter && (
        <Modal
          isOpen={!!editingCharacter}
          onClose={() => setEditingCharacter(null)}
          title={`Editar Personagem — ${editingCharacter.name || 'Herói'}`}
        >
          <CharacterForm
            campaignId={editingCharacter.campaignId || 'coalizao'}
            editCharacter={editingCharacter}
            onSave={() => {
              setEditingCharacter(null)
              window.dispatchEvent(new CustomEvent('vtp:roster_changed'))
            }}
            onCancel={() => setEditingCharacter(null)}
          />
        </Modal>
      )}

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}

      {currentDialogue && (
        <NpcSpotlightOverlay
          dialogue={currentDialogue}
          onDismiss={() => setCurrentDialogue(null)}
        />
      )}
    </div>
  )
}

export default App
