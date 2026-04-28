/* Header.jsx — Top navigation bar with tabs and theme toggle */
import { useTheme } from '../../context/ThemeContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { Sun, Moon, Download, Upload, Settings, Wifi } from 'lucide-react'
import '../../styles/layout.css'

export default function Header({ tabs, activeTab, onTabChange, serverOnline = false }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  return (
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
        <button className="btn btn-ghost btn-icon" title="Import" aria-label="Import data">
          <Upload size={18} />
        </button>
        <button className="btn btn-ghost btn-icon" title="Export" aria-label="Export data">
          <Download size={18} />
        </button>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle Theme" aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="btn btn-ghost btn-icon" title="Settings" aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
