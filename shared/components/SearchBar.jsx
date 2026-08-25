/* SearchBar.jsx — Reusable search input with filter icon */
import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-bar" style={{ position: 'relative' }}>
      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input
        className="input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '36px' }}
      />
    </div>
  )
}
