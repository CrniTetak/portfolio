// P2. My contract: sažetak igračevog ugovora (novi klub, trajanje, zarada). Igrač vidi svoj ugovor, ne uslove dogovora između klubova.
import { Chip } from '../../komponente/Chip'
import { DugmeLink, DugmeVanPrice } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function P2Ugovor() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('P2')
  const p = pogled('player')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="P2" naslov="My contract">
        <PraznoStanje opis="Once the clubs have agreed in principle, your contract is discussed between you, your agent and the new club. A summary appears here." korak={korakEkrana('P2', 'player')} />
      </Ekran>
    )
  }
  const dogovoren = gotovo(poz, 't2')
  const potpisan = gotovo(poz, 'g3')
  return (
    <Ekran
      id="P2"
      naslov="My contract"
      podnaslov={`${p.noviKlub} · ${p.ugovor.godina}-year contract`}
      akcije={potpisan ? <Chip v="paid" ikona="check">Signed</Chip> : dogovoren ? <Chip v="info" ikona="check">Agreed</Chip> : <Chip v="nego" ikona="pen">Draft</Chip>}
    >
      <div className="grid g-1-1">
        <Kartica naslov="Contract summary" id="sazetak">
          <dl className="terms" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>New club</dt><dd>{p.noviKlub}</dd></div>
            <div><dt>Duration</dt><dd>{p.ugovor.godina} years</dd></div>
            <div><dt>Starts</dt><dd>{odbijeno(poz) ? 'Does not take effect' : 'After the registration is confirmed'}</dd></div>
            <div><dt>Gross yearly salary</dt><dd className="num">{eur(p.ugovor.godisnjaBruto)}</dd></div>
            <div><dt>Buy-out clause</dt><dd>Not part of this demo</dd></div>
          </dl>
        </Kartica>
        <Kartica naslov="Your agent" id="agent">
          <div className="stack">
            <p><b>{p.agent.ime}</b></p>
            <p className="muted">Licence shown as valid in this illustration. Your agent negotiates the contract with you.</p>
            <Napomena ikona="lock">In this illustration, other parties see only the outcome of the medical.</Napomena>
          </div>
        </Kartica>
      </div>
      <Kartica naslov="Where it stands" id="stanje">
        <p>{odbijeno(poz) ? 'In this illustration, the contract does not take effect because the registration was refused.' : potpisan ? 'You have signed your contract.' : dogovoren ? 'The contract is agreed. It is waiting for your signature.' : 'The contract is a draft, still being agreed between you, your agent and the buying club.'}</p>
      </Kartica>
      <div className="btnrow">
        {poz.korak >= 4 ? (
          <DugmeLink to={putZa('P5')} varijanta={dogovoren && !potpisan ? 'primary' : 'secondary'}>{potpisan ? 'View documents' : 'Open contract to sign'}</DugmeLink>
        ) : (
          <DugmeVanPrice varijanta="secondary" razlog="Available at step 4">Open contract to sign</DugmeVanPrice>
        )}
        <DugmeLink to={putZa('P4')} varijanta="secondary">View medical</DugmeLink>
      </div>
    </Ekran>
  )
}
