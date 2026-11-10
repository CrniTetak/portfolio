// Fiksni datumi priče (UX.md tabela 4.0 i 7.10). Sat računara se NIGDE ne koristi.
import type { Grana } from '../prica/tipovi'
import { DATUMI_RATA } from './uslovi'

// Rata 3 dospeva 14 Jul 2028; kašnjenje od 14 i 28 dana pada na petak (28 Jul i 11 Aug 2028).
const KASNJENJE_14 = '28 Jul 2028'
const KASNJENJE_28 = '11 Aug 2028'

export interface DatumKoraka {
  pocetak: string
  kraj: string
}

const APPROVED: Record<number, DatumKoraka> = {
  1: { pocetak: '3 Jun 2027', kraj: '10 Jun 2027' },
  2: { pocetak: '10 Jun 2027', kraj: '17 Jun 2027' },
  3: { pocetak: '17 Jun 2027', kraj: '21 Jun 2027' },
  4: { pocetak: '21 Jun 2027', kraj: '23 Jun 2027' },
  5: { pocetak: '23 Jun 2027', kraj: '28 Jun 2027' },
  6: { pocetak: '28 Jun 2027', kraj: '5 Jul 2027' },
  7: { pocetak: '5 Jul 2027', kraj: '7 Jul 2027' },
  8: { pocetak: '15 Sep 2027', kraj: DATUMI_RATA[1] },
  9: { pocetak: KASNJENJE_14, kraj: KASNJENJE_28 },
}

// Grana Rejected se razlikuje od koraka 7 (korak 6 je isti).
const REJECTED: Record<number, DatumKoraka> = {
  7: { pocetak: '5 Jul 2027', kraj: '7 Jul 2027' },
  8: { pocetak: '7 Jul 2027', kraj: '7 Jul 2027' },
  9: { pocetak: '7 Jul 2027', kraj: '12 Jul 2027' },
}

export function datumKoraka(korak: number, grana: Grana): DatumKoraka {
  return (grana === 'rejected' ? REJECTED[korak] : undefined) ?? APPROVED[korak]
}

// Prolazni pod-koraci prikazuju POČETNI datum koraka, a završno stanje ZAVRŠNI datum (PLAN B3).
export function demoDatum(korak: number, grana: Grana, zavrseno: boolean): string {
  const d = datumKoraka(korak, grana)
  return zavrseno ? d.kraj : d.pocetak
}

// Imenovani datumi koji se spominju u tekstovima ekrana.
export const DATUM = {
  ponudaIstice: '10 Jun 2027',
  ponudaIsticeVreme: '10 Jun, 18:00 CEST',
  ponudaV1: '3 Jun 2027',
  prihvaceno: '10 Jun 2027',
  medicinski: '17 Jun 2027',
  potpisRok: '24 Jun 2027',
  escrowRok: '28 Jun 2027',
  uplataEscrow: '28 Jun 2027',
  registracija: '5 Jul 2027',
  isplata: '7 Jul 2027',
  ponudaFinansijera: '15 Sep 2027',
  rata2: DATUMI_RATA[1],
  rata3: DATUMI_RATA[2],
  kasnjenje14: KASNJENJE_14,
  kasnjenje28: KASNJENJE_28,
} as const
