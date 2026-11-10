// Tabela 4.0 iz UX.md kao PODATAK: korak x uloga x grana -> ekran(i), "Show me" cilj, početni i završni opis.
// Prvi ekran u listi je onaj koji "Show me" otvara. Merodavna je tabela iz UX.md, ne narativ.
import { eur } from '../scenario/format'
import { dospecaMeseci, isplata, provizijaAgenta, udeoPoRati, uplataKupca } from '../scenario/racun'
import { DATUM } from '../scenario/datumi'
import { ULOGE } from '../prica/tipovi'
import type { EkranId, Grana, Uloga } from '../prica/tipovi'

export interface Celija {
  ekrani: EkranId[]
  pocetni: string
  zavrsni: string
}

const c = (ekrani: EkranId[], pocetni: string, zavrsni: string): Celija => ({ ekrani, pocetni, zavrsni })
const NISTA = 'Nothing for you at this step'
const FIN_NISTA = c(['F1'], NISTA, NISTA)

type Red = Record<Uloga, Celija>

// ------------------------------------------------------------------ glavni put (Approved)
const APPROVED: Record<number, Red> = {
  1: {
    selling: c(['S3'], 'Offer v1 is waiting for your reply', 'Offer v3 accepted'),
    buying: c(['B3'], 'Offer v1 sent', 'Offer v3 accepted'),
    player: c(['P1'], 'A club has shown interest', 'The clubs have agreed in principle'),
    agent: c(['A2'], 'Waiting for the clubs', 'Clubs agreed: personal terms can start'),
    financier: FIN_NISTA,
  },
  2: {
    selling: c(['S4'], 'Personal terms: not agreed yet', 'Personal terms agreed. Medical: passed'),
    buying: c(['B4'], 'Terms in negotiation, medical scheduled', 'Terms agreed. Medical: passed'),
    player: c(['P2', 'P4'], 'Draft contract, medical scheduled', 'Contract agreed. Medical: passed'),
    agent: c(['A3', 'A4'], 'Negotiation notes in progress', 'Terms confirmed'),
    financier: FIN_NISTA,
  },
  3: {
    selling: c(['S5'], '3 of 6 checks passed', '6 of 6 checks passed'),
    buying: c(['B5'], '3 of 6 checks passed', '6 of 6 checks passed'),
    player: c(['P1'], 'Checks running', 'Your 5% share is included'),
    agent: c(['A6'], 'Licence check running', 'Licence check completed'),
    financier: FIN_NISTA,
  },
  4: {
    selling: c(['S6'], '0 of 2 signatures', '2 of 2 signatures'),
    buying: c(['B6'], 'Documents waiting for signature', 'Documents signed'),
    player: c(['P5'], '0 of 2 documents signed by you', '2 of 2 documents signed by you'),
    agent: c(['A5'], 'Agent agreement not signed', 'Agent agreement signed'),
    financier: FIN_NISTA,
  },
  5: {
    selling: c(['S7'], 'Waiting for buyer', 'Held in escrow'),
    buying: c(['B7', 'B10', 'B7'], 'Deposit ready to prepare', 'Deposit confirmed'),
    player: c(['P1'], 'Waiting for funds', 'Funds are secured'),
    agent: c(['A4'], 'Commission agreed', 'Held in escrow'),
    financier: FIN_NISTA,
  },
  6: {
    selling: c(['S8'], 'Pack ready, not entered yet', 'Entered in the TMS. ITC issued'),
    buying: c(['B8'], 'Pack ready, not entered yet', 'Entered in the TMS. ITC issued'),
    player: c(['P1'], 'Registration in progress', 'Registration approved'),
    agent: c(['A2'], 'Registration in progress', 'Registration approved'),
    financier: FIN_NISTA,
  },
  7: {
    selling: c(['S9'], 'Payout scheduled', `Paid out. Net ${eur(isplata.prodavacNeto)}`),
    buying: c(['B9'], 'Installment 1 scheduled', 'Installment 1 paid out'),
    player: c(['P6'], `Payment scheduled: ${eur(udeoPoRati[0])}`, `Paid on ${DATUM.isplata}`),
    agent: c(['A4'], 'Payment scheduled', `Paid ${eur(provizijaAgenta)}`),
    financier: FIN_NISTA,
  },
  8: {
    selling: c(['S10', 'S11', 'S12', 'S10'], 'Installments tracked, receivable not offered', 'Receivable assigned, installment 2 paid out'),
    buying: c(['B9', 'B10'], `Installment 2 due in ${dospecaMeseci[0]} months`, 'Installment 2 funded'),
    player: c(['P3'], 'Installment 1 paid, installment 2 scheduled', 'Installment 2 paid'),
    agent: c(['A4'], 'Paid', 'Nothing new'),
    financier: c(['F1', 'F2', 'F3', 'F4', 'F5', 'F6'], 'No new receivables', 'Position with installment 2 paid'),
  },
  9: {
    selling: c(['S13'], 'Installment 3 overdue 14 days. Reminder sent', 'Grace period over. Evidence pack ready'),
    buying: c(['B11'], 'Installment 3 overdue 14 days', 'Evidence pack prepared'),
    player: c(['P3', 'P8'], 'Installment 3 delayed', "Waiting for the buyer's installment"),
    agent: c(['A4', 'A7'], 'Nothing new', 'Nothing new'),
    financier: c(['F7'], 'Missed installment: reminder sent', 'Evidence pack described as a process step'),
  },
}

// ------------------------------------------------------------------ grana Rejected (od koraka 6)
const REJECTED: Record<number, Red> = {
  6: {
    selling: c(['S8'], 'Pack ready, not entered yet', 'ITC refused'),
    buying: c(['B8'], 'Pack ready, not entered yet', 'ITC refused'),
    player: c(['P1'], 'Registration in progress', 'Registration not completed'),
    agent: c(['A2'], 'Registration in progress', 'Registration not completed'),
    financier: FIN_NISTA,
  },
  7: {
    selling: c(['S13', 'S7'], 'Refund initiated', 'Returned to buyer'),
    buying: c(['B11', 'B7'], 'Refund initiated', `${eur(uplataKupca)} returned`),
    player: c(['P8'], 'Registration not completed', 'The transfer did not go through'),
    agent: c(['A7'], 'In this illustration, no commission is paid', 'In this illustration, no commission is paid'),
    financier: FIN_NISTA,
  },
  8: {
    selling: c(['S2'], 'Closed: no installments', 'Closed: no installments'),
    buying: c(['B2'], 'Closed: no installments', 'Closed: no installments'),
    player: c(['P1'], 'Closed: no payments from this transfer are scheduled', 'Closed: no payments from this transfer are scheduled'),
    agent: c(['A2'], 'Closed', 'Closed'),
    financier: FIN_NISTA,
  },
  9: {
    selling: c(['S13'], 'Refund confirmed by escrow partner', 'Evidence archive stored'),
    buying: c(['B11'], 'Refund confirmed', 'Evidence archive stored'),
    player: c(['P8'], 'Closed', 'Closed'),
    agent: c(['A7'], 'Closed', 'Closed'),
    financier: FIN_NISTA,
  },
}

/** Ćelija tabele 4.0. Koraci 1-5 su isti u obe grane. */
export function celija(korak: number, uloga: Uloga, grana: Grana): Celija {
  const red = (grana === 'rejected' ? REJECTED[korak] : undefined) ?? APPROVED[korak]
  return red[uloga]
}

/** Ekran koji "Show me" otvara. */
export function showMe(korak: number, uloga: Uloga, grana: Grana): EkranId {
  return celija(korak, uloga, grana).ekrani[0]
}

/** Za testove: cela tabela. */
export function sveCelije(): { korak: number; uloga: Uloga; grana: Grana; celija: Celija }[] {
  const lista: { korak: number; uloga: Uloga; grana: Grana; celija: Celija }[] = []
  for (const grana of ['approved', 'rejected'] as const) {
    for (let korak = 1; korak <= 9; korak++) {
      for (const uloga of ULOGE) lista.push({ korak, uloga, grana, celija: celija(korak, uloga, grana) })
    }
  }
  return lista
}
