// SAGLASNOSTI I IZBORI KOJI PRATE RADNJE PRIČE (PLAN B5.11).
// Obavezne kvačice NISU unapred štiklirane. Kad traka priče („Dalje“, „Nazad“, skok) ili automatska radnja izvede korak umesto
// gledaoca, štikliraju se samo one čija je radnja time odrađena: ključ → id radnje koja ga traži. Opcione kvačice ovde nisu.
import { imaKljuc } from '../scenario/kljuc'
import { odradjene } from './koraci'
import type { Poz } from './tipovi'

/** Ključ kvačice ili izbora → radnja priče koja ga zahteva. */
export const SAGLASNOST_RADNJA: Record<string, string> = {
  r3_punoletstvo: '1.r3',
  r3_uslovi: '1.r3',
  x1_izbor: '4.x1',
  x2_razumem: '4.x2',
  d2_uslovi: '7.d2',
  z3_odmah_dostava: '7.z3',
}

/** Ključevi koje treba štiklirati kad se priča nađe na datoj poziciji (njihova radnja je odrađena). */
export function saglasnostiZa(poz: Poz): string[] {
  const gotovo = odradjene(poz)
  return Object.entries(SAGLASNOST_RADNJA)
    .filter(([, radnja]) => gotovo.has(radnja))
    .map(([kljuc]) => kljuc)
}

/**
 * Saglasnosti posle skoka ili koraka unazad (PK2): one vezane za radnje priče računaju se iznova iz pozicije
 * (skidaju se kad se vrati ispred svoje radnje), a ostale (slobodni tokovi) se čuvaju kakve jesu.
 */
export function saglasnostiPosle(stare: Record<string, boolean>, poz: Poz): Record<string, boolean> {
  const ostale = Object.fromEntries(Object.entries(stare).filter(([k]) => !imaKljuc(SAGLASNOST_RADNJA, k)))
  return { ...ostale, ...Object.fromEntries(saglasnostiZa(poz).map((k) => [k, true])) }
}
