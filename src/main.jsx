/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { CampaignProvider } from './context/CampaignContext.jsx'
import { ServerProvider } from './context/ServerContext.jsx'
import { seedDatabase } from './services/dataSeeder.js'
import { initErrorLogger } from './utils/errorLogger.js'
import PlayerLoginPage from './pages/PlayerLoginPage.jsx'
import PlayerDashboard from './pages/PlayerDashboard.jsx'
import './styles/index.css'

// ── Initialize error capture before anything else ─────────────────────────────
initErrorLogger()

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
        <LanguageProvider>
          <PlayerLoginPage onConnect={setSession} />
        </LanguageProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <PlayerDashboard session={session} onDisconnect={() => setSession(null)} />
      </LanguageProvider>
    </ThemeProvider>
  )
}

// ── Master app ─────────────────────────────────────────────────────────────────
function MasterApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CampaignProvider>
          <ServerProvider>
            <App />
          </ServerProvider>
        </CampaignProvider>
      </LanguageProvider>
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
  try {
    await seedDatabase()
  } catch (err) {
    console.error('[Bootstrap] seedDatabase failed:', err)
  }

  const container = document.getElementById('root')
  if (!window.__reactRoot) {
    window.__reactRoot = createRoot(container)
  }

  window.__reactRoot.render(
    <StrictMode>
      <Root />
    </StrictMode>
  )
})()
