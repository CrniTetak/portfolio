// S6 / B6. Potpis: skraćen dokument sa istaknutim klauzulama, potpisnici sa oznakama (To sign / Signed), lažni kvalifikovani e-potpis.
import { useState } from 'react'
import { Chip, ZaPotpis } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur, nizRata, pct } from '../../scenario/format'
import { IGRAC, KUPAC, PRODAVAC } from '../../scenario/strane'
import { DATUM } from '../../scenario/datumi'

type Klub = 'selling' | 'buying'

const Potpisan = () => <Chip v="paid" ikona="check">Signed</Chip>

function DokumentUgovor({ uloga }: { uloga: Klub }) {
  const p = pogled(uloga)
  const d = p.dogovoreno
  const { poz } = usePrica()
  if (odbijeno(poz)) {
    // Registracija odbijena: uslovi se ne izvršavaju, pa se ne ponavljaju rate, bonusi ni sell-on.
    return (
      <div className="doc">
        <h3>Transfer agreement · summary</h3>
        Fixed fee <s className="num">{eur(d.fiksni)}</s>.
        <br />
        In this illustration, these terms are not carried out because the registration was refused.
      </div>
    )
  }
  return (
    <div className="doc">
      <h3>Transfer agreement · summary</h3>
      Fixed fee <mark className="num">{eur(d.fiksni)}</mark> in 3 installments (<span className="num">{nizRata(d.rate)}</span>);
      bonuses up to <mark className="num">{eur(d.bonusiUkupno)}</mark>; sell-on <mark>{pct(d.sellOnPct)}</mark> of net profit on a future sale;
      payment on registration confirmation, through escrow.
      <br />
      In this illustration, if the registration is not completed, the escrow funds would be returned to the buyer.
    </div>
  )
}

function DokumentIgrac({ uloga }: { uloga: 'buying' }) {
  const p = pogled(uloga)
  const { poz } = usePrica()
  if (odbijeno(poz)) {
    return (
      <div className="doc">
        <h3>Player contract · summary (buyer signatory)</h3>
        In this illustration, the contract does not take effect because the registration was refused.
      </div>
    )
  }
  return (
    <div className="doc">
      <h3>Player contract · summary (buyer signatory)</h3>
      Duration <mark>{p.licniUslovi.godina} years</mark>; gross yearly salary <mark className="num">{eur(p.licniUslovi.godisnjaBruto)}</mark>; no signing-on payments.
      <br />
      Signed by the buying club and by the player.
    </div>
  )
}

export default function Potpis({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const id = prodavac ? 'S6' : 'B6'
  const stanje = useStanjeEkrana(id)
  const p = pogled(uloga)
  const [dok, setDok] = useState<'ugovor' | 'igrac'>('ugovor')

  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id={id} naslov="Signing" transfer>
        <PraznoStanje opis="In this illustration the transfer agreement is signed here with a simulated e-signature, once the rules check is complete." korak={korakEkrana(id, uloga)} />
      </Ekran>
    )
  }

  const g1 = gotovo(poz, 'g1')
  const g2 = gotovo(poz, 'g2')
  const g3 = gotovo(poz, 'g3')
  const potpisa = (g1 ? 1 : 0) + (g2 ? 1 : 0)
  const dokumenataPotpisano = (g1 && g2 ? 1 : 0) + (g3 ? 1 : 0)
  const sve = potpisa === 2 && (prodavac || g3)

  return (
    <Ekran
      id={id}
      naslov="Signing"
      transfer
      podnaslov={`${IGRAC.ime} → ${p.protivStrana.naziv}`}
      akcije={
        <Chip v={prodavac ? (potpisa === 2 ? 'paid' : 'sign') : dokumenataPotpisano === 2 ? 'paid' : 'sign'} ikona={sve ? 'check' : 'pen'}>
          {prodavac ? `${potpisa} of 2 signatures` : `${dokumenataPotpisano} of 2 documents fully signed`}
        </Chip>
      }
    >
      <div className="grid g-2-1">
        <Kartica naslov={prodavac ? 'Transfer agreement' : dok === 'ugovor' ? 'Transfer agreement' : 'Player contract'} id="dokument"
          desno={
            !prodavac && (
              <div className="seg light" role="group" aria-label="Document">
                <button type="button" aria-pressed={dok === 'ugovor'} onClick={() => setDok('ugovor')}>Transfer agreement</button>
                <button type="button" aria-pressed={dok === 'igrac'} onClick={() => setDok('igrac')}>Player contract</button>
              </div>
            )
          }
        >
          <div className="stack">
            {prodavac || dok === 'ugovor' ? <DokumentUgovor uloga={uloga} /> : <DokumentIgrac uloga="buying" />}
            {prodavac && <Napomena>The player's own contract is signed separately and is not shown here.</Napomena>}
          </div>
        </Kartica>

        <Kartica naslov="Signers" id="potpisnici">
          <div className="stack">
            <div>
              <Red
                naziv="Seller signatory"
                opis={`${PRODAVAC.osobe.sporting.uloga}, ${PRODAVAC.naziv}`}
                desno={g1 ? <Potpisan /> : <ZaPotpis />}
              />
              <Red
                naziv="Buyer signatory"
                opis={KUPAC.naziv}
                desno={g2 ? <Potpisan /> : <ZaPotpis />}
              />
              {!prodavac && dok === 'igrac' && <Red naziv="Player" opis={IGRAC.ime} desno={g3 ? <Potpisan /> : <ZaPotpis />} />}
            </div>
            <AkcijaDugme radnja={prodavac ? 'g1' : 'g2'} uloga={uloga} ikona="pen" blok />
            {!prodavac && (
              <p className="muted" style={{ fontSize: 12.5 }}>
                {odbijeno(poz)
                  ? 'In this illustration, the signed documents are not carried out because the registration was refused.'
                  : `You sign both documents in one step. The player signs his contract separately; deadline ${DATUM.potpisRok}.`}
              </p>
            )}
          </div>
        </Kartica>
      </div>
    </Ekran>
  )
}
