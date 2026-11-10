// V2 — Zahtev za rezervaciju (vlasnik): rok 48 h, Odobri / Odbij, zaštita istog termina, prednost prve opcije (A2),
// dokumenti posle uplate (A3) i simulacija "Vlasnik otkazuje plaćenu rezervaciju" (B5).
import { Check, FileText, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { Iznos } from '../../komponente/Iznos'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { Dugme, Kartica, KLASA_POLJA, Naslov, Natpis, Oznaka, Polje, ProzorPotvrde, Stranica } from '../../komponente/osnovno'
import { SATI_ZAHTEV_VLASNIKA } from '../../logika/konstante'
import { brutoNeto, kursTekst, NAZIV_RAZREDA } from '../../logika/novac'
import { opisTermina, terminTekst } from '../../logika/prikaz'
import { mozeLiOdobriti, mozeLiOtkazatiVlasnik, stanjeZahteva } from '../../logika/rezervacije'
import { nazivAktera, pibMbTekst, TIP_VLASNIKA } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { akterTrenutni, predracunZa, zauzetiDani } from '../../stanje/izvedeno'
import { PrebaciPrikaz } from './PrebaciPrikaz'
import { useStanje } from '../../stanje/StanjeProvider'

const RAZLOZI = ['Termin nije slobodan', 'Nije pogodno', 'Drugo']

export default function Zahtev() {
  const { id = '' } = useParams()
  const { stanje, salji, vodjeno, izvedi } = useStanje()
  const [razlog, setRazlog] = useState(RAZLOZI[0])
  const [poruka, setPoruka] = useState<string | null>(null)
  const [pitaZaOtkazivanje, setPitaZaOtkazivanje] = useState(false)
  const z = stanje.zahtevi.find((x) => x.id === id)
  const l = nadjiLokaciju(z?.lokacijaId ?? '')
  if (!z || !l) return <NedostajeObjekat korak={6} ka="/vlasnik" />
  // vlasnik vidi samo zahteve za svoje lokacije
  if (l.vlasnikId !== akterTrenutni(stanje)) return <PrebaciPrikaz vlasnikId={l.vlasnikId} />

  const tip = TIP_VLASNIKA[l.vlasnikId] ?? 'pravno'
  const st = stanjeZahteva(z, stanje.sati)
  const odluka = mozeLiOdobriti(z, stanje.zahtevi, zauzetiDani(stanje, l), stanje.sati, stanje.opcije)
  const bn = brutoNeto(z.osnovicaCenti, tip)
  const p = predracunZa(stanje, z.id)
  const placeno = st === 'odobren' && p?.uplataPotvrdjena != null
  const mozeOtkazati = mozeLiOtkazatiVlasnik(z, p, stanje.sati)
  const ref = `rezervacija=${z.id}`

  return (
    <Stranica uzak>
      <Naslov>Zahtev za rezervaciju — {l.naziv}</Naslov>

      <Kartica className="mb-6 p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-sek">Produkcija</dt><dd className="font-medium">{nazivAktera(z.produkcijaId)}<span className="block text-sm font-normal text-sek">{pibMbTekst(z.produkcijaId)}</span></dd>
          <dt className="text-sek">Termin</dt><dd className="font-medium">{terminTekst(z.termin)} ({opisTermina(z.termin)})</dd>
          <dt className="text-sek">Veličina ekipe</dt><dd className="font-medium">{NAZIV_RAZREDA[z.razred]}</dd>
          {z.prekovremeniSati > 0 && <><dt className="text-sek">Prekovremeni sati</dt><dd className="font-medium">{z.prekovremeniSati}</dd></>}
          {z.domacin && <><dt className="text-sek">Domaćin na snimanju</dt><dd className="font-medium">Da — usluga Nasetua, ne ulazi u vaš iznos</dd></>}
        </dl>
      </Kartica>

      <Kartica className="mb-6 p-5">
        {st === 'ceka' && (
          <>
            <p className="mb-2 text-lg font-semibold">Odgovorite u roku od {SATI_ZAHTEV_VLASNIKA} h</p>
            <Odbrojavanje rok={z.rok} sada={stanje.sati} ukupno={SATI_ZAHTEV_VLASNIKA} prefiks="Preostalo" />
          </>
        )}
        {st === 'istekao' && <Oznaka vrsta="istekla" velika>Zahtev je istekao</Oznaka>}
        {st === 'odobren' && <Oznaka vrsta="placeno" velika>Odobreno</Oznaka>}
        {st === 'odbijen' && <><Oznaka vrsta="odbijeno" velika>Odbijeno</Oznaka>{z.razlog && <p className="mt-2 text-sm text-sek">Razlog: {z.razlog}</p>}</>}
        {st === 'otkazao-vlasnik' && <Oznaka vrsta="odbijeno" velika>Otkazali ste rezervaciju</Oznaka>}
      </Kartica>

      <Kartica className="mb-6 p-5">
        <table className="cifre w-full text-sm">
          <caption className="sr-only">Iznosi za vlasnika u dinarima</caption>
          <tbody>
            <tr className="border-b border-linija"><td className="py-2">Bruto (cena lokacije)</td><td className="py-2 text-right font-semibold"><Iznos centi={bn.brutoCenti} kurs={z.kurs} /></td></tr>
            {tip === 'fizicko' && <tr className="border-b border-linija"><td className="py-2">Porez po odbitku (orijentaciono)</td><td className="py-2 text-right">−<Iznos centi={bn.porezCenti} kurs={z.kurs} /></td></tr>}
            <tr><td className="pt-3 font-bold">Neto (iznos koji dobijate)</td><td className="pt-3 text-right text-xl font-bold"><Iznos centi={bn.netoCenti} kurs={z.kurs} /></td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-sek">Naknadu Nasetua plaća produkcija; ona se ne odbija od vašeg iznosa. Fakturišete u dinarima po izmišljenom kursu ({kursTekst(z.kurs)}).</p>
        <p className="mt-1 text-sm text-prig">Orijentaciono i izmišljeno; nije poreski savet.</p>
      </Kartica>

      {st === 'ceka' && !poruka && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start gap-3">
            <DugmeRadnje id="odobri" primarno ikona={Check} disabled={!odluka.moze} zasto={odluka.razlog}
              slobodno={() => { salji({ tip: 'ODOBRI_ZAHTEV', zahtevId: z.id }); setPoruka('Odobreno. Produkcija je obaveštena i dobija predračun naknade.') }}
              naIzvedeno={() => setPoruka('Odobreno. Produkcija je obaveštena i dobija predračun naknade.')}>Odobri</DugmeRadnje>
          </div>
          <Kartica className="flex flex-wrap items-end gap-3 p-4">
            <Polje naziv="Razlog odbijanja" htmlFor="razlog">
              <select id="razlog" className={`${KLASA_POLJA} !w-auto`} value={razlog} onChange={(e) => setRazlog(e.target.value)}>
                {RAZLOZI.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Polje>
            <Dugme vanPrice varijanta="opasno" ikona={X} onClick={() => { salji({ tip: 'ODBIJ_ZAHTEV', zahtevId: z.id, razlog }); setPoruka('Odbijeno.') }}>Odbij</Dugme>
          </Kartica>
        </div>
      )}
      {poruka && <p className="rounded-dugme bg-[#F0FDF4] p-4 font-semibold text-uspeh" role="status">{poruka}</p>}
      {st === 'odobren' && !poruka && !placeno && <p className="font-semibold text-uspeh">Odobreno. Produkcija je obaveštena i dobija predračun naknade.</p>}

      {placeno && (
        <section className="mt-6">
          <Natpis>Dokumenti ove rezervacije</Natpis>
          <p className="mb-2 text-sm text-sek">Naknada je plaćena. Iste dokumente vidi i produkcija.</p>
          <ul className="flex flex-col gap-2">
            {[['ugovor', 'Ugovor o lokaciji (primer)'], ['brief', 'Location Brief (primer)'], ['zapisnik', 'Obrazac zapisnika na ulazu i izlazu (primer)']].map(([dok, naziv]) => (
              <li key={dok}><Link to={`/primeri?dokument=${dok}&${ref}`} className="flex min-h-11 items-center gap-2 rounded-kartica border border-linija bg-white p-3 font-semibold text-akcent hover:underline"><FileText size={18} aria-hidden /> {naziv}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {/* B5 — simulacija: samo za plaćenu rezervaciju, samo pre prvog dana termina */}
      {(placeno || st === 'otkazao-vlasnik') && (
        <section className="mt-6 rounded-kartica border-2 border-dashed border-linija-j p-4">
          <Natpis>Simulacija: vlasnik otkazuje plaćenu rezervaciju</Natpis>
          {st === 'otkazao-vlasnik' ? (
            <p className="text-sm" role="status">Rezervacija je otkazana. Produkcija vidi da joj se naknada vraća (izmišljeno) i dobija predlog zamenske lokacije; termin je ponovo slobodan.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-sek">Po predlogu blueprinta naknada se vraća produkciji, a ponovljeno otkazivanje vodi isključenju vlasnika (bez funkcije u prototipu).</p>
              <DugmeRadnje id="otkazi" primarno varijanta="opasno" disabled={!mozeOtkazati.moze} zasto={mozeOtkazati.razlog} preKlik={() => setPitaZaOtkazivanje(true)}>Otkaži rezervaciju</DugmeRadnje>
            </>
          )}
        </section>
      )}
      {pitaZaOtkazivanje && (
        <ProzorPotvrde
          naslov="Otkazati plaćenu rezervaciju?" tekst="Naknada se vraća produkciji (izmišljeno), termin se oslobađa, a adresa se ponovo zatvara."
          potvrdi="Otkaži rezervaciju" odustani="Odustani"
          onPotvrdi={() => { setPitaZaOtkazivanje(false); if (vodjeno) izvedi('otkazi'); else salji({ tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: z.id }) }} onOdustani={() => setPitaZaOtkazivanje(false)}
        />
      )}
      <p className="mt-6"><Link to="/vlasnik" className="font-semibold text-akcent hover:underline">← Nazad na tablu</Link></p>
    </Stranica>
  )
}
