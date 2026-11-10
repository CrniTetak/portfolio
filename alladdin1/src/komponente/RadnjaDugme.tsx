// Dugme radnje priče (UX 3.1): aktivno samo ako je radnja sledeća i gledalac je u pravoj ulozi; inače vidljivo, neaktivno, sa razlogom.
// Gost: klik otvara "Enter demo as…" pa se ista radnja izvrši. Savetnik/putnik u tuđoj radnji: "Switch to … to try this".
import { useId, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { PORUKA_SIMULACIJE, useDemo } from '../demo/DemoProvider'
import { useEkran, usePromenaUloge } from '../okvir/kontekst'
import { statusRadnje } from '../pravila/radnje'
import type { Uloga } from '../prica/tipovi'
import { Dugme } from './Dugme'

export function RadnjaDugme({
  id,
  children,
  varijanta = 'primary',
  mala,
  siroko,
  nakon,
  poruka = true,
  blokirano,
}: {
  id: string
  children: ReactNode
  varijanta?: 'primary' | 'secondary' | 'text' | 'danger'
  mala?: boolean
  siroko?: boolean
  /** Link na koji se ide posle uspešne radnje (dobija ulogu koja je radnju izvela). */
  nakon?: (u: Uloga) => string | void
  /** Prikazuje napomenu "Simulated action …" posle radnje. */
  poruka?: boolean
  /** Dodatni razlog zbog kog je dugme neaktivno (npr. nisu štiklirane obavezne saglasnosti). */
  blokirano?: string
}) {
  const demo = useDemo()
  const { uloga } = useEkran()
  const navigate = useNavigate()
  const promeni = usePromenaUloge()
  const razlogId = useId()
  const st = statusRadnje(demo.poz, uloga, id)

  const klik = () => {
    if (st.gost) {
      demo.otvoriUlaz({ cekaRadnja: { id, nakon } })
      return
    }
    if (!st.aktivno || blokirano) return
    if (demo.izvedi(id, uloga)) {
      if (poruka) demo.obavesti(PORUKA_SIMULACIJE)
      const cilj = nakon?.(uloga)
      if (cilj) {
        navigate(cilj)
        window.scrollTo(0, 0)
      }
    }
  }

  const neaktivno = !st.aktivno || !!blokirano
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Dugme varijanta={varijanta} mala={mala} siroko={siroko} onClick={klik} disabled={neaktivno} opis={neaktivno ? razlogId : undefined}>
        {children}
      </Dugme>
      {neaktivno && (
        <span id={razlogId} className="polje-pomoc">
          {st.prebaci ? (
            <button type="button" className="btn-link-mini" onClick={() => promeni(st.prebaci!)}>
              {st.razlog}
            </button>
          ) : (
            (st.aktivno ? blokirano : st.razlog)
          )}
        </span>
      )}
    </span>
  )
}
