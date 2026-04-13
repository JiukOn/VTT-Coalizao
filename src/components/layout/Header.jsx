/* Header.jsx — Top navigation bar with tabs and theme toggle */
import { useTheme } from '../../context/ThemeContext.jsx'
import { Sun, Moon, Download, Upload, Settings } from 'lucide-react'
import '../../styles/layout.css'

export default function Header({ tabs, activeTab, onTabChange }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="header-logo">⚔️ VTT Coalizao</div>

      <nav className="header-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
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
