import { useState } from 'react'
import './SuggestInput.css'

export default function SuggestInput({ value, onChange, suggestions = [], placeholder, type = 'text' }) {
  const [show, setShow] = useState(false)

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )

  return (
    <div className="suggest-wrap">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <ul className="suggest-list">
          {filtered.slice(0, 6).map(s => (
            <li key={s} onMouseDown={() => onChange(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}