// Dugme radnje u SLOBODNOM toku (krstarenje, Monte Karlo, konsijerž, transport, članstvo): uvek aktivno, ne zavisi od koraka priče.
// Gost: klik otvara "Enter demo as…" pa se radnja izvrši. Savetnik na javnoj strani: "Switch to Traveler to try this".
// `primeni` menja stanje tokova (samo napred); `uloge` su uloge koje smeju da izvedu radnju (podrazumevano organizator i putnik).
import { useNavigate } from 'react-router'
import type { ReactNode } from 'react'
import { PORUKA_SIMULACIJE, useDemo } from '../demo/DemoProvider'
import { useEkran, usePromenaUloge } from '../okvir/kontekst'
import { NAZIV_ULOGE } from '../pravila/rute'
import type { Uloga } from '../prica/tipovi'
import type { Tokovi } from '../tokovi/tokovi'
import { Dugme } from './Dugme'

/** Uloga prvog podnosioca zahteva (organizator ili putnik) pamti se kad se prvi put nešto zatraži; savetnik je ne menja. */
function zapamtiPodnosioca(pre: Tokovi, posle: Tokovi, uloga: Uloga): Tokovi {
  const bilo = pre.monteKarlo !== 'none' || pre.konsijerz !== 'none' || pre.transport !== 'none' || pre.zahtevi.length > 0
  return !bilo && (uloga === 'organizer' || uloga === 'traveler') ? { ...posle, podnosilac: uloga } : posle
}

export function TokDugme({
  primeni,
  nakon,
  children,
  varijanta = 'primary',
  siroko,
  mala,
  uloge = ['traveler', 'organizer'],
  poruka = true,
  blokirano,
}: {
  primeni: (t: Tokovi) => Tokovi
  nakon?: (u: Uloga) => string | void
  children: ReactNode
  varijanta?: 'primary' | 'secondary' | 'text' | 'danger'
  siroko?: boolean
  mala?: boolean
  uloge?: Uloga[]
  poruka?: boolean
  blokirano?: string
}) {
  const demo = useDemo()
  const { uloga } = useEkran()
  const navigate = useNavigate()
  const promeni = usePromenaUloge()
  const moze = uloge.includes(uloga)
  // "Switch to …" vodi na prvu dozvoljenu ulogu (za podrazumevane: putnika)
  const prebaci = uloge[0]
  const klik = () => {
    if (uloga === 'guest') {
      demo.otvoriUlaz({ cekaRadnja: null, cekaAkcija: { izvrsi: (u) => demo.promeniTokove((t) => zapamtiPodnosioca(t, primeni(t), u)), uloge, nakon } })
      return
    }
    if (!moze || blokirano) return
    demo.promeniTokove((t) => zapamtiPodnosioca(t, primeni(t), uloga))
    if (poruka) demo.obavesti(PORUKA_SIMULACIJE)
    const cilj = nakon?.(uloga)
    if (cilj) {
      navigate(cilj)
      window.scrollTo(0, 0)
    }
  }
  const neaktivno = (uloga !== 'guest' && !moze) || !!blokirano
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Dugme varijanta={varijanta} siroko={siroko} mala={mala} onClick={klik} disabled={neaktivno}>
        {children}
      </Dugme>
      {neaktivno && (
        <span className="polje-pomoc">
          {blokirano && (uloga === 'guest' || moze) ? (
            blokirano
          ) : (
            <button type="button" className="btn-link-mini" onClick={() => promeni(prebaci)}>
              Switch to {NAZIV_ULOGE[prebaci]} to try this
            </button>
          )}
        </span>
      )}
    </span>
  )
}
