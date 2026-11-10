// Dugme (UI 7.2): sva dugmad su type="button" (nema <form>, pa ni Enter ništa ne šalje).
import type { ReactNode } from 'react'

type Varijanta = 'primary' | 'secondary' | 'text' | 'danger'
const KLASA: Record<Varijanta, string> = { primary: 'btn btn-primary', secondary: 'btn btn-secondary', text: 'btn btn-text', danger: 'btn btn-danger' }

export function Dugme({
  varijanta = 'primary',
  mala = false,
  siroko = false,
  onClick,
  disabled = false,
  children,
  opis,
  ...rest
}: {
  varijanta?: Varijanta
  mala?: boolean
  siroko?: boolean
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  opis?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      className={`${KLASA[varijanta]}${mala ? ' btn-sm' : ''}${siroko ? ' w-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-describedby={opis}
      {...rest}
    >
      {children}
    </button>
  )
}
