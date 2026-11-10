import { datumIso } from './format'

// ULAZNE vrednosti priče (ono što je "dogovoreno"). Sve ostalo se IZRAČUNAVA u racun.ts.
// Ekrani NE smeju direktno da uvoze ovaj fajl; podaci idu kroz pravila/vidljivost.ts.
// Iznosi su celi evri (UX.md 7).

export interface VerzijaPonude {
  broj: 1 | 2 | 3
  od: 'buyer' | 'seller'
  datum: string
  rate: [number, number, number]
  bonusiUkupno: number
  sellOnPct: number
}

export const VERZIJE: VerzijaPonude[] = [
  { broj: 1, od: 'buyer', datum: '3 Jun 2027', rate: [1_500_000, 1_250_000, 1_250_000], bonusiUkupno: 500_000, sellOnPct: 10 },
  // Rate u v2 nisu navedene u UX.md; izabrane tako da zbir bude 4,800,000 (pretpostavka, vidi izveštaj).
  { broj: 2, od: 'seller', datum: '4 Jun 2027', rate: [1_800_000, 1_500_000, 1_500_000], bonusiUkupno: 600_000, sellOnPct: 20 },
  { broj: 3, od: 'buyer', datum: '8 Jun 2027', rate: [1_600_000, 1_400_000, 1_400_000], bonusiUkupno: 600_000, sellOnPct: 15 },
]

// Konačni (dogovoreni) uslovi = v3.
export const RATE: [number, number, number] = [1_600_000, 1_400_000, 1_400_000]
// Datumi plaćanja su radni dani (petak/sreda), da demo ne pokazuje isplatu subotom.
export const DATUMI_RATA_ISO = ['2027-07-07', '2028-01-14', '2028-07-14'] as const
export const DATUMI_RATA = DATUMI_RATA_ISO.map(datumIso) as unknown as readonly [string, string, string]

export interface BonusDef {
  id: 'B1' | 'B2' | 'B3'
  iznos: number
  opis: string
  izvor: string
}
export const BONUSI: BonusDef[] = [
  { id: 'B1', iznos: 200_000, opis: '30 official first-team appearances', izvor: 'Official match data' },
  { id: 'B2', iznos: 250_000, opis: 'First call-up to the senior national team', izvor: 'Official association data' },
  { id: 'B3', iznos: 150_000, opis: 'Buying club plays the group stage of the continental competition', izvor: 'Official competition data' },
]
export const SELL_ON_PCT = 15

// Napredak bonusa B1 (nastupi): početak koraka 8 -> kraj koraka 8.
export const B1_NASTUPI = { ukupno: 30, pocetak: 18, kraj: 24 } as const

export const UDEO_IGRACA_PCT = 5
export const NAKNADA_PLATFORME_PROMILE = 5 // 0.5% na fiksni deo, kupac i prodavac na pola
export const PROVIZIJA_AGENTA_PCT = 5
export const UGOVOR_IGRACA = { godina: 4, godisnjaBruto: 150_000 } as const

// Korak 8: ponuda finansijera (ulaz). Datum ponude je 15 Sep 2027.
export const PONUDA_FINANSIJERA = { avans: 2_535_000, datumIso: '2027-09-15', vaziDoIso: '2027-09-22' } as const

// Unapred popunjeno polje "Minimum advance" na ekranu S11 (ulaz).
export const MINIMALNI_AVANS = 2_400_000

// Referenca potvrde banke (izmišljena). Igračev udeo isplaćuje escrow istog dana kad i ratu prodavca.
export const POTVRDA_BANKE_REFERENCA = 'PAY-DEMO-0001-27'

// Procenjene obaveze školovanja/solidarnosti (ilustrativno, rešava ih Clearing House; ne ulaze u escrow).
export const SKOLOVANJE_PROCENA = 195_000
