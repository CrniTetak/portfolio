// V1–V4 (moderacija), O5 (prijava oglasa) i S2 (pravila zajednice i zabranjene stvari), UX 6.15, 6.4. Prijavljen oglas u priči: „Domaća šljivovica 5 l“.
// Korak 4: prijava stiže; korak 5: moderacija otvara prijavu (V2), odlučuje uz obrazloženje (V3); korak 6: V4 pokazuje kako korisnik vidi odluku.
// Slobodni tok: svaki oglas može da se prijavi (O5), prijava stiže na tablu moderacije (V1), pa V2 → V3 → V4 sa odlukom Ukloni / Traži izmenu / Ostavi.
// Moderacija ne drži poene i ne razmenjuje; ima samo ove ekrane i pregled onoga što je javno. Spisak zabranjenih stvari je JEDAN izvor (N-4).
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useJednom } from '../../demo/useJednom'
import { useStanjePrice } from '../../demo/useStanje'
import { Dijalog } from '../../okvir/Dijalozi'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { Kpi, KpiMreza } from '../../komponente/Kpi'
import { Pilule } from '../../komponente/Kontrole'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja, ObavestenjeNekretnine } from '../../komponente/Obavestenja'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { ZabranjeneStvari } from '../../komponente/ZabranjeneStvari'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { demoDatum } from '../../scenario/datumi'
import { imaKljuc, uzmi } from '../../scenario/kljuc'
import { broj, datum, ocena } from '../../scenario/format'
import { CLAN_OD, CLAN_OD_PODRAZUMEVANO } from '../../scenario/prica'
import {
  AUTOMATSKE_PROVERE,
  NAZIV_ODLUKE,
  NASLOV_ODLUKE,
  ODLUKA_OSNOV,
  OPIS_PRIJAVE_PRIMER,
  POVRATNE_PRIJAVE_PORUKA,
  PRAVILA_ZAJEDNICE,
  PRAVILO_NOVAC,
  PRIJAVE_NA_CEKANJU,
  RAZLOZI_PRIJAVE,
  SLJIVOVICA,
  obrazlozenjeOdluke,
  odlukaDonela,
  prigovorTekst,
} from '../../scenario/poslovno'
import { ODLUKE_MODERACIJE } from '../../scenario/slobodno'
import { MODERATORKA } from '../../scenario/strane'
import { KATEGORIJA_PO_ID, jeRezervisan, oglasPoId, nadjiOglas } from '../../scenario/svet'
import type { Oglas } from '../../scenario/svet'
import { odluciPrijavu, prijaviOglas } from '../../tokovi/operacije'
import { NAZIV_UGLA } from '../../prica/tipovi'
import { PORUKE, PREDMET_PRICE } from '../../tekstovi/okvir'
import { imeVlasnika } from '../../komponente/KarticaOglasa'
import { NemaStranice } from '../NemaStranice'

const PRIJAVA = { prijava: SLJIVOVICA.id }
type Odluka = 'ukloni' | 'izmena' | 'ostavi'
const jeOdluka = (x: unknown): x is Odluka => x === 'ukloni' || x === 'izmena' || x === 'ostavi'

function Stanje({ stanje, naziv }: { stanje: 'ceka' | 'pregled' | 'uklonjeno' | 'ostaje'; naziv: string }) {
  return (
    <span className="stanje-prijave" data-stanje={stanje}>
      {naziv}
    </span>
  )
}

/** Podaci jedne prijave, bez obzira da li je iz priče, unapred pripremljena ili je poslao gledalac. */
type Prijava = { id: string; naslov: string; vlasnik: string; razlog: string; pravilo: string; oglas?: Oglas; izPrice: boolean }

function useNadjiPrijavu(id: string): Prijava | null {
  const { s, tokovi } = useStanjePrice()
  if (id === SLJIVOVICA.id) {
    const o = oglasPoId(SLJIVOVICA.id)!
    return { id, naslov: o.naslov, vlasnik: SLJIVOVICA.vlasnik, razlog: SLJIVOVICA.razlog, pravilo: SLJIVOVICA.pravilo, oglas: o, izPrice: true }
  }
  const opsta = PRIJAVE_NA_CEKANJU.find((p) => p.id === id)
  if (opsta) return { id, naslov: opsta.naslov, vlasnik: opsta.korisnik, razlog: opsta.razlog, pravilo: 'Oglas mora da odgovara stvarnom stanju i da bude objavljen jednom.', izPrice: false }
  const svoja = tokovi.prijave.find((p) => p.id === id)
  if (svoja) {
    const o = nadjiOglas(s, svoja.oglas, tokovi)
    if (o) return { id, naslov: o.naslov, vlasnik: o.vlasnik, razlog: svoja.razlog, pravilo: 'Oglas mora da poštuje pravila zajednice i spisak zabranjenih stvari.', oglas: o, izPrice: false }
  }
  return null
}

export function V1() {
  const { s, korak, uradjeno, tokovi } = useStanjePrice()
  const m = s.moderacija
  const sljivovica = oglasPoId(SLJIVOVICA.id)!
  const stigla = korak >= 4
  const odlucena = uradjeno('5.v3')
  const upregledu = korak === 5 && !odlucena
  const naCekanju = stigla && !odlucena && !upregledu
  // redovi tabele: svaka prijava bez odluke čeka (ili je u pregledu); sa odlukom prelazi u „Nedavno obrađeno“
  const opste = PRIJAVE_NA_CEKANJU.map((p) => ({ id: p.id, naslov: p.naslov, razlog: p.razlog, kategorija: '' }))
  const svoje = tokovi.prijave.map((p) => {
    const o = nadjiOglas(s, p.oglas, tokovi)
    return { id: p.id, naslov: o?.naslov ?? p.oglas, razlog: p.razlog, kategorija: o ? KATEGORIJA_PO_ID[o.kat]?.naziv ?? '' : '' }
  })
  const cekaju = [...opste, ...svoje].filter((p) => !imaKljuc(tokovi.odluke, p.id))
  const obradjene = [...opste, ...svoje].filter((p) => imaKljuc(tokovi.odluke, p.id))
  return (
    <div className="stog" data-ekran-sadrzaj="V1">
      <div>
        <h1>Tabla moderacije</h1>
        <p className="pomocni-tekst">Prijave oglasa i korisnika koje čekaju odluku.</p>
      </div>
      <KpiMreza oznaka="Pokazatelji moderacije" tri>
        <Kpi id="na-cekanju" oznaka="Na čekanju" vrednost={broj(m.naCekanju)} />
        <Kpi id="obradjeno" oznaka="Obrađeno ove nedelje" vrednost={broj(m.obradjeno)} />
        <Kpi id="uklonjeno" oznaka="Uklonjeno ove nedelje" vrednost={broj(m.uklonjeno)} />
      </KpiMreza>
      <div className="dva-stupca">
        <div className="stog">
          <section className="stog" aria-label="Prijave">
            <h2>Prijave</h2>
            <table className="tabela-kartice" data-tabela-prijava>
              <thead>
                <tr>
                  <th scope="col">Oglas</th>
                  <th scope="col">Razlog</th>
                  <th scope="col">Broj prijava</th>
                  <th scope="col">Stanje</th>
                  <th scope="col">Radnja</th>
                </tr>
              </thead>
              <tbody>
                {cekaju.map((p) => (
                  <tr key={p.id} data-prijava={p.id}>
                    <td data-oznaka="Oglas">
                      <b>{p.naslov}</b>
                      {p.kategorija && (
                        <>
                          <br />
                          <span className="pomocni-tekst">{p.kategorija}</span>
                        </>
                      )}
                    </td>
                    <td data-oznaka="Razlog">{p.razlog}</td>
                    <td data-oznaka="Broj prijava">
                      <span className="num">{broj(1)}</span>
                    </td>
                    <td data-oznaka="Stanje">
                      <Stanje stanje="ceka" naziv="Na čekanju" />
                    </td>
                    <td data-oznaka="Radnja">
                      <Veza ekran="V2" parametri={{ prijava: p.id }} className="dugme dugme-linija">
                        Otvori
                      </Veza>
                    </td>
                  </tr>
                ))}
                {(naCekanju || upregledu) && (
                  <tr data-prijava={SLJIVOVICA.id} data-nova={naCekanju ? '1' : undefined}>
                    <td data-oznaka="Oglas">
                      <b>{sljivovica.naslov}</b>
                      <br />
                      <span className="pomocni-tekst">{KATEGORIJA_PO_ID[sljivovica.kat].naziv}</span> {naCekanju && <span className="znacka znacka-poklon">Nova</span>}
                    </td>
                    <td data-oznaka="Razlog">{SLJIVOVICA.razlog}</td>
                    <td data-oznaka="Broj prijava">
                      <span className="num">{broj(1)}</span>
                    </td>
                    <td data-oznaka="Stanje">{upregledu ? <Stanje stanje="pregled" naziv="U pregledu" /> : <Stanje stanje="ceka" naziv="Na čekanju" />}</td>
                    <td data-oznaka="Radnja">
                      <Veza ekran="V2" parametri={PRIJAVA} className="dugme dugme-plavo">
                        Otvori prijavu
                      </Veza>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {cekaju.length === 0 && !naCekanju && !upregledu && <p className="prazno-stanje">Nema prijava na čekanju.</p>}
          </section>
          {(odlucena || obradjene.length > 0) && (
            <section className="stog" aria-label="Nedavno obrađeno" data-obradjeno>
              <h2>Nedavno obrađeno</h2>
              <ul className="stog-sm">
                {odlucena && (
                  <li className="stavka">
                    <div className="stavka-glavna stog-sm">
                      <b>{sljivovica.naslov}</b>
                      <span className="pomocni-tekst">{SLJIVOVICA.razlog}</span>
                    </div>
                    <div className="stavka-akcije">
                      <Stanje stanje="uklonjeno" naziv="Uklonjeno" />
                      <Veza ekran="V4" parametri={PRIJAVA} className="dugme dugme-linija">
                        Kako korisnik vidi odluku
                      </Veza>
                    </div>
                  </li>
                )}
                {obradjene.map((p) => (
                  <li key={p.id} className="stavka" data-obradjena={p.id}>
                    <div className="stavka-glavna stog-sm">
                      <b>{p.naslov}</b>
                      <span className="pomocni-tekst">{p.razlog}</span>
                    </div>
                    <div className="stavka-akcije">
                      <Stanje stanje={uzmi(tokovi.odluke, p.id) === 'ukloni' ? 'uklonjeno' : 'ostaje'} naziv={NAZIV_ODLUKE[uzmi(tokovi.odluke, p.id) ?? 'ostavi']} />
                      <Veza ekran="V4" parametri={{ prijava: p.id }} className="dugme dugme-linija">
                        Kako korisnik vidi odluku
                      </Veza>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="stog-sm" aria-label="Automatske provere" data-automatske-provere>
            <h2>Automatske provere</h2>
            <ul className="lista-pravila">
              {korak >= 2 && <li>{AUTOMATSKE_PROVERE.oglasPrvi}</li>}
              {korak >= 9 && <li>{AUTOMATSKE_PROVERE.akcijaIReklama}</li>}
              {korak < 2 && <li className="pomocni-tekst">Još nema novih automatskih provera.</li>}
            </ul>
          </section>
        </div>
        <aside className="kartica stog" aria-label="Spisak zabranjenih stvari">
          <h2>Spisak zabranjenih stvari</h2>
          <ZabranjeneStvari sazeto />
        </aside>
      </div>
    </div>
  )
}

export function V2() {
  const { parametri } = useEkran()
  const { s, korak, uradjeno, slobodno, tokovi } = useStanjePrice()
  const navigate = useNavigate()
  const l = useLink()
  const p = useNadjiPrijavu(parametri.prijava)
  if (!p) return <NemaStranice />
  if (p.izPrice && !slobodno && korak < 4) return <JosNijePocelo naslov="Pregled prijave" opis="Prijava oglasa „Domaća šljivovica 5 l“ stiže u koraku 4." korak={4} />
  const k = s.korisnici[p.vlasnik]
  const odluka = uzmi(tokovi.odluke, p.id)
  const odlucena = p.izPrice ? uradjeno('5.v3') : !!odluka
  const ide = (o: Odluka) => navigate(l('V3', { prijava: p.id }) + `?odluka=${o}`)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="V2" data-prijava={p.id}>
      <h1>Pregled prijave</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <h2>{p.naslov}</h2>
          <p>
            Korisnik: <b>{p.vlasnik}</b> <Znacka vrsta="gradjanin" />
          </p>
          {p.oglas && <p className="pomocni-tekst">Kategorija: {KATEGORIJA_PO_ID[p.oglas.kat].naziv}.</p>}
        </div>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Razlog prijave</span>
        <p data-razlog-prijave>{p.razlog}</p>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Pravilo</span>
        <p>{p.pravilo}</p>
        <Veza ekran="S2">Spisak zabranjenih stvari</Veza>
      </div>
      <div className="grupa-polja" data-istorija-korisnika>
        <span className="polje-oznaka">Istorija korisnika</span>
        {k ? (
          <p>
            Član od {CLAN_OD[p.vlasnik] ?? CLAN_OD_PODRAZUMEVANO} · <span className="num">{broj(k.razmene)}</span> razmena · ocena <b className="num">{ocena(k.zbirOcena, k.recenzije)}</b> (<span className="num">{broj(k.recenzije)}</span> recenzija). Ranije prijave: nema.
          </p>
        ) : (
          <p>Nema podataka.</p>
        )}
      </div>
      {odlucena ? (
        <div className="stog-sm" data-obradjeno>
          <Obavestenje stanje="uspeh" uloga="status">
            Prijava je obrađena{odluka ? `: ${NAZIV_ODLUKE[odluka].toLowerCase()}` : ': oglas je uklonjen'}, a korisnik je obavešten.
          </Obavestenje>
          <div className="red-dugmad">
            <Veza ekran="V1" className="dugme dugme-zeleno">
              Tabla moderacije
            </Veza>
            <Veza ekran="V4" parametri={{ prijava: p.id }} className="dugme dugme-linija">
              Kako korisnik vidi odluku
            </Veza>
          </div>
        </div>
      ) : (
        <div className="red-dugmad">
          {p.izPrice && !slobodno ? (
            <RadnjaDugme id="5.v2" varijanta="crveno" nakon={l('V3', PRIJAVA)} poruka={false}>
              Ukloni
            </RadnjaDugme>
          ) : (
            <button type="button" className="dugme dugme-crveno" onClick={() => ide('ukloni')}>
              Ukloni
            </button>
          )}
          <button type="button" className="dugme dugme-linija" onClick={() => ide('ostavi')} aria-disabled={(p.izPrice && !slobodno) || undefined} aria-describedby={p.izPrice && !slobodno ? 'v2-prica' : undefined}>
            Ostavi
          </button>
          <button type="button" className="dugme dugme-linija" onClick={() => ide('izmena')} aria-disabled={(p.izPrice && !slobodno) || undefined}>
            Traži izmenu
          </button>
          {p.izPrice && !slobodno && (
            <span id="v2-prica" className="razlog-neaktivno">
              U priči moderacija uklanja ovaj oglas
            </span>
          )}
          <Veza ekran="V1" className="dugme dugme-tekst">
            Nazad na tablu
          </Veza>
        </div>
      )}
    </section>
  )
}

export function V3() {
  const { korak, uradjeno, slobodno, tokovi, promeni } = useStanjePrice()
  const { parametri } = useEkran()
  const demo = useDemo()
  const navigate = useNavigate()
  const l = useLink()
  const trazena = new URLSearchParams(useLocation().search).get('odluka')
  const p = useNadjiPrijavu(parametri.prijava)
  const [izbor, setIzbor] = useState<Odluka>(jeOdluka(trazena) ? trazena : 'ukloni')
  if (!p) return <NemaStranice />
  const izPrice = p.izPrice && !slobodno
  // V3 guard: odluka o „šljivovici“ se donosi tek u koraku 5
  if (izPrice && korak < 5) return <JosNijePocelo naslov="Odluka i obrazloženje" opis="Odluka o prijavi oglasa se donosi u koraku 5." korak={5} />
  const poslata = izPrice ? uradjeno('5.v3') : imaKljuc(tokovi.odluke, p.id)
  const odluka: Odluka = izPrice ? 'ukloni' : poslata ? (uzmi(tokovi.odluke, p.id) ?? izbor) : izbor
  const obrazlozenje = izPrice ? SLJIVOVICA.obrazlozenje : obrazlozenjeOdluke(odluka, p.razlog)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="V3" data-prijava={p.id}>
      <h1>Odluka i obrazloženje</h1>
      <p>
        Oglas: <b>{p.naslov}</b> ({p.vlasnik})
      </p>
      <div className="grupa-polja">
        <span className="polje-oznaka">Odluka</span>
        <Pilule<Odluka>
          oznaka="Odluka"
          vrednost={odluka}
          onChange={setIzbor}
          onemoguceno={izPrice || poslata ? ODLUKE_MODERACIJE.map((o) => o.v).filter((v) => v !== odluka) : []}
          opcije={ODLUKE_MODERACIJE.map((o) => ({ v: o.v, naziv: o.naziv }))}
        />
      </div>
      <PrikaznoPolje oznaka="Obrazloženje" vrednost={obrazlozenje} napomena />
      <div className="odluka-pregled stog-sm" data-pregled-korisnik>
        <p className="polje-oznaka">Ovo vidi korisnik</p>
        <h2>{NASLOV_ODLUKE[odluka]}</h2>
        <p>{obrazlozenje}</p>
        <p className="pomocni-tekst">Pravilo: {p.pravilo}</p>
        <ZabranjeneStvari sazeto link={false} />
      </div>
      {poslata ? (
        <div className="stog-sm" data-odluka-poslata>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Odluka je poslata.</b> Korisnik je obavešten.
          </Obavestenje>
          <div className="red-dugmad">
            <Veza ekran="V1" className="dugme dugme-zeleno">
              Tabla moderacije
            </Veza>
            <Veza ekran="V4" parametri={{ prijava: p.id }} className="dugme dugme-linija">
              Kako korisnik vidi odluku
            </Veza>
          </div>
        </div>
      ) : (
        <div className="red-dugmad">
          {izPrice ? (
            <RadnjaDugme id="5.v3" poruka="Odluka je poslata korisniku (demo)">
              Pošalji odluku
            </RadnjaDugme>
          ) : (
            <button
              type="button"
              className="dugme dugme-zeleno"
              onClick={() => {
                promeni((t) => odluciPrijavu(t, p.id, izbor, korak))
                demo.obavesti('Odluka je poslata korisniku (demo)')
                navigate(l('V4', { prijava: p.id }))
                window.scrollTo(0, 0)
              }}
            >
              Pošalji odluku
            </button>
          )}
          <Veza ekran="V2" parametri={{ prijava: p.id }} className="dugme dugme-tekst">
            Nazad na prijavu
          </Veza>
        </div>
      )}
    </section>
  )
}

export function V4() {
  const { ugao, parametri } = useEkran()
  const { korak, uradjeno, slobodno, tokovi } = useStanjePrice()
  const [prigovor, setPrigovor] = useState(false)
  const p = useNadjiPrijavu(parametri.prijava)
  if (!p) return <NemaStranice />
  const izPrice = p.izPrice && !slobodno
  if (izPrice && (korak < 5 || !uradjeno('5.v3'))) return <JosNijePocelo naslov="Obaveštenje korisniku o odluci" opis="Obaveštenje se šalje korisniku kad moderacija pošalje odluku." korak={5} />
  const odluka: Odluka | undefined = izPrice ? 'ukloni' : uzmi(tokovi.odluke, p.id)
  if (!odluka)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="V4" data-bez-odluke>
        <h1>Obaveštenje korisniku o odluci</h1>
        <Obavestenje>Moderacija još nije odlučila o ovoj prijavi, pa korisnik nema šta da vidi.</Obavestenje>
        <Veza ekran={ugao === 'moderacija' ? 'V2' : 'P1'} parametri={ugao === 'moderacija' ? { prijava: p.id } : undefined} className="dugme dugme-zeleno self-start">
          {ugao === 'moderacija' ? 'Pregled prijave' : 'Nazad na početnu'}
        </Veza>
      </section>
    )
  const obrazlozenje = izPrice ? SLJIVOVICA.obrazlozenje : obrazlozenjeOdluke(odluka, p.razlog)
  const kad = demoDatum(izPrice ? 5 : (uzmi(tokovi.korakOdluke, p.id) ?? korak), false)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="V4" data-prijava={p.id}>
      {/* PK2-9: ko nije moderator vidi da je ovo tuđe obaveštenje */}
      <Obavestenje>
        {ugao === 'moderacija' ? `Ovako korisnik ${p.vlasnik} vidi tvoju odluku.` : `Ovo vidi korisnik ${p.vlasnik}. Ti gledaš kao ${NAZIV_UGLA[ugao]}.`}
      </Obavestenje>
      <h1>{NASLOV_ODLUKE[odluka]}</h1>
      <p>
        Oglas: <b>{p.naslov}</b>
      </p>
      <div className="grupa-polja">
        <span className="polje-oznaka">Razlog</span>
        <p>{obrazlozenje}</p>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Ko je odlučio</span>
        <p data-odlucio>{odlukaDonela(MODERATORKA, datum(kad))}</p>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Osnov</span>
        <p>
          <Veza ekran="S4" parametri={{ tekst: 'uslovi' }}>
            {ODLUKA_OSNOV}
          </Veza>
        </p>
        <p className="pomocni-tekst">Pravilo: {p.pravilo}</p>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Spisak zabranjenih stvari</span>
        <ZabranjeneStvari sazeto />
      </div>
      <p className="pomocni-tekst" data-prigovor-rok>
        {prigovorTekst}
      </p>
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-linija" onClick={() => setPrigovor(true)}>
          Uloži prigovor
        </button>
        <Veza ekran={ugao === 'moderacija' ? 'V1' : 'P1'} className="dugme dugme-zeleno">
          Razumem
        </Veza>
      </div>
      {prigovor && (
        <Dijalog naslov="Prigovor na odluku" onZatvori={() => setPrigovor(false)}>
          <p className="mb-2">Prigovor se šalje moderaciji SWAPIT tima, a odgovor stiže u roku iz obaveštenja. U ovom demou ništa se ne šalje.</p>
          <p className="mb-4 pomocni-tekst">{prigovorTekst}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="dugme dugme-zeleno" onClick={() => setPrigovor(false)}>
              Pošalji prigovor (demo)
            </button>
            <button type="button" className="dugme dugme-linija" data-prvi-fokus onClick={() => setPrigovor(false)}>
              Odustani
            </button>
          </div>
        </Dijalog>
      )}
    </section>
  )
}

export function O5() {
  const { parametri, ugao } = useEkran()
  const { s, tokovi, ja, promeni } = useStanjePrice()
  const demo = useDemo()
  const idi = useIdi()
  const [razlog, setRazlog] = useState(RAZLOZI_PRIJAVE[0])
  const [poslata, setPoslata] = useState(false)
  const jednom = useJednom()
  const oglas = nadjiOglas(s, parametri.oglas, tokovi)
  if (!oglas || oglas.id === SLJIVOVICA.id) return <NemaStranice />
  const svoj = !!ja && oglas.vlasnik === ja
  const izPriceO5 = jeRezervisan(oglas) // K1: predmet priče se ne prijavljuje
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="O5">
      <h1>Prijavi oglas ili korisnika</h1>
      <div className="mala-ponuda">
        <MalaStvar stvar={{ naslov: oglas.naslov, vrsta: oglas.vrsta, oglas: oglas.id, ikonica: 'flag' }} />
      </div>
      <p className="pomocni-tekst">Vlasnik oglasa: {imeVlasnika(oglas)}</p>
      {poslata ? (
        <div className="stog" data-prijava-poslata>
          <Obavestenje stanje="uspeh" uloga="status">
            {POVRATNE_PRIJAVE_PORUKA}
          </Obavestenje>
          <div className="red-dugmad">
            <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-zeleno">
              Nazad na oglas
            </Veza>
            <button type="button" className="dugme dugme-linija" onClick={() => idi('V1', 'moderacija')}>
              Gledaj kao Moderacija
            </button>
          </div>
        </div>
      ) : izPriceO5 ? (
        <div data-predmet-price><Obavestenje>{PREDMET_PRICE}. Prijava se ovde ne može poslati.</Obavestenje></div>
      ) : svoj ? (
        <Obavestenje>Ne možeš da prijaviš sopstveni oglas. Ako želiš da ga ukloniš, uradi to u „Moji oglasi“.</Obavestenje>
      ) : (
        <>
          <div className="grupa-polja">
            <span className="polje-oznaka">Razlog</span>
            <Pilule oznaka="Razlog prijave" vrednost={razlog} onChange={setRazlog} opcije={RAZLOZI_PRIJAVE.map((r) => ({ v: r, naziv: r }))} />
          </div>
          <PrikaznoPolje oznaka="Opis" vrednost={OPIS_PRIJAVE_PRIMER} napomena />
          <div className="grupa-polja" data-spisak-u-prijavi>
            <span className="polje-oznaka">Šta ne sme da se objavi</span>
            <ZabranjeneStvari sazeto />
          </div>
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-crveno"
              onClick={() => {
                jednom(() => {
                  if (ja) promeni((t) => prijaviOglas(t, oglas.id, razlog, ja))
                  setPoslata(true)
                  demo.obavesti(PORUKE.simulacija)
                })
              }}
            >
              Pošalji prijavu
            </button>
            <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-tekst">
              Odustani
            </Veza>
          </div>
        </>
      )}
      {ugao === 'moderacija' && <Obavestenje>Moderacija prijave ne šalje; one stižu na tablu moderacije.</Obavestenje>}
    </section>
  )
}

export function S2() {
  const { ugao } = useEkran()
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="S2">
      <h1>Pravila zajednice i zabranjene stvari</h1>
      <div>
        <h2>Pravila zajednice</h2>
        <ul className="lista-pravila mt-1">
          {PRAVILA_ZAJEDNICE.map((p) => (
            <li key={p}>{p}</li>
          ))}
          <li data-pravilo-novac>{PRAVILO_NOVAC}</li>
        </ul>
      </div>
      <div>
        <h2>Šta ne sme da se objavi</h2>
        <div className="mt-1">
          <ZabranjeneStvari link={false} />
        </div>
      </div>
      <div>
        <h2>Ideje</h2>
        <div className="mt-1">
          <ObavestenjeIdeja />
        </div>
      </div>
      <div>
        <h2>Nekretnine i vozila</h2>
        <div className="mt-1">
          <ObavestenjeNekretnine />
        </div>
      </div>
      <div className="red-dugmad">
        {ugao !== 'moderacija' && (
          <Veza ekran="O5" className="dugme dugme-crveno">
            Prijavi oglas
          </Veza>
        )}
        <Veza ekran={ugao === 'moderacija' ? 'V1' : ugao === 'prodavnica' ? 'F3' : 'P1'} className="dugme dugme-zeleno">
          Nazad
        </Veza>
      </div>
    </section>
  )
}

