// Tabele rata, bonusa i sell-on (UI.md 6.5): kolone Due date / Amount / Status / Paid from, zbir u podnožju. Telefon: kartice.
import { ChipRate, Chip } from './Chip'
import { Kartica } from './Kartica'
import { usePrica } from '../prica/PricaProvider'
import { daniKasnjenja, statusRate } from '../pravila/izvedeno'
import type { StatusRate } from '../pravila/izvedeno'
import { eur, pct } from '../scenario/format'
import { ESCROW, FINANSIJER } from '../scenario/strane'

interface PodaciRata {
  rate: number[]
  datumi: readonly string[]
}

function izvorIsplate(n: 1 | 2 | 3, status: StatusRate, kupac: boolean): string {
  if (!kupac && (status === 'paid-financier' || status === 'assigned')) return `Escrow, directly to ${FINANSIJER.naziv}`
  if (n === 1) return `Escrow (${ESCROW.naziv})`
  return kupac ? 'Escrow, funded by you' : 'Escrow, funded by the buyer'
}

export function TabelaRata({ podaci, kupac }: { podaci: PodaciRata; kupac: boolean }) {
  const { poz } = usePrica()
  const kasnjenje = daniKasnjenja(poz)
  const ukupno = podaci.rate.reduce((a, b) => a + b, 0)
  return (
    <Kartica naslov="Installments" id="rate" bezTela>
      <div className="tablewrap">
        <table className="t">
          <thead>
            <tr>
              <th>Installment</th>
              <th>Due date</th>
              <th className="r">Amount</th>
              <th>Status</th>
              <th>Paid from</th>
            </tr>
          </thead>
          <tbody>
            {([1, 2, 3] as const).map((n) => {
              const st = statusRate(n, poz)
              return (
                <tr key={n} data-rata={n}>
                  <td className="who" data-label="Installment"><b>Installment {n}</b></td>
                  <td data-label="Due date" className="num">{podaci.datumi[n - 1]}</td>
                  <td data-label="Amount" className="r num">{eur(podaci.rate[n - 1])}</td>
                  <td data-label="Status"><ChipRate status={st} kupac={kupac} kasnjenje={n === 3 ? kasnjenje : null} /></td>
                  <td data-label="Paid from">{izvorIsplate(n, st, kupac)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td data-label="Installment">Total fixed fee</td>
              <td data-label="Due date" className="nolabel" />
              <td data-label="Amount" className="r num">{eur(ukupno)}</td>
              <td data-label="Status" className="nolabel" />
              <td data-label="Paid from" className="nolabel" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Kartica>
  )
}

interface BonusPrikaz {
  id: string
  iznos: number
  opis: string
  izvor: string
}

export function TabelaBonusa({ bonusi, ukupno, nastupi }: { bonusi: BonusPrikaz[]; ukupno: number; nastupi?: { trenutno: number; ukupno: number } }) {
  return (
    <Kartica naslov="Bonuses" id="bonusi" bezTela>
      <div className="tablewrap">
        <table className="t">
          <thead>
            <tr>
              <th>Condition</th>
              <th className="r">Amount</th>
              <th>Progress</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {bonusi.map((b) => (
              <tr key={b.id}>
                <td className="who" data-label="Condition"><b>{b.id}</b><small>{b.opis}</small></td>
                <td data-label="Amount" className="r num">{eur(b.iznos)}</td>
                <td data-label="Progress">
                  {b.id === 'B1' && nastupi ? <Chip v="neutral" ikona="clock">{nastupi.trenutno} / {nastupi.ukupno} appearances</Chip> : <Chip v="neutral" ikona="clock">Not triggered</Chip>}
                </td>
                <td data-label="Source">{b.izvor}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td data-label="Condition">Total, if all are triggered</td>
              <td data-label="Amount" className="r num">{eur(ukupno)}</td>
              <td className="nolabel" />
              <td className="nolabel" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Kartica>
  )
}

export function KarticaSellOn({ postotak, kupac }: { postotak: number; kupac: boolean }) {
  return (
    <Kartica naslov="Sell-on" id="sellon">
      <div className="signer" style={{ borderBottom: 0, padding: 0 }}>
        <div className="grow">
          <b>{pct(postotak)} of net profit on a future sale</b>
          <small>Net profit = future sale price minus the agreed fixed fee</small>
        </div>
        <Chip v="neutral">No future sale recorded</Chip>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>{kupac ? 'An obligation to the selling club, due only if the player is sold.' : 'You receive this share only if the player is sold again.'}</p>
    </Kartica>
  )
}
