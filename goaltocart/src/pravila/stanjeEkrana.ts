// Stanje ekrana u odnosu na priču (UX.md 1.2 i 1.6):
//  - 'nije-pocelo'  = korak kom ekran pripada tek dolazi ("Not started yet"),
//  - 'u-toku'       = ekran je u svom koraku, a korak nije završen,
//  - 'zavrseno'     = korak je završen ili prošao (istorija),
//  - 'uvek'         = ekran nema "svoj" korak (tabla, pregled, odobrenja...), uvek je živ.
import { sveCelije } from './matrica'
import { brojRadnji } from '../prica/reducer'
import type { EkranId, Pozicija, Uloga } from '../prica/tipovi'

export type StanjeEkrana = 'nije-pocelo' | 'u-toku' | 'zavrseno' | 'uvek'

/** Ekrani koji su uvek "živi" (nemaju stanje "Not started yet") čak i ako se pojavljuju u tabeli 4.0. */
const UVEK_ZIVI = new Set<EkranId>([
  'C1', 'C2', 'C3',
  'S1', 'S2', 'S12', 'S13', 'SP',
  'B1', 'B2', 'B10', 'B11', 'BP',
  'P1', 'P3', 'P7', 'P8', 'A1', 'A6', 'A7', 'F1', 'F2', 'F7',
])

/** Prvi korak (u grani Approved) u kom se ekran pojavljuje za datu ulogu. */
function prviKorak(ekran: EkranId, uloga: Uloga): number | null {
  const sve = sveCelije().filter((x) => x.grana === 'approved' && x.uloga === uloga && x.celija.ekrani.includes(ekran))
  return sve.length ? Math.min(...sve.map((x) => x.korak)) : null
}

export function stanjeEkrana(ekran: EkranId, uloga: Uloga, poz: Pozicija): StanjeEkrana {
  if (UVEK_ZIVI.has(ekran)) return 'uvek'
  const k0 = prviKorak(ekran, uloga)
  if (k0 === null) return 'uvek'
  if (poz.korak < k0) return 'nije-pocelo'
  if (poz.korak === k0) return poz.odradjeno >= brojRadnji(poz) ? 'zavrseno' : 'u-toku'
  return 'zavrseno'
}

/** Korak u kom ekran "nastaje" (za tekst "Available at step N" u praznom stanju). */
export function korakEkrana(ekran: EkranId, uloga: Uloga): number | null {
  return prviKorak(ekran, uloga)
}
