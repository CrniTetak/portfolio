// B4. Personal terms & medical: jedini ekran kupca na kom se vide lični uslovi igrača i ugovor sa agentom.
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function B4LicniUslovi() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('B4')
  const p = pogled('buying')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="B4" naslov="Personal terms & medical" transfer crumb="Personal terms">
        <PraznoStanje opis="After the offer is accepted, you agree the player's contract and the agent agreement, and the medical examination takes place." korak={korakEkrana('B4', 'buying')} />
      </Ekran>
    )
  }
  const t1 = gotovo(poz, 't1')
  const t2 = gotovo(poz, 't2')
  const l = p.licniUslovi
  return (
    <Ekran id="B4" naslov="Personal terms & medical" transfer crumb="Personal terms" podnaslov={`${p.igrac.ime} · ${p.igrac.godina}`}>
      <div className="grid g-1-1">
        <div className="card body kpi">
          <div className="label">Personal terms</div>
          <div className="value" style={{ fontSize: 18 }}>
            {t2 ? <Chip v="paid" ikona="check">Agreed</Chip> : t1 ? <Chip v="sign" ikona="pen">Agent confirmed, awaiting you</Chip> : <Chip v="nego" ikona="pen">In negotiation</Chip>}
          </div>
        </div>
        <div className="card body kpi">
          <div className="label">Medical examination</div>
          <div className="value" style={{ fontSize: 18 }}>
            {t2 ? <Chip v="paid" ikona="check">Passed</Chip> : <Chip v="neutral" ikona="clock">Scheduled · {l.termin}</Chip>}
          </div>
        </div>
      </div>

      <div className="grid g-1-1">
        <Kartica naslov="Player contract (summary)" id="ugovor">
          <dl className="terms" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>Duration</dt><dd>{l.godina} years</dd></div>
            <div><dt>Gross yearly salary</dt><dd className="num">{eur(l.godisnjaBruto)}</dd></div>
            <div><dt>Signing-on payments</dt><dd>None</dd></div>
          </dl>
        </Kartica>
        <Kartica naslov="Agent agreement" id="agent">
          <dl className="terms" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>Agent</dt><dd>{p.agent.ime}</dd></div>
            <div><dt>Licence</dt><dd>{p.agent.licenca}<small>valid until {p.agent.licencaVaziDo}</small></dd></div>
            <div><dt>Commission</dt><dd className="num">{eur(p.agent.provizija)}<small>paid by you on behalf of the player, through escrow</small></dd></div>
          </dl>
        </Kartica>
      </div>

      <Kartica naslov="Medical" id="medical">
        <Red naziv="Appointment" opis={`${l.termin} · ${l.klinika}`} desno={t2 ? <Chip v="paid" ikona="check">Passed</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>} />
        <Napomena ikona="lock">Only the outcome is shown here, not any findings.</Napomena>
      </Kartica>

      {!t2 && (
        <div className="btnrow">
          <AkcijaDugme radnja="t2" uloga="buying" />
        </div>
      )}
    </Ekran>
  )
}
