// Sve priče zajednice za traku na početnoj (P1) i ekran P8: najpre priče koje je gledalac objavio (P9), pa šest unapred pripremljenih.
import { STORIJE } from '../../scenario/prica'
import { AUTORI_PRICA } from '../../scenario/slobodno'
import type { Tokovi } from '../../tokovi/tokovi'

export type Storija = { id: string; naslov: string; ikonica: string; tekst: string; autor: string }

export function storije(tokovi: Tokovi): Storija[] {
  const moje = tokovi.price.map((p, i) => ({ id: `moja-${i + 1}`, naslov: 'Tvoja priča', ikonica: 'apple', tekst: p.tekst, autor: p.k }))
  return [...moje, ...STORIJE.map((p) => ({ ...p, autor: AUTORI_PRICA[p.id] ?? '' }))]
}
