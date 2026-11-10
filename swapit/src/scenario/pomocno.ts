// Pomoćne funkcije samo za testove: sve pozicije priče i pozicija „kraj koraka“. Ne uvozi se iz aplikacije.
import { brojRadnji } from '../prica/koraci'
import type { Grana, Poz } from '../prica/tipovi'

/** Sve moguće pozicije (obe grane; grana „poeni“ postoji tek od koraka 6). */
export function svePozicije(): Poz[] {
  const izlaz: Poz[] = []
  for (const grana of ['lanac', 'poeni'] as Grana[])
    for (let korak = 1; korak <= 9; korak++) {
      if (grana === 'poeni' && korak < 6) continue
      for (let n = 0; n <= brojRadnji(korak, grana); n++) izlaz.push({ korak, n, grana })
    }
  return izlaz
}

export const zavrsno = (korak: number, grana: Grana = 'lanac'): Poz => ({ korak, n: brojRadnji(korak, grana), grana })
export const pocetno = (korak: number, grana: Grana = 'lanac'): Poz => ({ korak, n: 0, grana })
