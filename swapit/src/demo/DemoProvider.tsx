// ZAJEDNIČKO STANJE DEMOA (PLAN B4): pozicija priče, grana, režim, tema, saglasnosti, slobodni tokovi + mali sloj za toast i dijaloge.
// Pozicija se menja samo kroz reducer (prica/reducer.ts); skok/Dalje/Nazad/Restart računaju cilj pa ga ponovo odigraju.
// Ugao i kontekst ekrana su u linku (ne ovde). Čuva se samo u sessionStorage (demo/cuvanje.ts), pod ključem swapit.demo.v1.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ekranZaPoziciju } from '../pravila/matrica'
import { ciljBack, ciljGlavniTok, ciljNext, ciljSkok } from '../prica/navigacija'
import { reducer } from '../prica/reducer'
import type { EkranId, Grana, Poz, Rezim, Tema, Ugao } from '../prica/tipovi'
import { PORUKE, TRAJANJE_TOASTA_MS } from '../tekstovi/okvir'
import { prebaciOmiljeno, type Tokovi } from '../tokovi/tokovi'
import { posleRestarta, ucitaj, upisi, type Sacuvano } from './cuvanje'
import { imaNapredak, poIzvedi, poPostavi, poUlazu } from './logika'

export type VrstaStuba = 'roba' | 'usluge' | 'ideje'

type Demo = {
  poz: Poz
  rezim: Rezim
  tema: Tema
  slobodnoVidjeno: boolean
  /** Poruka „Račva poništena“ posle skoka na korak 1–5 iz grane „poeni“. */
  toast: { tekst: string; kljuc: number; ms?: number } | null
  dijalogRestart: boolean
  panelOtvoren: boolean
  meniOtvoren: boolean
  /** Prekidač „Roba / Usluge / Ideje“ iz levog stuba (menja redove i brojače). */
  vrstaStuba: VrstaStuba
  tokovi: Tokovi
  saglasnosti: Record<string, boolean>
  /** Postoji li mesto u priči ili probani tokovi koje bi „Uđi u demo“ ili Restart obrisao (PK11). */
  imaNapredak: boolean
  /** Radnja sa ekrana: prihvata se samo ako je sledeća i ako je gledalac u uglu koji je izvodi (sa automatskim radnjama). */
  izvedi: (id: string, ugao: Ugao) => boolean
  postavi: (cilj: Poz) => void
  next: () => void
  back: () => void
  skok: (korak: number) => void
  izaberiGranu: (g: Grana) => void
  glavniTok: () => void
  restart: () => void
  postaviRezim: (r: Rezim) => void
  postaviTemu: (t: Tema) => void
  obavesti: (tekst?: string) => void
  pauzirajToast: (p: boolean) => void
  /** P-S12: korisnik sam zatvara poruku. */
  zatvoriToast: () => void
  oznaciSlobodnoVidjeno: () => void
  postaviSaglasnost: (kljuc: string, v: boolean) => void
  postaviVrstuStuba: (v: VrstaStuba) => void
  /** Zvezdica na kartici oglasa (omiljeno). */
  prebaciOmiljeno: (id: string) => void
  /** Promena stanja slobodnih tokova (čista funkcija iz tokovi/operacije.ts); vraća novo stanje da ekran odmah zna id i ishod. */
  promeniTokove: (f: (t: Tokovi) => Tokovi) => Tokovi
  otvoriRestart: (otvori: boolean) => void
  otvoriPanel: (otvori: boolean) => void
  otvoriMeni: (otvori: boolean) => void
  /** U2: ulaz u demo. Vođena → 1/početno; slobodno → 1/završno (Ana Verifikovan, 20 poena). Vraća ekran na koji se ide. */
  ulaz: (ugao: Ugao, rezim: Rezim) => EkranId
  /** Ekran na kome je trenutno stanje priče prikazano za ugao. */
  ekranZa: (ugao: Ugao) => EkranId
  ekranZaPoz: (poz: Poz, ugao: Ugao) => EkranId
}

const Ctx = createContext<Demo | null>(null)
export const useDemo = (): Demo => {
  const d = useContext(Ctx)
  if (!d) throw new Error('useDemo van DemoProvider-a')
  return d
}

/** Brojač poruka (ključ za ponovno prikazivanje iste poruke); sat računara se ne koristi. */
let brojacPoruka = 0

/** Primenjuje temu na ceo dokument (CSS promenljive `html[data-tema]`). Poziva se i pre prvog iscrtavanja (main.tsx). */
export function primeniTemu(tema: Tema): void {
  document.documentElement.setAttribute('data-tema', tema)
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Sacuvano>(() => ucitaj())
  // najnovije stanje, i pre nego što ga React iscrta: dva poziva u istom trenutku (npr. izvedi pa Dalje) vide jedno drugo
  const sRef = useRef(s)
  sRef.current = s
  const primeni = useCallback((f: (x: Sacuvano) => Sacuvano) => {
    const nova = f(sRef.current)
    sRef.current = nova
    setS(nova)
  }, [])
  const [toast, setToast] = useState<Demo['toast']>(null)
  const [toastPauza, pauzirajToast] = useState(false)
  const [dijalogRestart, otvoriRestart] = useState(false)
  const [panelOtvoren, otvoriPanel] = useState(false)
  const [meniOtvoren, otvoriMeni] = useState(false)
  const [vrstaStuba, postaviVrstuStuba] = useState<VrstaStuba>('roba')

  useEffect(() => upisi(s), [s])
  useEffect(() => primeniTemu(s.tema), [s.tema])
  useEffect(() => {
    if (!toast || toastPauza) return
    const t = setTimeout(() => setToast(null), toast.ms ?? TRAJANJE_TOASTA_MS)
    return () => clearTimeout(t)
  }, [toast, toastPauza])

  // traka priče izvodi korake umesto gledaoca: kvačice priče se računaju iznova iz pozicije (logika.ts)
  const postavi = useCallback((cilj: Poz) => primeni((x) => poPostavi(x, cilj)), [primeni])

  const obavesti = useCallback((tekst: string = PORUKE.simulacija) => setToast({ tekst, kljuc: ++brojacPoruka }), [])

  const demo = useMemo<Demo>(
    () => ({
      poz: s.poz,
      rezim: s.rezim,
      tema: s.tema,
      slobodnoVidjeno: s.poruke.slobodno,
      toast,
      dijalogRestart,
      panelOtvoren,
      meniOtvoren,
      vrstaStuba,
      tokovi: s.tokovi,
      saglasnosti: s.saglasnosti,
      imaNapredak: imaNapredak(s),
      izvedi: (id, ugao) => {
        const nova = poIzvedi(sRef.current, id, ugao)
        if (!nova) return false
        sRef.current = nova
        setS(nova)
        return true
      },
      postavi,
      next: () => postavi(ciljNext(sRef.current.poz)),
      back: () => {
        const cilj = ciljBack(sRef.current.poz)
        const vracaGranu = sRef.current.poz.grana === 'poeni' && cilj.grana === 'lanac'
        postavi(cilj)
        if (vracaGranu) setToast({ tekst: PORUKE.granaVracena, kljuc: ++brojacPoruka })
      },
      skok: (korak) => {
        const { poz, granaVracena } = ciljSkok(sRef.current.poz, korak)
        postavi(poz)
        if (granaVracena) setToast({ tekst: PORUKE.granaVracena, kljuc: ++brojacPoruka })
      },
      izaberiGranu: (g) => {
        primeni((x) => ({ ...x, poz: reducer(x.poz, { t: 'grana', grana: g }) }))
      },
      glavniTok: () => postavi(ciljGlavniTok()),
      restart: () => {
        postaviVrstuStuba('roba') // PK15: prekidač Roba/Usluge/Ideje se vraća na „Roba“
        primeni(posleRestarta)
        setToast({ tekst: PORUKE.restartovano, kljuc: ++brojacPoruka })
      },
      postaviRezim: (r) => primeni((x) => ({ ...x, rezim: r })),
      postaviTemu: (t) => primeni((x) => ({ ...x, tema: t })),
      obavesti,
      pauzirajToast,
      zatvoriToast: () => {
        setToast(null)
        pauzirajToast(false)
      },
      oznaciSlobodnoVidjeno: () => primeni((x) => ({ ...x, poruke: { ...x.poruke, slobodno: true } })),
      postaviSaglasnost: (kljuc, v) => primeni((x) => ({ ...x, saglasnosti: { ...x.saglasnosti, [kljuc]: v } })),
      postaviVrstuStuba,
      prebaciOmiljeno: (id) => primeni((x) => ({ ...x, tokovi: prebaciOmiljeno(x.tokovi, id) })),
      promeniTokove: (f) => {
        primeni((x) => ({ ...x, tokovi: f(x.tokovi) }))
        return sRef.current.tokovi
      },
      otvoriRestart,
      otvoriPanel,
      otvoriMeni,
      ulaz: (ugao, rezim) => {
        // isto čišćenje kao Restart (logika.poUlazu); slobodni ulaz = korak 1 završno, vođeni = korak 1 početno
        const { stanje, ekran } = poUlazu(sRef.current, ugao, rezim)
        postaviVrstuStuba('roba')
        primeni(() => stanje)
        return ekran
      },
      ekranZa: (ugao) => ekranZaPoziciju(s.poz, ugao),
      ekranZaPoz: ekranZaPoziciju,
    }),
    [s, toast, dijalogRestart, panelOtvoren, meniOtvoren, vrstaStuba, postavi, obavesti],
  )
  return <Ctx.Provider value={demo}>{children}</Ctx.Provider>
}
