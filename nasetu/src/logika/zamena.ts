// B5 — Zamenska lokacija kad vlasnik otkaže plaćenu rezervaciju (odluka O9).
// Redosled: (1) lokacija istog tipa; (2) lokacija tipa iz briefa te rezervacije. Mora da prima veličinu ekipe i da je slobodna
// u terminu (unapred zauzeti + blokirani dani + odobrene rezervacije). Tuđe opcije NE blokiraju, ali se lokacija bez opcija nudi prva.
// Najviše 2 predloga; ako nema nijedne, Nasetu šalje novi izbor.
import type { Lokacija } from '../podaci/lokacije'
import { jeZiva } from './opcije'
import { preklapaju, proveriTermin } from './termini'
import type { Opcija, Zahtev } from './tipovi'

export const NAJVISE_ZAMENA = 2

export function zamenskeLokacije(p: {
  katalog: Lokacija[]
  zahtev: Zahtev
  /** tipovi prostora iz briefa te rezervacije (npr. Loft, Hala, Studio) */
  tipoviBriefa: string[]
  sviZahtevi: Zahtev[]
  opcije: Opcija[]
  /** zatvoreni dani lokacije (unapred zauzeti + blokirani) */
  zauzetiDani: (l: Lokacija) => string[]
  sada: number
}): Lokacija[] {
  const { katalog, zahtev, tipoviBriefa, sviZahtevi, opcije, sada } = p
  const original = katalog.find((l) => l.id === zahtev.lokacijaId)
  const kandidati = katalog.filter(
    (l) => l.id !== zahtev.lokacijaId && !l.nova && l.cene[zahtev.razred] != null &&
      proveriTermin(l.id, zahtev.termin, sviZahtevi, p.zauzetiDani(l)).slobodan)
  const tudjeOpcije = (l: Lokacija) =>
    opcije.some((o) => o.lokacijaId === l.id && jeZiva(o, sada) && preklapaju(o.termin, zahtev.termin))
  // grupa 0 = isti tip, grupa 1 = tip iz briefa; ostali tipovi se ne nude. Unutar grupe lokacija bez tuđih opcija ide prva,
  // pa redosled kataloga.
  const grupa = (l: Lokacija) => (original && l.tip === original.tip ? 0 : tipoviBriefa.includes(l.tip) ? 1 : 2)
  return kandidati
    .filter((l) => grupa(l) < 2)
    .map((l, i) => ({ l, i }))
    .sort((a, b) => grupa(a.l) - grupa(b.l) || Number(tudjeOpcije(a.l)) - Number(tudjeOpcije(b.l)) || a.i - b.i)
    .slice(0, NAJVISE_ZAMENA)
    .map(({ l }) => l)
}
