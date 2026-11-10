// TOAST — kratka poruka u televizoru i telefonu (npr. „Ovo je početni ekran…“, „Simulirana radnja…“, „U priči ovo dolazi u koraku N.“).
// Poruka NE preuzima tastaturu: strelice i Enter i dalje idu televizoru. Ako nosi dugme (npr. „Idi na korak N“), dugme je obično dugme
// (klik, Tab) i isto dugme se nudi u traci priče dok poruka traje. Trajanje je srazmerno dužini teksta (najmanje 6 s); dok je miš ili
// fokus na poruci (ili na dugmetu u traci) odbrojavanje stoji. Samo JEDAN region (TvToast) se čita čitaču ekrana.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { NAJMANJE_TRAJANJE_PORUKE_MS, OSNOVA_TRAJANJA_PORUKE_MS, TRAJANJE_PO_ZNAKU_MS } from './mere'

export type AkcijaPoruke = { tekst: string; onClick: () => void }
type Poruka = { tekst: string; akcija?: AkcijaPoruke }
type ToastKontekst = {
  poruka: string | null
  akcija: AkcijaPoruke | null
  pokazi: (tekst: string, akcija?: AkcijaPoruke) => void
  sakrij: () => void
  /** Miš ili fokus je na poruci: odbrojavanje stoji dok se ne vrati `false`. */
  pauziraj: (stoji: boolean) => void
}
const Kontekst = createContext<ToastKontekst>({ poruka: null, akcija: null, pokazi: () => {}, sakrij: () => {}, pauziraj: () => {} })

/** Trajanje poruke: srazmerno dužini teksta, ali najmanje 6 s. */
export const trajanjePoruke = (tekst: string): number => Math.max(NAJMANJE_TRAJANJE_PORUKE_MS, OSNOVA_TRAJANJA_PORUKE_MS + tekst.length * TRAJANJE_PO_ZNAKU_MS)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [poruka, setPoruka] = useState<Poruka | null>(null)
  const tajmer = useRef<number | undefined>(undefined)
  const trenutna = useRef<Poruka | null>(null)
  const pauza = useRef(false)

  const pokreniOdbrojavanje = useCallback(() => {
    window.clearTimeout(tajmer.current)
    const p = trenutna.current
    if (!p) return
    tajmer.current = window.setTimeout(() => {
      trenutna.current = null
      setPoruka(null)
    }, trajanjePoruke(p.tekst))
  }, [])

  const sakrij = useCallback(() => {
    window.clearTimeout(tajmer.current)
    trenutna.current = null
    pauza.current = false
    setPoruka(null)
  }, [])
  const pokazi = useCallback(
    (tekst: string, akcija?: AkcijaPoruke) => {
      trenutna.current = { tekst, akcija }
      pauza.current = false
      setPoruka(trenutna.current)
      pokreniOdbrojavanje()
    },
    [pokreniOdbrojavanje],
  )
  const pauziraj = useCallback(
    (stoji: boolean) => {
      pauza.current = stoji
      if (stoji) window.clearTimeout(tajmer.current)
      else pokreniOdbrojavanje()
    },
    [pokreniOdbrojavanje],
  )
  useEffect(() => () => window.clearTimeout(tajmer.current), [])
  return <Kontekst.Provider value={{ poruka: poruka?.tekst ?? null, akcija: poruka?.akcija ?? null, pokazi, sakrij, pauziraj }}>{children}</Kontekst.Provider>
}

export const useToast = () => useContext(Kontekst)

/** Prikaz poruke unutar platna televizora. Region je uvek u stablu (da čitač ekrana javi promenu) i jedini je koji se čita. */
export function TvToast() {
  const { poruka, akcija, sakrij, pauziraj } = useToast()
  return (
    <div role="status" aria-live="polite" className="tv-toast-region">
      {poruka ? (
        <div className="tv-toast" onMouseEnter={() => pauziraj(true)} onMouseLeave={() => pauziraj(false)} onFocus={() => pauziraj(true)} onBlur={() => pauziraj(false)}>
          {poruka}
          {akcija && (
            <button
              type="button"
              className="tv-toast-dugme"
              onClick={() => {
                sakrij()
                akcija.onClick()
              }}
            >
              {akcija.tekst}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
