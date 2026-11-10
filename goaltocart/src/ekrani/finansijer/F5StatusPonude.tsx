// F5. Offer status (My offers): vremenska linija ponude (poslata -> odobrenja prodavca -> prihvaćena -> sredstva -> ustupljeno).
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { brojGotovih, gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function F5StatusPonude() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('F5')
  const p = pogled('financier')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="F5" naslov="My offers">
        <PraznoStanje opis="Your offers and their status appear here once a receivable is offered to you." korak={korakEkrana('F5', 'financier')} />
      </Ekran>
    )
  }
  const vidljivo = gotovo(poz, 'f1')
  const poslato = gotovo(poz, 'f2')
  const prihvaceno = gotovo(poz, 'f3')
  const odobrenja = brojGotovih(poz, ['f4', 'f5'])
  const dodeljeno = gotovo(poz, 'f5')
  const pr = p.potrazivanje
  if (!poslato) {
    return (
      <Ekran id="F5" naslov="My offers" podnaslov="No offers sent yet">
        <Kartica naslov="Drafts" id="nacrt">
          {vidljivo ? (
            <>
              <Red naziv={`${p.prodavac}: ${eur(pr.avans)} advance`} opis="Draft, not sent" desno={<Chip v="sign" ikona="pen">Draft</Chip>} />
              <div className="btnrow" style={{ marginTop: 12 }}>
                <DugmeLink to={putZa('F4')} varijanta="primary">Open the offer</DugmeLink>
              </div>
            </>
          ) : (
            <p className="muted">No drafts. A draft appears when a receivable is offered to you.</p>
          )}
        </Kartica>
      </Ekran>
    )
  }
  const koraci = [
    { naziv: 'Offer sent', opis: `${eur(pr.avans)} advance, sent on ${pr.datumPonude}`, gotovo: true },
    { naziv: 'Offer accepted by the seller', opis: prihvaceno ? 'The seller accepted your offer' : 'Waiting for the seller to reply', gotovo: prihvaceno },
    { naziv: 'Seller approvals', opis: `${odobrenja} of 2 approvals at the seller`, gotovo: odobrenja === 2 },
    { naziv: 'Funds transferred', opis: dodeljeno ? 'Funds sent from your account (simulated)' : 'After the seller approvals', gotovo: dodeljeno },
    { naziv: 'Receivable assigned', opis: dodeljeno ? 'In this illustration, installments A and B are paid to you from now on' : 'After the funds are transferred', gotovo: dodeljeno },
  ]
  const tekuci = koraci.findIndex((k) => !k.gotovo)
  return (
    <Ekran
      id="F5"
      naslov="My offers"
      podnaslov={`${p.prodavac} · ${eur(pr.avans)} advance`}
      akcije={dodeljeno ? <Chip v="paid" ikona="check">Accepted</Chip> : <Chip v="nego" ikona="clock">In progress</Chip>}
    >
      <div className="grid g-2-1">
        <Kartica naslov="Offer timeline" id="linija">
          <ol className="steps">
            {koraci.map((k, i) => (
              <li key={k.naziv} className={k.gotovo ? '' : i === tekuci ? 'todo now' : 'todo'}>
                <span className="dot">{k.gotovo ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                <div>
                  <b>{k.naziv}</b>
                  <small>{k.opis}</small>
                </div>
              </li>
            ))}
          </ol>
        </Kartica>
        <div className="stack-lg">
          {dodeljeno && (
            <Kartica naslov="Accepted" id="prihvaceno">
              <div className="stack">
                <p><Ikona ime="check" sm /> <b>Accepted: funds sent from your account (simulated).</b></p>
                <DugmeLink to={putZa('F6')} varijanta="primary">View position</DugmeLink>
              </div>
            </Kartica>
          )}
          <Napomena>Nothing is actually transferred in this demo.</Napomena>
          <Napomena>Illustrative only, not investment advice.</Napomena>
        </div>
      </div>
    </Ekran>
  )
}
