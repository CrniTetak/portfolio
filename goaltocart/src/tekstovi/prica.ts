// Engleski tekstovi kartica priče (traka demoa). Odvojeni od koda da se ton i jezik lako pregledaju i menjaju.
// Ton je ilustrativan ("in this illustration", "designed to", "would"): nijedna rečenica ne sme da zvuči kao pravna ili finansijska garancija.
// Bez iznosa. Kartica priče se prikazuje svim ulogama, pa osnovni tekst ne sme da otkrije ono što neka uloga ne vidi
// (provizija agenta, igračev udeo): za takve korake postoji tekst PO ULOZI (PRICA_ULOGA).
import type { Grana, Uloga } from '../prica/tipovi'

export interface TekstKoraka {
  /** Opšta priča koraka (2-3 rečenice). */
  prica: string
  /** Jedna rečenica za svaku ulogu: šta ona radi ili vidi u ovom koraku. */
  poUlozi: Record<Uloga, string>
}

/** Finansijer: isti tekst u obe grane, da razlika ne odaje ishod (korak 8 je njegov početak). */
const NISTA_FIN = 'Your part starts at step 8.'

export const PRICA: Record<number, TekstKoraka> = {
  1: {
    prica: 'The buying club proposes a deal. The selling club can accept or counter within the deadline.',
    poUlozi: {
      selling: 'You reply to the offer: counter once, then accept the revised terms.',
      buying: 'You made the first offer and revise it after the counter-offer.',
      player: 'A club has shown interest. Nothing to do yet, and you do not see the offers between the clubs.',
      agent: 'You wait while the clubs agree on the transfer. You do not see the offers between the clubs.',
      financier: NISTA_FIN,
    },
  },
  2: {
    prica: "The buyer, the player and the player's agent agree the player's contract. The selling club only learns that an agreement was reached.",
    poUlozi: {
      selling: 'You only see that the personal terms are agreed and the medical is passed.',
      buying: 'You agree the contract with the player and his agent, and confirm the terms.',
      player: 'You review your contract and attend the medical examination.',
      agent: 'You confirm the terms agreed for your client.',
      financier: NISTA_FIN,
    },
  },
  3: {
    prica: 'Before anything is signed, the platform runs a set of rule checks, for example the transfer window, the player\'s age and sanctions screening.',
    poUlozi: {
      selling: 'You follow the six checks until they all show as passed.',
      buying: 'You follow the checks and keep the compliance trail.',
      player: 'The checks are running.',
      agent: 'Your licence is part of the checks.',
      financier: NISTA_FIN,
    },
  },
  4: {
    prica: "Both the transfer agreement and the player's contract are signed. In this demo the e-signature is simulated.",
    poUlozi: {
      selling: 'You sign the transfer agreement.',
      buying: "You sign the transfer agreement and the player's contract.",
      player: 'You sign your contract and the agent agreement.',
      agent: 'You sign the agent agreement.',
      financier: NISTA_FIN,
    },
  },
  5: {
    prica: 'The buyer deposits the first installment into escrow: a separate account that, in this illustration, is held by a partner bank just for this transfer.',
    poUlozi: {
      selling: 'You see the deposit arrive in escrow, before anything is registered.',
      buying: 'You prepare the deposit, two people approve it, and the escrow partner confirms it.',
      player: 'Once the funds are in escrow, registration can start.',
      agent: 'Your commission is deposited together with the first installment.',
      financier: NISTA_FIN,
    },
  },
  6: {
    prica: 'GoalToCart prepares the data pack. The clubs enter it into the TMS (the transfer matching system) themselves, and the association then responds with the ITC, the international transfer certificate the association issues.',
    poUlozi: {
      selling: 'You confirm that the pack was entered in the TMS.',
      buying: 'You enter the pack into the TMS and mark it here.',
      player: 'Registration is in progress. Nothing to do.',
      agent: 'Registration is in progress. Nothing to do.',
      financier: NISTA_FIN,
    },
  },
  7: {
    prica: 'Once registration is confirmed, escrow pays out in a fixed order: the player\'s share, the platform fees, then the selling club.',
    poUlozi: {
      selling: 'You receive the first installment, net of the player\'s share and your half of the platform fee.',
      buying: 'Installment 1 is paid out; you receive the confirmation.',
      player: "Your first payment is paid to you from escrow on behalf of the selling club, on the same day as the club's installment (in this illustration).",
      agent: 'Your commission is paid out on behalf of your client.',
      financier: NISTA_FIN,
    },
  },
  8: {
    prica: 'Months later: installments are tracked, bonuses depend on official match data, and the selling club can turn the remaining installments into cash.',
    poUlozi: {
      selling: 'You offer the remaining installments to a financier, accept the offer and approve it with a second person.',
      buying: 'You fund installment 2 before it falls due. Two people at your club approve it.',
      player: "Your second payment follows the same schedule: paid to you from escrow on behalf of the selling club, on the same day as the club's installment (in this illustration).",
      agent: 'Nothing new: your commission was paid in step 7.',
      financier: 'You see a receivable, make an offer and follow the installments.',
    },
  },
  9: {
    prica: 'Not everything goes smoothly. A payment is late, and, as a what-if example, here is what would have happened if registration had failed.',
    poUlozi: {
      selling: 'The late installment triggers reminders and an evidence pack.',
      buying: 'You see the late installment and the evidence pack prepared against it.',
      player: "The buyer's installment is late, so in this illustration your last payment follows when that installment arrives.",
      agent: 'Nothing new for you.',
      financier: 'A missed installment is flagged and the evidence is kept ready.',
    },
  },
}

/**
 * Grana Rejected: korak 6 ima ishod "odbijeno", a koraci 7-9 su drugačiji. Ton je ilustrativan ("in this illustration ... is assumed to"):
 * nijedna rečenica ne tvrdi pravilo ili obećanje. Uzrok odbijanja je namerno neutralan.
 */
export const PRICA_REJECTED: Record<number, TekstKoraka> = {
  6: {
    prica: 'In this example, the association did not issue the ITC, the international transfer certificate the association issues. In this illustration, the escrow funds are assumed to be returned to the buyer.',
    poUlozi: {
      selling: 'The registration is refused.',
      buying: 'The registration is refused and, in this illustration, your deposit is assumed to be returned.',
      player: 'The registration was not completed.',
      agent: 'The registration was not completed.',
      financier: NISTA_FIN,
    },
  },
  7: {
    prica: 'The registration did not succeed, so in this illustration the sale is replaced by a refund: the escrow funds are assumed to go back to the buyer.',
    poUlozi: {
      selling: 'In this illustration, nothing is paid out and the funds are assumed to return to the buyer.',
      buying: 'In this illustration, your deposit is assumed to be returned.',
      player: 'You have nothing to do.',
      agent: 'In this illustration, no commission is paid.',
      financier: NISTA_FIN,
    },
  },
  8: {
    prica: 'In this illustration, there are no installments to follow.',
    poUlozi: {
      selling: 'The deal is closed.',
      buying: 'The deal is closed.',
      player: 'No payments from this transfer are scheduled.',
      agent: 'The deal is closed.',
      financier: NISTA_FIN,
    },
  },
  9: {
    prica: 'The escrow partner confirms the refund, and the evidence is then archived.',
    poUlozi: {
      selling: 'Follow the refund confirmation and the evidence archive here.',
      buying: 'Follow the refund confirmation and the evidence archive here.',
      player: 'Nothing more to do.',
      agent: 'Nothing more to do.',
      financier: NISTA_FIN,
    },
  },
}

/**
 * Tekst kartice priče u grani Rejected po ulozi: igrač, agent i finansijer ne smeju da saznaju escrow detalje,
 * a finansijer ne sme da sazna ni ishod ovog transfera (nikad nije imao potraživanje iz njega, D2).
 */
const PRICA_REJECTED_ULOGA: Partial<Record<number, Partial<Record<Uloga, string>>>> = {
  6: {
    player: 'In this example, the association did not issue the ITC, the international transfer certificate the association issues.',
    agent: 'In this example, the association did not issue the ITC, the international transfer certificate the association issues.',
  },
  7: {
    player: 'The transfer did not go through.',
    agent: 'The transfer did not complete.',
  },
  8: {
    player: 'Nothing is left to follow.',
    agent: 'Nothing is left to follow.',
  },
  9: {
    player: 'The case is closed.',
    agent: 'The case is closed.',
  },
}

/**
 * Osnovni tekst koraka koji zavisi od uloge, jer bi opšti tekst otkrio ono što neka uloga ne sme da vidi:
 * udeo igrača (5%) vide prodavac, kupac i igrač; proviziju agenta vide samo kupac i agent.
 */
const PRICA_ULOGA: Partial<Record<number, Partial<Record<Uloga, string>>>> = {
  2: {
    financier: 'The buying club agrees the personal terms of the transfer. These details are not part of what financiers see.',
  },
  3: {
    financier: 'Before anything is signed, the platform runs a set of rule checks, for example the transfer window and sanctions screening.',
    selling: "Before anything is signed, the platform runs a set of rule checks: the transfer window, the player's age, the player's 5% share, estimated education and solidarity obligations, and KYC and sanctions screening.",
    buying: "Before anything is signed, the platform runs a set of rule checks: the transfer window, the player's age, the player's 5% share, estimated education and solidarity obligations, and KYC and sanctions screening.",
    player: "Before anything is signed, the platform runs a set of rule checks: the transfer window, your age, your 5% share, and KYC and sanctions screening.",
  },
  4: {
    financier: 'The transfer agreement and the related contracts are signed. In this demo the e-signature is simulated.',
  },
  7: {
    financier: 'Once registration is confirmed, escrow pays out in a fixed order. Financiers are not part of this first payout.',
    buying: "Once registration is confirmed, escrow pays out in a fixed order: the player's share, the platform fees, the agent commission, then the selling club.",
    agent: 'Once registration is confirmed, escrow pays out in a fixed order.',
    player: 'Once registration is confirmed, escrow pays out in a fixed order, starting with your share.',
  },
  8: {
    player: 'Months later: the remaining installments follow their schedule.',
    agent: 'Months later: the remaining installments follow their schedule.',
    financier: 'Months later: the selling club can offer its remaining installments to financiers, and you follow the installments you take over.',
  },
}

/** Finansijer nikad ne dobija tekst grane Rejected: za njega je priča ista u obe grane (D2). */
export function pricaZa(korak: number, grana: Grana, uloga: Uloga): string {
  if (uloga === 'financier') grana = 'approved'
  if (grana === 'rejected') {
    const po = PRICA_REJECTED_ULOGA[korak]?.[uloga]
    if (po) return po
  }
  if (grana === 'approved') {
    const po = PRICA_ULOGA[korak]?.[uloga]
    if (po) return po
  }
  return tekstKoraka(korak, grana).prica
}

/** Jedna rečenica po ulozi (finansijeru uvek tekst glavne priče). */
export function poUloziZa(korak: number, grana: Grana, uloga: Uloga): string {
  return (uloga === 'financier' ? PRICA[korak] : tekstKoraka(korak, grana)).poUlozi[uloga]
}

export function tekstKoraka(korak: number, grana: Grana): TekstKoraka {
  if (grana === 'rejected' && PRICA_REJECTED[korak]) return PRICA_REJECTED[korak]
  return PRICA[korak]
}

export const NAZIV_ULOGE: Record<Uloga, string> = {
  selling: 'Selling club',
  buying: 'Buying club',
  player: 'Player',
  agent: 'Agent',
  financier: 'Financier',
}

export const KRATKI_NAZIV_ULOGE: Record<Uloga, string> = {
  selling: 'Selling',
  buying: 'Buying',
  player: 'Player',
  agent: 'Agent',
  financier: 'Financier',
}

/** "Waiting for ..." razlog kad je na redu druga strana. */
export const CEKA_ULOGU: Record<Uloga, string> = {
  selling: 'Waiting for the selling club',
  buying: 'Waiting for the buying club',
  player: 'Waiting for the player',
  agent: 'Waiting for the agent',
  financier: 'Waiting for the financier',
}

export const UVOD_ULOGE: Record<Uloga, string> = {
  selling: 'See how you could get paid, track bonuses and sell-on, and offer your receivables.',
  buying: 'See less paperwork, one place for the deal, clear costs and an audit trail.',
  player: 'See your share and your dates. Not the offers between the clubs.',
  agent: "The player's agent: see your client's deal and your commission.",
  financier: 'Review receivables and follow the installments (starts at step 8).',
}

/** igračev udeo isplaćuje escrow u ime prodavca, istog dana kad i ratu prodavca. */
export const ISPLATA_UDELA = "paid to you from escrow on behalf of the selling club, on the same day as the club's installment (in this illustration)"

/** iskren tekst o tome šta igrač vidi (vidi svoj udeo u iznosima, ne ponude, proviziju ni sell-on). */
export const STA_IGRAC_VIDI = 'You see your own share and its dates. You do not see the offers between the clubs, the agent commission or the sell-on terms.'

/** Igrač u grani Rejected (bez escrow detalja). */
export const IGRAC_NEMA_PLACANJA = 'No payments from this transfer are scheduled'

export const PORUKA_SIMULIRANO = 'Simulated action — nothing was sent'
export const NAPOMENA_DEMO = 'Demo — illustrative only, not legal or financial advice'
export const OZNAKA_DEMO = 'DEMO — fictional data'
