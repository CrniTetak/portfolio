// ZAJEDNIČKO STANJE DEMOA (B4): pozicija priče, režim, potvrda 18+, jednokratne poruke + mali sloj za toast i dijaloge.
// Pozicija se menja samo kroz reducer (prica/reducer.ts); skok/Next/Back/Restart računaju cilj pa ga ponovo odigraju.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { celija, ekranZaPoziciju } from '../pravila/matrica'
import { KUCA } from '../pravila/rute'
import { ciljBack, ciljGlavnaPrica, ciljNext, ciljSkok, odigraj } from '../prica/navigacija'
import { reducer } from '../prica/reducer'
import { PORUKE, TRAJANJE_GRANE_MS, TRAJANJE_TOASTA_MS } from '../tekstovi/kartice'
import type { EkranId, Ishod, Poz, Rezim, Uloga } from '../prica/tipovi'
import { OBAVEZNE_SAGLASNOSTI } from './useSaglasnost'
import type { Tokovi } from '../tokovi/tokovi'
import { posleRestarta, ucitaj, upisi, type Sacuvano } from './cuvanje'

export type CekaAkcija = { izvrsi: (u: Uloga) => void; uloge: Uloga[]; nakon?: (u: Uloga) => string | void }
export type DijalogUlaz = { cekaRadnja: { id: string; nakon?: (u: Uloga) => string | void } | null; cekaAkcija?: CekaAkcija } | null

type Demo = {
  poz: Poz
  rezim: Rezim
  potvrda18: boolean
  slobodnoVidjeno: boolean
  /** Poruka "Branch reset" posle skoka na korak 1–6 iz ishoda B/C (nestaje sama). */
  porukaGrane: boolean
  toast: { tekst: string; kljuc: number; ms?: number } | null
  dijalogRestart: boolean
  /** Stanja slobodnih tokova i njihova izmena (samo napred, vidi tokovi/tokovi.ts). */
  tokovi: Tokovi
  promeniTokove: (f: (t: Tokovi) => Tokovi) => void
  /** Prozor "Message advisor" (3 unapred napisane poruke, nema stvarnog četa). */
  dijalogPoruka: boolean
  otvoriPoruku: (otvori: boolean) => void
  dijalogUlaz: DijalogUlaz
  panelOtvoren: boolean
  /** Radnja sa ekrana: prihvata se samo ako je sledeća i ako je gledalac u pravoj ulozi. */
  izvedi: (id: string, uloga: Uloga) => boolean
  postavi: (cilj: Poz) => void
  next: () => void
  back: () => void
  skok: (korak: number) => void
  izaberiIshod: (i: Ishod) => void
  nazadNaGlavnuPricu: () => void
  restart: () => void
  postaviRezim: (r: Rezim) => void
  potvrdi18: () => void
  obavesti: (tekst?: string) => void
  /** Kvačice saglasnosti (ključ → štiklirano); nijedna nije unapred štiklirana. */
  saglasnosti: Record<string, boolean>
  postaviSaglasnost: (kljuc: string, v: boolean) => void
  /** Toast ostaje dok su miš ili fokus iznad njega. */
  pauzirajToast: (p: boolean) => void
  oznaciSlobodnoVidjeno: () => void
  otvoriRestart: (otvori: boolean) => void
  otvoriUlaz: (d: DijalogUlaz) => void
  otvoriPanel: (otvori: boolean) => void
  /** Ekran u kome je tačno prikazano trenutno stanje priče za ulogu ("Show me" bez skoka, i za promenu uloge). */
  ekranZa: (uloga: Uloga) => EkranId
  /** Ekran stanja za proizvoljnu poziciju (posle Next/Back/skoka). */
  ekranZaPoz: (poz: Poz, uloga: Uloga) => EkranId
  /** Ekran POČETNOG stanja koraka za ulogu ("Show me" posle skoka). */
  pocetniEkran: (korak: number, uloga: Uloga, ishod: Ishod) => EkranId
}

const Ctx = createContext<Demo | null>(null)
export const useDemo = () => {
  const d = useContext(Ctx)
  if (!d) throw new Error('useDemo van DemoProvider-a')
  return d
}

/** Brojač poruka (ključ za ponovno prikazivanje iste poruke); sat računara se ne koristi. */
let brojacPoruka = 0
export const PORUKA_SIMULACIJE = 'Simulated action — nothing was sent or charged'

export function DemoProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Sacuvano>(() => ucitaj())
  // najnovija pozicija za radnje koje se izvode brzo jedna za drugom (bez zastarelog zatvaranja)
  const pozRef = useRef(s.poz)
  pozRef.current = s.poz
  const [porukaGrane, setPorukaGrane] = useState(false)
  const [toast, setToast] = useState<Demo['toast']>(null)
  const [toastPauza, pauzirajToast] = useState(false)
  const [saglasnosti, setSaglasnosti] = useState<Record<string, boolean>>({})
  const [dijalogRestart, otvoriRestart] = useState(false)
  const [dijalogPoruka, otvoriPoruku] = useState(false)
  const [dijalogUlaz, otvoriUlaz] = useState<DijalogUlaz>(null)
  const [panelOtvoren, otvoriPanel] = useState(false)

  useEffect(() => upisi(s), [s])
  useEffect(() => {
    if (!toast) return
    if (toastPauza) return
    const t = setTimeout(() => setToast(null), toast.ms ?? TRAJANJE_TOASTA_MS)
    return () => clearTimeout(t)
  }, [toast, toastPauza])
  useEffect(() => {
    if (!porukaGrane) return
    const t = setTimeout(() => setPorukaGrane(false), TRAJANJE_GRANE_MS)
    return () => clearTimeout(t)
  }, [porukaGrane])

  // traka priče izvodi korake umesto gledaoca: obavezne kvačice se vizuelno štikliraju
  const postavi = useCallback((cilj: Poz) => {
    setS((x) => ({ ...x, poz: odigraj(cilj) }))
    setSaglasnosti(Object.fromEntries(OBAVEZNE_SAGLASNOSTI.map((k) => [k, true])))
  }, [])

  const ekranZa = useCallback((uloga: Uloga): EkranId => ekranZaPoziciju(s.poz, uloga), [s.poz])

  const demo = useMemo<Demo>(
    () => ({
      poz: s.poz,
      rezim: s.rezim,
      potvrda18: s.potvrda18,
      slobodnoVidjeno: s.poruke.slobodno,
      porukaGrane,
      toast,
      dijalogRestart,
      tokovi: s.tokovi,
      promeniTokove: (f) => setS((x) => ({ ...x, tokovi: f(x.tokovi) })),
      dijalogPoruka,
      otvoriPoruku,
      dijalogUlaz,
      panelOtvoren,
      izvedi: (id, uloga) => {
        const nova = reducer(pozRef.current, { t: 'radnja', id, uloga })
        if (nova === pozRef.current) return false
        pozRef.current = nova
        setS((x) => ({ ...x, poz: nova }))
        return true
      },
      postavi,
      next: () => postavi(ciljNext(pozRef.current)),
      back: () => {
        const cilj = ciljBack(pozRef.current)
        postavi(cilj)
        // Back iz ishoda B/C na korak 1–6 vraća glavni put: poruka mora da se vidi
        if (pozRef.current.ishod !== 'A' && cilj.ishod === 'A') {
          setPorukaGrane(true)
          setToast({ tekst: PORUKE.granaVracena, kljuc: ++brojacPoruka, ms: TRAJANJE_GRANE_MS })
        }
      },
      skok: (korak) => {
        const { poz, granaVracena } = ciljSkok(pozRef.current, korak)
        postavi(poz)
        if (granaVracena) {
          setPorukaGrane(true)
          setToast({ tekst: PORUKE.granaVracena, kljuc: ++brojacPoruka, ms: TRAJANJE_GRANE_MS })
        }
      },
      izaberiIshod: (i) => setS((x) => ({ ...x, poz: reducer(x.poz, { t: 'ishod', ishod: i }) })),
      nazadNaGlavnuPricu: () => postavi(ciljGlavnaPrica()),
      restart: () => {
        setS((x) => posleRestarta(x))
        setSaglasnosti({})
        setToast({ tekst: 'Demo restarted from step 1', kljuc: ++brojacPoruka })
      },
      postaviRezim: (r) => setS((x) => ({ ...x, rezim: r })),
      potvrdi18: () => setS((x) => ({ ...x, potvrda18: true })),
      saglasnosti,
      postaviSaglasnost: (kljuc, v) => setSaglasnosti((x) => ({ ...x, [kljuc]: v })),
      pauzirajToast,
      obavesti: (tekst = PORUKA_SIMULACIJE) => setToast({ tekst, kljuc: ++brojacPoruka }),
      oznaciSlobodnoVidjeno: () => setS((x) => ({ ...x, poruke: { ...x.poruke, slobodno: true } })),
      otvoriRestart,
      otvoriUlaz,
      otvoriPanel,
      ekranZa,
      ekranZaPoz: ekranZaPoziciju,
      pocetniEkran: (korak, uloga, ishod) => celija(korak, uloga, ishod)?.pocetno.ekran ?? KUCA[uloga],
    }),
    [s, saglasnosti, porukaGrane, toast, dijalogRestart, dijalogPoruka, dijalogUlaz, panelOtvoren, postavi, ekranZa],
  )
  return <Ctx.Provider value={demo}>{children}</Ctx.Provider>
}
