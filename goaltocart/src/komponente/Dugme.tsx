// Dugmad (UI.md 6.2). AkcijaDugme sprovodi pravilo 1.6: aktivno samo ako je radnja sledeća i gledalac je izvođač.
import { useEffect } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Ikona } from './Ikona'
import type { ImeIkone } from './Ikona'
import { useDock } from '../okvir/DockKontekst'
import { usePrica } from '../prica/PricaProvider'
import { stanjeRadnje } from '../pravila/radnje'
import type { UlogaUKlubu } from '../pravila/radnje'
import type { Uloga } from '../prica/tipovi'

export type VarijantaDugmeta = 'primary' | 'secondary' | 'ghost' | 'danger'

interface DugmeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varijanta?: VarijantaDugmeta
  sm?: boolean
  blok?: boolean
  ikona?: ImeIkone
}

export function Dugme({ varijanta = 'primary', sm, blok, ikona, className, children, ...rest }: DugmeProps) {
  return (
    <button type="button" className={`btn btn-${varijanta}${sm ? ' btn-sm' : ''}${blok ? ' btn-block' : ''}${className ? ' ' + className : ''}`} {...rest}>
      {ikona && <Ikona ime={ikona} sm />}
      {children}
    </button>
  )
}

/** Dugme-link (navigacija, ne menja stanje priče). */
export function DugmeLink({ to, varijanta = 'secondary', sm, ikona, children }: { to: string; varijanta?: VarijantaDugmeta; sm?: boolean; ikona?: ImeIkone; children: ReactNode }) {
  return (
    <Link to={to} className={`btn btn-${varijanta}${sm ? ' btn-sm' : ''}`}>
      {ikona && <Ikona ime={ikona} sm />}
      {children}
    </Link>
  )
}

/** Dugme za pregled/lažnu radnju koja ne pomera priču: pokazuje samo "Simulated action — nothing was sent". */
export function DugmePregled({ varijanta = 'secondary', sm, ikona, children, poruka }: { varijanta?: VarijantaDugmeta; sm?: boolean; ikona?: ImeIkone; children: ReactNode; poruka?: string }) {
  const { obavesti } = usePrica()
  return (
    <Dugme varijanta={varijanta} sm={sm} ikona={ikona} onClick={() => obavesti(poruka ?? 'Simulated action — nothing was sent')}>
      {children}
    </Dugme>
  )
}

/** Dugme koje je u ovoj priči uvek neaktivno (npr. "Decline"), uz razlog. */
export function DugmeVanPrice({ varijanta = 'danger', sm, children, razlog = 'Not part of this walkthrough' }: { varijanta?: VarijantaDugmeta; sm?: boolean; children: ReactNode; razlog?: string }) {
  return (
    <span className="actionbox">
      <button type="button" aria-disabled="true" className={`btn btn-${varijanta}${sm ? ' btn-sm' : ''}`} onClick={(e) => e.preventDefault()}>
        {children}
      </button>
      <span className="reason">{razlog}</span>
    </span>
  )
}

interface AkcijaProps {
  /** id radnje iz prica/koraci.ts */
  radnja: string
  /** uloga gledaoca */
  uloga: Uloga
  varijanta?: VarijantaDugmeta
  sm?: boolean
  blok?: boolean
  ikona?: ImeIkone
  actAs?: UlogaUKlubu
  /** Ako je true, na telefonu u vođenom režimu dugme se prebacuje u spojenu donju traku. */
  primarno?: boolean
  /** Prikaži razlog ispod neaktivnog dugmeta. */
  pokaziRazlog?: boolean
  children?: ReactNode
  /** Tekst kad je radnja gotova (podrazumevano: dugme ostaje sa razlogom "Done"). */
}

export function AkcijaDugme({ radnja, uloga, varijanta, sm, blok, ikona, actAs, primarno = true, pokaziRazlog = true, children }: AkcijaProps) {
  const { poz, izvedi, rezim, telefon } = usePrica()
  const dock = useDock()
  const st = stanjeRadnje(radnja, uloga, poz, actAs)
  const sustav = st.radnja?.uloga === 'sustav'
  const v: VarijantaDugmeta = varijanta ?? (sustav ? 'secondary' : 'primary')
  const uDock = telefon && rezim === 'guided' && st.aktivno && primarno && !!dock.slot

  useEffect(() => {
    if (!uDock) return
    dock.registruj(1)
    return () => dock.registruj(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uDock])

  const tekst = children ?? st.radnja?.tekst ?? radnja
  const dugme = (
    <span className={`actionbox${blok ? " block" : ""}`}>
      <button
        type="button"
        className={`btn btn-${v}${sm ? ' btn-sm' : ''}${blok ? ' btn-block' : ''}`}
        data-radnja={radnja}
        data-aktivno={st.aktivno ? 'da' : 'ne'}
        aria-disabled={st.aktivno ? undefined : 'true'}
        aria-describedby={!st.aktivno && st.razlog ? `razlog-${radnja}` : undefined}
        onClick={() => {
          if (st.aktivno) izvedi(radnja)
        }}
      >
        {ikona && <Ikona ime={ikona} sm />}
        {tekst}
      </button>
      {pokaziRazlog && !st.aktivno && st.razlog && (
        <span className="reason" id={`razlog-${radnja}`}>
          {st.razlog}
        </span>
      )}
    </span>
  )
  return uDock && dock.slot ? createPortal(dugme, dock.slot) : dugme
}
