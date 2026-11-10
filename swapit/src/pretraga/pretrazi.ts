// Pretraga oglasa demoa (PLAN B4.5). Čista funkcija nad listom oglasa iz svet(): ne menja stanje, ne zove mrežu.
// Oglas odgovara ako SVAKA reč upita (ili njen sinonim) počinje neka reč iz: naslov + kategorija + vrsta + opština + grad.
// Padeži se ne rešavaju (samo početak reči): „bicikl“ nalazi „bicikla“, ali „bicikla“ ne nalazi „bicikl“ (osim preko sinonima).
import { KATEGORIJA_PO_ID } from '../scenario/kategorije'
import type { Oglas } from '../scenario/oglasi'
import { OPSTINA_PO_ID } from '../scenario/opstine'
import { NAJVISE_ZNAKOVA, reci } from './normalizuj'
import { SINONIMI } from './sinonimi'

/** Upit se skraćuje na 40 znakova. */
export const ogranici = (upit: string): string => upit.slice(0, NAJVISE_ZNAKOVA)

function spojReci(o: Oglas): string[] {
  const kat = KATEGORIJA_PO_ID[o.kat]?.naziv ?? ''
  const opstina = o.opstina ? OPSTINA_PO_ID[o.opstina].naziv : ''
  return reci([o.naslov, kat, o.vrsta, opstina, o.grad].join(' '))
}

/** Reči upita sa alternativama (sinonimi). Prazan upit daje praznu listu. */
export function reciUpita(upit: string): string[][] {
  return reci(ogranici(upit)).map((r) => [r, ...(SINONIMI[r] ?? [])])
}

export function odgovara(o: Oglas, upit: string): boolean {
  const trazene = reciUpita(upit)
  if (trazene.length === 0) return false
  const spoj = spojReci(o)
  return trazene.every((alt) => alt.some((a) => spoj.some((r) => r.startsWith(a))))
}

/** D3: upit se poklapa sa NASLOVOM ili OPISOM oglasa (ne preko kategorije, vrste ni opštine). Po ovome se bira red „Istaknuto · plaćeno“ na P5. */
export function odgovaraTekstu(o: Oglas, upit: string): boolean {
  const trazene = reciUpita(upit)
  if (trazene.length === 0) return false
  const spoj = reci([o.naslov, o.opis].join(' '))
  return trazene.every((alt) => alt.some((a) => spoj.some((r) => r.startsWith(a))))
}

/**
 * Rezultati pretrage: najviše 2 istaknuta oglasa čiji naslov ili opis odgovara upitu idu prvi (P5, D3), ostali ostaju u redosledu ulaza.
 * Prazan upit nema rezultata (P5 tada pokazuje prazno stanje).
 */
export function pretrazi(oglasi: Oglas[], upit: string): Oglas[] {
  const nadjeni = oglasi.filter((o) => odgovara(o, upit))
  const istaknuti = nadjeni.filter((o) => o.istaknuto && odgovaraTekstu(o, upit)).slice(0, 2)
  const ostali = nadjeni.filter((o) => !istaknuti.includes(o))
  return [...istaknuti, ...ostali]
}
