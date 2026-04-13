import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { CampaignProvider } from './context/CampaignContext.jsx'
import { ServerProvider } from './context/ServerContext.jsx'
import { seedDatabase } from './services/dataSeeder.js'
import PlayerLoginPage from './pages/PlayerLoginPage.jsx'
import PlayerDashboard from './pages/PlayerDashboard.jsx'
import './styles/index.css'

// ── Simple hash router ─────────────────────────────────────────────────────────
function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  useEffect(() => {
    const handler = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return route
}

// ── Player app (no master-only providers needed) ──────────────────────────────
function PlayerApp() {
  const [session, setSession] = useState(null)

  if (!session) {
    return (
      <ThemeProvider>
        <PlayerLoginPage onConnect={setSession} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <PlayerDashboard session={session} onDisconnect={() => setSession(null)} />
    </ThemeProvider>
  )
}

// ── Master app ─────────────────────────────────────────────────────────────────
function MasterApp() {
  return (
    <ThemeProvider>
      <CampaignProvider>
        <ServerProvider>
          <App />
        </ServerProvider>
      </CampaignProvider>
    </ThemeProvider>
  )
}

// ── Root router ────────────────────────────────────────────────────────────────
function Root() {
  const route = useHashRoute()
  if (route.startsWith('#/player')) return <PlayerApp />
  return <MasterApp />
}

// ── Bootstrap: await DB seed, then mount ──────────────────────────────────────
;(async () => {
  await seedDatabase()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Root />
    </StrictMode>
  )
})()
