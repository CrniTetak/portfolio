// F3 „Tabla firme“, F4 „Javni profil firme“, F6 „Pregled rezultata“ (UX 6.13, 7.7). Firma je Sportski kutak Zupčanik (prodavnica sa planom „Radnja“).
// Sve brojke su iz svet() i scenario/poslovno.ts. Firme ne drže poene. Adresa radnje je izmišljena (firma je javno prikazuje, građani nikad).
import { BarChart3, Megaphone, Pencil, Store, Tag, Truck } from 'lucide-react'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Kpi, KpiMreza } from '../../komponente/Kpi'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrimerOznaka } from '../../komponente/PrimerOznaka'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { broj, datum, din, procenat } from '../../scenario/format'
import { DATUM_AKCIJA_DO, DATUM_AKCIJA_OD } from '../../scenario/datumi'
import { AKCIJA_NAZIV, NAJVECI_STUBIC, PERIOD_DANA, PREGLEDI_PO_NEDELJAMA, PREGLEDI_PO_OGLASIMA } from '../../scenario/poslovno'
import { ODREDISTA_REKLAME, RADNA_VREMENA } from '../../scenario/slobodno'
import { CENE, FIRMA_PO_ID } from '../../scenario/svet'
import { NemaStranice } from '../NemaStranice'

const ZUPCANIK = 'zupcanik'

export function F3() {
  const { s, korak, uradjeno, tokovi, slobodno } = useStanjePrice()
  const firma = FIRMA_PO_ID[ZUPCANIK]
  const z = s.zupcanik
  const objavljena = uradjeno('9.z4') || tokovi.poslovno.akcija
  const nacrt = !slobodno && korak >= 8 && !objavljena
  const cenaPlana = z.plan === 'Majstor' ? CENE.pretplataMajstor : CENE.pretplataRadnja
  const reklama = tokovi.poslovno.reklama
  return (
    <div className="stog" data-ekran-sadrzaj="F3">
      <div className="naslov-reda">
        <div>
          <h1>Tabla firme</h1>
          <p className="pomocni-tekst">
            Dobro došli, <b>{firma.naziv}</b>. Nalog je aktivan.
          </p>
        </div>
        <div className="znacke">
          <Znacka vrsta="firma" />
        </div>
      </div>
      <KpiMreza oznaka="Pokazatelji firme">
        <Kpi id="oglasi" oznaka="Aktivni oglasi" vrednost={broj(z.oglasa)} />
        <Kpi id="pregledi" oznaka={`Pregledi, ${PERIOD_DANA} dana`} vrednost={broj(z.pregledi30Dana)} />
        <Kpi id="ponude" oznaka="Ponude" vrednost={broj(z.ponude)} />
        <Kpi id="razmene" oznaka="Obavljene razmene" vrednost={broj(z.obavljeneRazmene)} />
      </KpiMreza>
      <div className="dva-stupca dva-stupca-jednaka">
        <section className="kartica stog" aria-label="Akcija" data-blok-akcija={objavljena ? 'aktivna' : 'nema'}>
          <h2>Akcija</h2>
          {objavljena && s.akcija ? (
            <>
              <p>
                <b>{AKCIJA_NAZIV}</b> <Znacka vrsta="sponzorisano" />
              </p>
              <p className="pomocni-tekst">
                Aktivna, od {datum(DATUM_AKCIJA_OD)} do {datum(DATUM_AKCIJA_DO)} · prijava: <b className="num">{broj(s.akcija.prijave)}</b>.
              </p>
              <PrimerOznaka />
              <div className="red-dugmad">
                <Veza ekran="A4" className="dugme dugme-plavo">
                  Tabla akcija
                </Veza>
                <Veza ekran="A1" parametri={{ akcija: 'staro-za-novo' }} className="dugme dugme-linija">
                  Javna stranica akcije
                </Veza>
              </div>
            </>
          ) : (
            <>
              <p>Nema aktivne akcije — napravi je.</p>
              {nacrt && <p className="pomocni-tekst">Nacrt akcije „{AKCIJA_NAZIV}“ je pripremljen i čeka objavu.</p>}
              <Veza ekran="A5" className="dugme dugme-zeleno self-start">
                {nacrt ? 'Otvori nacrt akcije' : 'Napravi akciju'}
              </Veza>
            </>
          )}
        </section>
        <section className="kartica stog" aria-label="Pretplata" data-blok-pretplata>
          <h2>Pretplata: {z.plan}</h2>
          <p>
            {tokovi.poslovno.otkazana ? 'Otkazana' : 'Aktivna'} · <b className="num">{din(cenaPlana)}</b> mesečno, sa PDV-om
          </p>
          <div>
            <Znacka vrsta="ilustrativno" />
          </div>
          <Veza ekran="F8" className="dugme dugme-linija self-start">
            Upravljaj pretplatom
          </Veza>
        </section>
      </div>
      {reklama && (
        <section className="kartica stog" aria-label="Reklama" data-blok-reklama>
          <h2>Reklama „Sponzorisano“</h2>
          <p>
            Objavljena (plaćeno) · vodi na: <b>{ODREDISTA_REKLAME.find((o) => o.v === reklama)?.naziv}</b> <Znacka vrsta="sponzorisano" />
          </p>
          <Veza ekran="F9" className="dugme dugme-linija self-start">
            Upravljaj reklamom
          </Veza>
        </section>
      )}
      <section className="stog-sm" aria-label="Prečice">
        <h2>Prečice</h2>
        <div className="red-dugmad">
          <Veza ekran="F6" className="dugme dugme-linija">
            <BarChart3 size={18} strokeWidth={1.75} aria-hidden /> Pregled rezultata
          </Veza>
          <Veza ekran="O6" className="dugme dugme-linija">
            <Tag size={18} strokeWidth={1.75} aria-hidden /> Moji oglasi
          </Veza>
          <Veza ekran="F4" parametri={{ firma: ZUPCANIK }} className="dugme dugme-linija">
            <Store size={18} strokeWidth={1.75} aria-hidden /> Javni profil
          </Veza>
          <Veza ekran="F9" className="dugme dugme-linija">
            <Megaphone size={18} strokeWidth={1.75} aria-hidden /> Reklama „Sponzorisano“
          </Veza>
          <Veza ekran="F5" className="dugme dugme-linija">
            <Pencil size={18} strokeWidth={1.75} aria-hidden /> Uredi profil
          </Veza>
          <Veza ekran="X12" className="dugme dugme-linija">
            <Truck size={18} strokeWidth={1.75} aria-hidden /> Moje razmene i ponude
          </Veza>
        </div>
      </section>
    </div>
  )
}

export function F4() {
  const { parametri, ugao } = useEkran()
  const { s, uradjeno, tokovi } = useStanjePrice()
  if (!Object.hasOwn(FIRMA_PO_ID, parametri.firma)) return <NemaStranice />
  const firma = FIRMA_PO_ID[parametri.firma]
  const oglasi = s.oglasi.filter((o) => o.vlasnik === firma.id)
  // akcija i njena reklama su javne tek posle plaćanja (N-3)
  const imaAkciju = firma.id === ZUPCANIK && (uradjeno('9.z4') || tokovi.poslovno.akcija)
  const moja = ugao === 'prodavnica' && firma.id === ZUPCANIK
  const radnoVreme = firma.id === ZUPCANIK ? RADNA_VREMENA[tokovi.poslovno.radnoVreme] : firma.radnoVreme
  return (
    <div className="stog" data-ekran-sadrzaj="F4" data-firma={firma.id}>
      <section className="kartica stog" aria-labelledby="f4-naslov">
        <div className="naslov-reda">
          <div>
            <div className="znacke">
              <Znacka vrsta="firma" />
            </div>
            <h1 id="f4-naslov" className="mt-2">
              {firma.naziv}
            </h1>
            <p className="pomocni-tekst">{firma.delatnost}</p>
          </div>
          <div className="red-dugmad">
            {/* N-8: na sopstvenom profilu firme nema dugmeta „Poruka“, nego „Uredi profil“ */}
            {moja ? (
              <Veza ekran="F5" className="dugme dugme-plavo">
                Uredi profil
              </Veza>
            ) : (
              ugao !== 'moderacija' && (
                <Veza ekran="C2" parametri={{ razgovor: firma.id }} className="dugme dugme-plavo">
                  Poruka
                </Veza>
              )
            )}
          </div>
        </div>
        <p>{firma.opis}</p>
        <dl className="podaci-oglasa">
          <dt>Radno vreme</dt>
          <dd data-radno-vreme>{radnoVreme}</dd>
          <dt>Adresa radnje</dt>
          <dd>
            {firma.adresa} (izmišljena adresa)
          </dd>
        </dl>
      </section>
      <section className="stog" aria-label="Oglasi firme">
        <h2>
          Oglasi firme (<span className="num">{broj(oglasi.length)}</span>)
        </h2>
        <div className="cipovi" data-oglasi-firme>
          {oglasi.map((o) => (
            <KarticaOglasa key={o.id} oglas={o} />
          ))}
        </div>
      </section>
      {imaAkciju && (
        <section className="kartica stog" aria-label="Akcije firme" data-akcije-firme>
          <h2>Akcije</h2>
          <p>
            <b>{AKCIJA_NAZIV}</b> <Znacka vrsta="sponzorisano" />
          </p>
          <p className="pomocni-tekst">
            Od {datum(DATUM_AKCIJA_OD)} do {datum(DATUM_AKCIJA_DO)}
          </p>
          <Veza ekran="A1" parametri={{ akcija: 'staro-za-novo' }} className="dugme dugme-plavo self-start">
            Pogledaj akciju
          </Veza>
        </section>
      )}
      <section className="kartica stog" aria-label="Recenzije firme">
        <h2>Recenzije</h2>
        <p className="pomocni-tekst">Recenziju može da ostavi samo ko je obavio razmenu. Firma ovde dobija recenzije tek posle potvrđene razmene.</p>
        {firma.id === ZUPCANIK && (
          <p>
            Obavljene razmene: <b className="num">{broj(s.zupcanik.obavljeneRazmene)}</b>
          </p>
        )}
      </section>
    </div>
  )
}

export function F6() {
  const { s, uradjeno, tokovi } = useStanjePrice()
  const z = s.zupcanik
  const oglasi = s.oglasi.filter((o) => o.vlasnik === ZUPCANIK)
  const akcija = uradjeno('9.z4') || tokovi.poslovno.akcija ? s.akcija : null
  return (
    <div className="stog" data-ekran-sadrzaj="F6">
      <div>
        <h1>Pregled rezultata</h1>
        <p className="pomocni-tekst">Poslednjih {broj(PERIOD_DANA)} dana</p>
      </div>
      <KpiMreza oznaka="Rezultati">
        <Kpi id="pregledi" oznaka="Pregledi" vrednost={broj(z.pregledi30Dana)} />
        <Kpi id="omiljeno" oznaka="Sačuvano u omiljeno" vrednost={broj(z.sacuvanoUOmiljeno)} />
        <Kpi id="ponude" oznaka="Ponude" vrednost={broj(z.ponude)} />
        <Kpi id="razmene" oznaka="Obavljene razmene" vrednost={broj(z.obavljeneRazmene)} />
      </KpiMreza>
      <section className="kartica stog" aria-label="Pregledi po nedeljama">
        <h2>Pregledi po nedeljama</h2>
        <svg className="stubici" viewBox="0 0 400 190" role="img" aria-label={`Pregledi po nedeljama: ${PREGLEDI_PO_NEDELJAMA.map((n) => `${n.naziv} ${broj(n.pregledi)}`).join(', ')}`} data-stubici>
          {PREGLEDI_PO_NEDELJAMA.map((n, i) => {
            const visina = Math.round((n.pregledi / NAJVECI_STUBIC) * 120)
            const x = 20 + i * 92
            return (
              <g key={n.naziv}>
                <rect className="stubic" x={x} y={150 - visina} width="60" height={visina} rx="6" />
                <text className="stubic-vrednost" x={x + 30} y={144 - visina}>
                  {broj(n.pregledi)}
                </text>
                <text className="stubic-natpis" x={x + 30} y="174">
                  {n.naziv}
                </text>
              </g>
            )
          })}
        </svg>
      </section>
      <section className="stog" aria-label="Oglasi po pregledima">
        <h2>Oglasi po pregledima</h2>
        <table className="tabela-kartice" data-tabela-oglasa>
          <thead>
            <tr>
              <th scope="col">Oglas</th>
              <th scope="col">Pregledi</th>
            </tr>
          </thead>
          <tbody>
            {oglasi.map((o, i) => (
              <tr key={o.id}>
                <td data-oznaka="Oglas">
                  <Veza ekran="O1" parametri={{ oglas: o.id }}>
                    {o.naslov}
                  </Veza>
                </td>
                <td data-oznaka="Pregledi">
                  <b className="num">{broj(PREGLEDI_PO_OGLASIMA[i] ?? 0)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <KpiMreza oznaka="Reklama Sponzorisano" tri>
        <Kpi id="prikazi" oznaka="Reklama: prikazi" vrednost={broj(z.reklamaPrikazi)} opis={<Znacka vrsta="sponzorisano" />} />
        <Kpi id="klikovi" oznaka="Reklama: klikovi" vrednost={broj(z.reklamaKlikovi)} />
        <Kpi id="ctr" oznaka="Udeo klikova u prikazima" vrednost={procenat(z.ctrDesetine)} />
      </KpiMreza>
      {akcija ? (
        <>
        <PrimerOznaka />
        <KpiMreza oznaka="Akcija" tri>
          <Kpi id="akcija-prijave" oznaka={`Akcija „${AKCIJA_NAZIV}“: prijave`} vrednost={broj(akcija.prijave)} />
          <Kpi id="akcija-popusti" oznaka="Izdati popusti" vrednost={din(akcija.izdatiPopusti)} opis={<Znacka vrsta="ilustrativno" />} />
          <Kpi id="akcija-pregledi" oznaka="Pregledi stranice akcije" vrednost={broj(akcija.pregledi)} />
        </KpiMreza>
        </>
      ) : (
        <Obavestenje>Rezultati akcije „{AKCIJA_NAZIV}“ stižu kad akcija bude objavljena.</Obavestenje>
      )}
    </div>
  )
}
