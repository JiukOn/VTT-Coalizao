/* AbilitiesPage.jsx — Abilities database page */
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { db } from '../services/database.js'
import AbilityList from '../components/abilities/AbilityList.jsx'

export default function AbilitiesPage({ onSelectEntity, onEntityContextMenu }) {
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
          <h2 className="page-title"><Zap size={24} /> Habilidades</h2>
          <p className="page-subtitle">Catálogo completo de habilidades do sistema Coalizão. ({abilities.length} total)</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">Carregando...</p></div>
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
