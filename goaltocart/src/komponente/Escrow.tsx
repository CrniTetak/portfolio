// Escrow kartica "Buyer's security" (UI.md 6.11): katanac, iznos u boji "zaključano", oznaka stanja, partner, maskiran račun.
import type { ReactNode } from 'react'
import { Chip } from './Chip'
import { Ikona } from './Ikona'
import { Kartica } from './Kartica'
import { eur } from '../scenario/format'
import { ESCROW } from '../scenario/strane'
import { jeUradjeno } from '../pravila/radnje'
import { fazaPovracaja } from '../pravila/izvedeno'
import { datumKoraka } from '../scenario/datumi'
import type { Pozicija } from '../prica/tipovi'

export type FazaEscrow = 'ceka' | 'obezbedjeno' | 'isplaceno' | 'odbijeno' | 'povrat' | 'vraceno'

export function fazaEscrow(poz: Pozicija): FazaEscrow {
  const povracaj = fazaPovracaja(poz) // jedna zajednička provera za granu Rejected
  if (povracaj === 'odbijeno') return 'odbijeno'
  if (povracaj === 'pokrenut') return 'povrat'
  if (povracaj !== 'nije') return 'vraceno'
  if (jeUradjeno('p1', poz)) return 'isplaceno'
  if (jeUradjeno('e4', poz)) return 'obezbedjeno'
  return 'ceka'
}

const OZNAKA: Record<FazaEscrow, ReactNode> = {
  ceka: <Chip v="nego" ikona="clock">Waiting for buyer</Chip>,
  obezbedjeno: <Chip v="held" ikona="lock">Held in escrow</Chip>,
  isplaceno: <Chip v="paid" ikona="check">Released</Chip>,
  odbijeno: <Chip v="nego" ikona="undo">Refund to follow</Chip>,
  povrat: <Chip v="nego" ikona="undo">Refund initiated</Chip>,
  vraceno: <Chip v="info" ikona="undo">Returned</Chip>,
}

export function EscrowKartica({ faza, iznos, naslovIznosa, redovi, children }: { faza: FazaEscrow; iznos: number; naslovIznosa: string; redovi: [string, ReactNode][]; children?: ReactNode }) {
  const povratFaza = faza === 'povrat' || faza === 'vraceno'
  return (
    <Kartica naslov="Buyer's deposit" id="escrow" desno={OZNAKA[faza]}>
      <div className="stack-lg">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ color: povratFaza ? 'var(--text-2)' : 'var(--money-held)' }}>
            <Ikona ime={povratFaza ? 'undo' : 'lock'} style={{ width: 28, height: 28 }} />
          </span>
          <div>
            <div className="eyebrow">{naslovIznosa}</div>
            <div className="headline num" style={{ color: faza === 'ceka' || povratFaza ? 'var(--money-sched)' : 'var(--money-held)' }}>{eur(iznos)}</div>
            <div className="muted">
              {faza === 'vraceno'
                ? `Returned to the buyer on ${datumKoraka(7, 'rejected').kraj}`
                : faza === 'povrat'
                  ? 'Being returned to the buyer'
                  : `Held at ${ESCROW.naziv} (${ESCROW.napomena}), separate account for this transfer.`}
            </div>
          </div>
        </div>
        <dl className="terms">
          {redovi.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {children}
      </div>
    </Kartica>
  )
}
