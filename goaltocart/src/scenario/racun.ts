// IZVEDENE vrednosti (funkcije). Ako se ulazna brojka u uslovi.ts promeni, sve zavisne se same usklade.
// Procenti se računaju u celim brojevima i proverava se da je rezultat ceo.
import {
  BONUSI, NAKNADA_PLATFORME_PROMILE, PONUDA_FINANSIJERA, PROVIZIJA_AGENTA_PCT, RATE, UDEO_IGRACA_PCT,
  UGOVOR_IGRACA, VERZIJE, DATUMI_RATA_ISO,
} from './uslovi'

const zbir = (a: readonly number[]) => a.reduce((s, x) => s + x, 0)

/** Ceo procenat: iznos * pct / 100; baca grešku ako rezultat nije ceo broj (brojke priče su cele). */
export function celiProcenat(iznos: number, p: number): number {
  const r = (iznos * p) / 100
  if (!Number.isInteger(r)) throw new Error(`Procenat nije ceo broj: ${iznos} * ${p}%`)
  return r
}

export const fiksniUkupno = zbir(RATE)
export const bonusiUkupno = zbir(BONUSI.map((b) => b.iznos))
export const naslovnaVrednost = fiksniUkupno + bonusiUkupno

// Udeo igrača (5%) na rate i bonuse; isplaćuje ga prodavac direktno
export const udeoPoRati = RATE.map((r) => celiProcenat(r, UDEO_IGRACA_PCT))
export const udeoUkupno = zbir(udeoPoRati)
export const udeoPoBonusu = BONUSI.map((b) => celiProcenat(b.iznos, UDEO_IGRACA_PCT))

// Naknada platforme: 0.5% fiksnog dela, na pola
export const naknadaUkupno = (fiksniUkupno * NAKNADA_PLATFORME_PROMILE) / 1000
export const naknadaPola = naknadaUkupno / 2

// Provizija agenta: 5% od ukupne zarade po ugovoru igrača
export const ugovorUkupno = UGOVOR_IGRACA.godina * UGOVOR_IGRACA.godisnjaBruto
export const provizijaAgenta = celiProcenat(ugovorUkupno, PROVIZIJA_AGENTA_PCT)

// Korak 5: uplata kupca u escrow
export const uplataKupca = RATE[0] + provizijaAgenta + naknadaPola

// Korak 7: isplata iz escrow-a
export const isplata = {
  igrac: udeoPoRati[0],
  naknada: naknadaUkupno,
  agent: provizijaAgenta,
  prodavacNeto: RATE[0] - udeoPoRati[0] - naknadaPola,
}
export const isplataUkupno = isplata.igrac + isplata.naknada + isplata.agent + isplata.prodavacNeto

// Korak 8: potraživanje (rate 2 i 3 bez igračevog udela)
export const potrazivanjePoRati = [RATE[1] - udeoPoRati[1], RATE[2] - udeoPoRati[2]]
export const potrazivanje = zbir(potrazivanjePoRati)
export const avans = PONUDA_FINANSIJERA.avans
export const popust = potrazivanje - avans
export const popustPct = (popust / potrazivanje) * 100 // oko 4.7

/** Meseci između dva ISO datuma (isti dan u mesecu). */
export function meseciIzmedju(odIso: string, doIso: string): number {
  const [g1, m1] = odIso.split('-').map(Number)
  const [g2, m2] = doIso.split('-').map(Number)
  return (g2 - g1) * 12 + (m2 - m1)
}
export const dospecaMeseci = [
  meseciIzmedju(PONUDA_FINANSIJERA.datumIso, DATUMI_RATA_ISO[1]),
  meseciIzmedju(PONUDA_FINANSIJERA.datumIso, DATUMI_RATA_ISO[2]),
]
export const prosecnoDospeceMeseci = zbir(dospecaMeseci) / dospecaMeseci.length
export const prinosZaPeriod = (popust / avans) * 100 // oko 4.93%
export const prinosGodisnje = prinosZaPeriod / (prosecnoDospeceMeseci / 12) // oko 8.45%, prikazuje se kao 8.5% (ilustrativno)

// Neto prodavca: korak 7 + korak 8
export const netoProdavca = isplata.prodavacNeto + avans
export const netoProveraIzRazlike = fiksniUkupno - udeoUkupno - naknadaPola - popust

// Alternativni ishod: povraćaj kupcu
export const povracaj = uplataKupca

// Verzije ponude: izvedeni zbirovi i razlike
export function fiksniVerzije(i: number): number {
  return zbir(VERZIJE[i].rate)
}
export function naslovnaVerzije(i: number): number {
  return fiksniVerzije(i) + VERZIJE[i].bonusiUkupno
}
export interface RazlikaVerzija {
  fiksni: number
  bonusi: number
  sellOn: number
}
export function razlikaVerzija(iz: number, u: number): RazlikaVerzija {
  return {
    fiksni: fiksniVerzije(u) - fiksniVerzije(iz),
    bonusi: VERZIJE[u].bonusiUkupno - VERZIJE[iz].bonusiUkupno,
    sellOn: VERZIJE[u].sellOnPct - VERZIJE[iz].sellOnPct,
  }
}
