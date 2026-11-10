// Tekstovi koji zavise od stanja grupe (Action Required, Recent Activity, Needs your attention). Brojke i datumi dolaze iz scenario/, ne kucaju se.
import { ROK_AVANSA, type Dat } from '../scenario/datumi'
import { datum, noci, sedista } from '../scenario/format'
import type { AkcijaPotrebna } from '../scenario/stanjeGrupe'
import { KLUB, PAKET_GRAND_PRIX } from '../scenario/strane'

export function tekstAkcije(a: AkcijaPotrebna): string {
  switch (a.kod) {
    case 'avans_rok':
      return `Group deposit due by ${datum(a.datum)}`
    case 'neplacena_sedista':
      return `${sedista(a.n)} unpaid — fill deadline ${datum(a.datum)}`
    case 'rata3_otvorena':
      return `${a.n} final installments open — due ${datum(a.datum)}`
    case 'neupisani_gp':
      return `${PAKET_GRAND_PRIX}: ${a.n} travelers not enrolled`
  }
}

/** Šta se desilo kad je radnja odrađena (Recent Activity). */
export const AKTIVNOST: Record<string, string> = {
  '1.pretraga': 'Group package selected',
  '1.zahtev': 'Quote request sent to your advisor',
  '2.v1': 'Quote v1 received',
  '3.izmene': 'Changes requested (VIP suites, gala dinner)',
  '3.v2': 'Quote v2 received',
  '4.prihvati': 'Quote v2 accepted',
  '4.transfer': 'Deposit transfer reported',
  '4.avans': 'Deposit received — seats and rooms on option',
  '5.uvoz': 'Passenger list imported',
  '5.link': 'Self-entry link shared with travelers',
  '5.upis1': 'A traveler opened the self-entry link',
  '5.upis2': 'A traveler accepted the terms',
  '5.upis3': 'A traveler finished enrollment',
  '6.rata2': 'A traveler paid installment 2',
  '6.podsetnik': 'Reminders sent to unpaid travelers',
  '7.sim': 'The last seats were paid on the deadline day',
  '7.potvrda': 'Block confirmed with partners',
  '7.opcije': 'Options sent to the organizer',
  '7.izbor': 'Option chosen at the fill deadline',
  '8.rata3': 'A traveler paid the final installment',
  '8.sim': 'All final installments received',
  '8.povracaj': 'Refunds confirmed',
  '9.paket': 'Trip pack issued',
  '9.zatvori': 'Group closed',
}

export const KRATKO_PUTOVANJE = (n: number) => noci(n)
export const UPIT_NASLOV = (klub: string = KLUB) => `New inquiry: ${klub}`
export const ROK_AVANSA_TEKST = (d: Dat = ROK_AVANSA) => datum(d)

/** Natpisi radnji priče (za poruke tipa "First: Send quote v1"); brojke se ne kucaju ovde. */
export const OPISI_RADNJI: Record<string, string> = {
  '1.pretraga': 'Find group packages',
  '1.zahtev': 'Request a group quote',
  '2.v1': 'Send quote v1',
  '3.izmene': 'Request changes',
  '3.v2': 'Send quote v2',
  '4.prihvati': 'Accept the quote',
  '4.transfer': 'Report the transfer',
  '4.avans': 'Mark the deposit received',
  '5.uvoz': 'Import the passenger list',
  '5.link': 'Send the invitation e-mails',
  '5.upis1': 'Continue to the consents',
  '5.upis2': 'Accept the consents',
  '5.upis3': 'Finish enrollment',
  '6.rata2': 'Pay installment 2',
  '6.podsetnik': 'Send the reminders',
  '7.sim': 'Run the deadline-day event',
  '7.potvrda': 'Confirm the block',
  '7.opcije': 'Send the options',
  '7.izbor': 'Choose an option',
  '8.rata3': 'Pay the final installment',
  '8.sim': 'Run the final-payments event',
  '8.povracaj': 'Confirm the refunds',
  '9.paket': 'Send the trip pack',
  '9.zatvori': 'Close the group',
}
