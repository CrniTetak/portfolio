// RUTA televizora: „Nazad“ sa sopstvenim stekom, „Početna“ i kretanje bez novih unosa u istoriju pregledača (PLAN B4.2, B5.2).
// Navigacija televizora menja link sa `replace`; taster Nazad pregledača zato izlazi iz demoa, a Backspace nikad ne napušta stranicu.
// Stanje telefona (upit ?tel=…&uredjaj=…) ostaje netaknuto pri kretanju po televizoru.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { imaPaket, KANAL_BESPLATNI_FILM } from '../podaci/svet'
import { razresi, roditeljPutanja, sastavi } from '../pravila/ekrani'
import { POCETNI_EKRAN_PORUKA } from '../podaci/stalni-tekstovi'
import { useToast } from '../okvir/Toast'
import { useTvMotor } from './fokus'
import { skini, stavi } from './stek'

type Idi = (putanja: string, opcije?: { koren?: boolean; search?: string }) => void
type RutaKontekst = { idi: Idi; nazad: () => void; pocetna: () => void; zaboraviStek: () => void }
const Kontekst = createContext<RutaKontekst | null>(null)

export function useTvRuta(): RutaKontekst {
  const k = useContext(Kontekst)
  if (!k) throw new Error('TvRuta nedostaje')
  return k
}

export function TvRuta({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const lokacija = useLocation()
  const { postaviRukovaoce } = useTvMotor()
  const { pokazi } = useToast()
  const stek = useRef<string[]>([])
  const lok = useRef(lokacija)
  lok.current = lokacija

  const idiNa = useCallback(
    (putanja: string, search?: string) => navigate({ pathname: putanja, search: search ?? lok.current.search }, { replace: true }),
    [navigate],
  )

  const idi = useCallback<Idi>(
    (putanja, opcije) => {
      stek.current = opcije?.koren ? [] : stavi(stek.current, lok.current.pathname)
      idiNa(putanja, opcije?.search)
    },
    [idiNa],
  )

  const pocetna = useCallback(() => {
    stek.current = []
    idiNa(sastavi('T2'))
  }, [idiNa])

  const nazad = useCallback(() => {
    const trenutna = lok.current.pathname
    let vrh: string | null
    // Preskače se isti ekran (npr. ako je putanja već vrh steka).
    do {
      ;[stek.current, vrh] = skini(stek.current)
    } while (vrh === trenutna)
    if (vrh) {
      idiNa(vrh)
      return
    }
    const r = razresi('tv', trenutna)
    if (!r || !r.ekran.roditelj) {
      pokazi(POCETNI_EKRAN_PORUKA)
      return
    }
    idiNa(roditeljPutanja(r.ekran.id, r.parametri, { jePaket: imaPaket, kanalReklame: KANAL_BESPLATNI_FILM.id }))
  }, [idiNa, pokazi])

  useEffect(() => {
    postaviRukovaoce({ nazad, pocetna })
  }, [postaviRukovaoce, nazad, pocetna])


  const zaboraviStek = useCallback(() => {
    stek.current = []
  }, [])

  const vrednost = useMemo(() => ({ idi, nazad, pocetna, zaboraviStek }), [idi, nazad, pocetna, zaboraviStek])
  return <Kontekst.Provider value={vrednost}>{children}</Kontekst.Provider>
}
