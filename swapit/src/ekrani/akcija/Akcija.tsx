// A1–A6: akcija „staro za novo“ (UX 6.14, 7.7). Korak 9 priče: prodavnica pravi akciju (A5), plaća (Z3, Z4), vidi javnu stranicu (A1),
// tablu (A4) i prijave (A6). Ana i Marko vide reklamu „Sponzorisano“ na P1 TEK POSLE plaćanja (N-3), pa A1 i A2. Iznosi nose „ilustrativno, nije cenovnik“.
// Akcija je javna tek kad je plaćena (radnja 9.z4 u priči, ili plaćanje u slobodnom toku); do tada A1 kaže „Akcija još nije objavljena“.
// Slobodni tok: prodavnica objavljuje akciju (A5 → Z3 → Z4), Ana i Marko se prijavljuju (A2 → A3), a prodavnica prima ili odbija svaki red „Čeka procenu“ (A6).
import { CalendarDays, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { Kpi, KpiMreza } from '../../komponente/Kpi'
import { Padajuce, Pilule } from '../../komponente/Kontrole'
import { PrimerOznaka } from '../../komponente/PrimerOznaka'
import { Mapa, isecakMape } from '../../komponente/Mapa'
import { Obavestenje } from '../../komponente/Obavestenje'
import { OvoRadi } from '../../komponente/OvoRadi'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran, usePromenaUgla } from '../../okvir/kontekst'
import { DATUM_AKCIJA_DO, DATUM_AKCIJA_OD, TERMINI_AKCIJE, danUNedelji } from '../../scenario/datumi'
import { broj, datum, din } from '../../scenario/format'
import {
  AKCIJA_KAKO_RADI,
  AKCIJA_NAKNADA_OPIS,
  AKCIJA_NAZIV,
  AKCIJA_NEOBJAVLJENA,
  AKCIJA_REKLAMA_UKLJUCENA,
  AKCIJA_STARA_STVAR,
  AKCIJA_USLOVI,
  ANIN_STARI_BICIKL,
  ANIN_STARI_BICIKL_OBJASNJENJE,
  NAZIV_STATUSA,
  PRVIH_PRIJAVA,
  PROCENE_STANJA,
  STARE_STVARI,
} from '../../scenario/poslovno'
import { REF_AKCIJA_PRIJAVA, REF_PLACANJE } from '../../scenario/strane'
import { CENE, FIRMA_PO_ID, polozajOglasa } from '../../scenario/svet'
import { odlukaPrijaveAkcije, prijaviZaAkciju } from '../../tokovi/operacije'
import { PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const ZUPCANIK = 'zupcanik'
const AKCIJA_ID = 'staro-za-novo'
const PARAM_AKCIJA = { akcija: AKCIJA_ID }

/** Mala ilustrativna mapa sa krugom približne lokacije radnje (A1, A3): bez imena opština, sa natpisom „Ilustrativna mapa“ (L-3). */
function MapaRadnje() {
  const firma = FIRMA_PO_ID[ZUPCANIK]
  const p = polozajOglasa(firma.opstina, firma.id)
  return (
    <div className="mala-mapa" data-lokacija-radnje>
      <h2 className="mb-2 flex items-center gap-2">
        <MapPin size={20} strokeWidth={1.75} aria-hidden /> Radnja
      </h2>
      <p>{firma.adresa} (izmišljena adresa)</p>
      <Mapa imena={false} viewBox={isecakMape(p.x, p.y)} krugovi={[{ id: firma.id, x: p.x, y: p.y, oznaka: `${firma.naziv}, približna lokacija` }]} naslov="Mala ilustrativna mapa sa krugom oko radnje" />
    </div>
  )
}

const rok = () => `${datum(DATUM_AKCIJA_OD)} – ${datum(DATUM_AKCIJA_DO)}`

/** Akcija je javna tek posle plaćanja: radnja 9.z4 u priči ili plaćanje u slobodnom toku. */
function useAkcijaObjavljena(): boolean {
  const { uradjeno, tokovi } = useStanjePrice()
  return uradjeno('9.z4') || tokovi.poslovno.akcija
}

/** Ekran koji još nema akciju: u priči „Još nije počelo“ (korak 9), a u slobodnom režimu poruka sa prečicom ka prodavnici. */
function BezAkcije({ naslov }: { naslov: string }) {
  const { slobodno, ugao } = useStanjePrice()
  const promeniUgao = usePromenaUgla()
  if (!slobodno) return <JosNijePocelo naslov={naslov} opis="Prijava se otvara kad prodavnica objavi i plati akciju „staro za novo“." korak={9} />
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="A-nema" data-nema-akcije>
      <h1>{naslov}</h1>
      <Obavestenje>{AKCIJA_NEOBJAVLJENA} Objavljuje je prodavnica.</Obavestenje>
      {ugao !== 'prodavnica' && (
        <button type="button" className="dugme dugme-plavo self-start" onClick={() => promeniUgao('prodavnica', true)}>
          Gledaj kao Prodavnica
        </button>
      )}
    </section>
  )
}

export function A1() {
  const { ugao, parametri } = useEkran()
  const { uradjeno, slobodno } = useStanjePrice()
  const objavljena = useAkcijaObjavljena()
  const l = useLink()
  if (parametri.akcija !== AKCIJA_ID) return <NemaStranice />
  const firma = FIRMA_PO_ID[ZUPCANIK]
  const smeDaSePrijavi = ugao === 'ana' || ugao === 'marko'
  return (
    <div className="ekran-srednji stog" data-ekran-sadrzaj="A1">
      <section className="kartica stog" aria-labelledby="a1-naslov">
        {objavljena && (
          <div className="znacke">
            <Znacka vrsta="sponzorisano" />
            <span className="pomocni-tekst">Oglašava: {firma.naziv}</span>
          </div>
        )}
        <h1 id="a1-naslov">
          {AKCIJA_NAZIV} — donesi stari bicikl, dobij popust <span className="num">{din(CENE.popustPoStaromBiciklu)}</span> na novi
        </h1>
        <div>
          <Znacka vrsta="ilustrativno" />
        </div>
        <p className="flex items-center gap-2" data-rok-akcije>
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden /> Rok: {rok()}
        </p>
        {!objavljena && (
          <Obavestenje stanje="upozorenje">
            <span data-akcija-neobjavljena>{AKCIJA_NEOBJAVLJENA}</span>
          </Obavestenje>
        )}
        <div>
          <h2>Kako radi</h2>
          <ol className="lista-pravila mt-1">
            {AKCIJA_KAKO_RADI.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ol>
        </div>
        <div>
          <h2>Uslovi</h2>
          <ul className="lista-pravila mt-1">
            {AKCIJA_USLOVI.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
        <MapaRadnje />
        <div className="red-dugmad">
          {smeDaSePrijavi &&
            (objavljena ? (
              <Veza ekran="A2" parametri={PARAM_AKCIJA} className="dugme dugme-zeleno">
                Prijavi stari bicikl
              </Veza>
            ) : (
              <span className="radnja-dugme">
                <button type="button" className="dugme dugme-zeleno" disabled>
                  Prijavi stari bicikl
                </button>
                <span className="razlog-neaktivno">{AKCIJA_NEOBJAVLJENA}</span>
              </span>
            ))}
          {ugao === 'prodavnica' &&
            (slobodno ? (
              <Veza ekran="A4" className="dugme dugme-plavo">
                Tabla akcija
              </Veza>
            ) : (
              <RadnjaDugme id="9.a1" varijanta="plavo" nakon={l('A4')} poruka={false} pregled={l('A4')}>
                Tabla akcija
              </RadnjaDugme>
            ))}
          <Veza ekran="F4" parametri={{ firma: ZUPCANIK }} className="dugme dugme-linija">
            Profil firme
          </Veza>
        </div>
        {ugao === 'prodavnica' && !objavljena && !slobodno && !uradjeno('9.z4') && <p className="pomocni-tekst">Pregled javne stranice: akcija još nije objavljena.</p>}
      </section>
    </div>
  )
}

export function A2() {
  const navigate = useNavigate()
  const demo = useDemo()
  const l = useLink()
  const { ugao, parametri } = useEkran()
  const { ja, promeni, tokovi } = useStanjePrice()
  const objavljena = useAkcijaObjavljena()
  const termini = TERMINI_AKCIJE.map((t) => `${danUNedelji(t)}, ${datum(t)}`)
  const stare = ugao === 'marko' ? STARE_STVARI.marko : STARE_STVARI.ana
  const [stvar, setStvar] = useState(stare[0])
  const [procena, setProcena] = useState(PROCENE_STANJA[1])
  const [termin, setTermin] = useState(termini[0])
  if (parametri.akcija !== AKCIJA_ID) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <OvoRadi ko="ana" naslov="Prijava za akciju" opis="Prijavu starog bicikla šalje građanin, Ana ili Marko." nazad={{ ekran: 'A1', naziv: 'Nazad na akciju' }} />
  if (!objavljena) return <BezAkcije naslov="Prijava za akciju" />
  const vecPrijavljen = tokovi.prijaveAkcije.some((p) => p.k === ja)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="A2">
      <h1>Prijava za akciju</h1>
      <p className="pomocni-tekst">
        {AKCIJA_NAZIV} · oglašava {FIRMA_PO_ID[ZUPCANIK].naziv}
      </p>
      <div className="grupa-polja">
        <span className="polje-oznaka">Stara stvar</span>
        <Pilule oznaka="Stara stvar" vrednost={stvar} onChange={setStvar} opcije={[...stare.map((s) => ({ v: s, naziv: s })), { v: 'nova', naziv: 'Nova stvar' }]} />
        <span className="polje-pomoc">Izbor je unapred popunjen za demo. Stara stvar nije javni oglas.</span>
        {ugao === 'ana' && stvar === ANIN_STARI_BICIKL && <span className="pomocni-tekst" data-objasnjenje-stvari>{ANIN_STARI_BICIKL_OBJASNJENJE}</span>}
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Procena stanja</span>
        <Pilule oznaka="Procena stanja" vrednost={procena} onChange={setProcena} opcije={PROCENE_STANJA.map((p) => ({ v: p, naziv: p }))} />
      </div>
      <Padajuce oznaka="Termin donošenja" opcije={termini} vrednost={termin} onChange={setTermin} />
      <Obavestenje>Konačnu procenu daje prodavnica kad doneseš bicikl. Popust se ne isplaćuje u novcu.</Obavestenje>
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => {
            demo.obavesti(PORUKE.simulacija)
            if (ja) promeni((t) => prijaviZaAkciju(t, { k: ja, stvar: stvar === 'nova' ? 'Nova stvar' : stvar, procena, termin }))
            navigate(l('A3', PARAM_AKCIJA))
            window.scrollTo(0, 0)
          }}
        >
          {vecPrijavljen ? 'Izmeni prijavu' : 'Pošalji prijavu'}
        </button>
        <Veza ekran="A1" parametri={PARAM_AKCIJA} className="dugme dugme-tekst">
          Nazad na akciju
        </Veza>
      </div>
    </section>
  )
}

export function A3() {
  const { ugao, parametri } = useEkran()
  const { ja, tokovi } = useStanjePrice()
  const objavljena = useAkcijaObjavljena()
  if (parametri.akcija !== AKCIJA_ID) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <OvoRadi ko="ana" naslov="Prijava potvrđena" opis="Potvrdu prijave dobija građanin, Ana ili Marko." nazad={{ ekran: 'A1', naziv: 'Nazad na akciju' }} />
  if (!objavljena) return <BezAkcije naslov="Prijava potvrđena" />
  const moja = tokovi.prijaveAkcije.find((p) => p.k === ja)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="A3">
      <Obavestenje stanje="uspeh" uloga="status">
        <b>Prijava je potvrđena (demo).</b>
      </Obavestenje>
      <h1>Prijava potvrđena</h1>
      <p>
        Šifra prijave: <b className="num" data-sifra-prijave>{REF_AKCIJA_PRIJAVA}</b>
      </p>
      {moja && (
        <p data-moja-prijava>
          {moja.stvar} · {moja.procena} · {moja.termin}
        </p>
      )}
      <p>Donesi stvar do {datum(DATUM_AKCIJA_DO)}</p>
      <MapaRadnje />
      <div className="red-dugmad">
        <Veza ekran="X12" className="dugme dugme-zeleno">
          Moje razmene i ponude
        </Veza>
        <Veza ekran="A1" parametri={PARAM_AKCIJA} className="dugme dugme-linija">
          Nazad na akciju
        </Veza>
      </div>
    </section>
  )
}

export function A4() {
  const { s, slobodno, korak } = useStanjePrice()
  const objavljena = useAkcijaObjavljena()
  const l = useLink()
  if (!slobodno && korak < 9) return <JosNijePocelo naslov="Tabla akcija" opis="Tabla se otvara kad prodavnica objavi akciju „staro za novo“." korak={9} />
  if (!objavljena || !s.akcija)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="A4" data-nema-akcije>
        <h1>Tabla akcija</h1>
        <p>Nema aktivne akcije — napravi je.</p>
        <Veza ekran="A5" className="dugme dugme-zeleno self-start">
          Nova akcija
        </Veza>
      </section>
    )
  const a = s.akcija
  return (
    <div className="stog" data-ekran-sadrzaj="A4">
      <div className="naslov-reda">
        <div>
          <h1>Tabla akcija</h1>
          <p className="pomocni-tekst">
            Aktivna akcija: <b>{AKCIJA_NAZIV}</b> · {rok()}
          </p>
          <PrimerOznaka />
        </div>
        <Znacka vrsta="sponzorisano" />
      </div>
      <KpiMreza oznaka="Prijave na akciji">
        <Kpi id="prijave" oznaka="Prijave" vrednost={broj(a.prijave)} />
        <Kpi id="primljeno" oznaka="Primljeno" vrednost={broj(a.primljeno)} />
        <Kpi id="ceka" oznaka="Čeka procenu" vrednost={broj(a.cekaProcenu)} />
        <Kpi id="odbijeno" oznaka="Odbijeno" vrednost={broj(a.odbijeno)} />
      </KpiMreza>
      <KpiMreza oznaka="Novac i pregledi" tri>
        <Kpi id="popusti" oznaka="Izdati popusti" vrednost={din(a.izdatiPopusti)} opis={<Znacka vrsta="ilustrativno" />} />
        <Kpi
          id="naknada"
          oznaka="Naknada akcije"
          vrednost={din(a.naknada)}
          opis={
            <>
              {AKCIJA_NAKNADA_OPIS} <Znacka vrsta="ilustrativno" />
            </>
          }
        />
        <Kpi id="pregledi" oznaka="Pregledi stranice akcije" vrednost={broj(a.pregledi)} />
      </KpiMreza>
      <div className="red-dugmad">
        {slobodno ? (
          <Veza ekran="A6" parametri={PARAM_AKCIJA} className="dugme dugme-plavo">
            Prijave na akciji
          </Veza>
        ) : (
          <RadnjaDugme id="9.a4" varijanta="plavo" nakon={l('A6', PARAM_AKCIJA)} poruka={false} pregled={l('A6', PARAM_AKCIJA)}>
            Prijave na akciji
          </RadnjaDugme>
        )}
        <Veza ekran="A1" parametri={PARAM_AKCIJA} className="dugme dugme-linija">
          Javna stranica akcije
        </Veza>
        <Veza ekran="A5" className="dugme dugme-tekst">
          Nova akcija
        </Veza>
      </div>
    </div>
  )
}

export function A5() {
  const navigate = useNavigate()
  const { korak, uradjeno, slobodno, tokovi } = useStanjePrice()
  const l = useLink()
  const objavljena = uradjeno('9.objavi') || tokovi.poslovno.akcija
  const kaPlacanju = l('Z3', { svrha: 'akcija', ref: REF_PLACANJE })
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="A5">
      <div>
        <h1>Nova akcija</h1>
        <p className="pomocni-tekst">{!slobodno && korak < 9 ? 'Nacrt: objava se otvara u koraku 9.' : 'Pregledaj i objavi.'}</p>
      </div>
      <PrikaznoPolje oznaka="Naziv akcije" vrednost={AKCIJA_NAZIV} napomena />
      <PrikaznoPolje oznaka="Koju staru stvar primate" vrednost={AKCIJA_STARA_STVAR} />
      <PrikaznoPolje oznaka="Popust po starom biciklu" vrednost={`${din(CENE.popustPoStaromBiciklu)} (ilustrativno)`} />
      <PrikaznoPolje oznaka="Rok" vrednost={rok()} />
      <div className="grupa-polja">
        <span className="polje-oznaka">Uslovi</span>
        <ul className="lista-pravila">
          {AKCIJA_USLOVI.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </div>
      <div className="odluka-pregled stog-sm" data-pregled-oznaka>
        <p className="polje-oznaka">Tako će oglas akcije izgledati</p>
        <div className="znacke">
          <Znacka vrsta="firma" />
          <Znacka vrsta="sponzorisano" />
        </div>
        <p>
          <b>
            {AKCIJA_NAZIV} — {FIRMA_PO_ID[ZUPCANIK].naziv}
          </b>
        </p>
        <p className="pomocni-tekst">Oglasi prodavnice nose oznaku „Firma“, a akcija i reklama oznaku „Sponzorisano“.</p>
      </div>
      <div className="stog-sm">
        <p>
          Cena akcije: <b className="num">{din(CENE.akcijaStaroZaNovo)}</b> sa PDV-om
        </p>
        <div>
          <Znacka vrsta="ilustrativno" />
        </div>
        <p data-reklama-ukljucena>{AKCIJA_REKLAMA_UKLJUCENA}</p>
      </div>
      <div className="red-dugmad">
        {slobodno ? (
          <>
            <button
              type="button"
              className="dugme dugme-zeleno"
              aria-disabled={(tokovi.poslovno.akcija) || undefined}
              onClick={() => {
                navigate(kaPlacanju)
                window.scrollTo(0, 0)
              }}
            >
              Objavi akciju
            </button>
            {tokovi.poslovno.akcija && <span className="razlog-neaktivno">Akcija je već objavljena</span>}
          </>
        ) : (
          <RadnjaDugme id="9.objavi" nakon={kaPlacanju} poruka={false}>
            Objavi akciju
          </RadnjaDugme>
        )}
        {objavljena && (
          <Veza ekran="A1" parametri={PARAM_AKCIJA} className="dugme dugme-linija">
            Javna stranica akcije
          </Veza>
        )}
        <Veza ekran="F3" className="dugme dugme-tekst">
          Tabla firme
        </Veza>
      </div>
    </section>
  )
}

export function A6() {
  const demo = useDemo()
  const { s, korak, slobodno, promeni } = useStanjePrice()
  const objavljena = useAkcijaObjavljena()
  const [sve, setSve] = useState(false)
  if (!slobodno && korak < 9) return <JosNijePocelo naslov="Prijave na akciji" opis="Prijave stižu kad prodavnica objavi akciju „staro za novo“." korak={9} />
  if (!objavljena || !s.akcija)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="A6" data-nema-akcije>
        <h1>Prijave na akciji</h1>
        <p>Akcija još nije objavljena, pa nema prijava.</p>
        <Veza ekran="A5" className="dugme dugme-zeleno self-start">
          Nova akcija
        </Veza>
      </section>
    )
  const sviRedovi = s.akcija.redovi
  const redovi = sve ? sviRedovi : sviRedovi.slice(0, PRVIH_PRIJAVA)
  const primljena = sviRedovi.some((r) => r.izPrice && r.status === 'primljeno') && !slobodno
  const primi = (korisnik: string) => {
    promeni((t) => odlukaPrijaveAkcije(t, korisnik, 'primljeno'))
    demo.obavesti(`Kupon izdat: ${din(CENE.popustPoStaromBiciklu)} (ilustrativno)`)
  }
  const odbij = (korisnik: string) => {
    promeni((t) => odlukaPrijaveAkcije(t, korisnik, 'odbijeno'))
    demo.obavesti('Prijava je odbijena (bez kupona)')
  }
  return (
    <div className="stog" data-ekran-sadrzaj="A6">
      <div>
        <h1>Prijave na akciji</h1>
        <p className="pomocni-tekst">
          {AKCIJA_NAZIV} · prijava ukupno: <b className="num">{broj(sviRedovi.length)}</b>
        </p>
        <PrimerOznaka />
      </div>
      {primljena && (
        <Obavestenje stanje="uspeh" uloga="status">
          <b>Kupon izdat: {din(CENE.popustPoStaromBiciklu)}</b> (ilustrativno). Popust se ne isplaćuje u novcu.
        </Obavestenje>
      )}
      <table className="tabela-kartice" data-tabela-prijava>
        <thead>
          <tr>
            <th scope="col">Korisnik</th>
            <th scope="col">Stara stvar</th>
            <th scope="col">Procena</th>
            <th scope="col">Status</th>
            <th scope="col">Radnja</th>
          </tr>
        </thead>
        <tbody>
          {redovi.map((r) => (
            <tr key={r.korisnik} data-prijava={r.korisnik}>
              <td data-oznaka="Korisnik">{r.korisnik}</td>
              <td data-oznaka="Stara stvar">{r.stvar}</td>
              <td data-oznaka="Procena">{r.procena}</td>
              <td data-oznaka="Status">
                <span className="stanje-prijave" data-stanje={r.status}>
                  {NAZIV_STATUSA[r.status]}
                </span>
              </td>
              <td data-oznaka="Radnja" data-prazno={r.status === 'ceka' ? undefined : ''}>
                {r.status === 'ceka' ? (
                  <div className="red-dugmad">
                    {r.izPrice && !slobodno ? (
                      <RadnjaDugme id="9.primi" poruka={`Kupon izdat: ${din(CENE.popustPoStaromBiciklu)} (ilustrativno)`}>
                        Primi
                      </RadnjaDugme>
                    ) : (
                      <button type="button" className="dugme dugme-zeleno" onClick={() => primi(r.korisnik)}>
                        Primi
                      </button>
                    )}
                    <button type="button" className="dugme dugme-linija" aria-disabled={(r.izPrice && !slobodno) || undefined} onClick={() => odbij(r.korisnik)}>
                      Odbij
                    </button>
                    {r.izPrice && !slobodno && <span className="razlog-neaktivno">U priči prodavnica prima ovu prijavu</span>}
                  </div>
                ) : (
                  <span aria-hidden>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sve && sviRedovi.length > PRVIH_PRIJAVA && (
        <button type="button" className="dugme dugme-linija self-start" onClick={() => setSve(true)}>
          Prikaži sve ({broj(sviRedovi.length)})
        </button>
      )}
      <div className="red-dugmad">
        <Veza ekran="A4" className="dugme dugme-linija">
          Tabla akcija
        </Veza>
      </div>
    </div>
  )
}

