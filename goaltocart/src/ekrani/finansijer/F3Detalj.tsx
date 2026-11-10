// F3. Receivable detail (glavno): potraživanje, dužnik, rate i "What you do not see". Dugme "Make an offer" vodi na F4.
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function F3Detalj() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('F3')
  const p = pogled('financier')
  const vidljivo = gotovo(poz, 'f1')
  if (stanje === 'nije-pocelo' || !vidljivo) {
    return (
      <Ekran id="F3" naslov="Receivable detail">
        <PraznoStanje
          naslov={stanje === 'nije-pocelo' ? 'Not started yet' : 'Not offered yet'}
          opis="The receivable of this story appears here once the selling club offers it to financiers."
          korak={stanje === 'nije-pocelo' ? korakEkrana('F3', 'financier') : null}
        />
      </Ekran>
    )
  }
  const poslato = gotovo(poz, 'f2')
  const pr = p.potrazivanje
  return (
    <Ekran
      id="F3"
      naslov="Receivable detail"
      podnaslov={`${p.prodavac} · debtor ${p.duznik}`}
      akcije={poslato ? <Chip v="nego" ikona="clock">Offer sent</Chip> : <Chip v="sign" ikona="pen">Awaiting your offer</Chip>}
    >
      <div className="grid g-1-1">
        <Kartica naslov="Receivable" id="potrazivanje">
          <div className="stack-lg">
            <Red naziv="Seller" desno={<b>{p.prodavac}</b>} />
            <Red naziv="Debtor" desno={<b>{p.duznik}</b>} />
            <div>
              <div className="eyebrow">Nominal amount</div>
              <div className="headline num">{eur(pr.nominal)}</div>
            </div>
            <div>
              <Red naziv="Installment A" opis={`Due ${pr.rate[0].datum}`} desno={<b className="num">{eur(pr.rate[0].iznos)}</b>} />
              <Red naziv="Installment B" opis={`Due ${pr.rate[1].datum}`} desno={<b className="num">{eur(pr.rate[1].iznos)}</b>} />
            </div>
            <p className="muted">Offer date in this story: {pr.datumPonude}. Installment A is due in {pr.dospeceMeseci[0]} months and installment B in {pr.dospeceMeseci[1]} months (average {pr.prosecnoDospeceMeseci} months).</p>
          </div>
        </Kartica>
        <div className="stack-lg">
          <Kartica naslov="Based on" id="obezbedjenje">
            <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Signed transfer agreement</li>
              <li>Escrow rules for the transfer</li>
              <li>KYC checks shown as passed (illustrative)</li>
            </ul>
          </Kartica>
          <Kartica naslov="What you do not see" id="ne-vidis">
            <p className="muted">Details about the people involved and the other terms of the deal are not shown to you.</p>
          </Kartica>
        </div>
      </div>
      <div className="btnrow">
        {poslato ? <DugmeLink to={putZa('F5')} varijanta="primary">View offer status</DugmeLink> : <DugmeLink to={putZa('F4')} varijanta="primary">Make an offer</DugmeLink>}
      </div>
      <Napomena>This is an illustration of how a receivable could be presented. It is not an investment recommendation.</Napomena>
    </Ekran>
  )
}
