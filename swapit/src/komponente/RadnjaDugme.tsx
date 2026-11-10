// Dugme radnje priče (UX 3.1, 3.3): aktivno samo ako je radnja sledeća i gledalac je u uglu koji je izvodi; inače je vidljivo,
// neaktivno, uz razlog („Urađeno“, „Dostupno u koraku N“, „Prvo: …“, „Gledaj kao Marko“). Posle klika ekran ide dalje (`nakon`).
import { useId, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { useEkran, usePromenaUgla } from '../okvir/kontekst'
import { statusRadnje } from '../pravila/radnje'
import { PORUKE } from '../tekstovi/okvir'

type Varijanta = 'zeleno' | 'plavo' | 'linija' | 'crveno' | 'tekst'

export function RadnjaDugme({
  id,
  children,
  varijanta = 'zeleno',
  nakon,
  siroko = false,
  poruka = true,
  blokirano,
  ikona,
  pregled,
}: {
  id: string
  children: ReactNode
  varijanta?: Varijanta
  /** Link (bez #) na koji se ide posle uspešne radnje. */
  nakon?: string
  siroko?: boolean
  /** Posle radnje prikaži poruku: true = „Simulirana radnja — ništa nije poslato ni naplaćeno“, tekst = ta poruka, false = ništa. */
  poruka?: boolean | string
  /** Dodatni razlog zbog kog je dugme neaktivno (npr. nisu štiklirane obavezne kvačice). */
  blokirano?: string
  ikona?: ReactNode
  /** Radnja je samo prelazak na drugi ekran: kad nije sledeća, dugme ostaje običan link (pregled radi uvek, UX 3.1). */
  pregled?: string
}) {
  const demo = useDemo()
  const { ugao } = useEkran()
  const navigate = useNavigate()
  const promeni = usePromenaUgla()
  const razlogId = useId()
  const st = statusRadnje(demo.poz, ugao, id)
  const neaktivno = !st.aktivno || !!blokirano

  if (pregled && !st.aktivno) {
    return (
      <span className={`radnja-dugme${siroko ? ' radnja-dugme-siroko' : ''}`} data-radnja={id} data-pregled>
        <a className={`dugme dugme-${varijanta}`} href={`#${pregled}`}>
          {ikona}
          {children}
        </a>
      </span>
    )
  }

  const klik = () => {
    if (neaktivno) return
    if (demo.izvedi(id, ugao)) {
      if (poruka) demo.obavesti(typeof poruka === 'string' ? poruka : PORUKE.simulacija)
      if (nakon) {
        navigate(nakon)
        window.scrollTo(0, 0)
      }
    }
  }
  return (
    <span className={`radnja-dugme${siroko ? ' radnja-dugme-siroko' : ''}`} data-radnja={id}>
      <button type="button" className={`dugme dugme-${varijanta}`} aria-disabled={(neaktivno) || undefined} aria-describedby={neaktivno ? razlogId : undefined} onClick={klik}>
        {ikona}
        {children}
      </button>
      {neaktivno && (
        <span id={razlogId} className="razlog-neaktivno" data-razlog>
          {!st.aktivno && st.prebaci ? (
            <>
              {st.razlog}
              {' · '}
              <button type="button" onClick={() => promeni(st.prebaci!)}>
                promeni ugao
              </button>
            </>
          ) : st.aktivno ? (
            blokirano
          ) : (
            st.razlog
          )}
        </span>
      )}
    </span>
  )
}
