// ČUVANJE (PLAN B4.1): jedan ključ sa verzijom u sessionStorage; pri učitavanju provera verzije i oblika.
// Neispravan ili star zapis se odbacuje i kreće se od početka. Nema localStorage-a ni kolačića; zatvaranjem prozora sve se briše.
import { KLJUC_CUVANJA } from '../podaci/podesavanja'
import { BROJ_KORAKA_PRICE, duzina } from './matrica'
import { POCETAK } from './navigacija'
import type { Grana } from '../podaci/svet'
import { POCETNI_SLOJ, type SlobodniSloj } from '../slobodno/slobodno'
import { KODOVI_ZEMALJA } from '../podaci/zemlje'

export type Sacuvano = {
  verzija: 1
  korak: number
  p: number
  grana: Grana
  rezim: 'vodjena' | 'slobodno'
  /** Kartica „Kako se upravlja“ je već prikazana (jednokratno, do Restarta). */
  kakoViđeno: boolean
  /** Slobodni sloj (pretplate van priče, podešavanja, ručna zemlja): ne briše se osvežavanjem. */
  sloj: SlobodniSloj
}

export const POCETNO_SACUVANO: Sacuvano = { verzija: 1, korak: POCETAK.korak, p: POCETAK.p, grana: 'grcka', rezim: 'vodjena', kakoViđeno: false, sloj: POCETNI_SLOJ }

/** Slobodni sloj: nedostajući ili neispravan deo se zamenjuje početnim (nikad greška). */
export function proveriSloj(sirovo: unknown): SlobodniSloj {
  if (typeof sirovo !== 'object' || sirovo === null) return POCETNI_SLOJ
  const z = sirovo as Record<string, unknown>
  const operacije = Array.isArray(z.operacije)
    ? z.operacije.filter((o): o is { tip: 'pretplati' | 'otkazi'; proizvod: string } => typeof o === 'object' && o !== null && ((o as { tip?: unknown }).tip === 'pretplati' || (o as { tip?: unknown }).tip === 'otkazi') && typeof (o as { proizvod?: unknown }).proizvod === 'string')
    : []
  const bool = (v: unknown, r: boolean) => (typeof v === 'boolean' ? v : r)
  return {
    operacije,
    titlovi: bool(z.titlovi, POCETNI_SLOJ.titlovi),
    velicinaTitlova: z.velicinaTitlova === 'mali' || z.velicinaTitlova === 'srednji' || z.velicinaTitlova === 'veliki' ? z.velicinaTitlova : POCETNI_SLOJ.velicinaTitlova,
    roditeljska: bool(z.roditeljska, POCETNI_SLOJ.roditeljska),
    uzrast: z.uzrast === '6+' || z.uzrast === '12+' || z.uzrast === '16+' || z.uzrast === '18+' ? z.uzrast : POCETNI_SLOJ.uzrast,
    obavestenja: bool(z.obavestenja, POCETNI_SLOJ.obavestenja),
    personalizovane: bool(z.personalizovane, POCETNI_SLOJ.personalizovane),
    zemlja: typeof z.zemlja === 'string' && (KODOVI_ZEMALJA as readonly string[]).includes(z.zemlja) ? (z.zemlja as SlobodniSloj['zemlja']) : null,
  }
}

/** Prihvata samo ispravan zapis; sve ostalo → null. */
export function proveri(sirovo: unknown): Sacuvano | null {
  if (typeof sirovo !== 'object' || sirovo === null) return null
  const z = sirovo as Record<string, unknown>
  if (z.verzija !== 1) return null
  if (z.grana !== 'grcka' && z.grana !== 'srbija') return null
  if (z.rezim !== 'vodjena' && z.rezim !== 'slobodno') return null
  if (typeof z.kakoViđeno !== 'boolean') return null
  if (!Number.isInteger(z.korak) || !Number.isInteger(z.p)) return null
  const korak = z.korak as number
  const p = z.p as number
  if (korak < 1 || korak > BROJ_KORAKA_PRICE) return null
  if (p < 0 || p > duzina(korak, z.grana)) return null
  return { verzija: 1, korak, p, grana: z.grana, rezim: z.rezim, kakoViđeno: z.kakoViđeno, sloj: proveriSloj(z.sloj) }
}

/** sessionStorage može da baci SecurityError već pri pristupu (blokirano skladište): zato je i sam pristup u try/catch. */
function uzmiSkladiste(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function ucitaj(skladiste?: Pick<Storage, 'getItem'> | null): Sacuvano {
  try {
    const s = skladiste === undefined ? uzmiSkladiste() : skladiste
    const t = s?.getItem(KLJUC_CUVANJA)
    if (!t) return POCETNO_SACUVANO
    return proveri(JSON.parse(t)) ?? POCETNO_SACUVANO
  } catch {
    return POCETNO_SACUVANO
  }
}

export function sacuvaj(z: Sacuvano, skladiste?: Pick<Storage, 'setItem'> | null): void {
  try {
    const s = skladiste === undefined ? uzmiSkladiste() : skladiste
    s?.setItem(KLJUC_CUVANJA, JSON.stringify(z))
  } catch {
    /* privatni režim ili pun prostor: demo radi i bez čuvanja */
  }
}

