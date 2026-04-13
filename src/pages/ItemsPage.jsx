/* ItemsPage.jsx — Items and weapons database page */
import { useState, useEffect } from 'react'
import { Swords } from 'lucide-react'
import { db } from '../services/database.js'
import ItemList from '../components/items/ItemList.jsx'

export default function ItemsPage({ onSelectEntity, onEntityContextMenu }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await db.items.toArray()
        setItems(data)
      } catch (err) {
        console.error('Failed to load items:', err)
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
          <h2 className="page-title"><Swords size={24} /> Itens &amp; Armas</h2>
          <p className="page-subtitle">Banco de dados de equipamentos do sistema Coalizão. ({items.length} total)</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p className="empty-state-text">Carregando...</p></div>
      ) : (
        <ItemList
          items={items}
          onSelect={onSelectEntity}
          onContextMenu={onEntityContextMenu}
        />
      )}
    </div>
  )
}
