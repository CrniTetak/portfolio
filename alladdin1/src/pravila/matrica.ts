// TABELA 3.3 iz UX.md kao podatak: korak × uloga × ishod → ekran i kratak opis stanja (početno i završno).
// "Show me" otvara ekran POČETNOG stanja za trenutnu ulogu. Opisi su bez brojki (brojke ekrani vade iz scenario/).
// Odstupanja od UX 3.3 su dokumentovana u PLAN.md B14 (npr. u koraku 8 organizator vidi G13, a G14 se stiže iz G13).
import type { EkranId, Ishod, Uloga } from '../prica/tipovi'

export type Stanje = { ekran: EkranId; opis: string }
export type Celija = { pocetno: Stanje; zavrsno: Stanje }
type Uloge3 = 'organizer' | 'traveler' | 'advisor'

const c = (ep: string, op: string, ez: string, oz: string): Celija => ({ pocetno: { ekran: ep, opis: op }, zavrsno: { ekran: ez, opis: oz } })
const prazno = c('T5', 'Nothing here yet — your organizer is still planning', 'T5', 'Nothing here yet — your organizer is still planning')

type Red = Record<Uloge3, Celija>
/** Koraci 1–6 isti u svim ishodima. */
const ZAJEDNICKI: Red[] = [
  {
    organizer: c('G1', 'Inquiry ready to send', 'G3', 'Quote request sent'),
    traveler: prazno,
    advisor: c('V1', 'No new inquiries', 'V1', 'New inquiry waiting for a quote'),
  },
  {
    organizer: c('G4', "Waiting for your advisor's quote", 'G4', 'Quote v1 received'),
    traveler: prazno,
    advisor: c('V2', 'Inquiry and draft quote v1', 'V2', 'Quote v1 sent'),
  },
  {
    organizer: c('G4', 'Quote v1 on record — changes can be requested', 'G4', 'Quote v2 received'),
    traveler: prazno,
    advisor: c('V2', 'Quote v1 sent — waiting for the organizer', 'V2', 'Quote v2 sent'),
  },
  {
    organizer: c('G5', 'Accept quote v2 and get deposit details', 'G5', 'Deposit received — seats and rooms on option'),
    traveler: prazno,
    advisor: c('V3', 'Reservation waiting for deposit', 'V3', 'Deposit received'),
  },
  {
    organizer: c('G8', 'No travelers enrolled yet', 'G8', 'All travelers enrolled'),
    traveler: c('T1', 'Join link opened', 'T4', "You're enrolled"),
    advisor: c('V3', 'Enrollment not started', 'V3', 'Enrollment complete'),
  },
  {
    organizer: c('G8', 'Installment 2 open', 'G8', 'Installment 2 paid for most seats'),
    traveler: c('T3', 'Pay installment 2', 'T6', 'Installment 2 paid'),
    advisor: c('V3', 'Installment 2 open', 'V3', 'Reminders sent — seats outstanding'),
  },
]

const KORAK7: Record<Ishod, Red> = {
  A: {
    organizer: c('G15', 'Deadline day — seats still open', 'G15', 'Group filled — block confirmed'),
    traveler: c('T6', 'Deadline day', 'T6', 'Your seat is confirmed'),
    advisor: c('V4', 'Seats open on the deadline day', 'V4', 'Block confirmed with partners'),
  },
  B: {
    organizer: c('G15', 'Deadline day — choose an option', 'G15', 'Smaller block chosen'),
    traveler: c('T6', 'Deadline day', 'T6', 'Your seat is in the smaller block'),
    advisor: c('V4', 'Group not full — prepare options', 'V4', 'Options sent — smaller block chosen'),
  },
  C: {
    organizer: c('G15', 'Deadline day — choose an option', 'G15', 'Cancelled with refund'),
    traveler: c('T6', 'Deadline day', 'T6', 'Group cancelled — refund being processed'),
    advisor: c('V4', 'Group not full — prepare options', 'V4', 'Options sent — cancellation chosen'),
  },
}
const KORAK8: Record<Ishod, Red> = {
  A: {
    organizer: c('G13', 'Final installments due', 'G13', 'All paid — invoices issued'),
    traveler: c('T3', 'Pay installment 3', 'T6', 'Paid in full'),
    advisor: c('V3', 'Final payments', 'V3', 'All payments received'),
  },
  B: {
    organizer: c('G13', 'Final installments due — credit note issued', 'G13', 'All paid — invoices issued'),
    traveler: c('T3', 'Pay installment 3', 'T6', 'Paid in full'),
    advisor: c('V3', 'Final payments', 'V3', 'All payments received'),
  },
  C: {
    organizer: c('G13', 'Refunds being processed', 'G13', 'Refunds confirmed'),
    traveler: c('T6', 'Refund on its way', 'T6', 'Refund confirmed'),
    advisor: c('V3', 'Refunds', 'V3', 'Refunds confirmed'),
  },
}
const KORAK9: Record<Ishod, Red> = {
  A: {
    organizer: c('G16', 'Trip pack being prepared', 'G16', 'Trip pack issued'),
    traveler: c('T9', 'Documents being prepared', 'T9', 'Documents ready'),
    advisor: c('V1', 'Trip pack ready to send', 'V1', 'Trip pack sent'),
  },
  B: {
    organizer: c('G16', 'Trip pack being prepared', 'G16', 'Trip pack issued'),
    traveler: c('T9', 'Documents being prepared', 'T9', 'Documents ready'),
    advisor: c('V1', 'Trip pack ready to send', 'V1', 'Trip pack sent'),
  },
  C: {
    organizer: c('G13', 'Closed', 'G13', 'Closed'),
    traveler: c('T6', 'Closed', 'T6', 'Closed'),
    advisor: c('V3', 'Group ready to close', 'V3', 'Group closed'),
  },
}

/** Ćelija tabele 3.3. Gost nema kolonu u priči (vidi javni sajt), pa za njega vraća null. */
export function celija(korak: number, uloga: Uloga, ishod: Ishod): Celija | null {
  if (uloga === 'guest') return null
  const red: Red = korak <= 6 ? ZAJEDNICKI[korak - 1] : korak === 7 ? KORAK7[ishod] : korak === 8 ? KORAK8[ishod] : KORAK9[ishod]
  return red[uloga]
}

import { radnjeKoraka } from '../prica/koraci'
import type { Poz } from '../prica/tipovi'
import { KUCA, RUTA_PO_ID } from './rute'

/**
 * Ekran u kome je tačno prikazano stanje priče za ulogu: početno → ekran početnog stanja, završno → ekran završnog stanja,
 * usred koraka → ekran sledeće radnje ako je ova uloga izvodi, inače ekran početnog stanja. Gost nema ekran u priči (kuća gosta).
 */
export function ekranZaPoziciju(poz: Poz, uloga: Uloga): EkranId {
  const c = celija(poz.korak, uloga, poz.ishod)
  if (!c) return KUCA[uloga]
  const lista = radnjeKoraka(poz.korak, poz.ishod)
  if (poz.n === 0) return c.pocetno.ekran
  if (poz.n >= lista.length) return c.zavrsno.ekran
  const sl = lista[poz.n]
  if (sl.uloge !== 'any' && sl.uloge.includes(uloga) && RUTA_PO_ID[sl.ekran]?.uloge.includes(uloga)) return sl.ekran
  return c.pocetno.ekran
}
