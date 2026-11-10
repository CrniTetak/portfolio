// S8 / B8. Registration pack: paket podataka za TMS, "Mark as entered in the TMS" (obe strane), odgovor udruženja (ITC).
// TMS i Clearing House postoje samo kao tekst, bez ikakvog zvaničnog znaka.
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmePregled } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno as jeOdbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'

type Klub = 'selling' | 'buying'

export default function Registracija({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const id = prodavac ? 'S8' : 'B8'
  const stanje = useStanjeEkrana(id)
  const p = pogled(uloga)
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id={id} naslov="Registration pack" transfer crumb="Registration">
        <PraznoStanje opis="GoalToCart prepares the data pack for the TMS. The clubs enter it themselves, and the association then issues the ITC." korak={korakEkrana(id, uloga)} />
      </Ekran>
    )
  }
  const m1 = gotovo(poz, 'm1') // kupac je uneo
  const m2 = gotovo(poz, 'm2') // prodavac je potvrdio
  const odbijeno = jeOdbijeno(poz)
  const mojeUneto = prodavac ? m2 : m1
  const drugiUneo = prodavac ? m1 : m2

  const status = m2
    ? odbijeno ? <Chip v="over" ikona="x">ITC refused</Chip> : <Chip v="paid" ikona="check">Entered in the TMS</Chip>
    : <Chip v="info" ikona="doc">Pack ready for the TMS</Chip>

  const stavke: [string, string][] = [
    ['Player identifier', p.igrac.id],
    ['Transfer agreement', 'Signed by both clubs'],
    ['Proof that the first installment is secured', 'Confirmation from the escrow partner'],
    ['Registration data sheet', 'Generated from the agreed terms'],
  ]

  return (
    <Ekran id={id} naslov="Registration pack" transfer crumb="Registration" podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`} akcije={status}>
      {m2 && odbijeno && (
        <PlocicaPaznje naslov="ITC refused" ikona="x">
          In this example, the association did not issue the ITC. In this illustration, the escrow funds are assumed to be returned to the buyer.
        </PlocicaPaznje>
      )}
      <div className="grid g-2-1">
        <Kartica naslov="Pack contents" id="paket" bezTela desno={<DugmePregled varijanta="secondary" sm ikona="download">Download pack</DugmePregled>}>
          <ul className="checks">
            {stavke.map(([naziv, opis]) => (
              <li key={naziv}>
                <span className="tick ok"><Ikona ime="check" /></span>
                <div>
                  {naziv}
                  <small>{opis}</small>
                </div>
                <Chip v="paid" ikona="check">Included</Chip>
              </li>
            ))}
          </ul>
        </Kartica>

        <div className="stack-lg">
          <Kartica naslov="Entry in the TMS" id="unos">
            <div className="stack">
              <Napomena>The pack is prepared here. Entering it into the TMS stays with the club.</Napomena>
              {m2 ? (
                <p><Ikona ime="check" sm /> Both clubs have entered the pack.</p>
              ) : mojeUneto ? (
                <p>You marked the pack as entered. Waiting for the {prodavac ? 'buying' : 'selling'} club.</p>
              ) : drugiUneo ? (
                <p>The {prodavac ? 'buying' : 'selling'} club has entered the pack. Please confirm your entry.</p>
              ) : !prodavac ? (
                <p>Waiting for the selling club's confirmation after you enter the pack.</p>
              ) : (
                <p>The buying club enters the pack first. Then you confirm.</p>
              )}
              {!m2 && <AkcijaDugme radnja={prodavac ? 'm2' : 'm1'} uloga={uloga} ikona="check" />}
            </div>
          </Kartica>
          <Kartica naslov="Association response" id="odgovor">
            <Red
              naziv="International transfer certificate (ITC)"
              opis={m2 ? (odbijeno ? `Refused on ${DATUM.registracija}` : `Issued on ${DATUM.registracija}`) : 'Requested after both clubs have entered the pack'}
              desno={m2 ? (odbijeno ? <Chip v="over" ikona="x">Refused</Chip> : <Chip v="paid" ikona="check">Issued</Chip>) : <Chip v="nego" ikona="clock">Pending</Chip>}
            />
          </Kartica>
        </div>
      </div>
    </Ekran>
  )
}
