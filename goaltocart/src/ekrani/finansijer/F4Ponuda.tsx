// F4. Make an offer: unapred popunjen obrazac (avans, popust, ilustrativan prinos) i lažno slanje ponude.
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur, pctDecimal } from '../../scenario/format'

function Polje({ id, naziv, vrednost, pomoc }: { id: string; naziv: string; vrednost: string; pomoc?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{naziv}</label>
      <input id={id} className="num" value={vrednost} readOnly aria-describedby={pomoc ? `${id}-pomoc` : undefined} />
      {pomoc && <span className="help" id={`${id}-pomoc`}>{pomoc}</span>}
    </div>
  )
}

export default function F4Ponuda() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('F4')
  const p = pogled('financier')
  const vidljivo = gotovo(poz, 'f1')
  if (stanje === 'nije-pocelo' || !vidljivo) {
    return (
      <Ekran id="F4" naslov="Make an offer">
        <PraznoStanje
          naslov={stanje === 'nije-pocelo' ? 'Not started yet' : 'Nothing to bid on yet'}
          opis="You can make an offer once a receivable has been offered to you."
          korak={stanje === 'nije-pocelo' ? korakEkrana('F4', 'financier') : null}
        />
      </Ekran>
    )
  }
  const poslato = gotovo(poz, 'f2')
  const pr = p.potrazivanje
  return (
    <Ekran
      id="F4"
      naslov="Make an offer"
      podnaslov={`${p.prodavac} · debtor ${p.duznik}`}
      akcije={poslato ? <Chip v="nego" ikona="clock">Offer sent</Chip> : <Chip v="sign" ikona="pen">Pre-filled draft</Chip>}
    >
      <div className="grid g-2-1">
        <Kartica naslov="Your offer (pre-filled)" id="obrazac">
          <div className="stack-lg">
            <div className="fieldgrid">
              <Polje id="f4-avans" naziv="Advance price" vrednost={eur(pr.avans)} pomoc="Paid to the seller if the offer is accepted" />
              <Polje id="f4-nominal" naziv="Nominal amount" vrednost={eur(pr.nominal)} />
              <Polje id="f4-popust" naziv="Discount" vrednost={eur(pr.popust)} pomoc={`${pctDecimal(pr.popustPct)} of the nominal amount`} />
              <Polje id="f4-prinos" naziv="Implied annual yield" vrednost={`about ${pctDecimal(pr.prinosGodisnje)} (illustrative)`} pomoc={`Average maturity ${pr.prosecnoDospeceMeseci} months`} />
              <Polje id="f4-vazi" naziv="Offer valid until" vrednost={pr.vaziDo} pomoc="Pre-filled for the demo" />
            </div>
            {poslato ? (
              <div className="btnrow">
                <DugmeLink to={putZa('F5')} varijanta="primary">View offer status</DugmeLink>
              </div>
            ) : (
              <div className="btnrow">
                <AkcijaDugme radnja="f2" uloga="financier" ikona="send" />
              </div>
            )}
          </div>
        </Kartica>
        <div className="stack-lg">
          {poslato && (
            <PlocicaPaznje varijanta="info" naslov="Offer sent">
              Your offer of <b>{eur(pr.avans)}</b> was sent to {p.prodavac}. Nothing is actually sent in this demo.
            </PlocicaPaznje>
          )}
          <Napomena>Display only. Nothing is typed or saved.</Napomena>
          <Napomena>The yield is a simple illustration based on the discount and the average maturity. It is not a forecast or investment advice.</Napomena>
        </div>
      </div>
    </Ekran>
  )
}
