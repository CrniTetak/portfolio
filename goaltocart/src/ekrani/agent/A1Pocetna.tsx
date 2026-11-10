// A1. Agent Home: značka licence (tekst, bez zvaničnog znaka), "My client (1)", provizija. Agent vidi SAMO posao svog klijenta.
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, KpiPlocica, PlocicaPaznje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { nazivKoraka } from '../../prica/koraci'
import { sledecaRadnja } from '../../prica/reducer'
import { celija } from '../../pravila/matrica'
import { gotovo, odbijeno as jeOdbijeno } from '../../pravila/izvedeno'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'
import { MiniLinijaFaze } from '../../komponente/Linije'

export default function A1Pocetna() {
  const { poz, zavrsenKorak } = usePrica()
  const p = pogled('agent')
  const sl = sledecaRadnja(poz)
  const moja = sl && sl.uloga === 'agent' ? sl : undefined
  const c = celija(poz.korak, 'agent', poz.grana)
  const placeno = gotovo(poz, 'p1')
  const obezbedjeno = gotovo(poz, 'e4')
  const odbijeno = jeOdbijeno(poz)

  return (
    <Ekran
      id="A1"
      naslov={`Hello, ${p.agent.ime}`}
      podnaslov={`Agent · licence ${p.agent.licenca} (fictional)`}
      akcije={<Chip v="held" ikona="check">Licence valid until {p.agent.licencaVaziDo} (fictional)</Chip>}
    >
      {moja && (
        <PlocicaPaznje naslov="Needs your attention (1)" desno={<DugmeLink to={putZa(moja.ekran)} varijanta="primary" sm>Open</DugmeLink>}>
          <b>{moja.pazi}</b>
        </PlocicaPaznje>
      )}

      <Kartica naslov="My client (1)" id="klijent" desno={<DugmeLink to={putZa('A2')} varijanta="ghost" sm>Client's deal</DugmeLink>}>
        <div className="stack-lg">
          <Red naziv={p.klijent.ime} opis={`${p.klijent.godina} · ${p.klijent.pozicija} · moving to ${p.noviKlub}`} desno={<Chip v="story">Step {poz.korak} · {nazivKoraka(poz.korak, poz.grana, 'kratak')}</Chip>} />
          <MiniLinijaFaze korak={poz.korak} zavrsen={zavrsenKorak} tekst={`Step ${poz.korak} · ${nazivKoraka(poz.korak, poz.grana, 'naziv', 'agent')}`} />
          <p>
            <b>Where it stands:</b> {zavrsenKorak ? c.zavrsni : c.pocetni}
          </p>
        </div>
      </Kartica>

      <div className="btnrow">
        <DugmeLink to={putZa('A7')} varijanta="secondary">Exceptions</DugmeLink>
      </div>
      <div className="grid g-1-1">
        <KpiPlocica
          oznaka="Commission"
          vrednost={odbijeno ? 'Not payable' : eur(p.provizija.iznos)}
          napomena={odbijeno ? `In this illustration, the commission of ${eur(p.provizija.iznos)} is not paid because the transfer did not go through` : placeno ? `Paid on behalf of your client` : obezbedjeno ? 'Held in escrow, to be paid when registration is confirmed' : 'Due at registration'}
        />
        <KpiPlocica oznaka="Paid by" vrednost={<span style={{ fontSize: 18 }}>{p.provizija.platiocKupac}</span>} napomena="On behalf of the player, through escrow" />
      </div>
    </Ekran>
  )
}
