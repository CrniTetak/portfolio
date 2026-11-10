// UKLOPI — uređaj (platno u zadatoj veličini) umanjen JEDNIM faktorom da stane u raspoloživi prostor (PLAN B4.5).
// Faktor se meri ResizeObserver-om i postavlja kroz CSSOM (React style), što CSP „style-src 'self'“ ne blokira (proverava se u fazi 0).
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Velicina } from './mere'

type Svojstva = {
  baza: Velicina
  tip: 'tv' | 'tel'
  /** Zbir ramova (obe strane) koji se oduzima od raspoloživog prostora. */
  ram: number
  /** Skala se računa samo iz širine (televizor uspravno na telefonu: slika 16 : 9 preko cele širine). */
  poSirini?: boolean
  /** Bez ramova i okvira (televizor preko celog ekrana na telefonu). */
  bezRama?: boolean
  osvetli?: boolean
  naslov?: string
  oblast?: boolean
  children: ReactNode
}

export function Uklopi({ baza, tip, ram, poSirini, bezRama, osvetli, naslov, oblast, children }: Svojstva) {
  const ref = useRef<HTMLDivElement>(null)
  const [skala, setSkala] = useState(0) // dok se prostor ne izmeri, uređaj je skriven (nema „skoka“ sa pogrešne veličine)
  const ramEfektivno = bezRama ? 0 : ram

  useLayoutEffect(() => {
    const el = ref.current!
    const izracunaj = () => {
      const r = el.getBoundingClientRect()
      const s = poSirini
        ? (r.width - ramEfektivno) / baza.sirina
        : Math.min((r.width - ramEfektivno) / baza.sirina, (r.height - ramEfektivno) / baza.visina)
      if (Number.isFinite(s) && s > 0) setSkala(s)
    }
    izracunaj()
    const ro = new ResizeObserver(izracunaj)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baza.sirina, baza.visina, ramEfektivno, poSirini])

  const w = Math.floor(baza.sirina * skala)
  const h = Math.floor(baza.visina * skala)
  const klasaOkvira = bezRama ? 'okvir-uredjaja' : `okvir-uredjaja okvir-uredjaja--${tip}${osvetli ? ' okvir-uredjaja--sija' : ''}`
  return (
    <div className="uklopi" ref={ref}>
      <div
        className={klasaOkvira}
        style={{ visibility: skala > 0 ? 'visible' : 'hidden', width: w + ramEfektivno, height: h + ramEfektivno, border: bezRama ? 0 : undefined, padding: bezRama ? 0 : undefined, background: bezRama ? 'transparent' : undefined }}
        data-tv-oblast={oblast ? '' : undefined}
        role={naslov ? 'region' : undefined}
        aria-label={naslov}
        data-skala={skala.toFixed(4)}
      >
        <div className={`uklopljeno uklopljeno--${tip}`} style={{ width: w, height: h }}>
          <div className="platno" style={{ width: baza.sirina, height: baza.visina, transform: `scale(${skala})` }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
