// STAVKE SLOBODNIH TOKOVA (UX 8.7): krstarenje, Monte Karlo, konsijerž, transport, članstvo i katalog paketa. Ulazne vrednosti i zbirovi na jednom mestu.
// Sve što ekran prikazuje kao broj, trajanje, rok ili cenu dolazi odavde (brava B3).
import { krajPoNocima, DOGADJAJI_DATUMI, KRSTARENJE_KRAJ, KRSTARENJE_POLAZAK, MONTE_KARLO_DO, MONTE_KARLO_OD, VEGAS_DO, VEGAS_OD, GRAND_PRIX_DO, GRAND_PRIX_OD, POLAZAK, KRAJ_PUTOVANJA, type Dat } from './datumi'
import { eur } from './format'
import { proc, VEGAS, GRAND_PRIX, CENA_V1, NOCI_MACAU } from './racun'
import { DOGADJAJI, NAZIVI_KRSTARENJA, NAZIVI_MK, PAKET_GRAND_PRIX, PAKET_MACAU, PAKET_VEGAS } from './strane'

export const KRSTARENJE = { cenaPoOsobi: 1499, osoba: 5, dodatakPoOsobi: 199, takseIPristojbe: 700, kabina: 'Balcony' } as const
export const krstarenjeOsnova = KRSTARENJE.cenaPoOsobi * KRSTARENJE.osoba
export const krstarenjeDodaci = KRSTARENJE.dodatakPoOsobi * KRSTARENJE.osoba
export const krstarenjeUkupno = krstarenjeOsnova + krstarenjeDodaci + KRSTARENJE.takseIPristojbe

export const MONTE_KARLO = {
  stavke: [
    { naziv: 'Royal Suite', iznos: 41000 },
    { naziv: 'Private chauffeur transfers', iznos: 3200 },
    { naziv: 'Dining reservations', iznos: 2400 },
    { naziv: 'Concierge fee', iznos: 3400 },
  ],
  avansProc: 20,
  gostiju: 2,
} as const
export const monteKarloUkupno = MONTE_KARLO.stavke.reduce((z, s) => z + s.iznos, 0)
export const monteKarloAvans = proc(monteKarloUkupno, MONTE_KARLO.avansProc)
export const monteKarloSaldo = monteKarloUkupno - monteKarloAvans

/** Konsijerž (Q4/Q5): paket gala događaja i usluge partnera sa porezima (razlaganje kao u Figmi). */
export const KONSIJERZ = { galaPaket: 5500, partneriITakse: 1760, gostiju: 4 } as const
export const konsijerzUkupno = KONSIJERZ.galaPaket + KONSIJERZ.partneriITakse

/** Usluge transporta (L2–L4, T7, V5): svaka ima svoju cenu i rutu; jahta ne polazi sa aerodroma. */
export const TRANSPORT_USLUGE = [
  { id: 'chauffeur', naziv: 'Private Chauffeur Service', opis: 'A dedicated driver for transfers and city days.', cena: 620, polazak: "Nice Côte d'Azur Airport", odrediste: 'Monte Carlo' },
  { id: 'helikopter', naziv: 'Luxury Helicopter Transfer', opis: 'Fast transfers between airports and the coast.', cena: 1850, polazak: "Nice Côte d'Azur Airport", odrediste: 'Monaco heliport' },
  { id: 'jahta', naziv: 'VIP Yacht Transfer', opis: 'Arrive by sea, with a crew and catering on request.', cena: 3900, polazak: 'Cannes harbour', odrediste: 'Monaco harbour' },
] as const
export const TRANSPORT = { helikopter: TRANSPORT_USLUGE[1].cena, vreme: '11:30', putnika: 2, maks: 4 } as const

/** Članstvo "All-In": pragovi su broj REZERVISANIH putovanja (bez cene članarine u demou); dostižni u demou. */
export const CLANSTVO = { member: 1, select: 2, signature: 4 } as const

/** Vrsta paketa u S5, tip zahteva u T5/T7/V5. */
export type VrstaPaketa = 'Group charter' | 'Cruises' | 'Monte Carlo' | 'Events'
export type TipZahteva = 'Group' | 'Cruise' | 'Event' | 'Monte Carlo'
export type Paket = { kljuc: string; naziv: string; vrsta: VrstaPaketa; tip: TipZahteva; noci: number; cenaOd: number; od: Dat; do: Dat }

/** JEDAN katalog: iz njega se prave K3, M1, M8, S5, S8 i zahtevi (nema dupliranih cena). Cene OD su po osobi (grupe, krstarenja) ili za paket. */
export const KATALOG: Paket[] = [
  { kljuc: 'vegas', naziv: PAKET_VEGAS, vrsta: 'Group charter', tip: 'Group', noci: VEGAS.noci, cenaOd: VEGAS.cena, od: VEGAS_OD, do: VEGAS_DO },
  { kljuc: 'grandPrix', naziv: PAKET_GRAND_PRIX, vrsta: 'Group charter', tip: 'Group', noci: GRAND_PRIX.noci, cenaOd: GRAND_PRIX.cena, od: GRAND_PRIX_OD, do: GRAND_PRIX_DO },
  { kljuc: 'macau', naziv: PAKET_MACAU, vrsta: 'Group charter', tip: 'Group', noci: NOCI_MACAU, cenaOd: CENA_V1, od: POLAZAK, do: KRAJ_PUTOVANJA },
  { kljuc: 'aegean', naziv: NAZIVI_KRSTARENJA.aegean, vrsta: 'Cruises', tip: 'Cruise', noci: 6, cenaOd: 1899, od: KRSTARENJE_POLAZAK, do: krajPoNocima(KRSTARENJE_POLAZAK, 6) },
  { kljuc: 'riviera', naziv: NAZIVI_KRSTARENJA.riviera, vrsta: 'Cruises', tip: 'Cruise', noci: 4, cenaOd: 1299, od: KRSTARENJE_POLAZAK, do: krajPoNocima(KRSTARENJE_POLAZAK, 4) },
  { kljuc: 'blackjack', naziv: NAZIVI_KRSTARENJA.blackjack, vrsta: 'Cruises', tip: 'Cruise', noci: 11, cenaOd: 3299, od: KRSTARENJE_POLAZAK, do: krajPoNocima(KRSTARENJE_POLAZAK, 11) },
  { kljuc: 'iberian', naziv: NAZIVI_KRSTARENJA.iberian, vrsta: 'Cruises', tip: 'Cruise', noci: 4, cenaOd: KRSTARENJE.cenaPoOsobi, od: KRSTARENJE_POLAZAK, do: KRSTARENJE_KRAJ },
  { kljuc: 'royal', naziv: NAZIVI_MK.royal, vrsta: 'Monte Carlo', tip: 'Monte Carlo', noci: 5, cenaOd: monteKarloUkupno, od: MONTE_KARLO_OD, do: MONTE_KARLO_DO },
  { kljuc: 'lifestyle', naziv: NAZIVI_MK.lifestyle, vrsta: 'Monte Carlo', tip: 'Monte Carlo', noci: 4, cenaOd: 7500, od: MONTE_KARLO_OD, do: krajPoNocima(MONTE_KARLO_OD, 4) },
  { kljuc: 'salon', naziv: NAZIVI_MK.salon, vrsta: 'Monte Carlo', tip: 'Monte Carlo', noci: 3, cenaOd: 15000, od: MONTE_KARLO_OD, do: krajPoNocima(MONTE_KARLO_OD, 3) },
  { kljuc: 'penthouse', naziv: NAZIVI_MK.penthouse, vrsta: 'Monte Carlo', tip: 'Monte Carlo', noci: 5, cenaOd: 22000, od: MONTE_KARLO_OD, do: MONTE_KARLO_DO },
  ...DOGADJAJI.map((d, i): Paket => ({ kljuc: `e${i + 1}`, naziv: d.naziv, vrsta: 'Events', tip: 'Event', noci: 3, cenaOd: [3200, 4800, 6400][i], od: DOGADJAJI_DATUMI[i].od, do: DOGADJAJI_DATUMI[i].do })),
]
/** Cena "od" UVEK sa jedinicom: po osobi (grupe, krstarenja, događaji) ili za goste (Monte Carlo). */
export const cenaOdTekst = (p: Paket) => `from ${eur(p.cenaOd)} ${p.tip === 'Monte Carlo' ? `for ${MONTE_KARLO.gostiju} guests` : 'per person'}`
export const paket = (kljuc: string): Paket => KATALOG.find((p) => p.kljuc === kljuc) ?? KATALOG[0]
export const KRSTARENJA = KATALOG.filter((p) => p.vrsta === 'Cruises')
export const MK_REZULTATI = KATALOG.filter((p) => p.vrsta === 'Monte Carlo')
export const MK_DOGADJAJI = KATALOG.filter((p) => p.vrsta === 'Events')
/** Dana krstarenja = noći + 1. */
export const danaKrstarenja = (noci: number) => noci + 1

/** Jedna referenca po zahtevu (isti broj kod putnika i savetnika). */
export const REF_ZAHTEV_KATALOG = 'AA1-R-04'
export const refKataloga = (indeks: number) => `${REF_ZAHTEV_KATALOG}${String(indeks + 1).padStart(2, '0')}`

/** Cenovni opsezi u pretrazi krstarenja (K2), po osobi. */
export const KRSTARENJE_OPSEZI = [
  [1000, 2000],
  [2000, 4000],
  [4000, 8000],
] as const
/** Cenovni opsezi Monte Karlo (M1). */
export const MK_OPSEZI = [
  [5000, 10000],
  [10000, 50000],
  [50000, 0],
] as const
