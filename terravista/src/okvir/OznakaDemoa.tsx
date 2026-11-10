// OZNAKA DEMOA — deo OKVIRA (ne ekrana), pa se ne može zaboraviti na novom ekranu (PLAN B6.2).
// Tekst je tačno iz stalni-tekstovi.ts (UX 2); ne zatvara se, ne skraćuje; na uskom ekranu prelazi u više redova.
import { OZNAKA_DEMOA } from '../podaci/stalni-tekstovi'
import { Info } from './Ikone'

export function OznakaDemoa() {
  return (
    <div className="oznaka-demoa" role="region" aria-label="Oznaka demoa" data-oznaka-demoa>
      <Info className="ic" aria-hidden="true" strokeWidth={2} />
      <span>{OZNAKA_DEMOA}</span>
    </div>
  )
}
