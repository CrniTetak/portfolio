// Tehnički list (UI 4.6) i cenovnik (UI 4.7).
import { Check, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KURS_RSD } from '../logika/konstante'
import { eur, kursTekst, NAZIV_RAZREDA } from '../logika/novac'
import type { Lokacija } from '../podaci/lokacije'
import { Kartica, Natpis } from './osnovno'

/** Da li je ekran širok (desktop). Na telefonu su grupe tehničkog lista sklopive. */
function useSirok(): boolean {
  const [sirok, setSirok] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)')
    const f = () => setSirok(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return sirok
}

function Vrednost({ v }: { v: string }) {
  // "Da"/"Ne" se prikazuje i ikonicom i tekstom
  if (/^da\b/i.test(v)) return <span className="flex items-center justify-end gap-1.5"><Check size={14} className="text-uspeh" aria-hidden /> {v}</span>
  if (/^ne\b/i.test(v)) return <span className="flex items-center justify-end gap-1.5"><Minus size={14} className="text-prig" aria-hidden /> {v}</span>
  return <span>{v}</span>
}

export function TehnickiList({ lokacija }: { lokacija: Lokacija }) {
  const sirok = useSirok()
  return (
    <Kartica className="p-4 md:p-6">
      {lokacija.tehnicki.map((g, i) => (
        <details key={g.naziv} open={sirok || i === 0} className="border-b border-linija py-3 last:border-b-0">
          <summary className={`${sirok ? 'pointer-events-none' : 'cursor-pointer'} list-none`}>
            <Natpis>{g.naziv}</Natpis>
          </summary>
          <dl>
            {g.stavke.map(([naziv, vrednost]) => (
              <div key={naziv} className="flex justify-between gap-4 border-t border-linija py-2 text-sm first:border-t-0">
                <dt className="text-sek">{naziv}</dt>
                <dd className="text-right font-medium">{<Vrednost v={vrednost} />}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </Kartica>
  )
}

export function Cenovnik({ lokacija: l }: { lokacija: Lokacija }) {
  const red = (naziv: string, vrednost: string) => (
    <div key={naziv} className="flex justify-between gap-4 border-t border-linija py-2 text-sm first:border-t-0">
      <dt className="text-sek">{naziv}</dt><dd className="cifre text-right font-medium">{vrednost}</dd>
    </div>
  )
  return (
    <Kartica className="p-4 md:p-6">
      <dl>
        {(['do10', 'do30', 'preko30'] as const).map((r) =>
          red(`Snimajući dan (${l.satiSnimajucegDana} sati), ekipa ${NAZIV_RAZREDA[r]}`, l.cene[r] != null ? eur(l.cene[r]) : 'ne prima toliku ekipu'))}
        {red('Dan pripreme / raspremanja', `${eur(l.cenaPripremeCenti)} (jedna cena za sve veličine ekipe)`)}
        {red('Prekovremeni sat', eur(l.prekovremeniSatCenti))}
        {red('Najkraće trajanje', l.najkrace)}
        {red('Posebno naplaćeni troškovi', l.posebniTroskovi)}
      </dl>
      <p className="mt-3 text-sm text-prig">Cene su izmišljene i fakturišu se u dinarima (izmišljen kurs {kursTekst(KURS_RSD)}).</p>
    </Kartica>
  )
}
