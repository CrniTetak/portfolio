// Izmišljeni akteri prototipa (UX.md, odeljak 6). Nijedan ne postoji u stvarnosti.
import type { TipVlasnika } from '../logika/novac'
import type { Uloga } from '../logika/tipovi'

export const DELTA = 'delta'
export const SIGMA = 'sigma'
export const ALFA = 'alfa'
export const IVAN = 'ivan'
export const MILA = 'mila'
export const NASETU = 'nasetu'

export interface Akter {
  id: string
  naziv: string
  /** kratak opis za traku "Gledate kao" */
  opis: string
}

export const AKTERI: Record<string, Akter> = {
  [DELTA]: { id: DELTA, naziv: 'Produkcija Delta (izmišljeno)', opis: 'producent: Ana P. (izmišljeno)' },
  [SIGMA]: { id: SIGMA, naziv: 'Produkcija Sigma (izmišljeno)', opis: 'druga produkcija' },
  [ALFA]: { id: ALFA, naziv: 'Alfa Prostori d.o.o. (izmišljeno)', opis: 'pravno lice; kontakt: Nenad J.' },
  [IVAN]: { id: IVAN, naziv: 'Ivan T. (izmišljeno)', opis: 'fizičko lice' },
  [MILA]: { id: MILA, naziv: 'Location menadžer Mila K. (izmišljeno)', opis: 'partner' },
  [NASETU]: { id: NASETU, naziv: 'Nasetu tim', opis: 'admin' },
}

export const TIP_VLASNIKA: Record<string, TipVlasnika> = { [ALFA]: 'pravno', [IVAN]: 'fizicko' }

export const NAZIV_ULOGE: Record<Uloga, string> = {
  produkcija: 'Produkcija',
  vlasnik: 'Vlasnik',
  partner: 'Partner',
  admin: 'Admin',
}

export const BOJA_ULOGE: Record<Uloga, string> = {
  produkcija: '#C8401E',
  vlasnik: '#2F6B4F',
  partner: '#4338CA',
  admin: '#3F3A36',
}

/** Koji akter je "ja" kad se gleda kao data uloga (vlasnik zavisi od prekidača pravno/fizičko). */
export function akterUloge(uloga: Uloga, prikazVlasnika: TipVlasnika): string {
  switch (uloga) {
    case 'produkcija': return DELTA
    case 'vlasnik': return prikazVlasnika === 'pravno' ? ALFA : IVAN
    case 'partner': return MILA
    case 'admin': return NASETU
  }
}

export function nazivAktera(id: string): string {
  return AKTERI[id]?.naziv ?? id
}

/** Skraćen naziv bez oznake "(izmišljeno)" — za rečenice u razlozima ("Čeka se odluka prve opcije (Produkcija Delta)…"). */
export function kratakNaziv(id: string): string {
  return nazivAktera(id).replace(/\s*\(izmišljeno\)/, '')
}

// ---- Firme i preduzetnici (B2): PIB i matični broj su OČIGLEDNO izmišljeni (sve nule) i ne mogu pripadati pravoj firmi ----
export const IZMISLJEN_PIB = '000000000'
export const IZMISLJEN_MB = '00000000'

/** Kupac na predračunu: produkcije i vlasnik-firma imaju (izmišljen) PIB/MB; vlasnik fizičko lice nema PIB. */
const IMA_PIB: Record<string, boolean> = { [DELTA]: true, [SIGMA]: true, [ALFA]: true, [IVAN]: false }

export function pibKupca(id: string): string {
  return IMA_PIB[id] ? IZMISLJEN_PIB : ''
}
export function mbKupca(id: string): string {
  return IMA_PIB[id] ? IZMISLJEN_MB : ''
}

/** "PIB 000000000 · MB 00000000 (izmišljeno)" ili tekst za fizičko lice. */
export function pibMbTekst(id: string): string {
  return IMA_PIB[id]
    ? `PIB ${IZMISLJEN_PIB} · MB ${IZMISLJEN_MB} (izmišljeno)`
    : 'fizičko lice, bez PIB-a (izmišljeno)'
}
