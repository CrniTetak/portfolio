// S12 / B10. Odobrenja: dvostruko odobrenje (Finance + Legal) kao LAŽNI prikaz; "Act as" prekidač uloge u klubu.
// U pravom proizvodu odobrenja se potvrđuju u mobilnoj aplikaciji. Ovde nema nikakve autentikacije.
// Kupac ima dve stavke (uplata u escrow i finansiranje rate 2), prodavac jednu (ustupanje potraživanja).
import { useEffect, useState } from 'react'
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeLink } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { sledecaRadnja } from '../../prica/reducer'
import { gotovo, odbijeno, odobrenjeDepozita, odobrenjeRate2, odobrenjeUstupanja } from '../../pravila/izvedeno'
import type { StanjeOdobrenja } from '../../pravila/izvedeno'
import type { UlogaUKlubu } from '../../pravila/radnje'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'
import { KUPAC, PRODAVAC } from '../../scenario/strane'
import type { EkranId } from '../../prica/tipovi'

type Klub = 'selling' | 'buying'

const NAZIV_U_KLUBU: Record<UlogaUKlubu, string> = { sporting: 'Sporting director', finance: 'Finance', legal: 'Legal' }

interface Stavka {
  id: string
  naslov: string
  stanje: StanjeOdobrenja
  /** radnje odobrenja: [Finance, Legal] */
  ids: [string, string]
  nazad: { ekran: EkranId; oznaka: string }
}

function ChipOdobrenja({ o }: { o: StanjeOdobrenja }) {
  return o.zavrseno ? <Chip v="paid" ikona="check">Completed, 2 of 2</Chip> : <Chip v="sign" ikona="pen">Approvals {o.odobreno} of 2</Chip>
}

export default function Odobrenja({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const id = prodavac ? 'S12' : 'B10'
  const osobe = prodavac ? PRODAVAC.osobe : KUPAC.osobe
  const klub = prodavac ? PRODAVAC.naziv : KUPAC.naziv

  const stavke: Stavka[] = prodavac
    ? [{
        id: 'ustupanje',
        naslov: `Assign receivable and receive advance ${eur(pogled('selling').finansiranje.avans)}`,
        stanje: odobrenjeUstupanja(poz),
        ids: ['f4', 'f5'],
        nazad: { ekran: 'S11', oznaka: 'Back to financing' },
      }]
    : [
        {
          id: 'depozit',
          naslov: `Deposit ${eur(pogled('buying').uplata.ukupno)} into escrow`,
          stanje: odobrenjeDepozita(poz),
          ids: ['e2', 'e3'],
          nazad: { ekran: 'B7', oznaka: 'Back to secure funds' },
        },
        {
          id: 'rata2',
          naslov: `Fund installment 2: ${eur(pogled('buying').dogovoreno.rate[1])} into escrow`,
          stanje: odobrenjeRate2(poz),
          ids: ['f7', 'f8'],
          nazad: { ekran: 'B9', oznaka: 'Back to payments' },
        },
      ]
  const vidljive = stavke.filter((s) => s.stanje.vidljivo)

  // "Act as": podrazumevano je odabrana uloga koja je sledeća na redu (jedan klik je dovoljan), ali se može promeniti
  const sl = sledecaRadnja(poz)
  const aktivna = vidljive.find((s) => sl && s.ids.includes(sl.id))
  const potrebna: UlogaUKlubu | undefined = aktivna && sl ? sl.odobrava : undefined
  const [actAs, setActAs] = useState<UlogaUKlubu>(potrebna ?? 'finance')
  useEffect(() => {
    if (potrebna) setActAs(potrebna)
  }, [potrebna])

  return (
    <Ekran id={id} naslov="Approvals" podnaslov={`${klub} · Two approvals from different people`}>
      <Napomena ikona="shield">In this illustration, every payout and every bank-account change needs two approvals from different people.</Napomena>

      {vidljive.length === 0 && (
        <Kartica naslov="Pending approvals" id="lista">
          <p className="muted">No pending approvals right now.</p>
        </Kartica>
      )}

      {vidljive.map((s) => {
        const finansOdobrio = gotovo(poz, s.ids[0])
        const legalOdobrio = gotovo(poz, s.ids[1])
        const jeAktivna = aktivna?.id === s.id
        return (
          <div className="grid g-2-1" key={s.id}>
            <Kartica naslov={s.naslov} id={`stavka-${s.id}`} desno={<ChipOdobrenja o={s.stanje} />}>
              <div className="stack-lg">
                <p className="muted">Approvals: <b>{s.stanje.odobreno} of 2</b>. The Sporting director can review but not approve payouts.</p>
                <div>
                  <Red naziv={osobe.sporting.uloga} opis={osobe.sporting.ime} desno={<Chip v="neutral" ikona="eye">Can review</Chip>} />
                  <Red naziv={osobe.finance.uloga} opis={osobe.finance.ime} desno={finansOdobrio ? <Chip v="paid" ikona="check">Approved</Chip> : <Chip v="sign" ikona="pen">To approve</Chip>} />
                  <Red naziv={osobe.legal.uloga} opis={osobe.legal.ime} desno={legalOdobrio ? <Chip v="paid" ikona="check">Approved</Chip> : <Chip v="sign" ikona="pen">To approve</Chip>} />
                </div>
                {!s.stanje.zavrseno && jeAktivna && sl && (
                  <>
                    <div className="stack">
                      <span className="lab" style={{ fontSize: 12.5, fontWeight: 600 }} id={`actas-l-${s.id}`}>Act as</span>
                      <div className="seg light" role="group" aria-labelledby={`actas-l-${s.id}`}>
                        {(['sporting', 'finance', 'legal'] as const).map((r) => (
                          <button key={r} type="button" aria-pressed={actAs === r} onClick={() => setActAs(r)}>{NAZIV_U_KLUBU[r]}</button>
                        ))}
                      </div>
                    </div>
                    <div className="btnrow">
                      <AkcijaDugme radnja={sl.id} uloga={uloga} actAs={actAs} ikona="check">{`Approve as ${NAZIV_U_KLUBU[actAs]}`}</AkcijaDugme>
                    </div>
                  </>
                )}
                {s.stanje.zavrseno && (
                  <p><Ikona ime="check" sm /> Completed: approved 2 of 2.</p>
                )}
              </div>
            </Kartica>
            <div className="stack-lg">
              <Kartica naslov="Bank account check" id={`racun-${s.id}`}>
                <p>
                  <Ikona ime="check" sm /> Account holder name matches {klub}: <b>check shown as passed</b>.
                </p>
              </Kartica>
              {!s.stanje.zavrseno && <DugmeLink to={putZa(s.nazad.ekran)} varijanta="secondary">{s.nazad.oznaka}</DugmeLink>}
            </div>
          </div>
        )
      })}

      {prodavac && (
        <Kartica naslov="Payout account" id="isplata">
          <p>
            <Ikona ime="check" sm /> Payout account check passed (illustrative): approved 2 of 2 earlier.{odbijeno(poz) ? '' : ' No new approvals are needed to receive a payout.'}
          </p>
        </Kartica>
      )}

      <Napomena>In a full product, approvals could also be confirmed in a mobile app.</Napomena>
    </Ekran>
  )
}
