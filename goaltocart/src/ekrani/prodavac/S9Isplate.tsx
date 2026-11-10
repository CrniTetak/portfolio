// S9. Payouts: slap isplate prve rate (iz ugla prodavca) i status isplate. Provizija agenta se OVDE NE prikazuje.
import { AkcijaDugme, DugmeLink } from '../../komponente/Dugme'
import { Chip } from '../../komponente/Chip'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { SlapIsplate } from '../../komponente/SlapIsplate'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'
import { ESCROW } from '../../scenario/strane'

export default function S9Isplate() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('S9')
  const p = pogled('selling')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="S9" naslov="Payouts" transfer>
        <PraznoStanje opis="Once registration is confirmed, escrow pays out in a fixed order and you receive the first installment, net of your player's share and fee." korak={korakEkrana('S9', 'selling')} />
      </Ekran>
    )
  }
  // Grana Rejected (povraćaj kupcu): nema isplate
  if (odbijeno(poz)) {
    return (
      <Ekran id="S9" naslov="Payouts" transfer>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="Nothing to pay out">In this illustration, nothing is paid out because the registration was not completed.</PlocicaPaznje>
        <div>
          <DugmeLink to={putZa('S13')} varijanta="secondary">Open exceptions</DugmeLink>
        </div>
      </Ekran>
    )
  }
  const placeno = gotovo(poz, 'p1')
  const s = p.slap
  return (
    <Ekran id="S9" naslov="Payouts" transfer podnaslov={`Installment 1 · ${p.igrac.ime} → ${p.protivStrana.naziv}`}
      akcije={placeno ? <Chip v="paid" ikona="check">Paid</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>}>
      <div className="grid g-2-1">
        <Kartica naslov="Payout waterfall · Installment 1" id="slap" bezTela>
          <SlapIsplate
            naslov="Payout waterfall"
            ukupno={s.ulaz}
            redovi={[
              { vrsta: 'in', naziv: 'Installment 1 in escrow', opis: `Held at ${ESCROW.naziv}`, iznos: s.ulaz },
              { vrsta: 'ded', naziv: "Player's share (5%)", opis: 'Paid to the player on your behalf', iznos: s.udeoIgraca },
              { vrsta: 'ded', naziv: 'Platform fee (your half)', opis: '0.5% of the fixed fee, split between both clubs', iznos: s.naknadaPola },
              { vrsta: 'net', naziv: `Net to ${p.klub.naziv}`, opis: placeno ? `Paid on ${DATUM.isplata}` : `Scheduled for ${DATUM.isplata}`, iznos: s.neto },
            ]}
          />
        </Kartica>
        <div className="stack-lg">
          <Kartica naslov="Payout status" id="status">
            <ol className="steps">
              <li>
                <span className="dot"><Ikona ime="check" /></span>
                <div><b>Scheduled</b><small className="num">{DATUM.registracija} · after registration is confirmed</small></div>
              </li>
              <li>
                <span className="dot"><Ikona ime="check" /></span>
                <div><b>Payout account checked</b><small>Approved 2 of 2 earlier</small></div>
              </li>
              <li className={placeno ? '' : 'todo now'}>
                <span className="dot">{placeno ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                <div>
                  <b>{placeno ? `Paid · ${eur(s.neto)}` : 'Paid'}</b>
                  <small>{placeno ? <>Bank reference <span className="mono">{p.escrow.referencaBanke}</span></> : `Expected ${DATUM.isplata}`}</small>
                </div>
              </li>
            </ol>
            {!placeno && (
              <div className="btnrow" style={{ marginTop: 16 }}>
                <AkcijaDugme radnja="p1" uloga="selling" />
              </div>
            )}
          </Kartica>
          <DugmeLink to={putZa('S12')} varijanta="secondary">View account approvals</DugmeLink>
        </div>
      </div>
      <Napomena>In this illustration escrow pays out in a fixed order: the player's share, platform fees, then you.</Napomena>
    </Ekran>
  )
}
