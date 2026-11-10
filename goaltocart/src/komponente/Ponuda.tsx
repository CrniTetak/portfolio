// Kartica ponude i istorija verzija (UI.md 6.8). Vrednosti uvek kroz format.ts; razlike među verzijama pišu se REČIMA.
import type { ReactNode } from 'react'
import { Chip } from './Chip'
import { Kartica } from './Kartica'
import { eur, eurRazlika, nizRata, nizRataKratko, pct, poeni } from '../scenario/format'
import type { RazlikaJavna, VerzijaJavna } from '../pravila/vidljivost'

const KO: Record<'buyer' | 'seller', string> = { buyer: 'Buyer', seller: 'Seller' }

function Razlika({ r, vrsta }: { r?: RazlikaJavna; vrsta: 'fiksni' | 'bonusi' | 'sellOn' }) {
  if (!r) return null
  const v = r[vrsta]
  if (v === 0) return <span className="diff">no change</span>
  const tekst = vrsta === 'sellOn' ? `Sell-on ${poeni(v)}` : `${vrsta === 'fiksni' ? 'Fixed fee' : 'Bonuses'} ${eurRazlika(v)}`
  // ćilibar = traži više, zeleno = bliže dogovoru, ali uvek sa tekstom
  const smer = vrsta === 'sellOn' ? (v > 0 ? 'up' : 'down') : v > 0 ? 'up' : 'down'
  return <span className={`diff ${smer}`}>{tekst}</span>
}

/** Trenutna ponuda: naslovna vrednost krupno + uslovi. */
export function UsloviPonude({ v, bonusiRaspis }: { v: VerzijaJavna; bonusiRaspis?: string }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Headline value</div>
        <div className="headline num">{eur(v.naslovna)}</div>
        <div className="muted">{eur(v.fiksni)} fixed + {eur(v.bonusi)} bonuses</div>
      </div>
      <dl className="terms">
        <div>
          <dt>Fixed fee</dt>
          <dd className="num">{eur(v.fiksni)}</dd>
        </div>
        <div>
          <dt>Installments (3)</dt>
          <dd className="num">
            <span className="hide-phone">{nizRata(v.rate)}</span>
            <span className="only-phone">{nizRataKratko(v.rate)}</span>
          </dd>
        </div>
        <div>
          <dt>Bonuses (3)</dt>
          <dd className="num">
            {eur(v.bonusi)}
            {bonusiRaspis && <small>{bonusiRaspis}</small>}
          </dd>
        </div>
        <div>
          <dt>Sell-on</dt>
          <dd className="num">
            {pct(v.sellOnPct)}
            <small>of net profit on a future sale</small>
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Istorija verzija: poređenje kolona na računaru, lista na telefonu (tekuća prva). */
export function IstorijaVerzija({ verzije, razlike, trenutna, naslov = 'Version history', zavrsena }: { verzije: VerzijaJavna[]; razlike: RazlikaJavna[]; trenutna: number; naslov?: string; zavrsena?: ReactNode }) {
  const prikaz = verzije.slice(0, trenutna)
  const raz = (broj: number) => razlike.find((r) => r.u === broj)
  return (
    <Kartica naslov={naslov} id="verzije" bezTela desno={zavrsena}>
      {/* računar: kolone */}
      <div className="cmp-scroll hide-phone">
        <table className="t cmp">
          <thead>
            <tr>
              <th scope="col"><span className="sr">Term</span></th>
              {prikaz.map((v) => (
                <th key={v.broj} scope="col" className={v.broj === trenutna ? 'cur' : undefined}>
                  v{v.broj}
                  {v.broj === trenutna ? ' · current' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="who">From</td>
              {prikaz.map((v) => (
                <td key={v.broj} className={`who${v.broj === trenutna ? ' cur' : ''}`}>{KO[v.od]}, {v.datum}</td>
              ))}
            </tr>
            <tr>
              <td>Fixed fee</td>
              {prikaz.map((v) => (
                <td key={v.broj} className={`num${v.broj === trenutna ? ' cur' : ''}`}>
                  {eur(v.fiksni)}
                  <Razlika r={raz(v.broj)} vrsta="fiksni" />
                </td>
              ))}
            </tr>
            <tr>
              <td>Bonuses</td>
              {prikaz.map((v) => (
                <td key={v.broj} className={`num${v.broj === trenutna ? ' cur' : ''}`}>
                  {eur(v.bonusi)}
                  <Razlika r={raz(v.broj)} vrsta="bonusi" />
                </td>
              ))}
            </tr>
            <tr>
              <td>Sell-on</td>
              {prikaz.map((v) => (
                <td key={v.broj} className={`num${v.broj === trenutna ? ' cur' : ''}`}>
                  {pct(v.sellOnPct)}
                  <Razlika r={raz(v.broj)} vrsta="sellOn" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {/* telefon: lista, tekuća verzija prva */}
      <div className="body only-phone-block">
        <div className="stack">
          {[...prikaz].reverse().map((v) => (
            <div key={v.broj} className="signer">
              <div className="grow">
                <b>v{v.broj} · {KO[v.od]}, {v.datum}</b>
                <small>
                  {eur(v.fiksni)} fixed · {eur(v.bonusi)} bonuses · sell-on {pct(v.sellOnPct)}
                </small>
                <Razlika r={raz(v.broj)} vrsta="fiksni" />
                <Razlika r={raz(v.broj)} vrsta="sellOn" />
              </div>
              {v.broj === trenutna && <Chip v="story">Current</Chip>}
            </div>
          ))}
        </div>
      </div>
    </Kartica>
  )
}
