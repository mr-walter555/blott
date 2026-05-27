import { useState, useRef } from 'react'
import { Palette } from '@phosphor-icons/react'
import { NOTE_COLORS } from '../../utils/noteColors'
import DropdownMenu from './DropdownMenu'

export default function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="btn-icon flex items-center gap-1"
        title="Note color"
      >
        <Palette className="w-5 h-5 text-black" />
        {value && value !== 'default' && (
          <span
            className="w-2.5 h-2.5 rounded-full border border-white -ml-0.5"
            style={{ background: NOTE_COLORS[value]?.swatch }}
          />
        )}
      </button>

      <DropdownMenu anchor={triggerRef} open={open} onClose={() => setOpen(false)}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-2.5 grid grid-cols-5 gap-1.5 w-44">
          {Object.entries(NOTE_COLORS).map(([key, color]) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false) }}
              title={color.label}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                value === key
                  ? 'border-brown-500 scale-110'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ background: color.swatch || '#e5e7eb' }}
            />
          ))}
        </div>
      </DropdownMenu>
    </div>
  )
}
