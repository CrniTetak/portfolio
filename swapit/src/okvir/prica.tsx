// Delovi kontrola priče koje dele traka za računar i traka/panel za telefon: kuka sa radnjama, prekidači, račva, glavno dugme.
// Markup i klase (pr-*) prate AllAddIn1 (TrakaPrice.tsx); mere su u src/traka.css.
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { link } from '../pravila/rute'
import { ciljBack, ciljNext, ciljSkok, jeKraj, jeZavrsno } from '../prica/navigacija'
import { BROJ_KORAKA, NAZIVI_KORAKA } from '../prica/koraci'
import { NAZIV_UGLA, UGLOVI, type Grana, type Poz, type Rezim, type Ugao } from '../prica/tipovi'
import { demoDatum } from '../scenario/datumi'
import { datum } from '../scenario/format'
import { PORUKE } from '../tekstovi/okvir'
import { ekraniPrice } from './stanjePrice'
import { useEkran, usePromenaUgla } from './kontekst'

/** Radnje trake: svaka računa ciljnu poziciju i otvara ekran tog stanja za trenutni ugao. */
export function usePrica() {
  const demo = useDemo()
  const { ugao, id } = useEkran()
  const navigate = useNavigate()
  const otvori = (poz: Poz) => {
    navigate(link(demo.ekranZaPoz(poz, ugao), ugao))
    window.scrollTo(0, 0)
  }
  /** Jedna funkcija skoka: „Pokaži mi“ i klik na krug koraka (POČETNO stanje izabranog koraka). */
  const idiNaKorak = (korak: number) => {
    const { poz } = ciljSkok(demo.poz, korak)
    demo.skok(korak)
    otvori(poz)
  }
  return {
    poz: demo.poz,
    mozeNext: !jeKraj(demo.poz),
    mozeBack: !(demo.poz.korak === 1 && demo.poz.n === 0),
    naEkranuPrice: ekraniPrice(demo.poz, ugao).includes(id),
    next: () => {
      const c = ciljNext(demo.poz)
      demo.postavi(c)
      otvori(c)
    },
    back: () => {
      const c = ciljBack(demo.poz)
      demo.back() // javlja „Račva poništena“ kad se vraća iz grane „poeni“ na korak 1–5
      otvori(c)
    },
    idiNaKorak,
    showMe: () => idiNaKorak(demo.poz.korak),
    izaberiGranu: (g: Grana) => {
      demo.izaberiGranu(g)
      otvori({ korak: 6, n: 0, grana: g })
    },
    glavniTok: () => {
      demo.glavniTok()
      demo.otvoriPanel(false)
      demo.obavesti(PORUKE.nazadNaGlavni)
      otvori({ korak: 6, n: 0, grana: 'lanac' })
    },
    /** „Nazad na priču“: ekran trenutnog stanja za ugao (pozicija se ne menja). */
    nazadNaPricu: () => otvori(demo.poz),
    kraj: jeKraj(demo.poz),
    zavrsno: jeZavrsno(demo.poz),
  }
}

export const nazivKoraka = (korak: number): string => NAZIVI_KORAKA[korak - 1]
export const naslovKoraka = (poz: Poz): string => `Korak ${poz.korak} od ${BROJ_KORAKA} · ${nazivKoraka(poz.korak)}`
export const demoDatumTekst = (poz: Poz): string => datum(demoDatum(poz.korak, jeZavrsno(poz)))

/** Segmentirani prekidač (tamna pozadina), kao u AllAddIn1. */
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

/** „Gledaj kao“: ugao gledanja. */
export function PrekidacUgla() {
  const { ugao } = useEkran()
  const promeni = usePromenaUgla()
  return <Seg<Ugao> oznaka="Gledaj kao" izabrano={ugao} onChange={promeni} vrednosti={UGLOVI.map((u) => ({ id: u, naziv: NAZIV_UGLA[u] }))} />
}

export function PrekidacRezima() {
  const demo = useDemo()
  return (
    <Seg<Rezim>
      oznaka="Režim"
      izabrano={demo.rezim}
      onChange={(r) => {
        demo.postaviRezim(r)
        if (r === 'slobodno' && !demo.slobodnoVidjeno) {
          demo.oznaciSlobodnoVidjeno()
          demo.obavesti(PORUKE.slobodno)
        }
      }}
      vrednosti={[
        { id: 'vodjena', naziv: 'Vođena' },
        { id: 'slobodno', naziv: 'Slobodno' },
      ]}
    />
  )
}

const KRATKE_GRANE = { lanac: 'Lanac', poeni: 'Za poene' } as const
const PUNE_GRANE = { lanac: 'Lanac razmene', poeni: 'Za poene' } as const

/**
 * Račva na koraku 6: „lanac razmene“ ili „za poene“. `kratko` = kratki nazivi (traka na računaru); `rezervisi` (traka na računaru):
 * van koraka 6 mesto prekidača ostaje zauzeto (nevidljivo), da traka ima istu visinu u svim koracima.
 */
export function PrekidacGrane({ kratko = false, rezervisi = false }: { kratko?: boolean; rezervisi?: boolean }) {
  const p = usePrica()
  const sakriven = rezervisi && p.poz.korak !== 6
  if (p.poz.korak !== 6 && !rezervisi) return null
  const nazivi = kratko ? KRATKE_GRANE : PUNE_GRANE
  return (
    <div className={`pr-grp${sakriven ? ' pr-rezervisano' : ''}`} data-racva={sakriven ? undefined : ''} aria-hidden={sakriven || undefined} inert={sakriven || undefined}>
      <span>Račva</span>
      <Seg<Grana> oznaka="Račva" izabrano={p.poz.grana} onChange={p.izaberiGranu} vrednosti={(['lanac', 'poeni'] as Grana[]).map((g) => ({ id: g, naziv: nazivi[g] }))} />
    </div>
  )
}

/** Glavno dugme trake (jedno): „Pokaži mi“ na ekranu priče, a van njega „Nazad na priču“. */
export function GlavnoDugme({ lagano = true, sakrij = false }: { lagano?: boolean; sakrij?: boolean }) {
  const p = usePrica()
  return (
    <button
      type="button"
      className={`pr-btn pr-glavno ${lagano ? 'pr-btn-light' : 'pr-btn-line'}${sakrij ? ' pr-rezervisano' : ''}`}
      aria-hidden={sakrij || undefined}
      tabIndex={sakrij ? -1 : undefined}
      onClick={p.showMe}
      data-glavno-dugme
    >
      {p.naEkranuPrice ? 'Pokaži mi' : 'Nazad na priču'} <ChevronRight size={14} aria-hidden />
    </button>
  )
}
