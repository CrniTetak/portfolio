// P5. Documents / Signing: dokumenta igrača (ugovor, ugovor sa agentom, saglasnost) i lažni kvalifikovani e-potpis.
import { Chip, ZaPotpis } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'

const Potpisan = ({ t = 'Signed' }: { t?: string }) => <Chip v="paid" ikona="check">{t}</Chip>

export default function P5Dokumenta() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('P5')
  const p = pogled('player')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="P5" naslov="Documents">
        <PraznoStanje opis="Your contract and the agent agreement are signed here once the rules check is complete." korak={korakEkrana('P5', 'player')} />
      </Ekran>
    )
  }
  const g3 = gotovo(poz, 'g3')
  const g4 = gotovo(poz, 'g4')
  return (
    <Ekran
      id="P5"
      naslov="Documents"
      podnaslov={odbijeno(poz) ? p.noviKlub : `${p.noviKlub} · sign by ${DATUM.potpisRok}`}
      akcije={<Chip v={g3 ? 'paid' : 'sign'} ikona={g3 ? 'check' : 'pen'}>{g3 ? 2 : 0} of 2 documents signed by you</Chip>}
    >
      <div className="grid g-2-1">
        <Kartica naslov="Your documents" id="lista">
          <Red naziv="Player contract" opis={`${p.noviKlub} · ${p.ugovor.godina} years`} desno={odbijeno(poz) ? <Chip v="neutral" ikona="undo">Does not take effect</Chip> : g3 ? <Potpisan /> : <ZaPotpis />} />
          <Red naziv="Agent agreement" opis={`With ${p.agent.ime}`} desno={g3 ? <Potpisan t={g4 ? 'Signed by both' : 'Signed by you'} /> : <ZaPotpis />} />
          <Red naziv="Data notice" opis="Information only, shown with your contract" desno={<Chip v="neutral" ikona="doc">Information</Chip>} />
        </Kartica>
        <Kartica naslov="Sign" id="potpis">
          <div className="stack">
            {odbijeno(poz) ? (
              <p className="muted">In this illustration, the contract does not take effect because the registration was refused.</p>
            ) : (
              <>
            <AkcijaDugme radnja="g3" uloga="player" ikona="pen" blok />
            <p className="muted" style={{ fontSize: 12.5 }}>One simulated e-signature signs both documents. Nothing is sent.</p>
              </>
            )}
            {!odbijeno(poz) && g3 && !g4 && <p className="muted" style={{ fontSize: 12.5 }}>The agent agreement is complete once your agent signs.</p>}
          </div>
        </Kartica>
      </div>
      <Napomena>The club's own transfer agreement is signed separately and is not shown to you.</Napomena>
    </Ekran>
  )
}
