// A5. Documents: "Agent agreement" (potpisnici igrač i agent) i "Player contract (view)"; potpis kad je na redu.
import { Chip, ZaPotpis } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function A5Dokumenta() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('A5')
  const p = pogled('agent')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="A5" naslov="Documents">
        <PraznoStanje opis="The agent agreement is signed here once the rules check is complete." korak={korakEkrana('A5', 'agent')} />
      </Ekran>
    )
  }
  const g3 = gotovo(poz, 'g3')
  const g4 = gotovo(poz, 'g4')
  return (
    <Ekran
      id="A5"
      naslov="Documents"
      podnaslov={p.klijent.ime}
      akcije={g4 ? <Chip v="paid" ikona="check">Agent agreement signed</Chip> : <Chip v="sign" ikona="pen">Agent agreement not signed</Chip>}
    >
      <div className="grid g-2-1">
        <div className="stack-lg">
          <Kartica naslov="Agent agreement" id="ugovor-agenta">
            <Red naziv="Player" opis={p.klijent.ime} desno={g3 ? <Chip v="paid" ikona="check">Signed</Chip> : <ZaPotpis />} />
            <Red naziv="Agent" opis={p.agent.ime} desno={g4 ? <Chip v="paid" ikona="check">Signed</Chip> : <ZaPotpis />} />
            <p className="muted" style={{ marginTop: 8 }}>
              Commission: <b className="num">{eur(p.provizija.iznos)}</b>, paid by {p.provizija.platiocKupac} on behalf of the player.
            </p>
          </Kartica>
          <Kartica naslov="Player contract (view)" id="ugovor-igraca">
            <p>
              {p.ugovor.godina} years with {p.noviKlub}, gross yearly salary <b className="num">{eur(p.ugovor.godisnjaBruto)}</b>. View only.
            </p>
          </Kartica>
        </div>
        <Kartica naslov="Sign" id="potpis">
          <div className="stack">
            <AkcijaDugme radnja="g4" uloga="agent" ikona="pen" blok />
            <p className="muted" style={{ fontSize: 12.5 }}>The simulated e-signature signs the agent agreement. Nothing is sent.</p>
          </div>
        </Kartica>
      </div>
      <Napomena>The transfer agreement between the clubs is not shown to you.</Napomena>
    </Ekran>
  )
}
