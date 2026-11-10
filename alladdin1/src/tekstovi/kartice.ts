// KARTICE PRIČE (UX 3.5) i pomoćni engleski tekstovi okvira. Brojke se UBACUJU iz scenario/, ne kucaju se.
import { BLOK_B, POVRACAJ_UKUPNO_C, SEDISTA } from '../scenario/racun'
import { eur } from '../scenario/format'
import type { Ishod, Poz, Uloga } from '../prica/tipovi'

export const KARTICE_PRICE: string[] = [
  `A club organizer asks for a block of seats and rooms for ${SEDISTA} guests. Nothing is booked yet.`,
  'An advisor answers with a quote: package, price, payment schedule and example cancellation terms.',
  'The organizer asks for VIP suites and a gala dinner; the advisor sends a new quote version.',
  'The organizer accepts the quote and sends the group deposit. Seats and rooms are only on option.',
  'Passengers arrive by CSV import or a self-entry link; each enters their own details and accepts the terms.',
  'Each traveler pays installment 2; the organizer sees who has paid.',
  'On the deadline the block is confirmed with partners if the group is full.',
  'Final installments arrive; invoices are issued per traveler and for the group.',
  "Vouchers, itinerary and the advisor's contact go to everyone before departure.",
]

const KARTICE_B: Record<number, string> = {
  7: `The group did not fill. The advisor confirms a smaller block of ${BLOK_B} seats; the other seats are released.`,
  8: 'Final installments arrive for the smaller block; a credit note covers the released seats.',
}
const KARTICE_C: Record<number, string> = {
  7: 'The group did not fill and the organizer cancels. No partner contract is signed; the refund follows the quote.',
  8: `The group is cancelled. ${eur(POVRACAJ_UKUPNO_C)} is refunded as the quote says; the handling fee is kept.`,
  9: 'The group is closed. Refunds are confirmed and the records stay available.',
}

/** Opšti opis koraka; prati i ishod (A/B/C) za korake 7–9, a posle izbora na koraku 7 nema "If not". */
export function tekstKartice(p: Poz): string {
  const osnovni = KARTICE_PRICE[p.korak - 1]
  if (p.ishod === 'B' && KARTICE_B[p.korak]) return KARTICE_B[p.korak]
  if (p.ishod === 'C' && KARTICE_C[p.korak]) return KARTICE_C[p.korak]
  if (p.korak === 7 && p.n > 0) return 'On the deadline the full block is confirmed with partners.'
  return osnovni
}

type Tri = Record<'organizer' | 'traveler' | 'advisor', string>
const PO_ULOZI: Tri[] = [
  { organizer: 'You describe the group and send the inquiry.', traveler: 'Your part starts at step 5, when you join the group.', advisor: 'You see the new inquiry and prepare the quote.' },
  { organizer: "You wait for the advisor's quote and review version 1.", traveler: 'Your part starts at step 5, when you join the group.', advisor: 'You send quote version 1 to the organizer.' },
  { organizer: 'You ask for changes and review quote version 2.', traveler: 'Your part starts at step 5, when you join the group.', advisor: 'You answer the change request with quote version 2.' },
  { organizer: 'You accept the quote and see how to send the deposit.', traveler: 'Your part starts at step 5, when you join the group.', advisor: 'You confirm that the group deposit has arrived.' },
  { organizer: 'You import passengers or share the link and watch enrollment.', traveler: 'You open the join link, enter your details and accept the terms.', advisor: 'You follow enrollment as travelers complete it.' },
  { organizer: 'You see who has paid and send reminders.', traveler: 'You pay your installment 2.', advisor: 'You track installment 2 and remind unpaid travelers.' },
]
const PO_ULOZI_7: Record<Ishod, Tri> = {
  A: { organizer: 'You see which seats are paid and wait for the block to be confirmed.', traveler: 'You see whether your seat is confirmed.', advisor: 'You confirm the block with the partners once the group is full.' },
  B: { organizer: 'You choose between a smaller block and cancelling with refund.', traveler: 'You see that your seat is in the smaller block.', advisor: 'You send the organizer the options: a smaller block or cancellation.' },
  C: { organizer: 'You choose between a smaller block and cancelling with refund.', traveler: 'You see that the group is cancelled and a refund follows.', advisor: 'You send the organizer the options: a smaller block or cancellation.' },
}
const PO_ULOZI_8: Record<Ishod, Tri> = {
  A: { organizer: 'You follow the final payments and the invoices.', traveler: 'You pay your final installment.', advisor: 'You follow the final payments.' },
  B: { organizer: 'You see the credit note and follow the final payments.', traveler: 'You pay your final installment.', advisor: 'You follow the final payments.' },
  C: { organizer: 'You follow the refunds.', traveler: 'You see the status of your refund.', advisor: 'You confirm the refunds.' },
}
const PO_ULOZI_9: Record<Ishod, Tri> = {
  A: { organizer: 'You receive the trip pack for the group.', traveler: 'You open your trip documents.', advisor: 'You send the trip pack to the organizer and travelers.' },
  B: { organizer: 'You receive the trip pack for the group.', traveler: 'You open your trip documents.', advisor: 'You send the trip pack to the organizer and travelers.' },
  C: { organizer: 'You see the group closed, with its refunds.', traveler: 'You see the closed group and your refund.', advisor: 'You close the group.' },
}

/** Jedna rečenica: šta TA uloga vidi ili radi u ovom koraku (isti obrazac kao u GoalToCart-u i Nasetu). Gost nema ulogu u priči. */
export function poUloziZa(p: Poz, uloga: Uloga): string {
  if (uloga === 'guest') return ''
  const red = p.korak <= 6 ? PO_ULOZI[p.korak - 1] : p.korak === 7 ? PO_ULOZI_7[p.ishod] : p.korak === 8 ? PO_ULOZI_8[p.ishod] : PO_ULOZI_9[p.ishod]
  return red[uloga]
}

/** Ceo opis u traci (računar) i panelu (telefon): opšti opis koraka + jedna rečenica za ulogu. */
export const opisKartice = (p: Poz, uloga: Uloga) => [tekstKartice(p), poUloziZa(p, uloga)].filter(Boolean).join(' ')

export const NAZIVI_ISHODA = { A: 'Group filled', B: 'Smaller block', C: 'Cancel with refund' } as const

export const PORUKE = {
  slobodno: "You're now exploring freely. The story bar stays at the bottom — use it any time.",
  granaVracena: 'Branch reset — the story is back on the main path.',
  nazadNaGlavni: 'Back on the main path — step 7, group filled',
  krajPrice: 'End of story — Restart or explore',
  nemaPotvrde18: 'Please confirm that you are 18 or over to continue.',
} as const

/** Poruka "Branch reset" ostaje duže na ekranu od običnog toasta (gledalac mora da stigne da je pročita). */
export const TRAJANJE_GRANE_MS = 7000
/** Običan toast (WCAG: dovoljno vremena za čitanje); pauzira se dok su miš ili fokus iznad njega. */
export const TRAJANJE_TOASTA_MS = 7000

export const DEMO_TRAKA = 'Demo — illustrative only. Fictional data. Not an offer.'
export const PODNOZJE_TEKST = 'AllAddIn1 does not operate games of chance, does not extend credit for play and does not accept bets.'

