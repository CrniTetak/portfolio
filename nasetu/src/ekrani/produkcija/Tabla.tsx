// P1 — Kontrolna tabla produkcije.
import { FileText, Inbox, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { OznakaFaze, OznakaOpcije } from '../../komponente/Faze'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { DugmeLink, Kartica, Naslov, Natpis, Oznaka, PraznoStanje, Stranica } from '../../komponente/osnovno'
import { SATI_OSPORAVANJE, SATI_OPCIJA } from '../../logika/konstante'
import { CENA_IZBORA_VAN_KATALOGA_CENTI } from '../../logika/konstante'
import { eurKratko, rsdPara, uPare } from '../../logika/novac'
import { efektivniRok, pozicija, stanjeOpcije } from '../../logika/opcije'
import { fazaRezervacije } from '../../logika/rezervacije'
import { terminTekst } from '../../logika/prikaz'
import { formatVreme } from '../../logika/vreme'
import { pibMbTekst } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { briefDelte, izborDelte, opcijeDelte, predracunZa, zahteviDelte } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Tabla() {
  const { stanje } = useStanje()
  const brief = briefDelte(stanje)
  const izbor = izborDelte(stanje)
  const opcije = opcijeDelte(stanje).filter((o) => o.stanje === 'aktivna')
  const zahtevi = zahteviDelte(stanje)
  const imaIzvidjanja = stanje.izvidjanja.filter((i) => i.produkcijaId === 'delta')

  // "Sledeće što čeka vas": najviše dve karte sa akcijom
  const karte: { tekst: string; do: string; dugme: string }[] = []
  if (izbor && zahtevi.length === 0 && opcije.length === 0) karte.push({ tekst: 'Izbor je spreman.', do: `/izbor/${izbor.id}`, dugme: 'Otvori izbor' })
  for (const o of opcije) {
    if (stanjeOpcije(o, stanje.sati) === 'osporena') {
      karte.push({ tekst: `Opcija na lokaciji „${nadjiLokaciju(o.lokacijaId)?.naziv}“ je osporena — potvrdite ili odustanite.`, do: '/produkcija/opcije', dugme: 'Otvori opcije' })
    }
  }
  for (const z of zahtevi) {
    const p = predracunZa(stanje, z.id)
    const faza = fazaRezervacije(z, p, stanje.sati)
    if (faza === 'ceka-uplatu' && p) karte.push({ tekst: 'Vlasnik je odobrio. Predračun čeka uplatu.', do: `/produkcija/predracun/${p.id}`, dugme: 'Otvori predračun' })
    if (faza === 'placeno') karte.push({ tekst: 'Naknada je plaćena. Adresa i kontakt su otvoreni.', do: `/produkcija/rezervacija/${z.id}`, dugme: 'Otvori rezervaciju' })
    // kartica o otkazivanju ide prva, da je ograničenje na dve karte ne sakrije
    if (faza === 'otkazao-vlasnik') karte.unshift({ tekst: 'Vlasnik je otkazao rezervaciju. Naknada se vraća (izmišljeno); pogledajte zamensku lokaciju.', do: `/produkcija/rezervacija/${z.id}`, dugme: 'Otvori rezervaciju' })
  }
  // predračun za izbor van kataloga koji još čeka uplatu
  for (const p of stanje.predracuni) {
    if (p.vrsta === 'izbor-van-kataloga' && p.kupacId === 'delta' && p.uplataPotvrdjena === null) {
      karte.push({ tekst: 'Predračun za izbor van kataloga čeka uplatu.', do: `/produkcija/predracun/${p.id}`, dugme: 'Otvori predračun' })
    }
  }
  // dokumenti se otvaraju iz plaćene rezervacije (ugovor i Brief se popunjavaju iz nje)
  const placena = zahtevi.find((z) => fazaRezervacije(z, predracunZa(stanje, z.id), stanje.sati) === 'placeno')
  const placeno = !!placena
  const refDok = placena ? `&rezervacija=${placena.id}` : ''

  return (
    <Stranica>
      <Naslov desno={<DugmeLink to="/brief?novi=1">Novi zahtev</DugmeLink>}>Produkcija Delta <span className="text-xl font-normal text-sek">(izmišljeno)</span><span className="mt-1 block text-sm font-normal text-sek">{pibMbTekst('delta')}</span></Naslov>

      {karte.length > 0 && (
        <section className="mb-8">
          <Natpis>Sledeće što čeka vas</Natpis>
          <div className="flex flex-col gap-3">
            {karte.slice(0, 2).map((k) => (
              <Kartica key={`${k.do}|${k.tekst}`} className="flex flex-wrap items-center justify-between gap-3 border-l-4 !border-l-akcent p-4">
                <span className="font-medium">{k.tekst}</span>
                <DugmeLink to={k.do} varijanta="sekundarno">{k.dugme}</DugmeLink>
              </Kartica>
            ))}
          </div>
        </section>
      )}

      {!brief ? (
        <PraznoStanje ikona={Inbox} naslov="Još nemate zahteva" tekst="Pošaljite prvi zahtev (brief) i dobijate izbor lokacija u 24–48 sati.">
          <DugmeLink to="/brief?novi=1">Pošalji prvi zahtev</DugmeLink>
        </PraznoStanje>
      ) : (
        <div className="flex flex-col gap-10">
          <section>
            <Natpis>Zahtevi</Natpis>
            <Kartica className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <b>{brief.vrsta}, {brief.grad}</b>
                <p className="text-sm text-sek">Termin: {terminTekst(brief.termin)} · poslato {formatVreme(brief.poslat)}</p>
                {brief.pomocDozvole && <p className="text-sm text-sek">Pomoć oko dozvola — cena po dogovoru</p>}
                {brief.vanKataloga && <p className="text-sm text-sek">Traženje van kataloga (usluga {eurKratko(CENA_IZBORA_VAN_KATALOGA_CENTI)})</p>}
              </div>
              <div className="flex items-center gap-3">
                {brief.izborId ? <Oznaka vrsta="aktivna">Izbor spreman</Oznaka> : <Oznaka vrsta="ceka-vlasnika">Čeka izbor</Oznaka>}
                {izbor && <DugmeLink to={`/izbor/${izbor.id}`} varijanta="sekundarno">Otvori</DugmeLink>}
              </div>
            </Kartica>
          </section>

          {!brief.izborId && (
            <section className="rounded-kartica border-2 border-dashed border-linija-j p-4" aria-label="Za demonstratora">
              <Natpis>Za demonstratora (nije deo proizvoda)</Natpis>
              <p className="mb-3 text-sm text-sek">Izbor lokacija priprema Nasetu tim; u prototipu se to simulira jednim klikom.</p>
              <DugmeRadnje id="izbor" varijanta="sekundarno">Simuliraj: Nasetu tim šalje izbor</DugmeRadnje>
            </section>
          )}

          <section>
            <Natpis>Opcije</Natpis>
            {opcije.length === 0 ? <p className="text-sek">Nemate aktivnih opcija.</p> : (
              <div className="grid gap-3 md:grid-cols-2">
                {opcije.map((o) => {
                  const poz = pozicija(stanje.opcije, o, stanje.sati)
                  return (
                    <Kartica key={o.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <b>{nadjiLokaciju(o.lokacijaId)?.naziv}</b>
                        <OznakaOpcije stanje={stanjeOpcije(o, stanje.sati)} pozicija={poz} />
                      </div>
                      <p className="mb-2 text-sm text-sek">{terminTekst(o.termin)}</p>
                      <Odbrojavanje rok={efektivniRok(o)} sada={stanje.sati} ukupno={o.osporavanje ? SATI_OSPORAVANJE : SATI_OPCIJA} istekloTekst="Opcija je istekla" />
                    </Kartica>
                  )
                })}
              </div>
            )}
            <p className="mt-3"><Link to="/produkcija/opcije" className="font-semibold text-akcent hover:underline">Sve opcije →</Link></p>
          </section>

          <section>
            <Natpis>Rezervacije</Natpis>
            {zahtevi.length === 0 ? <p className="text-sek">Još nema zahteva za rezervaciju.</p> : (
              <div className="flex flex-col gap-3">
                {zahtevi.map((z) => {
                  const p = predracunZa(stanje, z.id)
                  return (
                    <Kartica key={z.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <b>{nadjiLokaciju(z.lokacijaId)?.naziv}</b>
                        <p className="text-sm text-sek">{terminTekst(z.termin)} · cena lokacije <span className="cifre">{rsdPara(uPare(z.osnovicaCenti, z.kurs))}</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OznakaFaze faza={fazaRezervacije(z, p, stanje.sati)} />
                        <DugmeLink to={`/produkcija/rezervacija/${z.id}`} varijanta="sekundarno">Otvori</DugmeLink>
                      </div>
                    </Kartica>
                  )
                })}
              </div>
            )}
          </section>

          {imaIzvidjanja.length > 0 && (
            <section>
              <Natpis>Izviđanja</Natpis>
              {imaIzvidjanja.map((i) => (
                <Kartica key={i.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
                  <div><b>{nadjiLokaciju(i.lokacijaId)?.naziv}</b><p className="text-sm text-sek">{formatVreme(i.kada)} · {i.osoba}</p></div>
                  <DugmeLink to={`/produkcija/izvidjanje/${i.lokacijaId}`} varijanta="sekundarno">Otvori</DugmeLink>
                </Kartica>
              ))}
            </section>
          )}

          <section>
            <Natpis>Dokumenti</Natpis>
            <ul className="flex flex-col gap-2">
              {([['Ugovor o lokaciji (primer)', 'ugovor'], ['Location Brief (primer)', 'brief'], ['Obrazac zapisnika na ulazu i izlazu (primer)', 'zapisnik']] as const).map(([d, dok]) => (
                <li key={d}>
                  <Kartica className={`flex items-center justify-between gap-3 p-4 ${placeno ? '' : '!bg-traka text-prig'}`}>
                    <span className="flex items-center gap-2"><FileText size={18} aria-hidden /> {d}</span>
                    {placeno
                      ? <Link to={`/primeri?dokument=${dok}${refDok}`} className="font-semibold text-akcent hover:underline">Otvori</Link>
                      : <span className="flex items-center gap-1.5 text-sm"><Lock size={14} aria-hidden /> Dostupno posle uplate naknade</span>}
                  </Kartica>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Stranica>
  )
}
