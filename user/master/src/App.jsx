import { useState, useEffect, useCallback } from 'react'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MainContent from './components/layout/MainContent.jsx'
import BottomBar from './components/layout/BottomBar.jsx'
import DetailPanel from './components/layout/DetailPanel.jsx'
import ContextMenu from './components/ui/ContextMenu.jsx'

import { useLocalStorage } from './hooks/index.js'
import { useServer } from './context/ServerContext.jsx'
import { WS_STATUS } from './hooks/useWebSocket.js'

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

const TABS = [
  { id: 'mesa',        label: 'Mesa',        icon: 'zap' },
  { id: 'mapa',        label: 'Mapa',        icon: 'map' },
  { id: 'personagens', label: 'Personagens', icon: 'users' },
  { id: 'npcs',        label: 'NPCs',        icon: 'users' },
  { id: 'bestiario',   label: 'Bestiário',   icon: 'skull' },
  { id: 'habilidades', label: 'Habilidades', icon: 'zap' },
  { id: 'itens',       label: 'Itens',       icon: 'swords' },
  { id: 'campanha',    label: 'Campanha',    icon: 'book-open' },
  { id: 'dominios',   label: 'Domínios',   icon: 'globe' },
  { id: 'servidor',    label: 'Servidor',    icon: 'server' },
]

function App() {
  const [activeTab, setActiveTab] = useState('mesa')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)

  const [tableEntities, setTableEntities] = useLocalStorage('vtp_tableEntities', [])

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

  const handleEntityContextMenu = (e, entity) => {
    e.preventDefault()
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      options: [
        { label: 'Ver Detalhes',     action: () => handleSelectEntity(entity) },
        { label: 'Adicionar à Mesa', action: () => handleAddToTable(entity) },
        { label: 'Editar',           action: () => console.log('Editar', entity.name) },
        { label: 'Deletar',          action: () => console.log('Deletar', entity.name), danger: true },
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
      case 'servidor':
        return <ServerPage />
      default:
        return <DashboardPage onSelectEntity={handleSelectEntity} onEntityContextMenu={handleEntityContextMenu} />
    }
  }

  return (
    <div className="app-container">
      <Header
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        serverOnline={serverOnline}
      />
      <div className="app-body">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onSelectEntity={handleSelectEntity}
        />
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

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default App
