// S1 „Podrška“, S3 „Kako radi SWAPIT“, S4 „Pravni tekstovi“ (NACRT, nije pravni dokument), S5 „Prijavi problem“ i P10 „Kako ređamo oglase“ (UX 6.12, 6.3).
// Tekstovi su u scenario/stranice.ts (brojke i rokovi iz jednog izvora). Pravni tekstovi su nacrt koji mora da pregleda advokat pre upotrebe.
import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Veza } from '../../komponente/Veza'
import { ZabranjeneStvari } from '../../komponente/ZabranjeneStvari'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { RAZLOZI_PROBLEMA } from '../../scenario/slobodno'
import { P10_AUKCIJE, P10_OZNAKE, P10_PARAMETRI, P10_PREMIUM, P10_RECENZIJE, P10_SPONZORISANO, PRAVNI_TEKSTOVI, S1_KARTICE, S1_ODGOVOR, S3_ODELJCI, S4_NAPOMENA, S4_UPOZORENJE } from '../../scenario/stranice'
import { PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

export function S1() {
  const { ugao } = useEkran()
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="S1">
      <h1>Podrška</h1>
      <p>Odgovori na najčešća pitanja i pravila koja važe u zajednici.</p>
      <ul className="stog-sm" data-podrska-kartice>
        {S1_KARTICE.map((k) => (
          <li key={k.naslov} className="stavka">
            <div className="stavka-glavna stog-sm">
              <h2>{k.naslov}</h2>
              <p className="pomocni-tekst">{k.opis}</p>
            </div>
            <div className="stavka-akcije">
              <Veza ekran={k.ekran} parametri={k.parametri} className="dugme dugme-plavo">
                Otvori
              </Veza>
            </div>
          </li>
        ))}
      </ul>
      {ugao !== 'moderacija' && (
        <Veza ekran="C2" parametri={{ razgovor: 'podrska' }} className="dugme dugme-linija self-start">
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Poruka podršci
        </Veza>
      )}
      <p className="pomocni-tekst">{S1_ODGOVOR}</p>
    </section>
  )
}

export function S3() {
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="S3">
      <h1>Kako radi SWAPIT</h1>
      <div className="stog" data-odeljci>
        {S3_ODELJCI.map((o) => (
          <div key={o.naslov} className="stog-sm" data-odeljak>
            <h2>{o.naslov}</h2>
            <p>{o.tekst}</p>
          </div>
        ))}
      </div>
      <div className="red-dugmad">
        <Veza ekran="P10" className="dugme dugme-linija">
          Kako ređamo oglase
        </Veza>
        <Veza ekran="S2" className="dugme dugme-linija">
          Pravila zajednice
        </Veza>
      </div>
    </section>
  )
}

export function S4() {
  const { parametri, ugao } = useEkran()
  const tekst = PRAVNI_TEKSTOVI.find((t) => t.id === parametri.tekst)
  if (!tekst) return <NemaStranice />
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="S4" data-pravni-tekst={tekst.id}>
      <Obavestenje stanje="upozorenje">
        <b data-nije-pravni-dokument>{S4_UPOZORENJE}</b>
      </Obavestenje>
      <h1>{tekst.naziv}</h1>
      <nav className="tabovi" aria-label="Pravni tekstovi">
        {PRAVNI_TEKSTOVI.map((t) => (
          <a key={t.id} className="tab" href={`#${link('S4', ugao, { tekst: t.id })}`} aria-current={t.id === tekst.id ? 'page' : undefined}>
            {t.naziv}
          </a>
        ))}
      </nav>
      <p className="pomocni-tekst">{S4_NAPOMENA}</p>
      <div className="stog">
        {tekst.odeljci.map((o) => (
          <div key={o.naslov} className="stog-sm">
            <h2>{o.naslov}</h2>
            <p>{o.tekst}</p>
            {o.id === 'zabranjene' && (
              <div data-zabranjene-u-uslovima>
                <ZabranjeneStvari link={false} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="red-dugmad">
        <Veza ekran="S1" className="dugme dugme-linija">
          Podrška
        </Veza>
      </div>
    </section>
  )
}

export function S5() {
  const demo = useDemo()
  const { tokovi, ja, uradjeno } = useStanjePrice()
  const [tip, setTip] = useState(RAZLOZI_PROBLEMA[0])
  const razmene = [...(uradjeno('6.jovana') ? ['Lanac razmene (priča)'] : []), ...tokovi.razmene.filter((r) => !!ja && (r.vlasnik === ja || r.od === ja)).map((r) => r.naslov)]
  const opcije = razmene.length > 0 ? razmene : ['Nije izabrana nijedna razmena']
  // N6: za „Razmena nije obavljena“ razmena mora da se izabere; „Pošalji“ je neaktivno dok nije izabrana
  const NIJE_IZABRANO = 'Izaberi razmenu'
  const [razmena, setRazmena] = useState(NIJE_IZABRANO)
  const treba = tip === RAZLOZI_PROBLEMA[0]
  const blokirano = treba && !razmene.includes(razmena) ? (razmene.length === 0 ? 'Nemaš nijednu razmenu koju možeš da prijaviš' : 'Izaberi razmenu') : undefined
  const [poslato, setPoslato] = useState(false)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="S5">
      <h1>Prijavi problem</h1>
      {poslato ? (
        <div className="stog" data-problem-poslat>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Hvala, prijava je primljena.</b> Podrška će pregledati: {tip}.
          </Obavestenje>
          <div className="red-dugmad">
            <Veza ekran="X12" className="dugme dugme-zeleno">
              Moje razmene i ponude
            </Veza>
            <Veza ekran="S1" className="dugme dugme-linija">
              Podrška
            </Veza>
          </div>
        </div>
      ) : (
        <>
          <div className="grupa-polja">
            <span className="polje-oznaka">Tip problema</span>
            <Pilule oznaka="Tip problema" vrednost={tip} onChange={setTip} opcije={RAZLOZI_PROBLEMA.map((r) => ({ v: r, naziv: r }))} />
          </div>
          <Padajuce oznaka={treba ? 'Povezana razmena (obavezno)' : 'Povezana razmena'} vrednost={razmena} onChange={setRazmena} opcije={opcije} />
          <PrikaznoPolje oznaka="Opis" vrednost="Imam problem sa ovom razmenom i molim za pomoć." napomena />
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-zeleno"
              aria-disabled={(!!blokirano) || undefined}
              onClick={() => {
                setPoslato(true)
                demo.obavesti(PORUKE.simulacija)
              }}
            >
              Pošalji
            </button>
            {blokirano && <span className="razlog-neaktivno">{blokirano}</span>}
            <Veza ekran="S1" className="dugme dugme-tekst">
              Odustani
            </Veza>
          </div>
        </>
      )}
    </section>
  )
}

export function P10() {
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="P10">
      <h1>Kako ređamo oglase</h1>
      <div>
        <h2>Glavni parametri rangiranja</h2>
        <ol className="lista-pravila mt-1" data-parametri>
          {P10_PARAMETRI.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>
      <div>
        <h2>Sponzorisano</h2>
        <p className="mt-1">
          <Znacka vrsta="sponzorisano" /> {P10_SPONZORISANO}
        </p>
      </div>
      <div>
        <h2>Javne aukcije</h2>
        <p className="mt-1" data-p10-aukcije>
          <Znacka vrsta="aukcija" /> {P10_AUKCIJE}
        </p>
      </div>
      <div>
        <h2>Top ponuda i PREMIUM</h2>
        <p className="mt-1" data-p10-premium>
          <Znacka vrsta="istaknuto" /> {P10_PREMIUM}
        </p>
      </div>
      <div>
        <h2>Građanin i Firma</h2>
        <p className="mt-1">{P10_OZNAKE}</p>
      </div>
      <div>
        <h2>Recenzije</h2>
        <p className="mt-1">{P10_RECENZIJE}</p>
      </div>
      <div className="red-dugmad">
        <Veza ekran="S3" className="dugme dugme-linija">
          Kako radi SWAPIT
        </Veza>
        <Veza ekran="P1" className="dugme dugme-zeleno">
          Nazad na početnu
        </Veza>
      </div>
    </section>
  )
}
