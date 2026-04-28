/* CharacterList.jsx — Grid of campaign characters with search & creation */
import { useState, useEffect, useCallback } from 'react'
import { Plus, User, MoreVertical, Sparkles } from 'lucide-react'
import SearchBar from '../common/SearchBar'
import Modal from '../common/Modal'
import CharacterForm from './CharacterForm'
import CharacterSheet from './CharacterSheet'
import EvolutionModal from './EvolutionModal'
import db from '../../services/database'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function CharacterList({ campaignId, onSelectCharacter, onContextMenu }) {
  const { t, ui } = useLanguage()
  const [characters, setCharacters] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editChar, setEditChar] = useState(null)
  const [viewChar, setViewChar] = useState(null)
  const [evolutionChar, setEvolutionChar] = useState(null)

  const loadCharacters = useCallback(async () => {
    try {
      const list = await db.characters.where({ campaignId }).toArray()
      setCharacters(list)
    } catch (err) {
      console.error('Erro ao carregar personagens:', err)
    }
  }, [campaignId])

  useEffect(() => {
    if (campaignId) loadCharacters()
  }, [campaignId, loadCharacters])

  const filtered = characters.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.classId?.toLowerCase().includes(q)
    )
  })

  function handleSave() {
    setShowForm(false)
    setEditChar(null)
    loadCharacters()
  }

  function handleCardClick(char) {
    setViewChar(char)
    onSelectCharacter?.(char)
  }

  function handleCharUpdate(updated) {
    setViewChar(updated)
    db.characters.put(updated).then(loadCharacters).catch(console.error)
  }

  function handleEvolutionSave(updated) {
    db.characters.put(updated).then(loadCharacters).catch(console.error)
  }

  function handleContextMenu(e, char) {
    e.preventDefault()
    onContextMenu?.(e, char)
  }

  return (
    <div className="character-list">
      {/* Toolbar */}
      <div className="cl-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder={`${ui('buscar')} ${ui('personagens').toLowerCase()}...`} />
        <button className="btn btn-primary" onClick={() => { setEditChar(null); setShowForm(true) }}>
          <Plus size={16} /> {ui('novo')} {ui('herois')}
        </button>
      </div>

      {/* Character grid */}
      {filtered.length > 0 ? (
        <div className="cl-grid">
          {filtered.map(char => (
            <div
              key={char.id}
              className="cl-card card"
              onClick={() => handleCardClick(char)}
              onContextMenu={e => handleContextMenu(e, char)}
            >
              <div className="cl-avatar" style={{ background: char.tokenColor || 'var(--accent-primary)' }}>
                {char.tokenImage
                  ? <img src={char.tokenImage} alt={t(char.name)} />
                  : <span>{t(char.name)?.[0] || '?'}</span>
                }
              </div>
              <div className="cl-info">
                <div className="cl-name">{t(char.name)}</div>
                <div className="cl-meta">
                  {char.classId && <span className="badge badge-accent">{t(char.classId)}</span>}
                  <span className="badge badge-warning">Nv {char.level}</span>
                  {char.evolution && (
                    <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                      ✦ {char.evolution}
                    </span>
                  )}
                  {!char.evolution && char.level >= 5 && (
                    <button
                      className="btn btn-sm"
                      style={{ padding: '1px 6px', fontSize: '0.68rem', background: 'rgba(155,89,232,0.15)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: 4 }}
                      onClick={e => { e.stopPropagation(); setEvolutionChar(char) }}
                    >
                      <Sparkles size={10} /> {char.level >= 10 ? 'TransEvo' : 'Evoluir'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cl-empty">
          <User size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-muted">
            {search ? ui('nenhum_encontrado') : `${ui('nenhum_encontrado')} (${ui('herois').toLowerCase()})`}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> {ui('criar')} {ui('herois').toLowerCase()}
            </button>
          )}
        </div>
      )}

      {/* Creation / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditChar(null) }}
        title={editChar ? `${ui('editar')} ${ui('herois')}` : `${ui('novo')} ${ui('herois')}`}
      >
        <CharacterForm
          campaignId={campaignId}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditChar(null) }}
          editCharacter={editChar}
        />
      </Modal>

      {/* Character Sheet Modal */}
      <Modal
        isOpen={!!viewChar}
        onClose={() => setViewChar(null)}
        title={t(viewChar?.name) || 'Ficha do Personagem'}
      >
        <CharacterSheet character={viewChar} onUpdate={handleCharUpdate} />
      </Modal>

      {/* Evolution / TransEvolution Modal */}
      <Modal
        isOpen={!!evolutionChar}
        onClose={() => setEvolutionChar(null)}
        title={evolutionChar?.level >= 10 ? 'TransEvolução' : 'Evolução de Classe'}
      >
        {evolutionChar && (
          <EvolutionModal
            character={evolutionChar}
            onSave={updated => { handleEvolutionSave(updated); setEvolutionChar(null) }}
            onClose={() => setEvolutionChar(null)}
          />
        )}
      </Modal>
    </div>
  )
}
