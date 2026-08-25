/* FilterBar.jsx — Reusable multi-filter dropdown bar */
export default function FilterBar({ filters, values, onChange }) {
  return (
    <div className="filter-bar flex gap-sm" style={{ flexWrap: 'wrap' }}>
      {filters.map(filter => (
        <select
          key={filter.key}
          className="input select"
          value={values[filter.key] || ''}
          onChange={e => onChange(filter.key, e.target.value)}
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">{filter.label}</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  )
}
