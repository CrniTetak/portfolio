// KORACI vođene priče (UX 3.2). U fazi 0: naslovi, uglovi i kartice. Radnje po koracima (pod-koraci) dolaze u talasu 1.
// Šabloni kartica su u tekstovi/kartice-price.ts (imena, kanali i cene se ubacuju iz podaci/).
import { popuni } from '../podaci/svet'
import { SABLONI_KARTICA } from '../tekstovi/kartice-price'

export type Ugao = 'gledalac' | 'kanal' | 'platforma'

export type Korak = {
  broj: number
  naslov: string
  ugao: Ugao
  /** Šablon kartice priče (2–3 rečenice). */
  kartica: string
}

export const BROJ_KORAKA = 9

const NASLOVI: readonly [string, Ugao][] = [
  ['Uključivanje', 'gledalac'],
  ['Besplatni kanal', 'gledalac'],
  ['Kanal po izboru', 'gledalac'],
  ['Pretplata', 'gledalac'],
  ['Paket za dijasporu', 'gledalac'],
  ['Putovanje', 'gledalac'],
  ['Otkaz', 'gledalac'],
  ['Vlasnica kanala', 'kanal'],
  ['Platforma', 'platforma'],
]

export const KORACI: readonly Korak[] = NASLOVI.map(([naslov, ugao], i) => ({ broj: i + 1, naslov, ugao, kartica: SABLONI_KARTICA[i] }))

export function korak(broj: number): Korak {
  const k = KORACI.find((x) => x.broj === broj)
  if (!k) throw new Error(`Nepoznat korak: ${broj}`)
  return k
}

/** Tekst kartice sa ubačenim podacima. */
export function karticaTekst(broj: number): string {
  return popuni(korak(broj).kartica)
}
