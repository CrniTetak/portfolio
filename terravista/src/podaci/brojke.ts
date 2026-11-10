// BROJKE za table V1 (Vesna) i M1 (platforma) — PLAN B3. Sve izmišljeno i nepromenljivo (isto u svim koracima).
// Iznosi u centima, prikaz kroz format.ts. Kanal vlasnice Vesne je izmišljen (FILMSKA_RIZNICA), pa brojke ne pripadaju stvarnoj firmi.
import { KODOVI_ZEMALJA, type KodZemlje } from './zemlje'
import { KANALI, type Deo } from './kanali'

// ---- V1: tabla vlasnice kanala
/** Gledalaca mesečno po zemlji (primer). Ključevi su ISTI kao zemlje u zemlje.ts. */
export const GLEDANOST: Record<KodZemlje, number> = { DE: 12480, AT: 3120, CH: 2640, GR: 860, RS: 5410 }
/** Mesečni prihod od reklama na izmišljenom kanalu (primer), u centima. */
export const PRIHOD_KANALA = 386000
/** Udeo kanala u prihodu od reklama (primer), u procentima. */
export const PODELA_KANALA = 60
/** Zemlje u kojima su prava za izmišljeni kanal „obezbeđena“ (primer). */
export const PRAVA_KANALA: Record<KodZemlje, boolean> = { DE: true, AT: true, CH: true, GR: true, RS: false }

// ---- M1: tabla platforme
export const PRIHOD_PO_DELOVIMA: Record<Deo, number> = { besplatni: 1200000, 'po-izboru': 500000, paket: 300000 }

export function ukupniPrihod(): number {
  return Object.values(PRIHOD_PO_DELOVIMA).reduce((a, b) => a + b, 0)
}
/** Udeo dela u ukupnom prihodu u celim procentima (podaci su odabrani tako da se udeli tačno sabiraju u 100). */
export function udeo(deo: Deo): number {
  return (PRIHOD_PO_DELOVIMA[deo] * 100) / ukupniPrihod()
}

export type StanjePrava = 'obezbedjeno' | 'delimicno' | 'nije'
export const DELOVI: readonly Deo[] = ['besplatni', 'po-izboru', 'paket']

/**
 * Pregled prava po DELU i ZEMLJI (ne po pravom kanalu): izvedeno iz dostupnosti kanala u kanali.ts.
 * „obezbedjeno“ = svi kanali dela rade u zemlji; „nije“ = nijedan; „delimicno“ = neki.
 */
export function pravaZaDeoIZemlju(deo: Deo, kod: KodZemlje): StanjePrava {
  const kanali = KANALI.filter((k) => k.deo === deo)
  const rade = kanali.filter((k) => !k.nedostupanU.includes(kod)).length
  if (rade === kanali.length) return 'obezbedjeno'
  return rade === 0 ? 'nije' : 'delimicno'
}

/** Matrica „deo × zemlja“ (3 × 5). */
export function matricaPrava(): Record<Deo, Record<KodZemlje, StanjePrava>> {
  const izlaz = {} as Record<Deo, Record<KodZemlje, StanjePrava>>
  for (const d of DELOVI) {
    izlaz[d] = {} as Record<KodZemlje, StanjePrava>
    for (const z of KODOVI_ZEMALJA) izlaz[d][z] = pravaZaDeoIZemlju(d, z)
  }
  return izlaz
}

/** Plan tržišta: pilot pa nova tržišta (KONCEPT, „Pilot i širenje“; primer). */
export const PLAN_TRZISTA: readonly string[] = [
  'Pilot: dijaspora iz bivše Jugoslavije u Nemačkoj, Austriji i Švajcarskoj',
  'Ista dijaspora u novim zemljama',
  'Nove dijaspore',
  'Domaća tržišta',
]
/** Merila pilota (nazivi merila; vrednosti nema jer demo ništa ne meri). */
export const MERILA_PILOTA: readonly string[] = [
  'Gledaoci mesečno',
  'Zadržavanje posle tri meseca',
  'Trošak po pretplatniku',
  'Broj vlasnika sadržaja koji su pristali',
]
