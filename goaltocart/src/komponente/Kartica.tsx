// Kartice, pločice, napomene i prazna stanja (UI.md 6.4, 6.18).
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Ikona } from './Ikona'
import { usePrica } from '../prica/PricaProvider'
import { gotovo, odbijeno } from '../pravila/izvedeno'
import type { ImeIkone } from './Ikona'

export function Kartica({ naslov, desno, id, children, bezTela, className }: { naslov?: ReactNode; desno?: ReactNode; id?: string; children: ReactNode; bezTela?: boolean; className?: string }) {
  const hid = id ? `${id}-h` : undefined
  return (
    <section className={`card${className ? ' ' + className : ''}`} aria-labelledby={naslov ? hid : undefined}>
      {(naslov || desno) && (
        <header>
          {naslov && <h2 id={hid}>{naslov}</h2>}
          {desno}
        </header>
      )}
      {bezTela ? children : <div className="body">{children}</div>}
    </section>
  )
}

export function KpiPlocica({ oznaka, vrednost, napomena }: { oznaka: string; vrednost: ReactNode; napomena?: ReactNode }) {
  return (
    <div className="card body kpi">
      <div className="label">{oznaka}</div>
      <div className="value num">{vrednost}</div>
      {napomena && <div className="hint">{napomena}</div>}
    </div>
  )
}

/** "Needs your attention" (ćilibarska) ili informativna (plava) pločica. */
export function PlocicaPaznje({ naslov, varijanta = 'warn', ikona, desno, children }: { naslov?: string; varijanta?: 'warn' | 'info' | 'ok'; ikona?: ImeIkone; desno?: ReactNode; children: ReactNode }) {
  const ik: ImeIkone = ikona ?? (varijanta === 'warn' ? 'warn' : varijanta === 'ok' ? 'check' : 'clock')
  return (
    <section className={`attn${varijanta === 'info' ? ' attn--info' : varijanta === 'ok' ? ' attn--ok' : ''}`} aria-label={naslov ?? 'Notice'}>
      <Ikona ime={ik} />
      <div className="grow">
        {naslov && <div className="attn-title">{naslov}</div>}
        <div>{children}</div>
      </div>
      {desno}
    </section>
  )
}

export function Napomena({ ikona = 'info', children }: { ikona?: ImeIkone; children: ReactNode }) {
  return (
    <div className="note">
      <Ikona ime={ikona} sm />
      <div className="grow">{children}</div>
    </div>
  )
}

/** Prazno stanje "Not started yet": isprekidana ivica, ikonica, kratak opis šta će ekran sadržati i u kom koraku nastaje. */
export function PraznoStanje({ naslov = 'Not started yet', opis, korak, naKorak }: { naslov?: string; opis: ReactNode; korak?: number | null; naKorak?: ReactNode }) {
  const { poz, uloga, skoci } = usePrica()
  // Finansijer: isti tekst u obe grane dok mu potraživanje nije ponuđeno (ne sme da sazna ishod ove priče).
  if (uloga === 'financier' && !gotovo(poz, 'f1')) {
    return (
      <div className="empty" data-prazno="da">
        <Ikona ime="hourglass" />
        <h2>Nothing for you at this step</h2>
        <p>{poz.korak < 8 ? 'Your part starts at step 8.' : 'No receivable has been offered to you yet.'}</p>
        {poz.korak < 8 && <button type="button" className="btn btn-secondary" onClick={() => skoci(8)}>Jump to step 8</button>}
      </div>
    )
  }
  // Grana Rejected posle odbijene registracije: ekran nikad ne najavljuje korak koji se neće dogoditi.
  if (odbijeno(poz)) {
    return (
      <div className="empty" data-prazno="da">
        <Ikona ime="hourglass" />
        <h2>Not applicable</h2>
        <p>Not applicable: registration refused.</p>
      </div>
    )
  }
  return (
    <div className="empty" data-prazno="da">
      <Ikona ime="hourglass" />
      <h2>{naslov}</h2>
      <p>{opis}</p>
      {korak ? <p>This screen comes alive at step {korak}.</p> : null}
      {naKorak}
    </div>
  )
}

/** Red "naziv / opis — vrednost" (potpisnici, rate, uslovi). */
export function Red({ naziv, opis, desno }: { naziv: ReactNode; opis?: ReactNode; desno?: ReactNode }) {
  return (
    <div className="signer">
      <div className="grow">
        <b>{naziv}</b>
        {opis && <small className="tnum">{opis}</small>}
      </div>
      {desno}
    </div>
  )
}

export function LinkUNazad({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="btn btn-ghost btn-sm">
      <Ikona ime="left" sm />
      {children}
    </Link>
  )
}
