// Slap isplate (UI.md 6.12): ulaz iz escrow-a (tirkizno) -> odbici (sivo, znak minus) -> neto (zelena pozadina, veći iznos).
// Širina trake je proporcionalna iznosu (obični blokovi, bez biblioteke za grafikone).
import type { ReactNode } from 'react'
import { eur, eurMinus } from '../scenario/format'

export interface RedSlapa {
  vrsta: 'in' | 'ded' | 'net'
  naziv: string
  opis?: ReactNode
  iznos: number
}

export function SlapIsplate({ redovi, ukupno, naslov }: { redovi: RedSlapa[]; ukupno: number; naslov: string }) {
  return (
    <ol className="wf" aria-label={naslov}>
      {redovi.map((r) => (
        <li key={r.naziv} className={r.vrsta}>
          <span className="lbl">
            <span>{r.naziv}</span>
            {r.opis && <small>{r.opis}</small>}
          </span>
          <span className="amt num">{r.vrsta === 'ded' ? eurMinus(r.iznos) : eur(r.iznos)}</span>
          <span className="bar" aria-hidden="true">
            <i style={{ width: `${Math.max(2, Math.round((r.iznos / ukupno) * 100))}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}
