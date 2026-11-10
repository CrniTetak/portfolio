// STANJE DEMOA: pozicija priče (korak, p), režim, grana račve, otvorena pomoć i dijalog Restarta; čuva se u sessionStorage (prica/cuvanje.ts).
// Ugao (gledalac / Vesna / platforma) se čita iz LINKA: tabla je ekran, ne posebno stanje. Ekrani televizora i telefona se računaju
// iz matrice (prica/matrica.ts); dugmad koja su radnje priče zovu `radnja(id)` (reducer: prica/navigacija.ts, PLAN B4.6.6).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { KANAL_GLAVNI, PAKET_PRICE, imaPaket, type Grana, type KodZemlje } from '../podaci/svet'
import type { Ugao } from '../prica/koraci'
import { definicija, duzina, stanjeZa, type RadnjaId } from '../prica/matrica'
import { vaziZaProizvod, dalje as daljePoz, nazad as nazadPoz, pretplatePozicije, primeniRadnju, sledecaRadnja, skok, zemljaPozicije, type Pozicija } from '../prica/navigacija'
import { POCETNI_SLOJ, dodajOperaciju, ocistiStavkePrice, vazecePretplate, type Pretplate, type SlobodniSloj, type TipOperacije } from '../slobodno/slobodno'
import { POCETNO_SACUVANO, sacuvaj, ucitaj, type Sacuvano } from '../prica/cuvanje'
import { sastavi } from '../pravila/ekrani'
import { useTvMotor } from '../tv-navigacija/fokus'
import { useTvRuta } from '../tv-navigacija/ruta'
import { TRAJANJE_SIJE_MS } from './mere'
import { useToast } from './Toast'
import { PRVO_PRITISNI } from '../tekstovi/radnje'
import { SIMULIRANA_RADNJA } from '../podaci/stalni-tekstovi'
import { popuni } from '../podaci/svet'

export type Rezim = 'vodjena' | 'slobodno'
export type PrikazUredjaja = 'tv' | 'tel'
export type IshodRadnje = 'ok' | 'ceka' | 'nije'
export type IzvorRadnje = 'tv' | 'tel'

type Stanje = Sacuvano & { pomoc: boolean; restartDijalog: boolean; menuTelefona: boolean; sija: string | null; sloj: SlobodniSloj }

type Kontekst = Stanje & {
  /** Važeće pretplate: iz priče za poziciju + operacije slobodnog sloja. */
  pretplate: Pretplate
  jePretplacenKanal: (kanalId: string, paketId?: string) => boolean
  /** Važeća zemlja: ručno izabrana (slobodno) ili iz priče. */
  zemlja: KodZemlje
  operacija: (tip: TipOperacije, proizvod: string) => void
  podesavanje: (izmena: Partial<SlobodniSloj>) => void
  pozicija: Pozicija
  ugao: Ugao
  uredjaj: PrikazUredjaja
  /** Telefonski ekran iz linka (npr. /pocetna). */
  telPutanja: string
  /** Gledalac je napustio ekran priče (vođeni režim): traka nudi „Nazad na priču“. */
  napustio: boolean
  dalje: () => void
  nazad: () => void
  idiNaKorak: (n: number) => void
  pokaziMi: () => void
  nazadNaPricu: () => void
  radnja: (id: RadnjaId, grana?: Grana, izvor?: IzvorRadnje, proizvod?: string) => IshodRadnje
  /** „Nazad na priču“ sa table: vraća gledaoca na poziciju priče na kojoj je bio (sa koraka 8 i 9: na kraj koraka 7). */
  vratiGledaoca: () => void
  postaviRezim: (r: Rezim) => void
  postaviUgao: (u: Ugao) => void
  postaviGranu: (g: Grana) => void
  postaviUredjaj: (u: PrikazUredjaja) => void
  idiTel: (putanja: string) => void
  /** Otvara ekran na telefonu (na uskom ekranu prebacuje uređaj) i javlja „Otvoreno na telefonu“. */
  otvoriNaTelefonu: (putanja: string, bezSije?: boolean) => void
  /** Izbor zemlje na T25: UVEK postavlja granu i poziciju (Grčka/Srbija: 6/1; Nemačka: 6/0). */
  izaberiZemlju: (kod: 'DE' | 'GR' | 'RS') => void
  uđiUDemo: (rezim: Rezim, ugao: Ugao) => void
  otvoriPomoc: () => void
  zatvoriPomoc: () => void
  otvoriRestart: () => void
  zatvoriRestart: () => void
  potvrdiRestart: () => void
  prebaciMeni: (otvoren: boolean) => void
}

const Ctx = createContext<Kontekst | null>(null)
export function useDemo(): Kontekst {
  const k = useContext(Ctx)
  if (!k) throw new Error('DemoProvider nedostaje')
  return k
}

/** Lažne radnje posle kojih se javlja „Simulirana radnja — ništa nije poslato ni naplaćeno“ (pretplata, plaćanje, otkaz). */
const LAZNE_RADNJE: RadnjaId[] = ['plati', 'otkazi-kanal', 'jetzt-kundigen']

function napraviSearch(tel: string, uredjaj: PrikazUredjaja): string {
  const n = new URLSearchParams()
  if (uredjaj === 'tel') n.set('uredjaj', 'tel')
  if (tel !== sastavi('P1')) n.set('tel', tel)
  const t = n.toString()
  return t ? `?${t}` : ''
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Stanje>(() => ({ ...ucitaj(), pomoc: false, restartDijalog: false, menuTelefona: false, sija: null }))
  const sRef = useRef(s)
  sRef.current = s
  const navigate = useNavigate()
  const lokacija = useLocation()
  const lokRef = useRef(lokacija)
  lokRef.current = lokacija
  const [sp, setSp] = useSearchParams()
  const { motor } = useTvMotor()
  const { idi, zaboraviStek } = useTvRuta()
  const { pokazi } = useToast()
  const sijaTajmer = useRef<number | undefined>(undefined)
  const slobodnoJavljeno = useRef(false)

  const ugao: Ugao = lokacija.pathname === sastavi('V1') ? 'kanal' : lokacija.pathname === sastavi('M1') ? 'platforma' : 'gledalac'
  const uredjaj: PrikazUredjaja = sp.get('uredjaj') === 'tel' ? 'tel' : 'tv'
  const telPutanja = sp.get('tel') ?? sastavi('P1')
  const pozicija: Pozicija = { korak: s.korak, p: s.p }

  // čuvanje (samo trajni deo)
  useEffect(() => {
    sacuvaj({ verzija: 1, korak: s.korak, p: s.p, grana: s.grana, rezim: s.rezim, kakoViđeno: s.kakoViđeno, sloj: s.sloj })
  }, [s.korak, s.p, s.grana, s.rezim, s.kakoViđeno, s.sloj])

  const upali = useCallback((tekst: string) => {
    window.clearTimeout(sijaTajmer.current)
    setS((p) => ({ ...p, sija: tekst }))
    sijaTajmer.current = window.setTimeout(() => setS((p) => ({ ...p, sija: null })), TRAJANJE_SIJE_MS)
  }, [])
  useEffect(() => () => window.clearTimeout(sijaTajmer.current), [])

  /** Prikazuje stanje pozicije: ekran televizora, ekran telefona i (na uskom ekranu) pravi uređaj. */
  const prikazi = useCallback(
    (poz: Pozicija, grana: Grana, opcije: { koren: boolean; radnja?: RadnjaId; izvor?: IzvorRadnje }) => {
      motor.zaboraviSve() // ekran priče kreće od početnog izbora iz matrice
      setS((p) => ({ ...p, sloj: ocistiStavkePrice(p.sloj, [KANAL_GLAVNI.id, PAKET_PRICE.id]) })) // priča uvek izgleda kako kartica kaže (B4.4)
      const st = stanjeZa(poz.korak, poz.p, grana)
      const staraTel = new URLSearchParams(lokRef.current.search).get('tel') ?? sastavi('P1')
      const telPromena = st.tel !== staraTel
      let novi: PrikazUredjaja = new URLSearchParams(lokRef.current.search).get('uredjaj') === 'tel' ? 'tel' : 'tv'
      if (opcije.radnja) {
        // uređaj se menja (i javlja) SAMO kad radnja sa televizora otvara telefon; radnje koje se već odvijaju na telefonu ništa ne javljaju
        const sTelevizora = (opcije.izvor ?? 'tv') === 'tv'
        if (opcije.radnja === 'vrati-na-tv') novi = 'tv'
        else if (sTelevizora && telPromena && st.tel !== sastavi('P1')) novi = 'tel'
        if (sTelevizora && telPromena && st.tel !== sastavi('P1') && opcije.radnja !== 'vrati-na-tv') upali(opcije.radnja === 'skeniraj' ? 'Skenirano' : 'Otvoreno na telefonu')
      } else novi = 'tv'
      const search = napraviSearch(st.tel, novi)
      if (st.tv.startsWith('/tv')) idi(st.tv, { koren: opcije.koren, search })
      else navigate({ pathname: st.tv, search }, { replace: false })
    },
    [idi, navigate, upali, motor],
  )

  const idiNaPoziciju = useCallback(
    (poz: Pozicija, opcije: { koren: boolean; radnja?: RadnjaId; grana?: Grana; izvor?: IzvorRadnje }) => {
      const grana = opcije.grana ?? sRef.current.grana
      setS((p) => ({ ...p, korak: poz.korak, p: poz.p, grana }))
      prikazi(poz, grana, opcije)
    },
    [prikazi],
  )

  const idiNaKorak = useCallback((n: number) => idiNaPoziciju(skok(n), { koren: true }), [idiNaPoziciju])

  const radnja = useCallback(
    (id: RadnjaId, granaZa?: Grana, izvor: IzvorRadnje = 'tv', proizvod?: string): IshodRadnje => {
      const cur = sRef.current
      const grana = granaZa ?? cur.grana
      // radnje priče važe samo za proizvod priče; za druge ide slobodni put
      if (proizvod !== undefined && !vaziZaProizvod(cur.korak, id, proizvod)) return 'nije'
      const ishod = primeniRadnju({ korak: cur.korak, p: cur.p }, id, grana)
      if (ishod.tip === 'primenjena') {
        idiNaPoziciju(ishod.poz, { koren: false, radnja: id, grana, izvor })
        if (LAZNE_RADNJE.includes(id)) pokazi(SIMULIRANA_RADNJA)
        return 'ok'
      }
      if (ishod.tip === 'ceka' && cur.rezim === 'vodjena') {
        if (ishod.korak === cur.korak) {
          const sledeca = sledecaRadnja({ korak: cur.korak, p: cur.p }, grana)
          pokazi(sledeca ? `Prvo ${popuni(PRVO_PRITISNI[sledeca])}.` : 'Ovaj korak je završen. Pritisni Dalje.')
        } else pokazi(`U priči ovo dolazi u koraku ${ishod.korak}.`, { tekst: `Idi na korak ${ishod.korak}`, onClick: () => idiNaKorak(ishod.korak) })
        return 'ceka'
      }
      return 'nije'
    },
    [idiNaPoziciju, pokazi],
  )

  const postaviUredjaj = useCallback(
    (u: PrikazUredjaja) =>
      setSp(
        (prethodni) => {
          const n = new URLSearchParams(prethodni)
          if (u === 'tel') n.set('uredjaj', 'tel')
          else n.delete('uredjaj')
          return n
        },
        { replace: true },
      ),
    [setSp],
  )

  const idiTel = useCallback(
    (putanja: string) =>
      setSp(
        (prethodni) => {
          const n = new URLSearchParams(prethodni)
          if (putanja === sastavi('P1')) n.delete('tel')
          else n.set('tel', putanja)
          return n
        },
        { replace: true },
      ),
    [setSp],
  )

  // „Napustio si ekran priče“: ni ekran televizora ni (neosnovni) ekran telefona nisu iz ovog koraka
  const napustio = useMemo(() => {
    // tabla izabrana svesno (ugao Vlasnica kanala / Platforma) nije „napuštanje“ priče
    if (s.rezim !== 'vodjena' || ugao !== 'gledalac') return false
    const d = definicija(s.korak, s.grana)
    const tvPutanje = new Set(d.stanja.map((x) => x.tv))
    const telPutanje = new Set(d.stanja.map((x) => x.tel).filter((t) => t !== sastavi('P1')))
    return !(tvPutanje.has(lokacija.pathname) || telPutanje.has(telPutanja))
  }, [s.rezim, s.korak, s.grana, lokacija.pathname, telPutanja, ugao])

  // Kartica „Kako se upravlja“: prvi put na T1 (i posle Restarta)
  const autoPomoc = useRef(false)
  useEffect(() => {
    if (lokacija.pathname === sastavi('T1') && !s.kakoViđeno) {
      autoPomoc.current = true
      setS((p) => (p.pomoc ? p : { ...p, pomoc: true }))
    } else if (autoPomoc.current) {
      // napuštanjem T1 samootvorena kartica se zatvara (i računa se kao viđena)
      autoPomoc.current = false
      setS((p) => ({ ...p, pomoc: false, kakoViđeno: true }))
    }
  }, [lokacija.pathname, s.kakoViđeno])

  const postaviUgao = useCallback(
    (u: Ugao) => {
      const search = lokRef.current.search
      if (u === 'kanal') navigate({ pathname: sastavi('V1'), search })
      else if (u === 'platforma') navigate({ pathname: sastavi('M1'), search })
      else idi(sastavi('T2'), { koren: true })
    },
    [navigate, idi],
  )

  const pretplate = useMemo(() => {
    const a = pretplatePozicije({ korak: s.korak, p: s.p }, s.grana)
    return vazecePretplate({ kanali: a.kanal ? [KANAL_GLAVNI.id] : [], paketi: a.paket ? [PAKET_PRICE.id] : [] }, s.sloj, imaPaket)
  }, [s.korak, s.p, s.grana, s.sloj])
  const zemlja: KodZemlje = s.sloj.zemlja ?? zemljaPozicije({ korak: s.korak, p: s.p }, s.grana)

  const vrednost = useMemo<Kontekst>(
    () => ({
      ...s,
      pretplate,
      zemlja,
      jePretplacenKanal: (kanalId, paketId) => pretplate.kanali.includes(kanalId) || (paketId !== undefined && pretplate.paketi.includes(paketId)),
      operacija: (tip, proizvod) => {
        setS((p) => ({ ...p, sloj: dodajOperaciju(p.sloj, { tip, proizvod }) }))
        pokazi(SIMULIRANA_RADNJA)
      },
      podesavanje: (izmena) => setS((p) => ({ ...p, sloj: { ...p.sloj, ...izmena } })),
      pozicija,
      ugao,
      uredjaj,
      telPutanja,
      napustio,
      dalje: () => {
        const n = daljePoz(pozicija, s.grana)
        if (n) idiNaPoziciju(n, { koren: true })
      },
      nazad: () => {
        const n = nazadPoz(pozicija)
        if (n) idiNaPoziciju(n, { koren: true })
      },
      idiNaKorak,
      pokaziMi: () => idiNaKorak(s.korak),
      nazadNaPricu: () => idiNaPoziciju(pozicija, { koren: true }),
      vratiGledaoca: () => idiNaPoziciju(pozicija.korak >= 8 ? { korak: 7, p: duzina(7, s.grana) } : pozicija, { koren: true }),
      radnja,
      postaviRezim: (rezim) => {
        // povratak u vođenu priču: priča opet izgleda kako kartica kaže (briše se ručna zemlja i operacije nad stavkama priče)
        setS((p) => ({ ...p, rezim, sloj: rezim === 'vodjena' ? ocistiStavkePrice(p.sloj, [KANAL_GLAVNI.id, PAKET_PRICE.id]) : p.sloj }))
        if (rezim === 'slobodno' && !slobodnoJavljeno.current) {
          slobodnoJavljeno.current = true
          pokazi('Sada razgledaš slobodno. Traka priče ostaje dole — koristi je kad god želiš.')
        }
      },
      postaviUgao,
      postaviGranu: (grana) => {
        setS((p) => ({ ...p, grana }))
        // ako je gledalac u koraku 6, pozicija se prilagođava dužini grane
        if (s.korak === 6) {
          const n: Pozicija = { korak: 6, p: Math.min(s.p, definicija(6, grana).radnje.length) }
          setS((p) => ({ ...p, grana, korak: n.korak, p: n.p }))
          prikazi(n, grana, { koren: true })
        }
      },
      postaviUredjaj,
      idiTel,
      // jedan setSearchParams (dva uzastopna sa funkcijom bi jedan drugom poništila izmenu)
      otvoriNaTelefonu: (putanja, bezSije) => {
        setSp(
          (prethodni) => {
            const n = new URLSearchParams(prethodni)
            n.set('uredjaj', 'tel')
            if (putanja === sastavi('P1')) n.delete('tel')
            else n.set('tel', putanja)
            return n
          },
          { replace: true },
        )
        if (!bezSije) upali('Otvoreno na telefonu')
      },
      izaberiZemlju: (kod) => {
        // slobodno klikanje ne pomera priču: menja se samo zemlja u slobodnom sloju
        if (sRef.current.rezim === 'slobodno') {
          setS((p) => ({ ...p, sloj: { ...p.sloj, zemlja: kod } }))
          motor.zaboraviSve()
          idi(kod === 'GR' ? sastavi('T26') : kod === 'RS' ? sastavi('T27') : sastavi('T2'), { koren: kod === 'DE' })
          return
        }
        if (kod === 'DE') {
          // isto čišćenje kao pri svakoj navigaciji priče (stavke priče i ručna zemlja)
          setS((p) => ({ ...p, korak: 6, p: 0, sloj: ocistiStavkePrice(p.sloj, [KANAL_GLAVNI.id, PAKET_PRICE.id]) }))
          motor.zaboraviSve()
          idi(sastavi('T2'), { koren: true })
          return
        }
        idiNaPoziciju({ korak: 6, p: 1 }, { koren: false, grana: kod === 'GR' ? 'grcka' : 'srbija' })
      },
      uđiUDemo: (rezim, ugao) => {
        setS((p) => ({ ...POCETNO_SACUVANO, rezim, kakoViđeno: p.kakoViđeno, pomoc: false, restartDijalog: false, menuTelefona: false, sija: null, sloj: POCETNI_SLOJ }))
        const poz: Pozicija = ugao === 'kanal' ? { korak: 8, p: 0 } : ugao === 'platforma' ? { korak: 9, p: 0 } : rezim === 'slobodno' ? { korak: 1, p: 1 } : { korak: 1, p: 0 }
        setS((p) => ({ ...p, korak: poz.korak, p: poz.p }))
        prikazi(poz, 'grcka', { koren: true })
        if (rezim === 'slobodno') {
          // ulaz u slobodno klikanje: „Kako se upravlja“ i poruka o slobodnom režimu
          setS((p) => ({ ...p, pomoc: true }))
          slobodnoJavljeno.current = true
          pokazi('Sada razgledaš slobodno. Traka priče ostaje dole — koristi je kad god želiš.')
        }
      },
      otvoriPomoc: () => {
        setS((p) => ({ ...p, pomoc: true, menuTelefona: false }))
        postaviUredjaj('tv')
      },
      zatvoriPomoc: () => setS((p) => ({ ...p, pomoc: false, kakoViđeno: true })),
      otvoriRestart: () => setS((p) => ({ ...p, restartDijalog: true, menuTelefona: false })),
      zatvoriRestart: () => setS((p) => ({ ...p, restartDijalog: false })),
      // Restart: korak 1 (početno), Grčka, briše stek i zapamćene izbore, ponovo prikazuje „Kako se upravlja“; ugao i režim ostaju (UX 3.4).
      potvrdiRestart: () => {
        setS((p) => ({ ...POCETNO_SACUVANO, rezim: p.rezim, pomoc: false, restartDijalog: false, menuTelefona: false, sija: null, sloj: POCETNI_SLOJ }))
        zaboraviStek()
        motor.zaboraviSve()
        slobodnoJavljeno.current = false
        const st = stanjeZa(1, 0, 'grcka')
        // ugao i režim ostaju (UX 3.4): sa table se ostaje na tabli
        const cilj = ugao === 'kanal' ? sastavi('V1') : ugao === 'platforma' ? sastavi('M1') : st.tv
        navigate({ pathname: cilj, search: napraviSearch(st.tel, 'tv') }, { replace: true })
      },
      prebaciMeni: (menuTelefona) => setS((p) => ({ ...p, menuTelefona })),
    }),
    [s, pretplate, zemlja, pozicija.korak, pozicija.p, ugao, uredjaj, telPutanja, napustio, idiNaPoziciju, idiNaKorak, radnja, postaviUgao, postaviUredjaj, idiTel, prikazi, pokazi, zaboraviStek, motor, navigate, idi, upali, setSp],
  )

  return <Ctx.Provider value={vrednost}>{children}</Ctx.Provider>
}

