// Oznake stanja (UI.md 6.14): UVEK ikonica + tekst, nikad samo boja.
import type { ReactNode } from 'react'
import { Ikona } from './Ikona'
import type { ImeIkone } from './Ikona'
import type { StatusRate } from '../pravila/izvedeno'
import { FINANSIJER } from '../scenario/strane'

export type VarijantaChipa = 'neutral' | 'nego' | 'info' | 'sign' | 'held' | 'paid' | 'over' | 'story' | 'outline'

export function Chip({ v = 'neutral', ikona, children }: { v?: VarijantaChipa; ikona?: ImeIkone; children: ReactNode }) {
  return (
    <span className={`chip chip--${v}`}>
      {ikona && <Ikona ime={ikona} />}
      {children}
    </span>
  )
}

// Gotove oznake za česta stanja
export const NijePoceo = () => <Chip v="neutral" ikona="clock">Not started yet</Chip>
export const Prosao = ({ children = 'Passed' }: { children?: ReactNode }) => <Chip v="paid" ikona="check">{children}</Chip>
export const NaCekanju = ({ children }: { children: ReactNode }) => <Chip v="nego" ikona="clock">{children}</Chip>
export const ZaPotpis = ({ children = 'To sign' }: { children?: ReactNode }) => <Chip v="sign" ikona="pen">{children}</Chip>

/** Oznaka rate iz ugla igrača: ne zna da je potraživanje ustupljeno, plaćanje je isto. */
export function ChipRataIgrac({ status }: { status: StatusRate }) {
  switch (status) {
    case 'secured':
      return <Chip v="held" ikona="lock">Held in escrow</Chip>
    case 'paid':
    case 'paid-financier':
      return <Chip v="paid" ikona="check">Paid</Chip>
    case 'overdue':
      return <Chip v="over" ikona="warn">Delayed</Chip>
    case 'void':
      return <Chip v="neutral" ikona="undo">Not applicable</Chip>
    default:
      return <Chip v="neutral" ikona="clock">Scheduled</Chip>
  }
}

/** Oznaka rate iz ugla finansijera (rata je njegova pozicija). */
export function ChipRataFinansijer({ status, kasnjenje }: { status: StatusRate; kasnjenje?: number | null }) {
  switch (status) {
    case 'paid':
    case 'paid-financier':
      return <Chip v="paid" ikona="check">Paid</Chip>
    case 'overdue':
      return <Chip v="over" ikona="warn">Overdue{kasnjenje ? ` ${kasnjenje} days` : ''}</Chip>
    case 'void':
      return <Chip v="neutral" ikona="undo">Not applicable</Chip>
    default:
      return <Chip v="neutral" ikona="clock">Scheduled</Chip>
  }
}

/**
 * Oznaka stanja rate. Kupac ne zna da je potraživanje ustupljeno finansijeru (ta informacija ne pripada njegovom pogledu),
 * pa se za njega "assigned" prikazuje kao "Scheduled".
 */
export function ChipRate({ status, kupac, kasnjenje }: { status: StatusRate; kupac?: boolean; kasnjenje?: number | null }) {
  switch (status) {
    case 'scheduled':
      return <Chip v="neutral" ikona="clock">Scheduled</Chip>
    case 'secured':
      return <Chip v="held" ikona="lock">Held in escrow</Chip>
    case 'paid':
      return <Chip v="paid" ikona="check">Paid</Chip>
    case 'assigned':
      return kupac ? <Chip v="neutral" ikona="clock">Scheduled</Chip> : <Chip v="info" ikona="check">Assigned to {FINANSIJER.naziv}</Chip>
    case 'paid-financier':
      return kupac ? <Chip v="paid" ikona="check">Paid</Chip> : <Chip v="paid" ikona="check">Paid to {FINANSIJER.naziv}</Chip>
    case 'overdue':
      // Prodavac je rate 2 i 3 ustupio finansijeru: kašnjenje je kod finansijera, pa ne protivreči sa "Open EUR 0"
      return <Chip v="over" ikona="warn">Overdue{kasnjenje ? ` ${kasnjenje} days` : ''}{kupac ? '' : ' · assigned'}</Chip>
    case 'void':
      return <Chip v="neutral" ikona="undo">Replaced by refund</Chip>
  }
}
