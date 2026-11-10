// JEDINO MESTO PRIKAZA brojeva, iznosa, ocena i datuma (B3): „1.284“, „4,7“, „1.149 din“, „19. 10. 2026.“.
// Ekrani ne formatiraju ništa sami. Bez Intl i toLocaleString (isti rezultat u svakom pregledaču).
import type { Datum } from './datumi'

/** Celi broj sa tačkom za hiljade: 1284 → „1.284“. */
export const broj = (n: number): string => {
  const znak = n < 0 ? '−' : ''
  return znak + String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const din = (n: number): string => `${broj(n)} din`

/** Srpski oblik: 1 poen, 2–4 poena, 5–20 poena, 21 poen… */
export const poeni = (n: number): string => {
  const jedan = n % 10 === 1 && n % 100 !== 11
  return `${broj(n)} ${jedan ? 'poen' : 'poena'}`
}

/** Ocena na jednu decimalu sa zarezom, zaokruženo celobrojnom računicom (4,75 → 4,8). Bez recenzija: „—“. */
export function ocena(zbir: number, brojRecenzija: number): string {
  if (brojRecenzija === 0) return '—'
  const desetine = Math.floor((zbir * 20 + brojRecenzija) / (brojRecenzija * 2)) // najbliža desetina, .5 naviše
  return `${Math.floor(desetine / 10)},${desetine % 10}`
}

export const datum = (x: Datum): string => `${x.d}. ${x.m}. ${x.y}.`

/** Rastojanje: 2 → „2 km“. */
export const km = (n: number): string => `${broj(n)} km`

/** Kilogrami: 5 → „5 kg“. */
export const kg = (n: number): string => `${broj(n)} kg`

/** Jedna decimala iz prosečne ocene (0–5) u ceo broj zvezdica za crtanje (zaokruženo, bez decimala). */
export const zvezdice = (zbir: number, brojRecenzija: number): number => (brojRecenzija === 0 ? 0 : Math.round(zbir / brojRecenzija))

/** Procenat iz desetina procenta: 22 → „2,2%“ (klikovi / prikazi u pregledu rezultata). */
export const procenat = (desetine: number): string => `${Math.floor(desetine / 10)},${desetine % 10}%`
