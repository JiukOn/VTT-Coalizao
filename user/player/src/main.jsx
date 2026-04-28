/* ============================================================
   VTT COALIZÃO — Player Entry Point
   Standalone player app: Login → Dashboard
   No master providers, no IndexedDB (all data via WS from Host)
   ============================================================ */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import PlayerLoginPage from './pages/PlayerLoginPage.jsx'
import PlayerDashboard from './pages/PlayerDashboard.jsx'
import '../../../src/styles/index.css'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PlayerApp />
  </StrictMode>
)
