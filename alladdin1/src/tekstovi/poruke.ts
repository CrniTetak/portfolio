// Unapred napisane poruke (T8 Messages i prozor "Message advisor"). Nema stvarnog četa; brojke i datumi dolaze iz scenario/.
import type { Poz } from '../prica/tipovi'
import { ROK_POPUNJENOSTI, POLAZAK, datumiKoraka } from '../scenario/datumi'
import { datum, eur } from '../scenario/format'
import { RATA2_PO_PUTNIKU } from '../scenario/racun'
import type { StanjeGrupe } from '../scenario/stanjeGrupe'
import { LJUDI, PAKET_MACAU } from '../scenario/strane'

export const PORUKE_SAVETNIKU = ['Could you confirm my room type?', 'I have a question about my payment.', 'Please call me when you have a moment.']

export type PorukaPutnika = { id: string; naslov: string; datum: string; telo: string[] }

/** Poruke koje putnik vidi do tekuće pozicije: Welcome (kad je upisan), Payment reminder (korak 6), Documents ready (trip pack izdat). */
export function porukePutnika(poz: Poz, s: StanjeGrupe): PorukaPutnika[] {
  const lista: PorukaPutnika[] = []
  if (s.marko.upisan)
    lista.push({
      id: 'welcome',
      naslov: `Welcome to ${PAKET_MACAU}`,
      datum: datum(datumiKoraka(5, 'A').at(-1)!),
      telo: [
        `Hello ${LJUDI.putnik.krace},`,
        'you are enrolled in the group. Your seat is covered by the group deposit paid by your organizer.',
        `Your advisor ${LJUDI.savetnik.ime} will keep you informed about the next steps.`,
        'You can follow your payments and documents in your trips.',
      ],
    })
  if (s.marko.upisan && poz.korak >= 6)
    lista.push({
      id: 'reminder',
      naslov: 'Payment reminder: installment 2',
      datum: datum(datumiKoraka(6, 'A')[0]),
      telo: [
        `Hello ${LJUDI.putnik.krace},`,
        `installment 2 of ${eur(RATA2_PO_PUTNIKU)} is due by ${datum(ROK_POPUNJENOSTI)}.`,
        'You can pay from your trip page at any time before the deadline.',
        'If you have already paid, please ignore this message.',
      ],
    })
  // ranije poruke ne nestaju; ishod B i C dodaju svoju poruku
  if (s.marko.upisan && s.izbor === 'B')
    lista.push({
      id: 'manji-blok',
      naslov: 'Your seat is in the smaller block',
      datum: datum(datumiKoraka(7, 'B').at(-1)!),
      telo: [`Hello ${LJUDI.putnik.krace},`, 'the group did not fill by the deadline, and the organizer chose a smaller block. Your seat is in it.', `Your advisor ${LJUDI.savetnik.ime} will confirm the details.`],
    })
  if (s.marko.upisan && s.otkazano)
    lista.push({
      id: 'otkazano',
      naslov: 'Group cancelled — refund',
      datum: datum(datumiKoraka(8, 'C')[0]),
      telo: [`Hello ${LJUDI.putnik.krace},`, `the group was cancelled. Your payment of ${eur(s.marko.povracaj)} is refunded.`, 'No further installments will be charged.'],
    })
  if (s.paketPutovanja === 'issued')
    lista.push({
      id: 'documents',
      naslov: 'Your trip documents are ready',
      datum: datum(datumiKoraka(9, 'A').at(-1)!),
      telo: [
        `Hello ${LJUDI.putnik.krace},`,
        `your vouchers and itinerary for the trip departing ${datum(POLAZAK)} are ready.`,
        'Please open them from your trip page and check your passport validity requirements.',
        `Your advisor ${LJUDI.savetnik.ime} is available if anything is unclear.`,
      ],
    })
  return lista
}
