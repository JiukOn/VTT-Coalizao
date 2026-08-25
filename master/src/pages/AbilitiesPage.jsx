/* AbilitiesPage.jsx — Abilities database page */
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { db } from '../services/database.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import AbilityList from '../components/abilities/AbilityList.jsx'

export default function AbilitiesPage({ onSelectEntity, onEntityContextMenu }) {
  const { ui } = useLanguage()
  const [abilities, setAbilities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await db.abilities.toArray()
        setAbilities(data)
      } catch (err) {
        console.error('Failed to load abilities:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title"><Zap size={24} /> {ui('habilidades')}</h2>
          <p className="page-subtitle">{ui('catalogo_habilidades')} ({abilities.length} total)</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">{ui('carregando')}</p></div>
      ) : (
        <AbilityList
          abilities={abilities}
          onSelect={onSelectEntity}
          onContextMenu={onEntityContextMenu}
        />
      )}
    </div>
  )
}
