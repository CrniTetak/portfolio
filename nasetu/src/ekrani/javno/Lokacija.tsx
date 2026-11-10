// J3 — Strana lokacije: galerija, tehnički list, cenovnik, kalendar, zaključana adresa i radnje.
import { Check, MapPin, Plus, Search } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { Galerija } from '../../komponente/Galerija'
import { Kalendar } from '../../komponente/Kalendar'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { Cenovnik, TehnickiList } from '../../komponente/TehnickiList'
import { ZakljucanaAdresa } from '../../komponente/ZakljucanaAdresa'
import { Iznos } from '../../komponente/Iznos'
import { ObracunVlasniku } from '../../komponente/ObracunVlasniku'
import { Dugme, DugmeLink, Kartica, Oznaka, Pilula, Podnaslov, Stranica } from '../../komponente/osnovno'
import { IKONA_OZNAKE } from '../../komponente/KarticaLokacije'
import { osnovicaZaTermin } from '../../logika/cenovnik'
import { NAKNADA_MINIMUM_CENTI, NAKNADA_PROCENAT, SATI_OPCIJA } from '../../logika/konstante'
import { TEKST_DEPOZITA } from '../../logika/dokumenti'
import { KURS_RSD } from '../../logika/konstante'
import { eurKratko, izracunajNaknadu, kursTekst, NAZIV_RAZREDA } from '../../logika/novac'
import { efektivniRok, jeZiva, pozicija } from '../../logika/opcije'
import { daniTermina } from '../../logika/termini'
import { TIP_VLASNIKA } from '../../podaci/akteri'
import { cenaDana, cenaOd, NAZIV_OZNAKE, razredZaPrimer } from '../../podaci/lokacije'
import { adresaZaUlogu, briefDelte, nadjiUStanju, opcijeDelte, proveriTerminZaDeltu, zauzetiDani } from '../../stanje/izvedeno'
import { useIdiKao, useIzborLokacije } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Lokacija() {
  const { id = '' } = useParams()
  const { stanje, salji } = useStanje()
  const l = nadjiUStanju(stanje, id)
  const { mozeDaDodaje: mozeDaDodajeUloga, uIzboru, prebaci } = useIzborLokacije()
  const idiKao = useIdiKao()
  if (!l) return <Navigate to="/lokacije" replace />

  // nova lokacija (admin je objavio u prototipu) se ne rezerviše i ne dodaje u izbor (odluka O14)
  const nova = !!l.nova
  const mozeDaDodaje = mozeDaDodajeUloga && !nova
  const jeProdukcija = stanje.uloga === 'produkcija' && !nova
  const brief = briefDelte(stanje)
  const termin = brief?.termin
  const provera = termin ? proveriTerminZaDeltu(stanje, l.id, termin, zauzetiDani(stanje, l)) : null
  const moja = opcijeDelte(stanje).find((o) => o.lokacijaId === l.id && jeZiva(o, stanje.sati))
  const poz = moja ? pozicija(stanje.opcije, moja, stanje.sati) : null

  // Zašto "Traži opciju" nije dostupno (obavezna rečenica)
  let zastoNeOpcija: string | null = null
  if (!jeProdukcija) zastoNeOpcija = 'Opciju traži Produkcija.'
  else if (!brief) zastoNeOpcija = 'Prvo pošaljite zahtev (brief).'
  else if (cenaDana(l, brief.razred) === null) zastoNeOpcija = 'Lokacija ne prima ekipu: ' + NAZIV_RAZREDA[brief.razred] + '.'
  else if (!uIzboru(l.id)) zastoNeOpcija = 'Prvo dodajte lokaciju u izbor.'
  else if (provera && !provera.slobodan) zastoNeOpcija = provera.razlog
  else if (moja) zastoNeOpcija = 'Već držite opciju na ovoj lokaciji.'

  // Primer "šta plaćate": jedan snimajući dan na ovoj lokaciji
  const razred = razredZaPrimer(l, brief?.razred ?? 'do30')
  const primerOsnovica = osnovicaZaTermin(l, { snimanje: ['x'], priprema: [] }, razred) ?? 0
  const primer = izracunajNaknadu(primerOsnovica)

  const adresa = adresaZaUlogu(stanje, l.id)

  // Glavne radnje su u JEDNOJ kopiji, u kartici sa cenom (nema više lepljive donje trake: pri dnu je samo traka priče).
  const imaRadnji = mozeDaDodaje || jeProdukcija
  const radnje = imaRadnji ? (
    <div className="flex flex-col gap-3">
      {mozeDaDodaje && (
        <Dugme vanPrice varijanta={uIzboru(l.id) ? 'sekundarno' : 'primarno'} onClick={() => prebaci(l.id)} aria-pressed={uIzboru(l.id)}>
          {uIzboru(l.id) ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
          {uIzboru(l.id) ? 'U izboru' : 'Dodaj u izbor'}
        </Dugme>
      )}
      {jeProdukcija && (
        <DugmeLink to={`/produkcija/zahtev/${l.id}`} varijanta="primarno" aria-label="Zatraži rezervaciju">
          <span className="sm:hidden">Rezervacija</span><span className="hidden sm:inline">Zatraži rezervaciju</span>
        </DugmeLink>
      )}
    </div>
  ) : null

  const dodatno = (
    <div className="flex flex-col gap-3">
      {jeProdukcija && (moja
        ? <DugmeLink to="/produkcija/opcije" varijanta="sekundarno">Moje opcije</DugmeLink>
        : l.id === 'industrijski-loft' || l.id === 'brutalisticka-hala'
          ? <DugmeRadnje id={l.id === 'industrijski-loft' ? 'opcijaLoft' : 'opcijaHala'} primarno varijanta="sekundarno" ikona={Search} disabled={!!zastoNeOpcija}
              slobodno={() => termin && salji({ tip: 'TRAZI_OPCIJU', lokacijaId: l.id, termin })}>Traži opciju</DugmeRadnje>
          : <Dugme vanPrice varijanta="sekundarno" ikona={Search} disabled={!!zastoNeOpcija} aria-describedby="zasto-opcija"
              onClick={() => termin && salji({ tip: 'TRAZI_OPCIJU', lokacijaId: l.id, termin })}>Traži opciju</Dugme>)}
      {jeProdukcija && !moja && zastoNeOpcija && <p id="zasto-opcija" className="text-sm text-sek">Traži opciju: {zastoNeOpcija}</p>}
      {moja && (
        <div className="rounded-dugme border border-linija bg-traka p-3" aria-live="polite">
          <Oznaka vrsta={moja.osporavanje ? 'osporena' : 'aktivna'}>{poz === 1 ? 'Prva' : poz === 2 ? 'Druga' : `${poz}.`} opcija</Oznaka>
          <div className="mt-2"><Odbrojavanje rok={efektivniRok(moja)} sada={stanje.sati} ukupno={moja.osporavanje ? 24 : SATI_OPCIJA} /></div>
        </div>
      )}
      {jeProdukcija
        ? <DugmeLink to={`/produkcija/izvidjanje/${l.id}`} varijanta="link" className="self-start">Zatraži izviđanje</DugmeLink>
        : (!nova && <Dugme varijanta="sekundarno" onClick={() => idiKao('produkcija', `/lokacije/${l.id}`)}>Gledaj kao Produkcija</Dugme>)}
    </div>
  )

  return (
    <Stranica>
      <div>
      <nav aria-label="Putanja" className="mb-4 text-sm text-sek">
        <Link to="/lokacije" className="hover:underline">Lokacije</Link> › <span className="text-mastilo">{l.naziv}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Galerija lokacija={l} />
          <h1 className="mt-6 text-[26px] md:text-[32px]">{l.naziv}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sek"><MapPin size={16} aria-hidden /> {l.opstina}, {l.zona}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pilula>{l.tip}</Pilula>
            {l.stilovi.map((s) => <Pilula key={s}>{s}</Pilula>)}
            {l.oznake.map((o) => <Pilula key={o} ikona={IKONA_OZNAKE[o]}>{NAZIV_OZNAKE[o]}</Pilula>)}
          </div>
          <p className="mt-5 max-w-2xl">{l.opis}</p>

          <section className="mt-10"><Podnaslov>Tehnički list</Podnaslov><TehnickiList lokacija={l} /></section>
          <section className="mt-10"><Podnaslov>Cenovnik</Podnaslov><Cenovnik lokacija={l} /></section>
          <section className="mt-10">
            <Podnaslov>Kalendar zauzetosti</Podnaslov>
            <div className="max-w-sm"><Kalendar zauzeti={l.zauzeti} blokirani={stanje.blokiraniDani[l.id] ?? []} izabrani={termin ? daniTermina(termin) : []} /></div>
          </section>
          <section className="mt-10">
            <Podnaslov>Šta plaćate</Podnaslov>
            <Kartica className="p-5">
              <p>Primer za ovu lokaciju — 1 snimajući dan ({eurKratko(primerOsnovica)}):</p>
              <div className="mt-3"><ObracunVlasniku osnovicaCenti={primerOsnovica} tip={TIP_VLASNIKA[l.vlasnikId] ?? 'pravno'} valuta="eur" /></div>
              <p className="cifre mt-3">Naknada Nasetua {NAKNADA_PROCENAT}%, najmanje {eurKratko(NAKNADA_MINIMUM_CENTI)}: <b className="text-mastilo"><Iznos centi={primer.naknadaCenti} /></b>{primer.primenjenMinimum && ' (primenjen najmanji iznos)'}</p>
              <p className="mt-3 rounded-dugme border-l-4 border-akcent bg-akcent-s px-3 py-2 text-sm font-semibold text-mastilo">Cenu lokacije plaćate direktno vlasniku. Naknadu Nasetuu plaćate predračunom u dinarima.</p>
              <p className="mt-3 text-sm text-sek">{TEKST_DEPOZITA}</p>
            </Kartica>
          </section>
        </div>

        {/* desno: cena + radnje (na telefonu ispod galerije/sadržaja; na desktopu lepljivo) */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Kartica className="p-5 shadow-plutajuce">
            <p className="cifre text-2xl font-bold">od {eurKratko(cenaOd(l))} <span className="text-sm font-normal text-prig">/ snimajući dan</span></p>
            <p className="text-[13px] text-sek">Fakturiše se u dinarima (izmišljen kurs {kursTekst(KURS_RSD)}).</p>
            {nova && <p className="mt-2 rounded-dugme bg-prototip-s px-3 py-2 text-sm text-prototip-tekst">Nova lokacija (izmišljeno). U prototipu se nova lokacija ne rezerviše.</p>}
            {nova && stanje.uloga === 'produkcija' && (
              <div className="my-4 flex flex-col gap-3">
                <Dugme disabled zasto="Nova lokacija se u prototipu ne rezerviše.">Zatraži rezervaciju</Dugme>
                <Dugme varijanta="sekundarno" disabled zasto="Za novu lokaciju se u prototipu ne traži opcija.">Traži opciju</Dugme>
              </div>
            )}
            <div className="my-4 flex flex-col gap-4">{radnje}{dodatno}</div>
            <ZakljucanaAdresa prikaz={adresa} dokumenti={adresa.nivo === 'sve' && jeProdukcija} zastitniPeriod={adresa.nivo === 'sve' && jeProdukcija} />
          </Kartica>
        </aside>
      </div>
      </div>
    </Stranica>
  )
}
