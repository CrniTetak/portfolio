// B6 — Objava lokacije: kontrolna lista za admina i pretvaranje odobrene prijave u lokaciju koja ulazi u katalog.
// Ograničen obim (odluka O14): odobrena lokacija se vidi u katalogu i ima svoju stranu, ali se u prototipu ne rezerviše.
import { LOKACIJE, grupisiTehnicki, POLJA_TEHNICKOG, TIPOVI, type Lokacija } from '../podaci/lokacije'
import { MIN_FOTOGRAFIJA_ZA_OBJAVU } from './konstante'
import type { Razred } from './novac'
import type { PrijavaLokacije } from './tipovi'

/** Provera nacrta lokacije iz obrasca: vraća poruku na običnom jeziku ili null kad je sve u redu (koriste je i obrazac i reducer). */
export function proveriNacrtLokacije(p: {
  naziv: string; opstina: string; kvadratura: number
  cenovnik: { do10: number | null; do30: number | null; preko30: number | null; satiDana: number; pripremaCenti: number; prekovremeniCenti: number }
}): string | null {
  const c = p.cenovnik
  if (!p.naziv.trim()) return 'Unesite naziv lokacije.'
  if (!p.opstina.trim()) return 'Unesite opštinu.'
  if (!Number.isFinite(p.kvadratura) || !(p.kvadratura > 0)) return 'Kvadratura mora biti veća od nule.'
  const cene = [c.do10, c.do30, c.preko30]
  if (cene.some((x) => x !== null && !(Number.isFinite(x) && x > 0))) return 'Cene moraju biti brojevi veći od nule.'
  if (cene.every((x) => x === null)) return 'Unesite cenu snimajućeg dana za bar jednu veličinu ekipe.'
  if (!Number.isFinite(c.satiDana) || !(c.satiDana > 0) || c.satiDana > 24) return 'Broj sati snimajućeg dana mora biti od 1 do 24.'
  if (!Number.isFinite(c.pripremaCenti) || c.pripremaCenti < 0) return 'Cena dana pripreme ne može biti negativna.'
  if (!Number.isFinite(c.prekovremeniCenti) || c.prekovremeniCenti < 0) return 'Cena prekovremenog sata ne može biti negativna.'
  return null
}

export interface StavkaListe {
  naziv: string
  ispunjeno: boolean
}

/** Tri uslova iz blueprinta: tehnički list, najmanje 10 fotografija i dokaz prava na izdavanje (računa se iz prijave). */
export function kontrolnaLista(p: PrijavaLokacije): StavkaListe[] {
  return [
    { naziv: 'Tehnički list popunjen', ispunjeno: POLJA_TEHNICKOG.every((f) => (p.tehnicki[f.kljuc] ?? '').trim().length > 0) },
    { naziv: `Najmanje ${MIN_FOTOGRAFIJA_ZA_OBJAVU} fotografija (u prototipu: ${p.brojFotografija})`, ispunjeno: p.brojFotografija >= MIN_FOTOGRAFIJA_ZA_OBJAVU },
    { naziv: 'Dokaz prava na izdavanje', ispunjeno: p.dokaz.trim().length > 0 },
  ]
}

/** "Odobri objavu" je moguće samo za prijavu na čekanju kojoj su ispunjena sva tri uslova. */
export function mozeLiObjaviti(p: PrijavaLokacije): { moze: boolean; razlog: string | null } {
  if (p.stanje !== 'ceka') return { moze: false, razlog: 'Prijava je već rešena.' }
  const fale = kontrolnaLista(p).filter((s) => !s.ispunjeno)
  if (fale.length > 0) {
    return { moze: false, razlog: p.izvor === 'partner' && !p.dokaz ? 'Preporuka čeka dopunu vlasnika (tehnički list, fotografije, dokaz).' : `Nedostaje: ${fale.map((s) => s.naziv.split(' (')[0].toLowerCase()).join(', ')}.` }
  }
  return { moze: true, razlog: null }
}

/** Lokacija iz objavljene prijave: nema fotografije, nema unapred zauzetih dana, nema adrese. */
export function lokacijaIzPrijave(p: PrijavaLokacije): Lokacija {
  const cene: Partial<Record<Razred, number>> = {}
  if (p.cenovnik.do10) cene.do10 = p.cenovnik.do10
  if (p.cenovnik.do30) cene.do30 = p.cenovnik.do30
  if (p.cenovnik.preko30) cene.preko30 = p.cenovnik.preko30
  const kapacitet: Razred = cene.preko30 ? 'preko30' : cene.do30 ? 'do30' : 'do10'
  const tip = (TIPOVI as readonly string[]).includes(p.tip) ? (p.tip as Lokacija['tip']) : TIPOVI[0]
  const osnovno = { tip, kvadratura: p.kvadratura, opstina: p.opstina, zona: 'nova lokacija (izmišljeno)', stilovi: [] as string[] }
  return {
    id: `nova-${p.id}`, naziv: p.naziv, ...osnovno,
    opis: 'Lokacija dodata u prototipu (izmišljeno). Nema fotografija; u pravoj aplikaciji se objavljuje tek sa najmanje 10 fotografija.',
    kapacitet, vlasnikId: p.vlasnikId || 'nepoznat', cene, cenaPripremeCenti: p.cenovnik.pripremaCenti,
    satiSnimajucegDana: p.cenovnik.satiDana, prekovremeniSatCenti: p.cenovnik.prekovremeniCenti,
    najkrace: p.cenovnik.najkrace || '—', posebniTroskovi: p.cenovnik.troskovi || '—',
    tehnicki: grupisiTehnicki(osnovno, p.tehnicki), oznake: [], zauzeti: [], istaknuto: false, nova: true,
  }
}

/** Sve lokacije u katalogu: 10 izmišljenih + objavljene prijave. */
export function lokacijeIzKataloga(prijave: PrijavaLokacije[]): Lokacija[] {
  return [...LOKACIJE, ...prijave.filter((p) => p.stanje === 'objavljena').map(lokacijaIzPrijave)]
}
