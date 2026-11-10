// SAMO ZA TESTOVE: spisak svih ispravnih pozicija i podrazumevane postavke prikaza.
import { radnjeKoraka } from './koraci'
import type { Postavke } from './izgradi'
import { BROJ_KORAKA, type Grana, type Pozicija } from './tipovi'

export const POSTAVKE: Postavke = { uloga: 'produkcija', prikazVlasnika: 'pravno', demoSakriven: false, rezim: 'vodjeno', vidjenUvodSlobodno: false }

export function svePozicije(): Pozicija[] {
  const lista: Pozicija[] = []
  for (const grana of ['vazi', 'otkaz'] as Grana[]) {
    for (let korak = 1; korak <= BROJ_KORAKA; korak++) {
      if (grana === 'otkaz' && korak < 9) continue
      const n = radnjeKoraka(korak, grana).length
      for (let odradjeno = 0; odradjeno <= n; odradjeno++) lista.push({ korak, odradjeno, grana })
    }
  }
  return lista
}
