/* InventoryList.jsx — Backpack inventory list with encumbrance gauge and equip actions */
import { useState } from 'react'
import { Package, Plus, Trash2, Shield, Swords, PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react'
import { calculateTotalWeight, calculateMaxWeight, getEncumbranceStatus } from '@shared/utils/inventoryUtils.js'

export default function InventoryList({
  items = [],
  forceAttribute = 10,
  onEquipItem,
  onUpdateQuantity,
  onRemoveItem,
  onAddItem,
}) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemWeight, setNewItemWeight] = useState(1.0)
  const [newItemType, setNewItemType] = useState('misc')
  const [isAdding, setIsAdding] = useState(false)

  const maxWeight = calculateMaxWeight(forceAttribute)
  const totalWeight = calculateTotalWeight(items)
  const encumbrance = getEncumbranceStatus(totalWeight, maxWeight)
  const weightPercent = Math.min(100, Math.round((totalWeight / maxWeight) * 100))

  const handleAddNew = (e) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    const newItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      weight: parseFloat(newItemWeight) || 0.5,
      quantity: 1,
      type: newItemType,
    }
    if (onAddItem) onAddItem(newItem)
    setNewItemName('')
    setNewItemWeight(1.0)
    setIsAdding(false)
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header & Encumbrance Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mochila & Inventário ({items.length} itens)
            </span>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsAdding(!isAdding)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--accent-primary)' }}
          >
            <Plus size={12} /> Adicionar Item
          </button>
        </div>

        {/* Encumbrance Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ color: encumbrance.color, display: 'flex', alignItems: 'center', gap: 4 }}>
              {encumbrance.status === 'overburdened' && <AlertTriangle size={12} />}
              {encumbrance.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {totalWeight} kg / {maxWeight} kg ({weightPercent}%)
            </span>
          </div>

          <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${weightPercent}%`,
              background: encumbrance.color,
              borderRadius: 3,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Add Item Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddNew} style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '10px 12px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: 8,
          alignItems: 'center',
        }}>
          <input
            type="text"
            className="input"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Nome do item..."
            autoFocus
          />
          <input
            type="number"
            step="0.1"
            min="0"
            className="input"
            value={newItemWeight}
            onChange={e => setNewItemWeight(e.target.value)}
            placeholder="Peso (kg)"
          />
          <select
            className="input"
            value={newItemType}
            onChange={e => setNewItemType(e.target.value)}
          >
            <option value="weapon">Arma</option>
            <option value="armor">Armadura</option>
            <option value="shield">Escudo</option>
            <option value="accessory">Acessório</option>
            <option value="consumable">Consumível</option>
            <option value="misc">Geral</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!newItemName.trim()}>
            Salvar
          </button>
        </form>
      )}

      {/* Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Sua mochila está vazia.
          </div>
        ) : (
          items.map(item => {
            const isEquippable = ['weapon', 'armor', 'shield', 'accessory'].includes(item.type)
            const itemTotalWeight = Math.round((item.weight || 0) * (item.quantity || 1) * 10) / 10

            return (
              <div
                key={item.id || item.name}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {item.weight || 0} kg un · Total: {itemTotalWeight} kg
                  </span>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => onUpdateQuantity?.(item.id, Math.max(1, (item.quantity || 1) - 1))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    title="Diminuir"
                  >
                    <MinusCircle size={14} />
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 16, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity?.(item.id, (item.quantity || 1) + 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    title="Aumentar"
                  >
                    <PlusCircle size={14} />
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isEquippable && onEquipItem && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEquipItem(item)}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {item.type === 'weapon' ? <Swords size={11} /> : <Shield size={11} />}
                      Equipar
                    </button>
                  )}
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      title="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
