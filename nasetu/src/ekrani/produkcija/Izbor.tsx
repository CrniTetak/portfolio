// P2 — Pripremljen izbor (rezultat briefa).
import { Hourglass, Share2 } from 'lucide-react'
import { useParams } from 'react-router'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { OznakaOpcije } from '../../komponente/Faze'
import { KarticaLokacije } from '../../komponente/KarticaLokacije'
import { Dugme, DugmeLink, Kartica, Naslov, PraznoStanje, Stranica } from '../../komponente/osnovno'
import { jeZiva, pozicija, stanjeOpcije } from '../../logika/opcije'
import { proveriTermin } from '../../logika/termini'
import { DELTA } from '../../podaci/akteri'
import { cenaDana, nadjiLokaciju } from '../../podaci/lokacije'
import { NAZIV_RAZREDA } from '../../logika/novac'
import { briefDelte, opcijeDelte, proveriTerminZaDeltu, zauzetiDani } from '../../stanje/izvedeno'
import { useIzborLokacije } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Izbor() {
  const { id = '' } = useParams()
  const { stanje, salji } = useStanje()
  const { uIzboru, prebaci } = useIzborLokacije()
  const izbor = stanje.izbori.find((i) => i.id === id)
  if (!izbor) return <NedostajeObjekat korak={3} ka="/produkcija" />

  if (izbor.poslatProdukciji === null) {
    return (
      <Stranica>
        <Naslov>{izbor.naziv}</Naslov>
        <PraznoStanje ikona={Hourglass} naslov="Izbor se priprema" tekst="Stiže u 24–48 sati.">
          <DugmeLink to={`/izbor/${izbor.id}/deljenje`} varijanta="sekundarno">Pogledaj moj nacrt izbora</DugmeLink>
        </PraznoStanje>
      </Stranica>
    )
  }

  const brief = briefDelte(stanje)
  const lokacije = izbor.lokacijaIds.map(nadjiLokaciju).filter((l) => !!l)

  return (
    <Stranica>
      <Naslov
        podnaslov="Ove lokacije odgovaraju vašem zahtevu."
        desno={<DugmeLink to={`/izbor/${izbor.id}/deljenje`} ikona={Share2}>Podeli izbor</DugmeLink>}
      >
        {izbor.naziv} <span className="text-xl font-normal text-sek">— pripremio Nasetu</span>
      </Naslov>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lokacije.map((l, i) => {
          const moja = opcijeDelte(stanje).find((o) => o.lokacijaId === l.id && jeZiva(o, stanje.sati))
          const provera = brief ? proveriTerminZaDeltu(stanje, l.id, brief.termin, zauzetiDani(stanje, l)) : null
          const tudjeZauzet = !!brief && !proveriTermin(l.id, brief.termin, stanje.zahtevi.filter((z) => z.produkcijaId !== DELTA), zauzetiDani(stanje, l)).slobodan
          const zastoNe = !brief ? 'Prvo pošaljite zahtev (brief).' : cenaDana(l, brief.razred) === null ? 'Lokacija ne prima ekipu: ' + NAZIV_RAZREDA[brief.razred] + '.' : provera && !provera.slobodan ? provera.razlog : null
          return (
            <div key={l.id} className="flex flex-col gap-2">
              <KarticaLokacije lokacija={l} prva={i === 0} uIzboru={uIzboru(l.id)} mozeDaDodaje={stanje.uloga === 'produkcija'} onPrebaci={() => prebaci(l.id)} zauzet={tudjeZauzet} />
              <Kartica className="flex flex-col gap-3 p-4">
                <p className="text-sm"><b>Zašto je u izboru:</b> {izbor.zasto[l.id] ?? 'Odgovara vašem zahtevu.'}</p>
                <div className="flex flex-wrap items-start gap-2">
                  <DugmeLink to={`/lokacije/${l.id}`} varijanta="sekundarno">Otvori</DugmeLink>
                  {moja ? (
                    <OznakaOpcije stanje={stanjeOpcije(moja, stanje.sati)} pozicija={pozicija(stanje.opcije, moja, stanje.sati)} />
                  ) : (
                    (l.id === 'industrijski-loft' || l.id === 'brutalisticka-hala'
                      ? (
                        <DugmeRadnje
                          id={l.id === 'industrijski-loft' ? 'opcijaLoft' : 'opcijaHala'} varijanta="primarno"
                          disabled={!!zastoNe || stanje.uloga !== 'produkcija'}
                          zasto={stanje.uloga !== 'produkcija' ? 'Opciju traži Produkcija.' : zastoNe}
                          slobodno={() => brief && salji({ tip: 'TRAZI_OPCIJU', lokacijaId: l.id, termin: brief.termin })}
                        >Traži opciju</DugmeRadnje>
                      ) : (
                        <Dugme
                          vanPrice
                          disabled={!!zastoNe || stanje.uloga !== 'produkcija'}
                          zasto={stanje.uloga !== 'produkcija' ? 'Opciju traži Produkcija.' : zastoNe}
                          onClick={() => brief && salji({ tip: 'TRAZI_OPCIJU', lokacijaId: l.id, termin: brief.termin })}
                        >Traži opciju</Dugme>
                      ))
                  )}
                </div>
              </Kartica>
            </div>
          )
        })}
      </div>
    </Stranica>
  )
}
