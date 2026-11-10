// RED (grupa) televizora: naslov + vodoravna traka kartica. Red se pomera levo-desno kad izabrana kartica ne stane (skrol.ts),
// a ekran se pomera po redovima (data-tv-grupa). Kartice u redu dobijaju red= i indeks= (levo-desno ide po indeksu).
// Ivica na kojoj ima još kartica meko bledi (maska), da se kartica koja „viri“ čita kao nastavak.
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { azurirajMasku } from '../../tv-navigacija/skrol'

export function Red({ naslov, napomena, children }: { naslov: string; napomena?: string; children: ReactNode }) {
  const okno = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = okno.current
    if (!el) return
    azurirajMasku(el)
    const ro = new ResizeObserver(() => azurirajMasku(el))
    ro.observe(el)
    return () => ro.disconnect()
  })
  return (
    <section className="tv-grupa" data-tv-grupa>
      <h3 className="tv-naslov-reda">
        {naslov}
        {napomena && <small>{napomena}</small>}
      </h3>
      <div className="tv-red-okno" data-tv-skrol="x" ref={okno}>
        <div className="tv-red">{children}</div>
      </div>
    </section>
  )
}
