// REACT sloj prostorne navigacije (PLAN B5): FokusProvider, TvEkran, TvSloj, TvFokus, hookovi.
// Srce je motor.ts (čist TS). Ovde su samo: slušač tastature, registracija pravih <button> elemenata i stanje „Izabrano: …“.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { FokusMotor, SLOJ_EKRAN, type PocetniIzbor } from './motor'
import { komandaIzTastera, type Komanda } from './komande'
import { izmeri, osiguraVidljivost } from './skrol'
import type { Smer } from './geometrija'

type Obavestenje = { izabrano: string; udar: { smer: Smer; broj: number } | null }

type FokusKontekst = {
  motor: FokusMotor
  /** Izvrši komandu (daljinski, tastatura): strelice i OK idu motoru; „nazad“ i „pocetna“ ide ruteru (vidi TvNavigacija). */
  komanda: (k: Komanda) => void
  /** Postavlja rukovaoce za „nazad“ (kad nema prozora) i „početna“. */
  postaviRukovaoce: (r: { nazad?: () => void; pocetna?: () => void }) => void
  pretplati: (f: () => void) => () => void
  uzmi: () => Obavestenje
}
const Kontekst = createContext<FokusKontekst | null>(null)
const SlojKontekst = createContext<string>(SLOJ_EKRAN)

export function useTvMotor(): FokusKontekst {
  const k = useContext(Kontekst)
  if (!k) throw new Error('FokusProvider nedostaje')
  return k
}

/** Tekst za red „Izabrano: …“ i kratak „udar“ na ivici. */
export function useTvObavestenje(): Obavestenje {
  const k = useTvMotor()
  return useSyncExternalStore(k.pretplati, k.uzmi)
}

export function FokusProvider({ children }: { children: ReactNode }) {
  const stanje = useRef<Obavestenje>({ izabrano: '', udar: null })
  const slusaoci = useRef(new Set<() => void>())
  const rukovaoci = useRef<{ nazad?: () => void; pocetna?: () => void }>({})

  const javi = useCallback(() => {
    for (const f of slusaoci.current) f()
  }, [])

  const [motor] = useState(
    () =>
      new FokusMotor({
        onPromena: (_id, etiketa) => {
          stanje.current = { ...stanje.current, izabrano: etiketa }
          javi()
        },
        onUdar: (smer) => {
          const prethodni = stanje.current.udar?.broj ?? 0
          stanje.current = { ...stanje.current, udar: { smer, broj: prethodni + 1 } }
          javi()
        },
      }),
  )

  const komanda = useCallback(
    (k: Komanda) => {
      // Televizor nije na ekranu (table, telefon-uređaj): komande se ignorišu — bez poruke i bez tihe promene skrivenog ekrana.
      if (!motor.imaStavki()) return
      switch (k) {
        case 'gore':
        case 'dole':
        case 'levo':
        case 'desno':
          motor.pomeri(k)
          break
        case 'ok':
          motor.ok()
          break
        case 'nazad':
          // Prvo se zatvara prozor; tek ako ga nema, nazad ide ruteru (prethodni ekran).
          if (motor.nazad() === 'ekran') rukovaoci.current.nazad?.()
          break
        case 'pocetna':
          // Otvoren prozor se prvo zatvara (isti pritisak ne vodi i na početni ekran).
          if (motor.imaSloj()) motor.nazad()
          else rukovaoci.current.pocetna?.()
          break
      }
    },
    [motor],
  )

  // Tastatura: strelice, Enter, Backspace, Esc idu televizoru kad je DOM fokus u televizoru ili nigde (body).
  // Kad je fokus na traci ili telefonu (stigao tasterom Tab), važe obična pravila; Esc vraća fokus televizoru.
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const k = komandaIzTastera(e)
      if (!k) return
      if (document.querySelector('.dijalog')) return // dijalog Restarta je otvoren: TV komande se ignorišu
      if ((e.target as Element | null)?.closest?.('.tv-toast')) return // dugme u poruci radi kao obično dugme (Enter/Space)
      const t = e.target as Element | null
      const uTelevizoru = !t || t === document.body || t === document.documentElement || !!t.closest?.('[data-tv-oblast]')
      if (!uTelevizoru) {
        if (e.key === 'Escape') {
          e.preventDefault()
          document.querySelector<HTMLElement>('[data-tv-oblast] [data-izabran]')?.focus({ preventScroll: true })
        }
        return
      }
      e.preventDefault() // Backspace nikad ne vraća stranicu (demo nema polja za kucanje); Enter ne aktivira dugme dvaput
      if ((k === 'ok' || k === 'nazad' || k === 'pocetna') && e.repeat) return // držanje tastera ne preskače ekrane
      komanda(k)
    }
    // Pritisak miša na dugme VAN televizora (traka, prekidači, telefon, meni) ne uzima DOM fokus, pa strelice i Enter i dalje upravljaju
    // televizoru (PLAN B5.3). Rešeno centralno; poljima za kucanje demo ne raspolaže, a Tab/tastatura rade kao obično.
    const naMis = (e: MouseEvent) => {
      if (e.button !== 0 || !motor.imaStavki()) return
      const t = e.target as Element | null
      const dugme = t?.closest?.('button, a, label, input')
      if (dugme && !dugme.closest('[data-tv-oblast]') && !dugme.closest('.dijalog')) e.preventDefault()
    }
    document.addEventListener('keydown', naTaster)
    document.addEventListener('mousedown', naMis)
    return () => {
      document.removeEventListener('keydown', naTaster)
      document.removeEventListener('mousedown', naMis)
    }
  }, [motor, komanda])

  const vrednost = useMemo<FokusKontekst>(
    () => ({
      motor,
      komanda,
      postaviRukovaoce: (r) => {
        rukovaoci.current = r
      },
      pretplati: (f) => {
        slusaoci.current.add(f)
        return () => slusaoci.current.delete(f)
      },
      uzmi: () => stanje.current,
    }),
    [motor, komanda],
  )

  return <Kontekst.Provider value={vrednost}>{children}</Kontekst.Provider>
}

/** Omotač jednog TV ekrana: javlja motoru koji je ekran (ključ = ekran + parametar) i koji je početni izbor. */
export function TvEkran({ kljuc, pocetni, children }: { kljuc: string; pocetni?: PocetniIzbor; children: ReactNode }) {
  const { motor } = useTvMotor()
  const pocetniRef = useRef(pocetni)
  pocetniRef.current = pocetni
  useLayoutEffect(() => {
    motor.noviEkran(kljuc, () => {
      const p = pocetniRef.current
      return typeof p === 'function' ? p() : p
    })
  }, [motor, kljuc])
  return <>{children}</>
}

/** Prozor preko ekrana (panel, dijalog, poruka): fokus ne izlazi iz njega dok se ne zatvori; „Nazad“ ga zatvara. */
export function TvSloj({ id, onNazad, pocetni, children }: { id: string; onNazad?: () => void; pocetni?: PocetniIzbor; children: ReactNode }) {
  const { motor } = useTvMotor()
  const nazadRef = useRef(onNazad)
  nazadRef.current = onNazad
  const pocetniRef = useRef(pocetni)
  pocetniRef.current = pocetni
  useLayoutEffect(() => {
    motor.otvoriSloj(id, {
      onNazad: () => nazadRef.current?.(),
      pocetni: () => {
        const p = pocetniRef.current
        return typeof p === 'function' ? p() : p
      },
    })
    return () => motor.zatvoriSloj(id)
  }, [motor, id])
  return <SlojKontekst.Provider value={id}>{children}</SlojKontekst.Provider>
}

type TvFokusProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'onClick' | 'type' | 'tabIndex'> & {
  id: string
  /** Vodoravni red (kartice se pomeraju levo-desno po indeksu) i mesto u njemu. */
  red?: string
  indeks?: number
  /** Izričiti susedi: id elementa ili „nista“. */
  gore?: string
  dole?: string
  levo?: string
  desno?: string
  onemogucen?: boolean
  /** Tekst za „Izabrano: …“ (ako nije zadat, uzima se aria-label ili tekst elementa). */
  etiketa?: string
  /** OK / klik. */
  onAktiviraj?: () => void
  children?: ReactNode
}

/** Izborni element televizora: pravi <button> (čitač ekrana i axe rade), tabIndex -1 (TV se ne šeta tasterom Tab). */
export function TvFokus({ id, red, indeks, gore, dole, levo, desno, onemogucen, etiketa, onAktiviraj, className, children, ...ostalo }: TvFokusProps) {
  const { motor } = useTvMotor()
  const sloj = useContext(SlojKontekst)
  const ref = useRef<HTMLButtonElement>(null)
  const aktivirajRef = useRef(onAktiviraj)
  aktivirajRef.current = onAktiviraj
  const etiketaRef = useRef(etiketa)
  etiketaRef.current = etiketa

  useLayoutEffect(() => {
    const el = ref.current!
    return motor.registruj({
      id,
      sloj,
      red,
      indeks,
      gore,
      dole,
      levo,
      desno,
      onemogucen,
      get etiketa() {
        return etiketaRef.current ?? el.getAttribute('aria-label') ?? (el.textContent ?? '').trim()
      },
      rect: () => izmeri(el),
      aktiviraj: () => aktivirajRef.current?.(),
      prikaziIzabran: (da) => {
        if (da) {
          el.setAttribute('data-izabran', 'da')
          // DOM fokus samo ako ne otimamo fokus traci ili telefonu (do kojih se stiglo tasterom Tab).
          const a = document.activeElement
          if (!a || a === document.body || a.closest('[data-tv-oblast]')) el.focus({ preventScroll: true })
          osiguraVidljivost(el)
        } else el.removeAttribute('data-izabran')
      },
    })
  }, [motor, id, sloj, red, indeks, gore, dole, levo, desno, onemogucen])

  return (
    <button
      {...ostalo}
      ref={ref}
      type="button"
      tabIndex={-1}
      data-tv-id={id}
      data-tv-red={red}
      aria-disabled={onemogucen || undefined}
      className={`tv-fokus ${className ?? ''}`}
      onClick={() => motor.klik(id)}
    >
      {children}
    </button>
  )
}
