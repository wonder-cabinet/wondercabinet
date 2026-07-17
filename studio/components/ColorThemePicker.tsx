import React from 'react'
import {set, unset} from 'sanity'
import type {StringInputProps} from 'sanity'

const OPTIONS = [
  {title: 'Performance', value: 'performance', bg: '#cc6698', ink: '#0a0a16'},
  {title: 'Film',        value: 'film',        bg: '#ffe600', ink: '#0a0a16'},
  {title: 'Class',       value: 'class',       bg: '#c8a0f0', ink: '#0a0a16'},
  {title: 'Workshop',    value: 'workshop',    bg: '#ff5a00', ink: '#f6f3ea'},
  {title: 'Radio',       value: 'radio',       bg: '#00d26a', ink: '#0a0a16'},
  {title: 'Reading',     value: 'reading',     bg: '#ffd6c2', ink: '#0a0a16'},
  {title: 'Opening',     value: 'opening',     bg: '#0a0a16', ink: '#f6f3ea'},
  {title: 'Bar',         value: 'bar',         bg: '#e8a33d', ink: '#0a0a16'},
  {title: 'Exhibition',  value: 'exhibition',  bg: '#1d24ff', ink: '#f6f3ea'},
  {title: 'Paper',       value: 'paper',       bg: '#fcffe5', ink: '#0a0a16'},
]

export function ColorThemePicker(props: StringInputProps) {
  const {value, onChange} = props

  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0'}}>
      {OPTIONS.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(selected ? unset() : set(opt.value))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px 12px',
              background: opt.bg,
              color: opt.ink,
              border: selected
                ? '3px solid #2276fc'
                : '2px solid transparent',
              outline: selected ? '2px solid #2276fc' : '2px solid rgba(0,0,0,0.15)',
              outlineOffset: 1,
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transition: 'outline 0.1s',
            }}
          >
            {opt.title}
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange(unset())}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            color: '#888',
            border: '2px dashed #888',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'sans-serif',
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}
