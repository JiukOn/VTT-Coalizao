import { useEffect, useRef } from 'react'

export default function ContextMenu({ position, onClose, options }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!position) return null

  // Ensure menu doesn't overflow screen
  const style = {
    top: position.y,
    left: position.x,
  }

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={style}
    >
      <ul className="context-menu-list">
        {options.map((opt, i) => (
          <li 
            key={i} 
            className={`context-menu-item ${opt.danger ? 'danger' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              opt.action()
              onClose()
            }}
          >
            {opt.icon && <span className="icon">{opt.icon}</span>}
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
