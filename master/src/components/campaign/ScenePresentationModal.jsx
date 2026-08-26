import { useState } from 'react'
import { Image as ImageIcon, Send, X, Plus, Sparkles, Eye } from 'lucide-react'
import { compressToWebP } from '@shared/utils/imageCompressor.js'
import { generateUUID } from '@shared/utils/uuid.js'

const PRESET_SCENES = [
  {
    id: 's1',
    title: 'Neo-Kyoto: Setor 7',
    subtitle: 'Distrito Baixo · Nível -14',
    description: 'Arranha-céus colossais rasgam as nuvens ácidas. Luzes de néon roxo e ciano refletem no asfalto molhado enquanto veículos planadores cortam a noite.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 's2',
    title: 'Entrada do Complexo Subterrâneo',
    subtitle: 'Instalação Militar Desativada',
    description: 'Comportas de titânio maciço entreabertas revelam uma escuridão impenetrável. Cabos de alta tensão estalam emitindo fagulhas intermitentes.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 's3',
    title: 'Fronteira Selvagem da Coalizão',
    subtitle: 'Zona de Quarentena Mutante',
    description: 'Vegetação bioluminescente pulsa suavemente na penumbra. O ar está denso e carregado de eletricidade estática antes da tempestade.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 's4',
    title: 'Salão do Alto Conselho',
    subtitle: 'Bastião da Coalizão',
    description: 'Painéis holográficos gigantescos projetam o mapa estelar e o estado de prontidão das frotas enquanto diplomatas debatem o destino da resistência.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
  },
]

export default function ScenePresentationModal({ isOpen, onClose, onBroadcastScene }) {
  const [scenes, setScenes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt_scenes') || JSON.stringify(PRESET_SCENES))
    } catch {
      return PRESET_SCENES
    }
  })
  const [selectedScene, setSelectedScene] = useState(scenes[0] || null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newImage, setNewImage] = useState('')

  if (!isOpen) return null

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const compressed = await compressToWebP(reader.result, { maxWidth: 1920, maxHeight: 1080, quality: 0.8 })
        setNewImage(compressed)
      } catch {
        setNewImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCreateScene = (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newImage) return

    const newScene = {
      id: generateUUID(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      description: newDesc.trim() || undefined,
      imageUrl: newImage,
    }

    const updated = [newScene, ...scenes]
    setScenes(updated)
    setSelectedScene(newScene)
    try {
      localStorage.setItem('vtt_scenes', JSON.stringify(updated))
    } catch { /* ignore */ }

    setNewTitle('')
    setNewSubtitle('')
    setNewDesc('')
    setNewImage('')
    setIsCreating(false)
  }

  const handlePresent = (scene) => {
    if (!scene) return
    onBroadcastScene?.(scene)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 860,
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#38BDF820', color: '#38BDF8', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Teatro da Mente & Cenários Cinematográficos</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apresente artes conceituais e panoramas em tela cheia para os jogadores</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setIsCreating(!isCreating)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Novo Cenário
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Scenes List */}
          <div style={{
            width: 280,
            borderRight: '1px solid var(--border-subtle)',
            padding: 12,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {scenes.map(s => {
              const isSelected = selectedScene?.id === s.id
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedScene(s)}
                  style={{
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    padding: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {s.title}
                  </span>
                  {s.subtitle && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.subtitle}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: Preview & Broadcast Form */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isCreating ? (
              <form onSubmit={handleCreateScene} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Cadastrar Novo Cenário</h4>
                <input
                  type="text"
                  className="input"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Título do Cenário (ex: Setor Subterrâneo)"
                  required
                />
                <input
                  type="text"
                  className="input"
                  value={newSubtitle}
                  onChange={e => setNewSubtitle(e.target.value)}
                  placeholder="Subtítulo ou Localização (opcional)"
                />
                <textarea
                  className="input"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Narração e descrição do cenário..."
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="input" style={{ flex: 1 }} />
                  {newImage && <span style={{ fontSize: '0.75rem', color: '#10B981' }}>✓ Imagem carregada</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsCreating(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newTitle.trim() || !newImage}>Salvar Cenário</button>
                </div>
              </form>
            ) : selectedScene ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 240,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  background: '#000',
                }}>
                  <img
                    src={selectedScene.imageUrl}
                    alt={selectedScene.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 16,
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{selectedScene.title}</h3>
                    {selectedScene.subtitle && (
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{selectedScene.subtitle}</span>
                    )}
                  </div>
                </div>

                {selectedScene.description && (
                  <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Narração da Cena</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;{selectedScene.description}&rdquo;
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePresent(selectedScene)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Send size={15} /> Apresentar aos Jogadores (Tela Cheia)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 80 }}>
                Selecione um cenário à esquerda para visualizar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
