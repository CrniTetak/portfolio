// Vrednosti IZVEDENE iz pozicije u priči (čist TypeScript): faze, statusi rata, odobrenja, aktivnost, tačke igrača.
// Ekrani ovo koriste umesto da sami računaju, da dva ekrana nikad ne pokažu različito stanje.
import { radnjeKoraka, putanja, nazivKoraka } from '../prica/koraci'
import { brojRadnji, redniBroj } from '../prica/reducer'
import type { Pozicija, Uloga } from '../prica/tipovi'
import { datumKoraka, DATUM } from '../scenario/datumi'
import { RATE } from '../scenario/uslovi'
import { fiksniUkupno } from '../scenario/racun'
import { jeUradjeno } from './radnje'

export type FazaKoraka = 'buduci' | 'tekuci' | 'zavrsen'

/** Faza koraka k u odnosu na trenutnu poziciju. Korak bez radnji (Rejected 8) je odmah završen kad se stigne do njega. */
export function fazaKoraka(poz: Pozicija, k: number): FazaKoraka {
  if (poz.korak < k) return 'buduci'
  if (poz.korak > k) return 'zavrsen'
  return poz.odradjeno >= brojRadnji(poz) ? 'zavrsen' : 'tekuci'
}

/** Da li je korak započet (tekući ili završen). */
export const jeZapocet = (poz: Pozicija, k: number) => fazaKoraka(poz, k) !== 'buduci'
export const jeZavrsen = (poz: Pozicija, k: number) => fazaKoraka(poz, k) === 'zavrsen'

/** Da li je radnja (po id-u) odrađena. */
export const gotovo = (poz: Pozicija, id: string) => jeUradjeno(id, poz)

/** Koliko radnji iz niza id-eva je odrađeno. */
export const brojGotovih = (poz: Pozicija, ids: string[]) => ids.filter((id) => jeUradjeno(id, poz)).length

// ------------------------------------------------------------------ rate
export type StatusRate = 'scheduled' | 'secured' | 'paid' | 'assigned' | 'paid-financier' | 'overdue' | 'void'

/** Status rate 1-3 u datoj poziciji (isti za sve ekrane koji prikazuju rate). */
export function statusRate(n: 1 | 2 | 3, poz: Pozicija): StatusRate {
  if (odbijeno(poz)) return 'void'
  if (n === 1) {
    if (gotovo(poz, 'p1')) return 'paid'
    if (gotovo(poz, 'e4')) return 'secured'
    return 'scheduled'
  }
  if (n === 2) {
    if (gotovo(poz, 'f8')) return gotovo(poz, 'f5') ? 'paid-financier' : 'paid'
    if (gotovo(poz, 'f5')) return 'assigned'
    return 'scheduled'
  }
  // rata 3
  if (poz.korak >= 9) return 'overdue'
  if (gotovo(poz, 'f5')) return 'assigned'
  return 'scheduled'
}

/** Dani kašnjenja rate 3 u koraku 9: 14 pa 28 (UX 7.10). */
export function daniKasnjenja(poz: Pozicija): number | null {
  // Kašnjenje postoji samo u glavnoj priči (korak 9, Approved). U grani Rejected nema rata, a odbijeno(poz) važi od 6/završno,
  // pa je ovde dovoljna provera grane: kašnjenje je null na svakoj poziciji koju odbijeno(poz) označava, jer je korak 9 jedini koji ga daje.
  if (poz.korak < 9 || poz.grana === 'rejected') return null
  return poz.odradjeno >= 1 ? 28 : 14
}

/** Ponuda je prihvaćena tek kad prodavac izvede "Accept" (o3); do tada su uslovi samo predlog. */
export const ponudaPrihvacena = (poz: Pozicija) => gotovo(poz, 'o3')

/** Broj poslatih verzija ponude (v1 -> v3). */
export const brojVerzija = (poz: Pozicija) => 1 + (gotovo(poz, 'o1') ? 1 : 0) + (gotovo(poz, 'o2') ? 1 : 0)

// ------------------------------------------------------------------ grana Rejected (povraćaj kupcu)
/**
 * JEDINA provera "registracija je odbijena" (ITC refused). Važi od 6/završno (kad su oba kluba uneli paket) pa nadalje,
 * na SVIM ekranima i za sve uloge. Ekrani NE proveravaju ručno grana === 'rejected' && korak >= 7.
 */
export function odbijeno(poz: Pozicija): boolean {
  return poz.grana === 'rejected' && (poz.korak > 6 || gotovo(poz, 'm2'))
}

export type FazaPovracaja = 'nije' | 'odbijeno' | 'pokrenut' | 'vracen' | 'potvrdjen' | 'arhiviran'

/** Faza povraćaja u grani Rejected: ITC odbijen -> povraćaj pokrenut -> vraćeno -> potvrđeno -> dokazi arhivirani. */
export function fazaPovracaja(poz: Pozicija): FazaPovracaja {
  if (!odbijeno(poz)) return 'nije'
  if (poz.korak === 6) return 'odbijeno'
  if (poz.korak === 7) return gotovo(poz, 'rf1') ? 'vracen' : 'pokrenut'
  if (poz.korak === 8) return 'vracen'
  return gotovo(poz, 'rc1') ? 'arhiviran' : 'potvrdjen'
}

/** Otvoreni iznos iz ugla prodavca: koliko mu se još duguje (prodata potraživanja se ne računaju). */
export function otvoreniProdavca(poz: Pozicija): number {
  if (odbijeno(poz)) return 0 // povraćaj kupcu: prodavcu se ništa ne duguje
  if (gotovo(poz, 'f5')) return 0
  if (gotovo(poz, 'p1')) return RATE[1] + RATE[2]
  return fiksniUkupno
}

/** Iznos koji kupac još duguje (fiksni deo, bez provizije i naknade). */
export function otvoreniKupca(poz: Pozicija): number {
  if (odbijeno(poz)) return 0
  if (gotovo(poz, 'f8')) return RATE[2]
  if (gotovo(poz, 'p1')) return RATE[1] + RATE[2]
  return fiksniUkupno
}

/** Broj nastupa za bonus B1: 0 pre koraka 8, zatim početak -> kraj koraka 8 (UX: 18/30 -> 24/30). */
export function nastupiB1(poz: Pozicija, n: { pocetak: number; kraj: number }): number {
  if (poz.korak < 8) return 0
  if (poz.korak === 8) return jeZavrsen(poz, 8) ? n.kraj : n.pocetak
  return n.kraj
}

// ------------------------------------------------------------------ odobrenja (dvostruka: Finance + Legal)
export interface StanjeOdobrenja {
  vidljivo: boolean
  odobreno: 0 | 1 | 2
  zavrseno: boolean
}

/** B10, stavka "Deposit into escrow" (korak 5). */
export function odobrenjeDepozita(poz: Pozicija): StanjeOdobrenja {
  const poslato = gotovo(poz, 'e1')
  const n = (gotovo(poz, 'e2') ? 1 : 0) + (gotovo(poz, 'e3') ? 1 : 0)
  return { vidljivo: poslato, odobreno: n as 0 | 1 | 2, zavrseno: n === 2 }
}

/** S12, stavka "Assign receivable" (korak 8). */
export function odobrenjeUstupanja(poz: Pozicija): StanjeOdobrenja {
  const prihvaceno = gotovo(poz, 'f3')
  const n = (gotovo(poz, 'f4') ? 1 : 0) + (gotovo(poz, 'f5') ? 1 : 0)
  return { vidljivo: prihvaceno, odobreno: n as 0 | 1 | 2, zavrseno: n === 2 }
}

/** B10, stavka "Fund installment 2" (korak 8): isto dvostruko odobrenje kao uplata u escrow. */
export function odobrenjeRate2(poz: Pozicija): StanjeOdobrenja {
  const poslato = gotovo(poz, 'f6')
  const n = (gotovo(poz, 'f7') ? 1 : 0) + (gotovo(poz, 'f8') ? 1 : 0)
  return { vidljivo: poslato, odobreno: n as 0 | 1 | 2, zavrseno: n === 2 }
}

// ------------------------------------------------------------------ aktivnost (S2/B2)
export interface DogadjajAktivnosti {
  tekst: string
  datum: string
}

/** Poslednji događaji priče koje dati igrač sme da vidi (najnoviji prvo). */
export function aktivnost(poz: Pozicija, uloga: Uloga, max = 5): DogadjajAktivnosti[] {
  const tren = redniBroj(poz)
  const lista = putanja(poz.grana).slice(0, tren)
  const rez: DogadjajAktivnosti[] = []
  for (const r of lista) {
    const dozvoljeno = r.za ?? ['selling', 'buying']
    if (!dozvoljeno.includes(uloga)) continue
    const radnje = radnjeKoraka(r.korak, poz.grana)
    const poslednja = radnje[radnje.length - 1].id === r.id
    const d = datumKoraka(r.korak, poz.grana)
    rez.push({ tekst: r.aktivnost, datum: poslednja ? d.kraj : d.pocetak })
    // grana Rejected: posle potvrde unosa udruženje odbija ITC
    if (r.id === 'm2' && poz.grana === 'rejected') rez.push({ tekst: 'ITC refused by the association', datum: d.kraj })
  }
  return rez.reverse().slice(0, max)
}

// ------------------------------------------------------------------ rokovi
/** "Next deadline" glavnog transfera (tekst). */
export function sledeciRok(poz: Pozicija): string {
  const zav = poz.odradjeno >= brojRadnji(poz)
  let k = poz.korak
  // posle koraka 8 sledeći stvarni rok je rata 3, a ne kraj koraka 9
  if (zav && poz.korak === 8 && poz.grana === 'approved') return DATUM.rata3
  // grana Rejected: kad je slučaj zatvoren nema otvorenog roka
  if (poz.grana === 'rejected' && poz.korak >= 8 && (poz.korak === 8 || zav)) return 'No open deadline'
  if (zav && k < 9) k += 1
  if (k === 4 && poz.odradjeno < brojRadnji({ korak: 4, grana: poz.grana })) return DATUM.potpisRok
  if (poz.grana === 'rejected' && k >= 8) return datumKoraka(9, 'rejected').kraj
  return datumKoraka(k, poz.grana).kraj
}

// ------------------------------------------------------------------ vremenska linija igrača i agenta (6 tačaka)
export const TACKE_IGRACA = [
  { oznaka: 'Offer agreed', koraci: [1] },
  { oznaka: 'Contract & medical', koraci: [2] },
  { oznaka: 'Checks & signing', koraci: [3, 4] },
  { oznaka: 'Funds & registration', koraci: [5, 6] },
  { oznaka: 'Your payments', koraci: [7, 8] },
  { oznaka: 'Final payment', koraci: [9] },
] as const

export type StanjeTacke6 = 'todo' | 'now' | 'done' | 'nije-zavrseno' | 'ne-vazi'

/**
 * Preslikavanje 9 koraka na 6 tačaka (UX P1). Tačka je "aktivna" od početnog stanja prvog koraka koji joj pripada,
 * a "završena" po završnom stanju poslednjeg. U grani Rejected: tačka 4 = "Not completed", tačke 5 i 6 = "Not applicable".
 */
export function tackeIgraca(poz: Pozicija): { oznaka: string; stanje: StanjeTacke6 }[] {
  return TACKE_IGRACA.map((t, i) => {
    const prvi = t.koraci[0]
    const poslednji = t.koraci[t.koraci.length - 1]
    if (odbijeno(poz)) {
      if (i === 3) return { oznaka: t.oznaka, stanje: 'nije-zavrseno' as const }
      if (i >= 4) return { oznaka: t.oznaka, stanje: 'ne-vazi' as const }
    }
    if (poz.korak < prvi) return { oznaka: t.oznaka, stanje: 'todo' as const }
    // poslednja tačka: rata 3 u priči kasni, pa nikad nije "done" u grani Approved
    if (i === 5 && poz.grana === 'approved') return { oznaka: t.oznaka, stanje: 'now' as const }
    if (jeZavrsen(poz, poslednji)) return { oznaka: t.oznaka, stanje: 'done' as const }
    return { oznaka: t.oznaka, stanje: 'now' as const }
  })
}

export { nazivKoraka }
