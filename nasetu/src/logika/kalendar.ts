// B7 — Kalendar vlasnika: unapred zauzeti dani (izdati van Nasetua) + dani koje vlasnik sam blokira.
// JEDINO mesto koje spaja ta dva spiska; sve provere termina dobijaju spisak odavde (ne iz lokacija.zauzeti direktno).
import type { Lokacija } from '../podaci/lokacije'
import { jeZiva } from './opcije'
import { stanjeZahteva } from './rezervacije'
import { daniTermina } from './termini'
import { danasIso } from './vreme'
import type { Opcija, Zahtev } from './tipovi'

/** Svi dani koji su za lokaciju zatvoreni: unapred zauzeti + blokirani od vlasnika. */
export function zauzetiDani(l: Lokacija, blokirani: Record<string, string[]>): string[] {
  return [...l.zauzeti, ...(blokirani[l.id] ?? [])]
}

export interface OdlukaBlokade { moze: boolean; razlog: string | null }

/**
 * Vlasnik sme da blokira slobodan dan. Ne sme dan koji je već zauzet van Nasetua, ni dan na kome postoji
 * opcija, zahtev na čekanju ili rezervacija (odluka O17) — prvo se rešava ta stavka.
 */
export function mozeLiBlokirati(p: {
  l: Lokacija; dan: string; blokirani: Record<string, string[]>; opcije: Opcija[]; zahtevi: Zahtev[]; sada: number
}): OdlukaBlokade {
  const { l, dan, blokirani, opcije, zahtevi, sada } = p
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dan) || Number.isNaN(Date.parse(dan + 'T00:00:00Z')) || new Date(dan + 'T00:00:00Z').toISOString().slice(0, 10) !== dan) {
    return { moze: false, razlog: 'Neispravan datum.' }
  }
  if (dan < danasIso(sada)) return { moze: false, razlog: 'Dan je u prošlosti.' }
  if (l.zauzeti.includes(dan)) return { moze: false, razlog: 'Dan je zauzet van Nasetua (izmišljeno) i ne može se menjati.' }
  if ((blokirani[l.id] ?? []).includes(dan)) return { moze: false, razlog: 'Dan je već blokiran.' }
  if (opcije.some((o) => o.lokacijaId === l.id && jeZiva(o, sada) && daniTermina(o.termin).includes(dan))) {
    return { moze: false, razlog: 'Na ovaj dan postoji opcija.' }
  }
  const zahtev = zahtevi.find(
    (z) => z.lokacijaId === l.id && daniTermina(z.termin).includes(dan) && ['ceka', 'odobren'].includes(stanjeZahteva(z, sada)))
  if (zahtev) return { moze: false, razlog: zahtev.stanje === 'odobren' ? 'Na ovaj dan postoji rezervacija.' : 'Na ovaj dan postoji zahtev na čekanju.' }
  return { moze: true, razlog: null }
}
