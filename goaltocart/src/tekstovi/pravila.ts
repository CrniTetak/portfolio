// Engleski tekstovi za "Rules check" (S5/B5): naziv provere, kratak opis, "Why this matters".
// Ilustrativan ton: tekstovi opisuju kako bi platforma BILA zamišljena, ne obećavaju ništa i nisu pravni savet.
// Bez iznosa (iznosi se ubacuju na ekranu kroz format.ts); podaci o igraču dolaze iz scenario/strane.ts.
import { IGRAC } from '../scenario/strane'

export interface ProveraTekst {
  id: string
  naziv: string
  opis: string
  zasto: string
}

const STAROST = `Born ${IGRAC.rodjen}, shown as eligible for an international transfer in this illustration`

export const PROVERE_PRODAVCA: ProveraTekst[] = [
  { id: 'window', naziv: 'Transfer window open', opis: 'Both clubs are inside a registration period', zasto: 'A transfer is usually registered while the registration window of the buying association is open, so the platform is designed to check this early.' },
  { id: 'age', naziv: 'Player age and eligibility', opis: STAROST, zasto: 'Rules about the age of players differ between associations. The platform is designed to flag them early, so a problem does not surface late in the process.' },
  { id: 'share', naziv: "Player's 5% share included in the payment plan", opis: 'Paid to the player directly, on behalf of your club', zasto: 'In this illustration the share is part of the agreed plan, so it is included in every payout calculation.' },
  { id: 'education', naziv: 'Estimated education and solidarity obligations', opis: 'Information only: handled through the Clearing House, not via GoalToCart', zasto: 'These obligations exist outside the platform. They are shown as a rough estimate for information only.' },
  { id: 'kyc', naziv: 'KYC and sanctions screening', opis: 'Both parties', zasto: 'In this illustration, payments are meant to move only between parties that have passed identity and sanctions checks.' },
  { id: 'bank', naziv: 'Bank account ownership check', opis: 'The payout account belongs to your club', zasto: 'Checking who owns the payout account is meant to reduce the risk of paying into the wrong account.' },
]

export const PROVERE_KUPCA: ProveraTekst[] = [
  { id: 'window', naziv: 'Transfer window open', opis: 'Both clubs are inside a registration period', zasto: 'A transfer is usually registered while the registration window of your association is open, so the platform is designed to check this early.' },
  { id: 'age', naziv: 'Player age and eligibility', opis: STAROST, zasto: 'Rules about the age of players differ between associations. The platform is designed to flag them early, so a problem does not surface late in the process.' },
  { id: 'share', naziv: "Player's 5% share funded within the plan", opis: 'Included in the amounts you deposit and pay', zasto: 'In this illustration the share is part of the agreed plan, so it is funded together with each installment.' },
  { id: 'aml', naziv: 'AML / KYC trail', opis: 'Identity and source-of-funds checks stored with the deal', zasto: 'A complete trail is designed to help you answer an auditor or a regulator without searching through emails.' },
  { id: 'sanctions', naziv: 'Sanctions screening', opis: 'All parties screened', zasto: 'In this illustration, payments are meant to move only between parties that have passed sanctions screening.' },
  { id: 'trail', naziv: 'Compliance trail', opis: 'Documents stored with versions', zasto: 'Every document, version and approval would be kept, so the deal could be reconstructed step by step.' },
]
