// J1 „Javne aukcije“, J2 „Aukcija“, J3 „Pokreni aukciju“, J4 „Izaberi ponudu“ (UX 6.8). Javno nadmetanje PONUDAMA za jedan oglas, sa rokom:
// vlasnik na kraju bira ponudu koja mu odgovara — ne mora biti najveća. Nema novca; plaća se samo paket aukcija platformi (Z2 → Z3 → Z4).
// Šest aukcija je unapred pripremljeno; gledalac može da pokrene sopstvenu (troši jedan paket) i da izabere ponudu (J4 → X7).
import { Gavel } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useState, type ReactNode } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { OvoRadi } from '../../komponente/OvoRadi'
import { Pilule } from '../../komponente/Kontrole'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import type { Ugao } from '../../prica/tipovi'
import { dodajDane, demoDatum, type Datum } from '../../scenario/datumi'
import { broj, datum } from '../../scenario/format'
import { AUKCIJE_OGLASI as STATICKE, brojPonudaAukcije, ponudeAukcije, rokAukcije } from '../../scenario/slobodno'
import { useJednom } from '../../demo/useJednom'
import { ANA_ID, MARKO_ID, ROKOVI_AUKCIJE_DANA, jeRezervisan, nadjiOglas } from '../../scenario/svet'
import { nadjiRazmenu, pokreniAukciju, ponudeZaOglas, prihvatiPonuduIPokreni, type PonudaPrikaz } from '../../tokovi/operacije'
import type { Tokovi } from '../../tokovi/tokovi'
import { NEUSPEH, PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const uglaIz = (id: string): Ugao | null => (id === ANA_ID ? 'ana' : id === MARKO_ID ? 'marko' : null)

/** Rok aukcije: unapred pripremljene imaju datum iz podataka, a pokrenute se računaju od demo datuma (bez sata računara). */
function rokZa(oglasId: string, tokovi: Tokovi): Datum | undefined {
  const svoja = tokovi.aukcije.find((a) => a.oglas === oglasId)
  return svoja ? dodajDane(demoDatum(svoja.korak, true), svoja.dana) : rokAukcije(oglasId)
}

/** Sve ponude jedne aukcije: unapred pripremljene (tuđe aukcije) ili semena + poslate (naše aukcije), uz ponude koje je gledalac poslao. */
function ponudeAukcijeSve(oglasId: string, tokovi: Tokovi, slobodno: boolean): PonudaPrikaz[] {
  const poslate = tokovi.ponude.filter((p) => p.cilj === oglasId)
  if (STATICKE.includes(oglasId)) {
    const seme = ponudeAukcije(oglasId, brojPonudaAukcije(oglasId)).map((p) => ({ ...p, status: 'ceka' as const, razlog: undefined, seme: true }))
    return [...seme, ...poslate.map((p) => ({ id: p.id, od: p.od, stvari: p.stvari, poruka: '', status: p.status, razlog: p.razlog, seme: false }))]
  }
  return ponudeZaOglas(tokovi, oglasId, slobodno)
}

export function J1() {
  const { s, tokovi, slobodno } = useStanjePrice()
  const aukcije = s.oglasi.filter((o) => o.aukcija)
  return (
    <section className="stog" data-ekran-sadrzaj="J1">
      <div className="kartica stog">
        <h1>Javne aukcije</h1>
        <p data-objasnjenje-aukcije>Javno nadmetanje ponudama za jedan oglas, sa rokom. Vlasnik na kraju bira ponudu koja mu odgovara — ne mora biti najveća. Nema novca.</p>
        <div className="znacke">
          <span className="znacka znacka-aukcija">
            <Gavel size={14} strokeWidth={1.75} aria-hidden /> Javne aukcije · plaćena usluga vlasnika oglasa
          </span>
        </div>
        <Veza ekran="J3" className="dugme dugme-zeleno self-start">
          Pokreni svoju aukciju
        </Veza>
      </div>
      <div className="mreza-kartica" data-mreza-aukcija>
        {aukcije.map((o) => {
          const ponude = ponudeAukcijeSve(o.id, tokovi, slobodno).length
          const rok = rokZa(o.id, tokovi)
          return (
            <div key={o.id} className="stog-sm" data-aukcija={o.id}>
              <KarticaOglasa oglas={o} ka="J2" />
              <p className="pomocni-tekst" data-ponuda-i-rok>
                Ponuda: <b className="num">{broj(ponude)}</b>
                {rok && <> · ističe {datum(rok)}</>}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Kartica ponude u aukciji (J2, J4). */
function RedPonude({ p, izbor }: { p: PonudaPrikaz; izbor?: ReactNode }) {
  return (
    <li className="stavka" data-ponuda={p.id}>
      <div className="stavka-glavna stog-sm">
        <KorisnikRed id={p.od} bezZnacki />
        <div className="mala-ponuda">
          {p.stvari.map((st) => (
            <MalaStvar key={st.naslov} stvar={st} />
          ))}
        </div>
      </div>
      {izbor && <div className="stavka-akcije">{izbor}</div>}
    </li>
  )
}

export function J2() {
  const { parametri } = useEkran()
  const { s, tokovi, slobodno, ja, ugao } = useStanjePrice()
  const oglas = nadjiOglas(s, parametri.oglas, tokovi)
  if (!oglas) return <NemaStranice />
  const jeAukcija = oglas.aukcija || STATICKE.includes(oglas.id) || tokovi.aukcije.some((a) => a.oglas === oglas.id)
  if (!jeAukcija)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="J2" data-nije-aukcija>
        <h1>Aukcija</h1>
        <Obavestenje>Ovaj oglas nije na javnoj aukciji.</Obavestenje>
        <div className="red-dugmad">
          <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-zeleno">
            Pogledaj oglas
          </Veza>
          <Veza ekran="J1" className="dugme dugme-linija">
            Javne aukcije
          </Veza>
        </div>
      </section>
    )
  const rok = rokZa(oglas.id, tokovi)
  const ponude = ponudeAukcijeSve(oglas.id, tokovi, slobodno)
  const vlasnik = !!ja && oglas.vlasnik === ja
  return (
    <div className="dva-stupca" data-ekran-sadrzaj="J2" data-aukcija={oglas.id}>
      <section className="kartica stog">
        <h1>Aukcija</h1>
        <div className="flex flex-wrap items-center gap-4">
          <KarticaOglasa oglas={oglas} prva />
          <div className="stog-sm">
            {rok && (
              <p data-rok-aukcije>
                Ističe <b>{datum(rok)}</b>
              </p>
            )}
            <p className="pomocni-tekst">Nijedna ponuda nije automatski najbolja — vlasnik bira.</p>
            <Znacka vrsta="aukcija" />
          </div>
        </div>
        <div className="red-dugmad">
          {vlasnik ? (
            <Veza ekran="J4" parametri={{ oglas: oglas.id }} className="dugme dugme-zeleno">
              Izaberi ponudu
            </Veza>
          ) : ugao === 'ana' || ugao === 'marko' ? (
            <Veza ekran="X1" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
              Ponudi
            </Veza>
          ) : (
            <span className="razlog-neaktivno">Ponude šalju građani (Gledaj kao Ana).</span>
          )}
          <Veza ekran="J1" className="dugme dugme-linija">
            Sve aukcije
          </Veza>
        </div>
      </section>
      <section className="kartica stog" aria-label="Ponude">
        <h2>
          Ponude (<span className="num" data-broj-ponuda>{broj(ponude.length)}</span>)
        </h2>
        {ponude.length === 0 ? (
          <p className="prazno-stanje">Još nema ponuda.</p>
        ) : (
          <ul className="stog-sm" data-ponude-aukcije>
            {ponude.map((p) => (
              <RedPonude key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export function J3() {
  const navigate = useNavigate()
  const demo = useDemo()
  const l = useLink()
  const { parametri } = useEkran()
  const { s, tokovi, korak, ja, ugao, promeni } = useStanjePrice()
  const jednom = useJednom()
  const moji = s.oglasi.filter((o) => o.vlasnik === ja && !o.aukcija && !jeRezervisan(o) && o.vrsta === 'roba' && !o.istaknuto && o.nacin !== 'poklon')
  const trazeni = moji.find((o) => o.id === parametri.oglas)
  const [izbor, setIzbor] = useState<string>(trazeni?.id ?? moji[0]?.id ?? '')
  const [dana, setDana] = useState<number>(ROKOVI_AUKCIJE_DANA[1])
  if (ugao !== 'ana' && ugao !== 'marko') return <OvoRadi ko="ana" naslov="Pokreni aukciju" opis="Aukciju pokreće građanin sa svog oglasa." nazad={{ ekran: 'J1', naziv: 'Javne aukcije' }} />
  const oglas = moji.find((o) => o.id === izbor)
  const ostalo = tokovi.paketAukcija
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="J3">
      <h1>Pokreni aukciju</h1>
      {moji.length === 0 ? (
        <div className="stog" data-nema-oglasa>
          <Obavestenje>Nemaš oglas koji možeš da staviš na aukciju (roba, bez isticanja). Objavi oglas pa se vrati.</Obavestenje>
          <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-zeleno self-start">
            Novi oglas
          </Veza>
        </div>
      ) : (
        <>
          <div className="grupa-polja">
            <span className="polje-oznaka">Izaberi oglas</span>
            <Pilule oznaka="Oglas za aukciju" vrednost={izbor} onChange={setIzbor} opcije={moji.map((o) => ({ v: o.id, naziv: o.naslov }))} />
          </div>
          <div className="grupa-polja">
            <span className="polje-oznaka">Rok</span>
            <Pilule<string> oznaka="Rok aukcije" vrednost={String(dana)} onChange={(v) => setDana(Number(v))} opcije={ROKOVI_AUKCIJE_DANA.map((d) => ({ v: String(d), naziv: `${broj(d)} dana` }))} />
          </div>
          <Obavestenje>Uslovi: vlasnik bira ponudu koja mu odgovara, ne mora biti najveća. Nema novca između korisnika.</Obavestenje>
          <p data-paket-stanje>
            {ostalo > 0 ? (
              <>
                U paketu imaš <b className="num">{broj(ostalo)}</b>; posle ove ostaje <b className="num">{broj(ostalo - 1)}</b>.
              </>
            ) : (
              <>U paketu nemaš nijednu aukciju. Kupi paket pa se vrati.</>
            )}
          </p>
          <div className="red-dugmad">
            {ostalo > 0 ? (
              <button
                type="button"
                className="dugme dugme-zeleno"
                aria-disabled={(!oglas) || undefined}
                onClick={() =>
                  jednom(() => {
                    if (!oglas) return
                    promeni((t) => pokreniAukciju(t, oglas.id, dana as 3 | 7 | 14, korak))
                    demo.obavesti(PORUKE.simulacija)
                    navigate(l('J2', { oglas: oglas.id }))
                    window.scrollTo(0, 0)
                  })
                }
              >
                Pokreni aukciju
              </button>
            ) : (
              <>
                <Veza ekran="Z2" className="dugme dugme-plavo">
                  Kupi paket
                </Veza>
                <span className="razlog-neaktivno">Nemaš aukcija u paketu</span>
              </>
            )}
            <Veza ekran="J1" className="dugme dugme-tekst">
              Odustani
            </Veza>
          </div>
        </>
      )}
    </section>
  )
}

export function J4() {
  const navigate = useNavigate()
  const demo = useDemo()
  const l = useLink()
  const { parametri } = useEkran()
  const { s, tokovi, slobodno, ja, ugao, promeni } = useStanjePrice()
  const oglas = nadjiOglas(s, parametri.oglas, tokovi)
  if (!oglas) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <OvoRadi ko="ana" naslov="Izaberi ponudu" opis="Ponudu bira vlasnik aukcije." nazad={{ ekran: 'J1', naziv: 'Javne aukcije' }} />
  if (oglas.vlasnik !== ja) {
    const ko = uglaIz(oglas.vlasnik)
    return ko ? (
      <OvoRadi ko={ko} naslov="Izaberi ponudu" opis="Ponudu na aukciji bira vlasnik oglasa." nazad={{ ekran: 'J2', naziv: 'Nazad na aukciju' }} />
    ) : (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="J4" data-tudja-aukcija>
        <h1>Izaberi ponudu</h1>
        <Obavestenje>Ponudu na ovoj aukciji bira njen vlasnik. Pokreni sopstvenu aukciju da probaš izbor.</Obavestenje>
        <div className="red-dugmad">
          <Veza ekran="J3" className="dugme dugme-zeleno">
            Pokreni svoju aukciju
          </Veza>
          <Veza ekran="J2" parametri={{ oglas: oglas.id }} className="dugme dugme-linija">
            Nazad na aukciju
          </Veza>
        </div>
      </section>
    )
  }
  const ponude = ponudeAukcijeSve(oglas.id, tokovi, slobodno).filter((p) => p.status === 'ceka')
  const izaberi = (p: PonudaPrikaz) => {
    const novo = promeni((t) => prihvatiPonuduIPokreni(t, p.id, oglas.id, { id: p.id, tip: 'razmena', cilj: oglas.id, naslov: oglas.naslov, vlasnik: oglas.vlasnik, od: p.od, stvari: p.stvari }))
    if (!nadjiRazmenu(novo, p.id)) return demo.obavesti(NEUSPEH.razmena) // D6: bez lažnog uspeha i bez prelaska na X7
    demo.obavesti(PORUKE.simulacija)
    navigate(l('X7', { oglas: oglas.id, ponuda: p.id }))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="J4" data-aukcija={oglas.id}>
      <h1>Izaberi ponudu</h1>
      <p>
        Aukcija: <b>{oglas.naslov}</b> ({broj(ponude.length)} ponuda na čekanju)
      </p>
      <Obavestenje>Nijedna ponuda nije automatski najbolja — biraš ti.</Obavestenje>
      {ponude.length === 0 ? (
        <p className="prazno-stanje">Nema ponuda koje čekaju odluku.</p>
      ) : (
        <ul className="stog-sm" data-ponude-aukcije>
          {ponude.map((p) => (
            <RedPonude
              key={p.id}
              p={p}
              izbor={
                <button type="button" className="dugme dugme-zeleno" onClick={() => izaberi(p)}>
                  Izaberi ovu ponudu
                </button>
              }
            />
          ))}
        </ul>
      )}
      <Veza ekran="J2" parametri={{ oglas: oglas.id }} className="dugme dugme-tekst self-start">
        Nazad na aukciju
      </Veza>
    </section>
  )
}

