// SVE IZVEDENE VREDNOSTI iz uslovi.ts. Funkcije su čiste; svaki procenat mora dati ceo broj (proverava `proc`).
import { USLOVI } from './uslovi'

/** Procenat celog broja; baca grešku ako rezultat nije ceo (da se brojke ne zaokružuju u tišini). */
export function proc(iznos: number, p: number): number {
  const r = (iznos * p) / 100
  if (!Number.isInteger(r)) throw new Error(`${p}% od ${iznos} nije ceo broj`)
  return r
}

/** Način plaćanja po stavci (jedan izvor za G12, G13 i T3). */
export const NACIN_PLACANJA = { avans: 'Bank transfer', rata2: 'Card', rata3: 'Bank transfer' } as const
export const SEDISTA = USLOVI.sedista
export const BROJ_KORAKA = USLOVI.brojKoraka
export const PONUDA_VAZI_DANA = USLOVI.ponudaVaziDana
export const PASOS_VAZI_MESECI = USLOVI.pasosVaziMeseci
export const MACAU_MIN_GRUPA = USLOVI.macauMinGrupa
export const NOCI_MACAU = USLOVI.nociMacau
export const VIP_APARTMANA = USLOVI.vipApartmana
export const STANDARD_SOBA_V2 = USLOVI.sedista - USLOVI.vipApartmana
export const UPIS = USLOVI.upis
export const RATA2_PLACENO_DO_ROKA = USLOVI.rata2PlacenoDoRoka
export const NEPLACENO_NA_ROKU = USLOVI.sedista - USLOVI.rata2PlacenoDoRoka
export const AVANS_PROC = USLOVI.avansProc
export const RATA2_PROC = USLOVI.rata2Proc
export const RATA3_PROC = USLOVI.rata3Proc
export const TROSKOVI_OBRADE_PROC = USLOVI.troskoviObradeProc

export const CENA_V1 = USLOVI.cenaV1
export const CENA_V2 = USLOVI.cenaV1 + USLOVI.dodatakV2
export const DODATAK_V2 = USLOVI.dodatakV2

/** Cena po putniku za verziju ponude (1 ili 2). */
export const cenaVerzije = (v: 1 | 2) => (v === 1 ? CENA_V1 : CENA_V2)
/** Vrednost bloka. */
export const vrednost = (cena: number, sedista: number = SEDISTA) => cena * sedista
export const vrednostV1 = vrednost(CENA_V1)
export const vrednostV2 = vrednost(CENA_V2)
export const RAZLIKA_V2_UKUPNO = vrednostV2 - vrednostV1

/** Avans po sedištu i za grupu (od cene). */
export const avansPoSedistu = (cena: number) => proc(cena, AVANS_PROC)
export const avansGrupe = (cena: number, sedista: number = SEDISTA) => avansPoSedistu(cena) * sedista
export const AVANS_PO_PUTNIKU = avansPoSedistu(CENA_V2)
export const AVANS_GRUPE = avansGrupe(CENA_V2)
export const AVANS_GRUPE_V1 = avansGrupe(CENA_V1)

/** Rate po putniku i za grupu. */
export const RATA2_PO_PUTNIKU = proc(CENA_V2, RATA2_PROC)
export const RATA3_PO_PUTNIKU = proc(CENA_V2, RATA3_PROC)
export const RATA2_GRUPE = RATA2_PO_PUTNIKU * SEDISTA
export const RATA3_GRUPE = RATA3_PO_PUTNIKU * SEDISTA

/** Putnik koji dolazi u blok: avans je pokriven avansom grupe. */
export const MARKO_UPIS_PLACENO = AVANS_PO_PUTNIKU

/** Fakturisanje po putniku (avans grupe je posebna faktura): rata 2 + rata 3. */
export const FAKTURA_PUTNIKA = RATA2_PO_PUTNIKU + RATA3_PO_PUTNIKU

/** Ishod B: manji blok = sedišta koja su platila ratu 2; oslobođena sedišta vraćaju avans. */
export const BLOK_B = USLOVI.rata2PlacenoDoRoka
export const OSLOBODJENO_B = SEDISTA - BLOK_B
export const KREDITNA_NOTA_B = OSLOBODJENO_B * AVANS_PO_PUTNIKU
export const VIP_APARTMANA_U_B = VIP_APARTMANA
export const STANDARD_SOBA_B = BLOK_B - VIP_APARTMANA
export const VREDNOST_B = vrednost(CENA_V2, BLOK_B)
export const AVANS_ZADRZAN_B = AVANS_GRUPE - KREDITNA_NOTA_B

/** Ishod C: avans se vraća umanjen za troškove obrade, uplate putnika u celosti. */
export const TROSKOVI_OBRADE_C = proc(AVANS_GRUPE, TROSKOVI_OBRADE_PROC)
export const POVRACAJ_AVANSA_C = AVANS_GRUPE - TROSKOVI_OBRADE_C
export const POVRACAJ_PUTNICIMA_C = RATA2_PLACENO_DO_ROKA * RATA2_PO_PUTNIKU
export const POVRACAJ_UKUPNO_C = POVRACAJ_AVANSA_C + POVRACAJ_PUTNICIMA_C
export const PLACENO_DO_ROKA_C = AVANS_GRUPE + POVRACAJ_PUTNICIMA_C

/** Sporedne grupe sa table (G6): vrednost, avans, rata 2, preostalo. */
export function sporednaGrupa(g: { sedista: number; cena: number; upisano: number }) {
  const v = vrednost(g.cena, g.sedista)
  const placeno = avansGrupe(g.cena, g.sedista)
  return { vrednost: v, placeno, preostalo: v - placeno, rata2: proc(v, RATA2_PROC), neupisano: g.sedista - g.upisano }
}
export const VEGAS = { ...USLOVI.grupe.vegas, ...sporednaGrupa(USLOVI.grupe.vegas) }
export const GRAND_PRIX = { ...USLOVI.grupe.grandPrix, ...sporednaGrupa(USLOVI.grupe.grandPrix) }
