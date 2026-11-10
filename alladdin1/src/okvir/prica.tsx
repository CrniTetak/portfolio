// Delovi kontrola priče koje dele traka za računar i traka/panel za telefon: kuka sa radnjama, prekidači, račva, "You left the story screen".
// Markup i klase (pr-*) prate Nasetu (TrakaPrice.tsx); mere su u src/traka.css.
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { ciljBack, ciljNext, ciljSkok, jeKraj, jeZavrsno } from '../prica/navigacija'
import { NAZIVI_KORAKA } from '../prica/koraci'
import type { Ishod, Poz, Rezim, Uloga } from '../prica/tipovi'
import { link } from '../pravila/rute'
import { BROJ_KORAKA } from '../scenario/racun'
import { demoDatum } from '../scenario/datumi'
import { datum } from '../scenario/format'
import { NAZIVI_ISHODA, PORUKE } from '../tekstovi/kartice'
import { useEkran, usePromenaUloge } from './kontekst'
import { PRIKAZ_PRICE_EKRANI } from './stanjePrice'

/** Radnje trake: svaka računa ciljnu poziciju i otvara ekran tog stanja za trenutnu ulogu. */
export function usePrica() {
  const demo = useDemo()
  const { uloga, id } = useEkran()
  const navigate = useNavigate()
  const otvori = (poz: Poz) => {
    navigate(link(demo.ekranZaPoz(poz, uloga), uloga))
    window.scrollTo(0, 0)
  }
  /** Jedna funkcija skoka: "Show me" i klik na krug koraka (POČETNO stanje izabranog koraka). */
  const idiNaKorak = (korak: number) => {
    const { poz } = ciljSkok(demo.poz, korak)
    demo.skok(korak)
    otvori(poz)
  }
  return {
    poz: demo.poz,
    mozeNext: !jeKraj(demo.poz),
    mozeBack: !(demo.poz.korak === 1 && demo.poz.n === 0),
    naEkranuPrice: PRIKAZ_PRICE_EKRANI(demo.poz, uloga).includes(id),
    next: () => {
      const c = ciljNext(demo.poz)
      demo.postavi(c)
      otvori(c)
    },
    back: () => {
      const c = ciljBack(demo.poz)
      demo.back() // (javlja "Branch reset" kad se vraća iz B/C na korak 1–6)
      otvori(c)
    },
    idiNaKorak,
    showMe: () => idiNaKorak(demo.poz.korak),
    izaberiIshod: (i: Ishod) => {
      demo.izaberiIshod(i)
      otvori({ korak: 7, n: 0, ishod: i })
    },
    glavnaPrica: () => {
      demo.nazadNaGlavnuPricu()
      demo.otvoriPanel(false)
      demo.obavesti(PORUKE.nazadNaGlavni)
      otvori({ korak: 7, n: 0, ishod: 'A' })
    },
    /** "Back to story": ekran trenutnog stanja za ulogu (pozicija se ne menja). */
    nazadNaPricu: () => otvori(demo.poz),
    kraj: jeKraj(demo.poz),
    zavrsno: jeZavrsno(demo.poz),
  }
}

export const nazivKoraka = (korak: number) => NAZIVI_KORAKA[korak - 1]
export const naslovKoraka = (poz: Poz) => `Step ${poz.korak} of ${BROJ_KORAKA} · ${nazivKoraka(poz.korak)}`
export const demoDatumTekst = (poz: Poz) => datum(demoDatum(poz.korak, poz.n, poz.ishod))

const ULOGE_PRIKAZ: { id: Uloga; naziv: string }[] = [
  { id: 'organizer', naziv: 'Group organizer' },
  { id: 'traveler', naziv: 'Traveler' },
  { id: 'advisor', naziv: 'Advisor' },
]

/** Segmentirani prekidač (tamna pozadina), kao u Nasetu. */
export function Seg<T extends string>({ vrednosti, izabrano, onChange, oznaka }: { vrednosti: { id: T; naziv: string }[]; izabrano: T; onChange: (v: T) => void; oznaka: string }) {
  return (
    <div role="group" aria-label={oznaka} className="pr-seg">
      {vrednosti.map((v) => (
        <button key={v.id} type="button" aria-pressed={izabrano === v.id} onClick={() => izabrano !== v.id && onChange(v.id)}>
          {v.naziv}
        </button>
      ))}
    </div>
  )
}

/** "View as": ugao gledanja. */
export function PrekidacUloge() {
  const { uloga } = useEkran()
  const promeni = usePromenaUloge()
  return <Seg<Uloga> oznaka="View as" izabrano={uloga === 'guest' ? 'organizer' : uloga} onChange={promeni} vrednosti={ULOGE_PRIKAZ} />
}

export function PrekidacRezima() {
  const demo = useDemo()
  return (
    <Seg<Rezim>
      oznaka="Mode"
      izabrano={demo.rezim}
      onChange={(r) => {
        demo.postaviRezim(r)
        if (r === 'free' && !demo.slobodnoVidjeno) {
          demo.oznaciSlobodnoVidjeno()
          demo.obavesti(PORUKE.slobodno)
        }
      }}
      vrednosti={[
        { id: 'guided', naziv: 'Guided' },
        { id: 'free', naziv: 'Free' },
      ]}
    />
  )
}

/** Račva na koraku 7: ishod A / B / C. */
const KRATKI_ISHODI = { A: 'Filled', B: 'Smaller', C: 'Cancelled' } as const

/** `kratko` = kratki nazivi (traka na računaru); pun naziv ostaje u title i u panelu telefona. */
export function PrekidacRacve({ kratko = false, rezervisi = false }: { kratko?: boolean; rezervisi?: boolean }) {
  const p = usePrica()
  // `rezervisi` (traka na računaru): van koraka 7 mesto prekidača ostaje zauzeto (nevidljivo), da traka ima istu visinu u svim koracima
  const sakriven = rezervisi && p.poz.korak !== 7
  if (p.poz.korak !== 7 && !rezervisi) return null
  return (
    <div className={`pr-grp${sakriven ? ' pr-rezervisano' : ''}`} data-ishod={sakriven ? undefined : ''} aria-hidden={sakriven || undefined} inert={sakriven || undefined}>
      <span>Fill-deadline result</span>
      <Seg<Ishod> oznaka="Fill-deadline result" izabrano={p.poz.ishod} onChange={p.izaberiIshod} vrednosti={(['A', 'B', 'C'] as Ishod[]).map((i) => ({ id: i, naziv: `${i} · ${kratko ? KRATKI_ISHODI[i] : NAZIVI_ISHODA[i]}` }))} />
    </div>
  )
}

/** Glavno dugme trake (jedno): "Show me" na ekranu priče, a van njega "Back to story". Upozorenje o grani živi samo u stranici (TrakaGrane). */
export function GlavnoDugme({ lagano = true, sakrij = false }: { lagano?: boolean; sakrij?: boolean }) {
  const p = usePrica()
  return (
    <button type="button" className={`pr-btn pr-glavno ${lagano ? 'pr-btn-light' : 'pr-btn-line'}${sakrij ? ' pr-rezervisano' : ''}`} aria-hidden={sakrij || undefined} tabIndex={sakrij ? -1 : undefined} onClick={p.showMe} data-glavno-dugme>
      {p.naEkranuPrice ? 'Show me' : 'Back to story'} <ChevronRight size={14} aria-hidden />
    </button>
  )
}
