// Stanje priče u React-u: Context + čuvanje u sessionStorage.
// Uloga i ekran su u linku (rute), pozicija u priči i režim su ovde (i u sessionStorage).
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ciljBack, ciljNext, ciljSkok } from './navigacija'
import { brojRadnji, jeZavrsenKorak, POCETNO, reducer } from './reducer'
import { sacuvaj, sacuvajUlogu, ucitaj, ucitajUlogu } from './skladiste'
import type { Dogadjaj } from './reducer'
import type { Grana, Pozicija, Rezim, Uloga } from './tipovi'
import { celija } from '../pravila/matrica'
import { TABLA, idEkrana, putZa, ulogaIzPutanje } from '../pravila/rute'
import { PORUKA_SIMULIRANO } from '../tekstovi/prica'

export interface Poruka {
  id: number
  glavna: string
  dodatak?: string
}

export interface PricaApi {
  poz: Pozicija
  rezim: Rezim
  uloga: Uloga
  telefon: boolean
  zavrsenKorak: boolean
  /** Da li je trenutna ruta jedan od ekrana koraka za ovu ulogu. */
  naEkranuPrice: boolean
  poruka: Poruka | null
  izvedi: (id: string) => void
  sledeci: () => void
  nazad: () => void
  skoci: (korak: number) => void
  showMe: () => void
  restart: () => void
  setRezim: (r: Rezim) => void
  setGrana: (g: Grana) => void
  promeniUlogu: (u: Uloga) => void
  ulaz: (u: Uloga, r: Rezim) => void
  panel: boolean
  setPanel: (v: boolean) => void
  meni: boolean
  setMeni: (v: boolean) => void
  restartOtvoren: boolean
  setRestartOtvoren: (v: boolean) => void
  uvodFree: boolean
  odbaciUvod: () => void
  obavesti: (glavna: string, dodatak?: string) => void
}

const Ctx = createContext<PricaApi | null>(null)

export function usePrica(): PricaApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePrica van PricaProvider-a')
  return c
}

/** Telefon = prozor uži od 720 px (isto kao u CSS-u). */
function citajTelefon(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 719px)').matches
}
function useTelefon(): boolean {
  const [t, setT] = useState(citajTelefon)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 719px)')
    const f = () => setT(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [])
  return t
}

export function PricaProvider({ children }: { children: ReactNode }) {
  const pocetno = useMemo(() => ucitaj(typeof window !== 'undefined' ? window.sessionStorage : null), [])
  const [poz, dispatch] = useReducer(reducer, pocetno.pozicija)
  const [rezim, setRezimState] = useState<Rezim>(pocetno.rezim)
  const [uvodFree, setUvodFree] = useState(!pocetno.vidjenUvodFree) // true = još nije viđen
  const [poruka, setPoruka] = useState<Poruka | null>(null)
  const [panel, setPanel] = useState(false)
  const [meni, setMeni] = useState(false)
  const [restartOtvoren, setRestartOtvoren] = useState(false)
  const telefon = useTelefon()
  const navigate = useNavigate()
  const loc = useLocation()

  // Uloga: iz linka; ako ruta nema ulogu (npr. /about), važi poslednja (čuva se i u sessionStorage-u, pa je osvežavanje ne menja).
  const [poslednja, setPoslednja] = useState<Uloga>(() => ucitajUlogu(typeof window !== 'undefined' ? window.sessionStorage : null))
  const izLinka = ulogaIzPutanje(loc.pathname)
  useEffect(() => {
    if (izLinka && izLinka !== poslednja) setPoslednja(izLinka)
  }, [izLinka, poslednja])
  const uloga = izLinka ?? poslednja

  // Čuvanje u sessionStorage posle svake promene
  useEffect(() => {
    sacuvaj(typeof window !== 'undefined' ? window.sessionStorage : null, {
      pozicija: poz,
      rezim,
      vidjenUvodFree: !uvodFree,
    })
  }, [poz, rezim, uvodFree])
  useEffect(() => {
    sacuvajUlogu(typeof window !== 'undefined' ? window.sessionStorage : null, uloga)
  }, [uloga])

  // Panel i meni postoje samo na telefonu: kad prozor pređe 720 px, zatvaraju se
  useEffect(() => {
    if (!telefon) {
      setPanel(false)
      setMeni(false)
    }
  }, [telefon])

  const brojPoruke = useRef(0)
  const obavesti = useCallback((glavna: string, dodatak?: string) => {
    brojPoruke.current += 1
    setPoruka({ id: brojPoruke.current, glavna, dodatak })
  }, [])
  useEffect(() => {
    if (!poruka) return
    const t = window.setTimeout(() => setPoruka(null), 3800)
    return () => window.clearTimeout(t)
  }, [poruka])

  // Pomoćno: primeni događaj i vrati novo stanje (isti reducer koristi i dispatch)
  const primeni = useCallback((d: Dogadjaj): Pozicija => {
    const novo = reducer(poz, d)
    dispatch(d)
    return novo
  }, [poz])

  const izvedi = useCallback((id: string) => {
    const novo = primeni({ tip: 'izvedi', id })
    if (novo === poz) return // odbijeno: nije sledeća radnja
    obavesti(PORUKA_SIMULIRANO, jeZavrsenKorak(novo) ? `Step ${novo.korak} complete` : undefined)
  }, [primeni, poz, obavesti])

  const idi = useCallback((cilj: Pozicija | null) => {
    if (!cilj) return
    const novo = primeni({ tip: 'idi', cilj })
    if (poz.grana === 'rejected' && novo.grana === 'approved' && novo.korak < 6) obavesti('Branch reset: choose Approved or Rejected again at step 6')
    else if (novo.korak > poz.korak) obavesti(`Step advanced to ${novo.korak}`)
    else if (novo.korak === poz.korak && novo.odradjeno > poz.odradjeno && jeZavrsenKorak(novo)) obavesti(`Step ${novo.korak} complete`)
  }, [primeni, poz, obavesti])

  const sledeci = useCallback(() => idi(ciljNext(poz)), [idi, poz])
  const nazad = useCallback(() => idi(ciljBack(poz)), [idi, poz])
  const skoci = useCallback((k: number) => idi(ciljSkok(poz, k)), [idi, poz])

  const showMeZa = useCallback((u: Uloga, p: Pozicija) => {
    navigate(putZa(celija(p.korak, u, p.grana).ekrani[0]))
  }, [navigate])

  const showMe = useCallback(() => showMeZa(uloga, poz), [showMeZa, uloga, poz])

  const restart = useCallback(() => {
    dispatch({ tip: 'restart' })
    setRestartOtvoren(false)
    setPanel(false)
    obavesti('Demo restarted from step 1')
    navigate(putZa(TABLA[uloga]))
  }, [navigate, uloga, obavesti])

  const setRezim = useCallback((r: Rezim) => {
    setRezimState(r)
    if (r === 'free') setPanel(false)
  }, [])

  const setGrana = useCallback((g: Grana) => {
    if (poz.korak === 6 && poz.grana === g) return // već izabrano: ništa se ne menja i nema poruke
    const novo = reducer(poz, { tip: 'grana', grana: g })
    if (novo !== poz) {
      dispatch({ tip: 'grana', grana: g })
      obavesti(g === 'rejected' ? 'What-if branch: registration refused' : 'Back to the main story')
    }
  }, [poz, obavesti])

  const promeniUlogu = useCallback((u: Uloga) => {
    // Promena uloge uvek otvara "Show me" ekran te uloge za trenutni korak (tabela 4.0).
    showMeZa(u, poz)
    setPanel(false)
  }, [showMeZa, poz])

  const ulaz = useCallback((u: Uloga, r: Rezim) => {
    dispatch({ tip: 'restart' })
    setRezimState(r)
    setPanel(false)
    setMeni(false)
    navigate(putZa(TABLA[u]))
  }, [navigate])

  // Zatvori panel i meni kad se ruta promeni
  useEffect(() => {
    setMeni(false)
  }, [loc.pathname])

  const trenutni = idEkrana(loc.pathname)
  const naEkranuPrice = !!trenutni && trenutni.uloga === uloga && celija(poz.korak, uloga, poz.grana).ekrani.includes(trenutni.ekran)

  const api: PricaApi = {
    poz, rezim, uloga, telefon,
    zavrsenKorak: poz.odradjeno >= brojRadnji(poz),
    naEkranuPrice, poruka,
    izvedi, sledeci, nazad, skoci, showMe, restart, setRezim, setGrana, promeniUlogu, ulaz,
    panel, setPanel, meni, setMeni, restartOtvoren, setRestartOtvoren,
    uvodFree,
    odbaciUvod: () => setUvodFree(false),
    obavesti,
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export { POCETNO }
