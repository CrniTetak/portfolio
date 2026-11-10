// Cela priča kao UREĐENA lista radnji, po koracima (UX.md 4.0, PLAN B4).
// Svaka pozicija u priči je "prvih N radnji" ove liste. Za Approved granu i za Rejected (od koraka 6).
import { ESCROW, FINANSIJER, KUPAC, PRODAVAC } from '../scenario/strane'
import { avans } from '../scenario/racun'
import { eur } from '../scenario/format'
import { DATUM } from '../scenario/datumi'
import type { Grana, KorakDef, RadnjaDef, Uloga } from './tipovi'
import { BROJ_KORAKA } from './tipovi'

const odobrenje = (id: string, ekran: 'B10' | 'S12', odobrava: 'finance' | 'legal', pazi: string): RadnjaDef => ({
  id,
  uloga: ekran === 'B10' ? 'buying' : 'selling',
  ekran,
  tekst: odobrava === 'finance' ? 'Approve as Finance' : 'Approve as Legal',
  odobrava,
  pazi,
  aktivnost: odobrava === 'finance' ? 'Finance approved (1 of 2)' : 'Legal approved (2 of 2)',
  za: [ekran === 'B10' ? 'buying' : 'selling'],
})

const KORAK_1: RadnjaDef[] = [
  {
    id: 'o1', uloga: 'selling', ekran: 'S3', tekst: 'Send counter-offer',
    pazi: `Offer v1 from ${KUPAC.naziv} is waiting for your reply`,
    aktivnost: 'Counter-offer v2 sent by the selling club',
  },
  {
    id: 'o2', uloga: 'buying', ekran: 'B3', tekst: 'Revise offer',
    pazi: `Counter-offer v2 from ${PRODAVAC.naziv} is waiting for your reply`,
    aktivnost: 'Revised offer v3 sent by the buying club',
  },
  {
    id: 'o3', uloga: 'selling', ekran: 'S3', tekst: 'Accept',
    pazi: `Revised offer v3 from ${KUPAC.naziv} is waiting for your reply`,
    aktivnost: 'Offer v3 accepted by the selling club',
  },
]

const KORAK_2: RadnjaDef[] = [
  {
    id: 't1', uloga: 'agent', ekran: 'A3', tekst: 'Confirm agreed terms',
    pazi: `Confirm the contract terms agreed with ${KUPAC.naziv}`,
    aktivnost: 'Personal terms confirmed by the player\'s agent',
    za: ['buying'],
  },
  {
    id: 't2', uloga: 'buying', ekran: 'B4', tekst: 'Confirm terms',
    pazi: 'Confirm the personal terms agreed with the player and his agent',
    aktivnost: 'Personal terms agreed',
  },
]

const KORAK_3: RadnjaDef[] = [
  {
    id: 'r1', uloga: 'sustav', ekran: 'S5', tekst: 'Simulate: finish the checks',
    ceka: 'Waiting for the checks to finish',
    simulira: [{ uloga: 'selling', ekran: 'S5' }, { uloga: 'buying', ekran: 'B5' }],
    pazi: 'Rules check is running', aktivnost: 'Rules check completed: all checks passed',
  },
]

const KORAK_4: RadnjaDef[] = [
  {
    id: 'g1', uloga: 'selling', ekran: 'S6', tekst: 'Sign with qualified e-signature',
    pazi: `Transfer agreement with ${KUPAC.naziv} awaits your signature, by ${DATUM.potpisRok}`,
    aktivnost: 'Transfer agreement signed by the selling club',
  },
  {
    id: 'g2', uloga: 'buying', ekran: 'B6', tekst: 'Sign with qualified e-signature',
    pazi: 'Transfer agreement and player contract await your signature',
    aktivnost: 'Transfer agreement signed by the buying club',
  },
  {
    id: 'g3', uloga: 'player', ekran: 'P5', tekst: 'Sign with qualified e-signature',
    pazi: `You have 2 documents to sign by ${DATUM.potpisRok}`,
    aktivnost: 'Player contract and agent agreement signed by the player',
    za: ['buying'],
  },
  {
    id: 'g4', uloga: 'agent', ekran: 'A5', tekst: 'Sign with qualified e-signature',
    pazi: 'The agent agreement awaits your signature',
    aktivnost: 'Agent agreement signed by the agent',
    za: ['buying'],
  },
]

const KORAK_5: RadnjaDef[] = [
  {
    id: 'e1', uloga: 'buying', ekran: 'B7', tekst: 'Send for approval',
    pazi: `Escrow deposit is due by ${DATUM.escrowRok}`,
    aktivnost: 'Escrow deposit sent for approval',
    za: ['buying'],
  },
  odobrenje('e2', 'B10', 'finance', 'Escrow deposit awaits your Finance approval (0 of 2)'),
  odobrenje('e3', 'B10', 'legal', 'Escrow deposit awaits your Legal approval (1 of 2)'),
  {
    id: 'e4', uloga: 'sustav', ekran: 'B7', tekst: 'Simulate: escrow partner confirms the deposit',
    ceka: 'Waiting for the escrow partner',
    simulira: [{ uloga: 'buying', ekran: 'B7' }],
    pazi: 'Waiting for the escrow partner to confirm the deposit',
    aktivnost: `Deposit confirmed by ${ESCROW.naziv}`,
  },
]

const KORAK_6: RadnjaDef[] = [
  {
    id: 'm1', uloga: 'buying', ekran: 'B8', tekst: 'Mark as entered in the TMS',
    pazi: 'Enter the registration pack into the TMS and mark it here',
    aktivnost: 'Registration pack entered in the TMS by the buying club',
  },
  {
    id: 'm2', uloga: 'selling', ekran: 'S8', tekst: 'Mark as entered in the TMS',
    pazi: 'Confirm the registration entry in the TMS',
    aktivnost: 'Registration entry confirmed by the selling club',
  },
]

const KORAK_7: RadnjaDef[] = [
  {
    id: 'p1', uloga: 'sustav', ekran: 'S9', tekst: 'Simulate: payout executes',
    ceka: 'Waiting for the payout',
    simulira: [{ uloga: 'selling', ekran: 'S9' }, { uloga: 'buying', ekran: 'B9' }],
    pazi: 'Payout is scheduled', aktivnost: 'Escrow payout executed',
  },
]

const KORAK_8: RadnjaDef[] = [
  {
    id: 'f1', uloga: 'selling', ekran: 'S11', tekst: 'Offer receivable',
    pazi: 'You can turn installments 2 and 3 into cash today',
    aktivnost: 'Receivable offered to 1 financier',
    za: ['selling'],
  },
  {
    id: 'f2', uloga: 'financier', ekran: 'F4', tekst: 'Send offer',
    pazi: 'A new receivable is waiting for your offer',
    aktivnost: `Offer of ${eur(avans)} received from ${FINANSIJER.naziv}`,
    za: ['selling'],
  },
  {
    id: 'f3', uloga: 'selling', ekran: 'S11', tekst: 'Accept',
    pazi: `${FINANSIJER.naziv} offered ${eur(avans)}: accept or decline`,
    aktivnost: 'Financing offer accepted, sent for approval',
    za: ['selling'],
  },
  odobrenje('f4', 'S12', 'finance', `Receivable assignment awaits your Finance approval (0 of 2)`),
  odobrenje('f5', 'S12', 'legal', `Receivable assignment awaits your Legal approval (1 of 2)`),
  // Finansiranje rate 2 ide kroz dvostruko odobrenje, kao uplata u escrow (UX.md, B10)
  {
    id: 'f6', uloga: 'buying', ekran: 'B9', tekst: 'Fund installment 2',
    pazi: `Installment 2 is due on ${DATUM.rata2}`,
    aktivnost: 'Installment 2 funding sent for approval',
    za: ['buying'],
  },
  odobrenje('f7', 'B10', 'finance', 'Installment 2 funding awaits your Finance approval (0 of 2)'),
  { ...odobrenje('f8', 'B10', 'legal', 'Installment 2 funding awaits your Legal approval (1 of 2)'), aktivnost: 'Installment 2 funded and paid out', za: ['selling', 'buying'] },
]

const KORAK_9: RadnjaDef[] = [
  {
    id: 'x1', uloga: 'sustav', ekran: 'S13', tekst: 'Grace period ends',
    ceka: 'Waiting for the grace period to end',
    pazi: 'An installment is overdue', aktivnost: 'Grace period over, evidence pack ready',
  },
]

// Grana Rejected od koraka 7.
const REJ_7: RadnjaDef[] = [
  {
    id: 'rf1', uloga: 'sustav', ekran: 'S13', tekst: 'Simulate: escrow partner returns the funds',
    ceka: 'Waiting for the escrow partner',
    simulira: [{ uloga: 'selling', ekran: 'S13' }, { uloga: 'buying', ekran: 'B11' }],
    pazi: 'Refund is initiated', aktivnost: 'Funds returned to the buyer',
  },
]
const REJ_9: RadnjaDef[] = [
  {
    id: 'rc1', uloga: 'sustav', ekran: 'S13', tekst: 'Simulate: archive the evidence',
    ceka: 'Waiting for the evidence archive',
    simulira: [{ uloga: 'selling', ekran: 'S13' }, { uloga: 'buying', ekran: 'B11' }],
    pazi: 'Archive the evidence', aktivnost: 'Evidence archive stored',
  },
]

const isti = (r: RadnjaDef[]): Record<Grana, RadnjaDef[]> => ({ approved: r, rejected: r })

export const KORACI: KorakDef[] = [
  { broj: 1, kratak: 'Offer', naziv: 'Offer / counter-offer', radnje: isti(KORAK_1) },
  { broj: 2, kratak: 'Personal terms', naziv: 'Personal terms and medical', radnje: isti(KORAK_2) },
  { broj: 3, kratak: 'Rules check', naziv: 'Rules check', radnje: isti(KORAK_3) },
  { broj: 4, kratak: 'Signing', naziv: 'Signing', radnje: isti(KORAK_4) },
  { broj: 5, kratak: 'Security', naziv: 'Security (escrow)', radnje: isti(KORAK_5) },
  { broj: 6, kratak: 'Registration', naziv: 'Registration', radnje: isti(KORAK_6) },
  { broj: 7, kratak: 'Payout', naziv: 'Payout', radnje: { approved: KORAK_7, rejected: REJ_7 } },
  { broj: 8, kratak: 'Installments', naziv: 'Installments, bonuses, sell-on', radnje: { approved: KORAK_8, rejected: [] } },
  { broj: 9, kratak: 'Exceptions', naziv: 'Exceptions', radnje: { approved: KORAK_9, rejected: REJ_9 } },
]

/** Nazivi koraka 7-9 u grani Rejected (traka priče). */
export const NAZIVI_REJECTED: Record<number, { kratak: string; naziv: string }> = {
  7: { kratak: 'Refund', naziv: 'Replaced by refund' },
  8: { kratak: 'Closed', naziv: 'Closed — no installments' },
  9: { kratak: 'Refund confirmed', naziv: 'Refund confirmed' },
}

/** Naziv koraka 8 otkriva bonuse i sell-on, pa za igrača, agenta i finansijera piše samo "Installments". */
const NEUTRALAN_OSMI: Uloga[] = ['player', 'agent', 'financier']

export function nazivKoraka(korak: number, grana: Grana, vrsta: 'kratak' | 'naziv' = 'naziv', uloga?: Uloga): string {
  // Finansijer ne sme da sazna ishod ove priče: od koraka 6 vidi nazive glavne priče.
  if (grana === 'rejected' && NAZIVI_REJECTED[korak] && !(uloga === 'financier' && korak >= 6)) return NAZIVI_REJECTED[korak][vrsta]
  if (korak === 8 && uloga && NEUTRALAN_OSMI.includes(uloga)) return 'Installments'
  return KORACI[korak - 1][vrsta]
}

export function radnjeKoraka(korak: number, grana: Grana): RadnjaDef[] {
  return KORACI[korak - 1].radnje[grana]
}

/** Cela putanja grane kao jedna lista (sa brojem koraka). */
export function putanja(grana: Grana): (RadnjaDef & { korak: number })[] {
  const lista: (RadnjaDef & { korak: number })[] = []
  for (let k = 1; k <= BROJ_KORAKA; k++) for (const r of radnjeKoraka(k, grana)) lista.push({ ...r, korak: k })
  return lista
}

