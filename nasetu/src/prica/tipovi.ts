// Osnovni tipovi vođene priče (dorada 3). Čist TypeScript, bez React-a.
// Pozicija (korak, odradjeno, grana) je JEDINA istina priče; ostalo u Stanje je „svet" izveden iz nje.

/** Uloge koje se vide u priči. Admin postoji samo u slobodnom režimu. */
export type UlogaPrice = 'produkcija' | 'vlasnik' | 'partner'
export const ULOGE_PRICE: UlogaPrice[] = ['produkcija', 'vlasnik', 'partner']

export type Grana = 'vazi' | 'otkaz'
export type Rezim = 'vodjeno' | 'slobodno'

export const BROJ_KORAKA = 9
/** Račva postoji samo na ovom koraku. */
export const KORAK_RACVE = 9

/** Mesto u priči: korak 1–9, koliko je radnji u koraku odrađeno (0 = početno), i grana. */
export interface Pozicija {
  korak: number
  odradjeno: number
  grana: Grana
}

/** Deo Stanja koji se odnosi na priču (čuva se u sessionStorage zajedno sa ostalim). */
export interface StanjePrice extends Pozicija {
  rezim: Rezim
  /** samo u slobodnom režimu: „svet" se razlikuje od onoga što bi priča izgradila */
  odstupljeno: boolean
  /** jednokratni uvod u slobodni režim je već viđen */
  vidjenUvodSlobodno: boolean
}

export const POCETNA_POZICIJA: Pozicija = { korak: 1, odradjeno: 0, grana: 'vazi' }

export const pocetnaPrica = (rezim: Rezim = 'vodjeno'): StanjePrice => ({
  ...POCETNA_POZICIJA, rezim, odstupljeno: false, vidjenUvodSlobodno: false,
})

export const pozicijaIz = (p: Pozicija): Pozicija => ({ korak: p.korak, odradjeno: p.odradjeno, grana: p.grana })
