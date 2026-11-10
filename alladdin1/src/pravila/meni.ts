// JEDINSTVEN GLAVNI MENI (UX 2.1) i druge trake naloga po ulozi, kao podatak. Svaka stavka vodi na ekran iz registra (test u pravila.test.ts).
import type { EkranId, Uloga } from '../prica/tipovi'

export type StavkaMenija = { naziv: string; ekran?: EkranId; podmeni?: { naziv: string; ekran: EkranId }[] }

export const GLAVNI_MENI: StavkaMenija[] = [
  { naziv: 'Home', ekran: 'S2' },
  {
    naziv: 'Group travel',
    podmeni: [
      { naziv: 'Air Charter', ekran: 'G1' },
      { naziv: 'Cruises', ekran: 'K1' },
    ],
  },
  {
    naziv: 'Individual',
    podmeni: [
      { naziv: 'Monte Carlo', ekran: 'M1' },
      { naziv: 'VIP Concierge', ekran: 'Q1' },
      { naziv: 'Luxury Transport', ekran: 'L1' },
    ],
  },
  { naziv: 'Packages', ekran: 'S5' },
  { naziv: 'All-In', ekran: 'B1' },
]

/** Druga traka unutar naloga (UX 2.1). */
export const TRAKA_NALOGA: Partial<Record<Uloga, { naziv: string; ekran: EkranId }[]>> = {
  organizer: [
    { naziv: 'Overview', ekran: 'G6' },
    { naziv: 'Passengers', ekran: 'G8' },
    { naziv: 'Finances', ekran: 'G13' },
    { naziv: 'Advisor', ekran: 'G17' },
  ],
  traveler: [
    { naziv: 'My trips', ekran: 'T5' },
    { naziv: 'Messages', ekran: 'T8' },
    { naziv: 'All-In status', ekran: 'B2' },
  ],
  advisor: [
    { naziv: 'Desk', ekran: 'V1' },
    { naziv: 'Requests', ekran: 'V5' },
    { naziv: 'Groups', ekran: 'V3' },
  ],
}

/** Ekrani koji pripadaju nalogu (prikazuje se druga traka). */
export const EKRANI_NALOGA: Partial<Record<Uloga, string[]>> = {
  organizer: ['G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17'],
  traveler: ['T5', 'T6', 'T7', 'T8', 'T9', 'B2'],
  advisor: ['V1', 'V2', 'V3', 'V4', 'V5'],
}
