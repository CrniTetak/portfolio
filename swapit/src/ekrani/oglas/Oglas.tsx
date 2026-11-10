// O1 „Oglas“ (UX 6.4): jedan ekran za sve varijante: roba, usluga (Firma), ideja, nekretnine i vozila, sveže voće i povrće (jabučica),
// istaknuto, „Poklanjam“, „Za poene“, javna aukcija. Sve se izvodi iz podataka oglasa i stanja priče; nema fiksnih brojki.
import { ArrowRightLeft, Flag, Gift, MapPin, MessageCircle, Star } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { Inicijali } from '../../komponente/Inicijali'
import { imeVlasnika } from '../../komponente/KarticaOglasa'
import { Jabucica } from '../../komponente/Logo'
import { Mapa, isecakMape } from '../../komponente/Mapa'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja, ObavestenjeNekretnine, PravaPotrosaca } from '../../komponente/Obavestenja'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { SlikaOglasa } from '../../komponente/SlikaOglasa'
import { NavodjenjeAutora } from '../../komponente/Slika'
import { Veza, useLink } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { Znacka } from '../../komponente/Znacka'
import { useEkran, usePromenaUgla } from '../../okvir/kontekst'
import { slikaOglasa } from '../../podaci/slikeOglasa'
import { broj, km, ocena, poeni, zvezdice } from '../../scenario/format'
import { OPIS_PRICE, RASTOJANJE_KM, TRAZI_TEKST } from '../../scenario/prica'
import { FIRMA_PO_ID, KATEGORIJA_JABUCICA, KATEGORIJA_PO_ID, KATEGORIJE_SA_OBAVESTENJEM, nazivOpstine, oglasPoId, polozajOglasa, preuzimanjeTekst, recenzijeKorisnika, korisnikUgla, type Oglas } from '../../scenario/svet'
import { NAZIV_UGLA } from '../../prica/tipovi'
import { P10_OZNAKE } from '../../scenario/stranice'
import { DesnaKolona } from '../pocetna/DesnaKolona'
import { NemaStranice } from '../NemaStranice'

const VRSTA_NAZIV = { roba: 'Roba', usluga: 'Usluga', ideja: 'Ideja' } as const
const TRAZI_VRSTA = { roba: 'robu', usluga: 'uslugu', ideja: 'ideju' } as const

function Nacin({ oglas }: { oglas: Oglas }) {
  if (oglas.nacin === 'poeni' && oglas.poeni) return <Znacka vrsta="poeni" vrednost={oglas.poeni} />
  if (oglas.nacin === 'poklon') return <Znacka vrsta="poklon" />
  return <span>Za razmenu</span>
}

export function O1() {
  const { parametri, ugao } = useEkran()
  const demo = useDemo()
  const l = useLink()
  const promeniUgao = usePromenaUgla()
  const { s, grana, uradjeno, tokovi } = useStanjePrice()
  const [ceo, setCeo] = useState(false)

  const osnovni = oglasPoId(parametri.oglas) ?? tokovi.noviOglasi.find((o) => o.id === parametri.oglas)
  const aktivan = s.oglasi.find((o) => o.id === parametri.oglas)
  const oglas = aktivan ?? osnovni
  // nepoznat id u linku (ili oglas koji samo moderacija vidi) nikad ne daje prazan ekran
  if (!oglas || (oglas.id === 'sljivovica' && ugao !== 'moderacija')) return <NemaStranice />
  // Anin PlayStation 2 još nije objavljen (korak 2)
  if (!aktivan && oglas.id === 'ana-ps2' && !uradjeno('3.w4') && !uradjeno('2.o3')) {
    return <JosNijePocelo naslov="Oglas" opis="Anin oglas se objavljuje u koraku 2. Do tada ga nema u „Igre i konzole“ ni u „Moji oglasi“." korak={2} />
  }
  const zavrsen = !aktivan
  const korisnikSvet = s.korisnici[oglas.vlasnik]
  const firma = oglas.firma ? FIRMA_PO_ID[oglas.vlasnik] : null
  const gledalac = korisnikUgla(s, ugao)
  const moj = gledalac?.id === oglas.vlasnik
  const imaDovoljnoPoena = !!gledalac && !!oglas.poeni && gledalac.poeni >= oglas.poeni
  const smeGradjanin = ugao === 'ana' || ugao === 'marko'
  const kat = KATEGORIJA_PO_ID[oglas.kat]
  const fotoId = oglas.vrsta === 'roba' ? slikaOglasa(oglas.id) : null
  const polozaj = oglas.opstina ? polozajOglasa(oglas.opstina, oglas.id) : null
  const rastojanje = RASTOJANJE_KM[oglas.id]
  const opis = OPIS_PRICE[oglas.id] ?? oglas.opis
  const trazi = TRAZI_TEKST[oglas.id] ?? (oglas.trazi ? `Traži ${TRAZI_VRSTA[oglas.trazi]}` : null)
  const recenzije = korisnikSvet ? recenzijeKorisnika(oglas.vlasnik, demo.poz, 5, tokovi) : []
  const omiljeno = demo.tokovi.omiljeno.includes(oglas.id)
  const prosek = korisnikSvet ? ocena(korisnikSvet.zbirOcena, korisnikSvet.recenzije) : null
  const vlasnikIme = imeVlasnika(oglas)
  const obavestenjeNekretnine = KATEGORIJE_SA_OBAVESTENJEM.includes(oglas.kat)

  const nemaPravo = (
    <div className="stog-sm" data-samo-gradjanin>
      <p className="razlog-neaktivno">Dostupno uglu građanina.</p>
      <button type="button" className="dugme dugme-linija" onClick={() => promeniUgao('ana')}>
        Gledaj kao {NAZIV_UGLA.ana}
      </button>
    </div>
  )

  let dugmad
  if (zavrsen) {
    dugmad = <Obavestenje stanje="uspeh">Razmena je obavljena, oglas je završen i više nije aktivan.</Obavestenje>
  } else if (moj) {
    dugmad = (
      <div className="stog-sm">
        <Obavestenje>Ovo je tvoj oglas.</Obavestenje>
        <Veza ekran="O6" className="dugme dugme-plavo">
          Moji oglasi
        </Veza>
        <Veza ekran="Z1" parametri={{ oglas: oglas.id }} className="dugme dugme-linija">
          Istakni oglas
        </Veza>
        {ugao !== 'prodavnica' && (
          <Veza ekran="X4" parametri={{ oglas: oglas.id }} className="dugme dugme-linija">
            Primljene ponude
          </Veza>
        )}
      </div>
    )
  } else if (!smeGradjanin) {
    dugmad = nemaPravo
  } else {
    dugmad = (
      <div className="stog-sm">
        {oglas.aukcija ? (
          <Veza ekran="J2" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
            <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden /> Ponudi (javna aukcija)
          </Veza>
        ) : oglas.nacin === 'razmena' ? (
          <Veza ekran="X1" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
            <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden /> Ponudi razmenu
          </Veza>
        ) : oglas.nacin === 'poeni' ? (
          oglas.id === 'markov-bicikl' && grana === 'poeni' && imaDovoljnoPoena ? (
            <Veza ekran="W1" className="dugme dugme-plavo">
              Uzmi za poene
            </Veza>
          ) : oglas.id === 'markov-bicikl' && grana === 'poeni' ? (
            <RadnjaDugme id="6R.uzmi" varijanta="plavo" nakon={l('W2', { oglas: oglas.id })} poruka={false} pregled={l('W2', { oglas: oglas.id })}>
              Uzmi za poene
            </RadnjaDugme>
          ) : (
            <Veza ekran="W2" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
              Uzmi za poene
            </Veza>
          )
        ) : (
          <Veza ekran="W5" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
            <Gift size={18} strokeWidth={1.75} aria-hidden /> Zatraži poklon
          </Veza>
        )}
        <div className="red-dugmad">
          <Veza ekran="C2" parametri={{ razgovor: oglas.vlasnik }} className="dugme dugme-linija">
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Poruka
          </Veza>
          <button type="button" className="dugme dugme-linija" aria-pressed={omiljeno} aria-label={`Omiljeno: ${oglas.naslov}`} onClick={() => demo.prebaciOmiljeno(oglas.id)}>
            <Star size={18} strokeWidth={1.75} aria-hidden fill={omiljeno ? 'currentColor' : 'none'} /> Omiljeno
          </button>
          <Veza ekran="O5" parametri={{ oglas: oglas.id }} className="dugme dugme-tekst">
            <Flag size={16} strokeWidth={1.75} aria-hidden /> Prijavi
          </Veza>
        </div>
      </div>
    )
  }

  return (
    <div className="stog" data-ekran-sadrzaj="O1" data-oglas-id={oglas.id}>
      <div className="dva-stupca">
        <article className="kartica stog" aria-labelledby="o1-naslov">
          <div className="velika-slika">
            <SlikaOglasa oglas={oglas} namena="detalj" prva velicine="(min-width: 1024px) 560px, 100vw" />
            {oglas.kat === KATEGORIJA_JABUCICA && (
              <span className="ko-jabucica">
                <Jabucica velicina={40} />
              </span>
            )}
          </div>
          {fotoId && <NavodjenjeAutora id={fotoId} />}
          <div>
            <div className="znacke">
              <Znacka vrsta={oglas.firma ? 'firma' : 'gradjanin'} />
              {oglas.istaknuto && <Znacka vrsta="istaknuto" />}
              {oglas.kat === KATEGORIJA_JABUCICA && <span className="znacka znacka-poklon">Iz sopstvene proizvodnje</span>}
            </div>
            {/* P-S7: objašnjenje oznaka dostupno bez miša (tooltip title nije dovoljan) */}
            <p className="pomocni-tekst mt-1" data-oznake-objasnjenje>
              {P10_OZNAKE} <Veza ekran="P10" className="veza-tekst">Kako ređamo oglase</Veza>
            </p>
            <h1 id="o1-naslov" className="mt-2">
              {oglas.naslov}
            </h1>
            <p className="ko-mesto mt-1">
              {oglas.grad}
              {oglas.opstina ? `, ${nazivOpstine(oglas.opstina)}` : ''} · {VRSTA_NAZIV[oglas.vrsta].toLowerCase()}
            </p>
          </div>
          <dl className="podaci-oglasa">
            <dt>Kategorija</dt>
            <dd>{kat?.naziv}</dd>
            <dt>Vrsta</dt>
            <dd>{VRSTA_NAZIV[oglas.vrsta]}</dd>
            {oglas.stanje && (
              <>
                <dt>Stanje</dt>
                <dd>{oglas.stanje}</dd>
              </>
            )}
            <dt>Način</dt>
            <dd>
              <Nacin oglas={oglas} />
            </dd>
            <dt>Preuzimanje</dt>
            <dd data-preuzimanje>{preuzimanjeTekst(oglas)}</dd>
          </dl>
          <div>
            <h2>Opis</h2>
            <p className={`mt-1${ceo ? '' : ' line-clamp-3'}`} data-opis>
              {opis}
            </p>
            <button type="button" className="dugme dugme-tekst" aria-expanded={ceo} onClick={() => setCeo(!ceo)}>
              {ceo ? 'Prikaži manje' : 'Prikaži više'}
            </button>
          </div>
          {oglas.nacin === 'razmena' && trazi && (
            <div>
              <h2>{oglas.vrsta === 'usluga' ? 'Šta traži zauzvrat' : 'Traži zauzvrat'}</h2>
              <p className="mt-1" data-trazi>
                {trazi}
              </p>
            </div>
          )}
          {oglas.vrsta === 'ideja' && <ObavestenjeIdeja />}
          {obavestenjeNekretnine && <ObavestenjeNekretnine />}
          {polozaj && oglas.opstina && (
            <div className="mala-mapa" data-lokacija>
              <h2 className="mb-2 flex items-center gap-2">
                <MapPin size={20} strokeWidth={1.75} aria-hidden /> Približna lokacija
              </h2>
              <Mapa imena={false} viewBox={isecakMape(polozaj.x, polozaj.y)} krugovi={[{ id: oglas.id, x: polozaj.x, y: polozaj.y, oznaka: `${oglas.naslov}, približna lokacija` }]} naslov="Mala ilustrativna mapa sa krugom približne lokacije" />
              <p className="pomocni-tekst mt-1">
                {rastojanje ? `Oko ${km(rastojanje)} od tebe (približno). ` : ''}
                <Veza ekran="P6">Prikaži na mapi</Veza>
              </p>
            </div>
          )}
          <section aria-label="Recenzije vlasnika">
            <div className="naslov-reda">
              <h2>Recenzije vlasnika</h2>
              {korisnikSvet && (
                <Veza ekran="N4" parametri={{ korisnik: oglas.vlasnik }}>
                  Sve recenzije
                </Veza>
              )}
            </div>
            <p className="pomocni-tekst">Recenziju može da ostavi samo ko je obavio razmenu.</p>
            {recenzije.length === 0 ? (
              <p className="mt-2">Još nema recenzija.</p>
            ) : (
              <ul className="mt-2" data-recenzije>
                {recenzije.map((r, i) => (
                  <li key={i} className="recenzija">
                    <div className="znacke">
                      <Zvezdice ocena={r.ocena} />
                      <b>{r.autor}</b>
                      <Znacka vrsta="provereno" />
                    </div>
                    <p className="mt-1">{r.tekst}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <aside className="stog vlasnik-kartica" aria-label="Vlasnik oglasa">
          <div className="kartica stog">
            <div className="flex items-center gap-3">
              <Inicijali ime={vlasnikIme} velicina={48} firma={oglas.firma} />
              <div>
                {oglas.firma ? (
                  <Veza ekran="F4" parametri={{ firma: oglas.vlasnik }} className="font-extrabold">
                    {vlasnikIme}
                  </Veza>
                ) : korisnikSvet ? (
                  <Veza ekran="N1" parametri={{ korisnik: oglas.vlasnik }} className="font-extrabold">
                    {vlasnikIme}
                  </Veza>
                ) : (
                  <b>{vlasnikIme}</b>
                )}
                <div className="znacke mt-1">
                  {(korisnikSvet?.verifikovan || oglas.firma) && <Znacka vrsta="verifikovan" />}
                  <Znacka vrsta={oglas.firma ? 'firma' : 'gradjanin'} />
                </div>
              </div>
            </div>
            {korisnikSvet && (
              <p data-vlasnik-ocena>
                {korisnikSvet.recenzije > 0 ? (
                  <>
                    <Zvezdice ocena={zvezdice(korisnikSvet.zbirOcena, korisnikSvet.recenzije)} /> <b className="num">{prosek}</b> · {broj(korisnikSvet.recenzije)} recenzija
                  </>
                ) : (
                  <>Još nema recenzija</>
                )}
                {' · '}
                <span className="num">{broj(korisnikSvet.razmene)}</span> razmena
              </p>
            )}
            {firma && <p className="pomocni-tekst">{firma.delatnost}</p>}
            {dugmad}
            <PravaPotrosaca firma={oglas.firma} />
            <p className="pomocni-tekst">Telefon se otkriva tek posle prihvaćene ponude.</p>
            {oglas.nacin === 'poeni' && oglas.poeni && (
              <p className="pomocni-tekst">
                Vrednost: {poeni(oglas.poeni)} <Znacka vrsta="model" />
              </p>
            )}
          </div>
        </aside>
      </div>
      <DesnaKolona />
    </div>
  )
}
