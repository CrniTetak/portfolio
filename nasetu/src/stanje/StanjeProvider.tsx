// Drži celo stanje prototipa u Reactu i čuva ga u sessionStorage (nestaje zatvaranjem prozora).
// Dorada 3: isti provider vodi i VOĐENU PRIČU (traka pri dnu): Dalje / Nazad / skok / Prikaži mi / režim / račva.
// Stanje se menja samo kroz korenski reducer (prica/most.ts), koji iznad domenskog reducera sprovodi pravila režima.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { izgradiSvet, izgradiUsluge, postavkeIz, type Postavke } from '../prica/izgradi'
import { nadjiRadnju } from '../prica/koraci'
import { jeEkranPrice, prikaziMiRuta } from '../prica/matrica'
import { ciljBack, ciljGrana, ciljNext, ciljPocetak, ciljSkok } from '../prica/navigacija'
import { cuvarOdbija, primeni } from '../prica/most'
import { jednakaPozicija } from '../prica/pozicija'
import { stanjeRadnje, type StanjeDugmeta } from '../prica/radnje'
import { pozicijaIz, type Grana, type Pozicija, type Rezim, type UlogaPrice } from '../prica/tipovi'
import { nazivKoraka, PORUKA_NIJE_SLEDECI, PORUKA_RESTART, PORUKA_SIMULIRANO } from '../tekstovi/prica'
import { POLAZNA } from '../okvir/pristup'
import type { Akcija } from './akcije'
import { pocetnoStanje } from './scenario'
import { KLJUC_SESIJE, type Stanje, type Uloga } from './tipovi'
import { jeIspravnoStanje } from './validacija'

export interface Poruka { id: number; glavna: string; dodatak?: string }

/** Prozor za potvrdu koji otvara provider (npr. „Izmene van priče se brišu"). */
export interface Potvrda { naslov: string; tekst: string; potvrdi: string; onPotvrdi: () => void }

interface Vrednost {
  stanje: Stanje
  salji: (a: Akcija) => void
  /** Pokušaj radnje: vraća NOVO stanje ako je prošla, ili null ako je pravila ili priča odbiju (tada se ništa ne menja). */
  probaj: (a: Akcija) => Stanje | null
  // ---- priča ----
  poz: Pozicija
  rezim: Rezim
  vodjeno: boolean
  telefon: boolean
  /** Da li je tekući link jedan od ekrana koraka za aktivnu ulogu. */
  naEkranuPrice: boolean
  /** Izvedi radnju priče po id-u (dugme na ekranu). Vraća novo stanje ili null. */
  izvedi: (id: string) => Stanje | null
  dalje: () => void
  nazad: () => void
  skoci: (korak: number) => void
  prikaziMi: () => void
  kreniIspocetka: () => void
  setRezim: (r: Rezim) => void
  /** Admin (samo slobodni režim): prelazak u slobodni režim i uloga Admin odjednom. */
  udjiUAdmina: () => void
  setGrana: (g: Grana) => void
  promeniUlogu: (u: Uloga) => void
  ulaz: (u: UlogaPrice, r: Rezim) => void
  vratiNaKorak: () => void
  predracunSaUslugama: () => void
  premotaj: (sati: number) => void
  sakrijTraku: (sakriti: boolean) => void
  odbaciUvod: () => void
  // ---- pomoćno stanje interfejsa ----
  panel: boolean
  setPanel: (v: boolean) => void
  meni: boolean
  setMeni: (v: boolean) => void
  poruka: Poruka | null
  obavesti: (glavna: string, dodatak?: string) => void
  potvrda: Potvrda | null
  zatvoriPotvrdu: () => void
}

const Kontekst = createContext<Vrednost | null>(null)

/** Telefonski raspored: prozor uži od 720 px ILI niži od 500 px (telefon položeno). */
const UPIT_TELEFON = '(max-width: 719px), (max-height: 499px)'
function useTelefon(): boolean {
  const [t, setT] = useState(() => typeof window !== 'undefined' && window.matchMedia(UPIT_TELEFON).matches)
  useEffect(() => {
    const mq = window.matchMedia(UPIT_TELEFON)
    const f = () => setT(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [])
  return t
}

/**
 * Učitava sačuvano stanje; ako je format star ili pokvaren, kreće iz početnog scenarija.
 * U vođenom režimu (i u slobodnom bez odstupanja) svet se UVEK ponovo gradi iz pozicije, pa sačuvan zapis ne može da raskine priču.
 */
function ucitaj(): Stanje {
  try {
    // uklanjanje ključeva starog demoa
    sessionStorage.removeItem('nasetu.lokacije')
    sessionStorage.removeItem('nasetu.rezervacije')
    const sirovo = sessionStorage.getItem(KLJUC_SESIJE)
    if (sirovo) {
      let s = JSON.parse(sirovo) as Stanje
      if (jeIspravnoStanje(s)) {
        // Sakrivena traka se posle osvežavanja uvek vraća (i na telefonu nema Shift + D da je prikaže)
        s = { ...s, demoSakriven: false }
        if (s.prica.rezim === 'vodjeno' || !s.prica.odstupljeno) return izgradiSvet(pozicijaIz(s.prica), postavkeIz(s))
        return s
      }
    }
  } catch {
    // pokvaren zapis: ignoriši
  }
  return pocetnoStanje()
}

export function StanjeProvider({ children }: { children: ReactNode }) {
  const [stanje, dispatch] = useReducer(primeni, undefined, ucitaj)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const telefon = useTelefon()
  const [panel, setPanelState] = useState(false)
  const [meni, setMeni] = useState(false)
  const [poruka, setPoruka] = useState<Poruka | null>(null)
  const [potvrda, setPotvrda] = useState<Potvrda | null>(null)
  const brojPoruke = useRef(0)
  // najnovije stanje za rukovaoce (da dva uzastopna poziva u istom događaju ne rade sa zastarelim stanjem)
  const ref = useRef(stanje)
  ref.current = stanje

  useEffect(() => {
    try {
      sessionStorage.setItem(KLJUC_SESIJE, JSON.stringify(stanje))
    } catch {
      // pun ili zabranjen sessionStorage: prototip i dalje radi, samo ne pamti
    }
  }, [stanje])

  // Panel i meni postoje samo na telefonu: kad prozor pređe granicu, zatvaraju se
  useEffect(() => {
    if (!telefon) { setPanelState(false); setMeni(false) }
  }, [telefon])
  // Meni se zatvara pri promeni linka
  useEffect(() => { setMeni(false) }, [pathname])

  useEffect(() => {
    if (!poruka) return
    const t = window.setTimeout(() => setPoruka(null), 3800)
    return () => window.clearTimeout(t)
  }, [poruka])

  const obavesti = useCallback((glavna: string, dodatak?: string) => {
    brojPoruke.current += 1
    setPoruka({ id: brojPoruke.current, glavna, dodatak })
  }, [])

  const setPanel = useCallback((v: boolean) => { setPanelState(v) }, [])

  // ---------------------------------------------------------------- radnje sa ekrana
  const salji = useCallback((a: Akcija) => {
    if (cuvarOdbija(ref.current, a)) obavesti(PORUKA_NIJE_SLEDECI)
    dispatch(a)
  }, [obavesti])

  const probaj = useCallback((a: Akcija): Stanje | null => {
    const trenutno = ref.current
    const novo = primeni(trenutno, a)
    if (novo === trenutno) {
      if (cuvarOdbija(trenutno, a)) obavesti(PORUKA_NIJE_SLEDECI)
      return null
    }
    dispatch(a)
    return novo
  }, [obavesti])

  const izvedi = useCallback((id: string): Stanje | null => {
    const s = ref.current
    const radnja = nadjiRadnju(id)
    if (!radnja || !stanjeRadnje(id, s.uloga, s.prica).aktivno) return null
    const akcija = radnja.napravi(s)
    const novo = primeni(s, akcija)
    if (novo === s) return null
    dispatch(akcija)
    obavesti(PORUKA_SIMULIRANO, radnja.ishod)
    // dugme radnje često nestane iz ekrana: fokus ide na traku (ne na telo stranice)
    window.setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return
      document.querySelector<HTMLElement>('[data-traka] [data-dalje], [data-traka] button:not([disabled])')?.focus()
    }, 50)
    return novo
  }, [obavesti])

  // ---------------------------------------------------------------- navigacija kroz priču
  const poz: Pozicija = pozicijaIz(stanje.prica)
  const vodjeno = stanje.prica.rezim === 'vodjeno'

  /** Traži potvrdu samo ako postoje izmene van priče (one se brišu pri gradnji sveta iz pozicije). */
  const saPotvrdom = useCallback((radi: () => void, naslov = 'Izmene van priče će se obrisati', potvrdi = 'Nastavi') => {
    if (!ref.current.prica.odstupljeno) { radi(); return }
    setPanelState(false)
    setMeni(false)
    setPotvrda({ naslov, tekst: 'Izmenili ste stanje van priče. Ako nastavite, te izmene se brišu i svet se vraća na ono što priča predviđa.', potvrdi, onPotvrdi: radi })
  }, [])

  const gradi = useCallback((cilj: Pozicija, izmene: Partial<Postavke> = {}) => {
    const s = ref.current
    dispatch({ tip: 'UCITAJ', stanje: izgradiSvet(cilj, { ...postavkeIz(s), ...izmene }) })
  }, [])

  const dalje = useCallback(() => {
    const cilj = ciljNext(pozicijaIz(ref.current.prica))
    if (!cilj) return
    saPotvrdom(() => {
      gradi(cilj)
      obavesti(`Korak ${cilj.korak} od 9`, nazivKoraka(cilj.korak, cilj.grana))
    })
  }, [gradi, obavesti, saPotvrdom])

  const nazad = useCallback(() => {
    const p = pozicijaIz(ref.current.prica)
    const cilj = ciljBack(p)
    if (jednakaPozicija(cilj, p)) return
    saPotvrdom(() => {
      gradi(cilj)
      obavesti(`Korak ${cilj.korak} od 9`, nazivKoraka(cilj.korak, cilj.grana))
    })
  }, [gradi, obavesti, saPotvrdom])

  const skoci = useCallback((korak: number) => {
    if (!Number.isInteger(korak) || korak < 1 || korak > 9) return
    const cilj = ciljSkok(pozicijaIz(ref.current.prica), korak)
    saPotvrdom(() => {
      gradi(cilj)
      obavesti(`Korak ${cilj.korak} od 9`, nazivKoraka(cilj.korak, cilj.grana))
    })
  }, [gradi, obavesti, saPotvrdom])

  const setGrana = useCallback((g: Grana) => {
    const p = pozicijaIz(ref.current.prica)
    const cilj = ciljGrana(p, g)
    if (jednakaPozicija(cilj, p)) return
    saPotvrdom(() => {
      gradi(cilj)
      obavesti(g === 'otkaz' ? 'Grana: vlasnik otkazuje' : 'Nazad na glavnu priču')
    })
  }, [gradi, obavesti, saPotvrdom])

  const navigirajNa = useCallback((s: Stanje, u: Uloga) => {
    if (u === 'admin') { navigate(POLAZNA.admin); return }
    navigate(prikaziMiRuta(s, pozicijaIz(s.prica), u))
  }, [navigate])

  const prikaziMi = useCallback(() => {
    const s = ref.current
    navigirajNa(s, s.uloga)
    setPanelState(false)
  }, [navigirajNa])

  const promeniUlogu = useCallback((u: Uloga) => {
    const s = ref.current
    if (u === 'admin' && s.prica.rezim === 'vodjeno') return
    dispatch({ tip: 'PROMENI_ULOGU', uloga: u })
    navigirajNa(s, u)
    setPanelState(false)
  }, [navigirajNa])

  const kreniIspocetka = useCallback(() => {
    setPanelState(false)
    setMeni(false)
    setPotvrda({
      naslov: 'Krenuti ispočetka od koraka 1?',
      tekst: 'Mesto u priči se vraća na početak, a izmene van priče se brišu. Uloga koju gledate ostaje ista.',
      potvrdi: 'Da, kreni ispočetka',
      onPotvrdi: () => {
        const novo = izgradiSvet(ciljPocetak(), postavkeIz(ref.current))
        dispatch({ tip: 'UCITAJ', stanje: novo })
        navigirajNa(novo, novo.uloga)
        setPanelState(false)
        obavesti(PORUKA_RESTART)
      },
    })
  }, [navigirajNa, obavesti])

  const setRezim = useCallback((r: Rezim) => {
    const s = ref.current
    if (s.prica.rezim === r) return
    if (r === 'slobodno') {
      dispatch({ tip: 'UCITAJ', stanje: { ...s, prica: { ...s.prica, rezim: 'slobodno' } } })
      setPanelState(false)
      return
    }
    // u vođeni: Admin postaje Produkcija; izmene van priče se brišu (uz potvrdu)
    const radi = () => {
      const sad = ref.current // stanje u trenutku potvrde, ne u trenutku otvaranja prozora
      const uloga: Uloga = sad.uloga === 'admin' ? 'produkcija' : sad.uloga
      const novo = izgradiSvet(pozicijaIz(sad.prica), { ...postavkeIz(sad), uloga, rezim: 'vodjeno' })
      dispatch({ tip: 'UCITAJ', stanje: novo })
      if (sad.uloga === 'admin') navigirajNa(novo, uloga)
      setPanelState(false)
    }
    saPotvrdom(radi, 'Prelazak u vođenu priču', 'Pređi u vođenu priču')
  }, [navigirajNa, saPotvrdom])

  const udjiUAdmina = useCallback(() => {
    const s = ref.current
    dispatch({ tip: 'UCITAJ', stanje: { ...s, uloga: 'admin', prica: { ...s.prica, rezim: 'slobodno' } } })
    navigate(POLAZNA.admin)
  }, [navigate])

  const ulaz = useCallback((u: UlogaPrice, r: Rezim) => {
    const s = ref.current
    const novo = izgradiSvet(ciljPocetak(), { ...postavkeIz(s), uloga: u, prikazVlasnika: 'pravno', rezim: r })
    dispatch({ tip: 'UCITAJ', stanje: novo })
    navigirajNa(novo, u)
  }, [navigirajNa])

  const vratiNaKorak = useCallback(() => {
    const s = ref.current
    setPanelState(false)
    setMeni(false)
    setPotvrda({
      naslov: `Vratiti na korak ${s.prica.korak}?`,
      tekst: 'Izmene van priče se brišu, a svet se vraća na ono što priča predviđa za ovaj korak.',
      potvrdi: `Vrati na korak ${s.prica.korak}`,
      onPotvrdi: () => {
        const novo = izgradiSvet(pozicijaIz(ref.current.prica), postavkeIz(ref.current))
        dispatch({ tip: 'UCITAJ', stanje: novo })
        navigirajNa(novo, novo.uloga)
        setPanelState(false)
      },
    })
  }, [navigirajNa])

  const predracunSaUslugama = useCallback(() => {
    if (ref.current.prica.rezim === 'vodjeno') return // alat slobodnog režima: u vođenom ne sme nastati odstupanje
    const radi = () => {
      const novo = izgradiUsluge({ ...postavkeIz(ref.current), uloga: 'produkcija' })
      dispatch({ tip: 'UCITAJ', stanje: novo })
      const predracun = novo.predracuni.find((p) => p.vrsta === 'naknada')
      navigate(predracun ? `/produkcija/predracun/${predracun.id}` : POLAZNA.produkcija)
      setPanelState(false)
    }
    saPotvrdom(radi, 'Učitati predračun sa uslugama?', 'Učitaj')
  }, [navigate, saPotvrdom])

  const premotaj = useCallback((sati: number) => {
    if (ref.current.prica.rezim === 'vodjeno') return // premotavanje je alat slobodnog režima
    dispatch({ tip: 'PREMOTAJ', sati })
  }, [])
  const sakrijTraku = useCallback((sakriti: boolean) => { dispatch({ tip: 'SAKRIJ_DEMO', sakriven: sakriti }) }, [])
  const odbaciUvod = useCallback(() => {
    const s = ref.current
    dispatch({ tip: 'UCITAJ', stanje: { ...s, prica: { ...s.prica, vidjenUvodSlobodno: true } } })
  }, [])

  const uloga = stanje.uloga
  const naEkranuPrice = uloga !== 'admin' && jeEkranPrice(stanje, poz, uloga, pathname)

  const vrednost = useMemo<Vrednost>(() => ({
    stanje, salji, probaj, poz, rezim: stanje.prica.rezim, vodjeno, telefon, naEkranuPrice,
    izvedi, dalje, nazad, skoci, prikaziMi, kreniIspocetka, setRezim, udjiUAdmina, setGrana, promeniUlogu, ulaz, vratiNaKorak,
    predracunSaUslugama, premotaj, sakrijTraku, odbaciUvod,
    panel, setPanel, meni, setMeni, poruka, obavesti, potvrda, zatvoriPotvrdu: () => setPotvrda(null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [stanje, salji, probaj, telefon, naEkranuPrice, izvedi, dalje, nazad, skoci, prikaziMi, kreniIspocetka, setRezim, setGrana,
    promeniUlogu, ulaz, vratiNaKorak, predracunSaUslugama, premotaj, sakrijTraku, odbaciUvod, udjiUAdmina, panel, setPanel, meni, poruka, obavesti, potvrda])
  return <Kontekst.Provider value={vrednost}>{children}</Kontekst.Provider>
}

export function useStanje(): Vrednost {
  const v = useContext(Kontekst)
  if (!v) throw new Error('useStanje se koristi unutar StanjeProvider-a')
  return v
}

/** Stanje dugmeta radnje priče (aktivno / razlog). U slobodnom režimu uvek aktivno. */
export function useRadnja(id: string): StanjeDugmeta {
  const { stanje } = useStanje()
  return stanjeRadnje(id, stanje.uloga, stanje.prica)
}
