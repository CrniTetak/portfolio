// Okvir TV ekrana: gornja traka (osim na ekranima gledanja) + sadržaj koji se po redovima pomera uspravno.
import type { ReactNode } from 'react'
import { GornjaTraka } from './GornjaTraka'

export function TvStrana({ id, trenutni, pun = false, children }: { id: string; trenutni?: string; pun?: boolean; children: ReactNode }) {
  return (
    <div className="tv-ekran" data-ekran={id}>
      {!pun && <GornjaTraka trenutni={trenutni ?? ''} />}
      <div className={`tv-sadrzaj ${pun ? 'tv-sadrzaj--pun' : ''}`} data-tv-skrol="y">
        {children}
      </div>
    </div>
  )
}

/** Jedna grupa (red) ekrana: ekran se pomera po grupama (data-tv-grupa). */
export function TvGrupa({ children, klasa = '' }: { children: ReactNode; klasa?: string }) {
  return (
    <section className={`tv-grupa ${klasa}`} data-tv-grupa>
      {children}
    </section>
  )
}
