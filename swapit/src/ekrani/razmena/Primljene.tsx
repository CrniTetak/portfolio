// X4 „Primljene ponude“, X5 „Detalj ponude“, X6 „Odbij ponudu“, X7 „Ponuda prihvaćena“ (UX 6.5). Korak 5: Marko odbija Aninu ponudu
// i upisuje šta traži (udžbenike); moderacija istovremeno odlučuje o prijavljenom oglasu (korak 5 u uglu Moderacija).
import { Check, X } from 'lucide-react'
import { BICIKL_ID, PS2_ID } from '../../scenario/svet'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { Kvacica, Pilule } from '../../komponente/Kontrole'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja } from '../../komponente/Obavestenja'
import { OvoRadi } from '../../komponente/OvoRadi'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { useEkran } from '../../okvir/kontekst'
import { broj, ocena, zvezdice } from '../../scenario/format'
import { PONUDE_MARKO, RAZLOZI_ODBIJANJA, TRAZI_TEKST, type PrimljenaPonuda } from '../../scenario/prica'
import { ANA_ID, MARKO_ID, oglasPoId } from '../../scenario/svet'
import { PORUKE } from '../../tekstovi/okvir'
import { X4Slobodno, X5Slobodno, X6Slobodno, X7Slobodno } from './PrimljeneSlobodno'

const OGLAS = BICIKL_ID
const ANINA = PS2_ID
/** S2: u vođenoj priči Marko odbija Aninu ponudu, pa je „prihvati“ na njoj zaključano (ne može da pokvari priču). */
const RAZLOG_ZAKLJUCANO = 'U priči Marko odbija ovu ponudu'

/** Ponude koje Marko trenutno vidi: Anina stiže u koraku 4 i nestaje kad je odbijena; Irenina i Stefanova su tu od početka. */
export function primljenePonude(uradjeno: (id: string) => boolean): PrimljenaPonuda[] {
  return PONUDE_MARKO.filter((p) => p.id !== ANINA || (uradjeno('4.x2') && !uradjeno('5.x6')))
}

/** S8: ponude prima Marko (vlasnik oglasa); ostali uglovi vide poruku sa „Gledaj kao Marko“. */
const SamoMarko = ({ naslov }: { naslov: string }) => <OvoRadi ko="marko" naslov={naslov} opis="Ovde vlasnik oglasa vidi ponude koje je primio." nazad={{ ekran: 'X12', naziv: 'Moje razmene i ponude' }} />

function X4Prica() {
  const { ugao, parametri } = useEkran()
  const { s, uradjeno, korak, grana } = useStanjePrice()
  const l = useLink()
  const demo = useDemo()
  const oglas = oglasPoId(parametri.oglas) ?? oglasPoId(OGLAS)!
  const ponude = primljenePonude(uradjeno)
  const zakljucaj = demo.rezim === 'vodjena'
  if (ugao !== 'marko' || oglas.vlasnik !== MARKO_ID) return <SamoMarko naslov="Primljene ponude" />
  const mojiOglasi = s.oglasi.filter((o) => o.vlasnik === MARKO_ID && o.nacin === 'razmena')
  return (
    <div className="stog" data-ekran-sadrzaj="X4">
      <h1>Primljene ponude</h1>
      <div className="dva-stupca dva-stupca-jednaka">
        <section className="kartica stog" aria-label="Moji oglasi">
          <h2>Moji oglasi</h2>
          <ul className="stog-sm">
            {mojiOglasi.slice(0, 3).map((o) => (
              <li key={o.id} className="stavka" aria-current={o.id === oglas.id ? 'true' : undefined}>
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id }} />
                {o.id === oglas.id && <span className="znacka znacka-poklon">Izabrano</span>}
              </li>
            ))}
          </ul>
          <KarticaOglasa oglas={oglas} />
        </section>
        <section className="kartica stog" aria-label="Primljene ponude" data-primljene>
          <h2>
            Primljene ponude ({broj(ponude.length)})
          </h2>
          {korak < 4 && <p className="pomocni-tekst">Anina ponuda stiže u koraku 4.</p>}
          <ul className="stog-sm">
            {ponude.map((p) => {
              const anina = p.id === ANINA
              return (
                <li key={p.id} className="stavka" data-ponuda={p.id}>
                  <div className="stavka-glavna stog-sm">
                    <KorisnikRed id={p.od} />
                    <div className="mala-ponuda">
                      {p.stvari.map((st) => (
                        <MalaStvar key={st.naslov} stvar={st} />
                      ))}
                    </div>
                  </div>
                  <div className="stavka-akcije">
                    {anina ? (
                      <RadnjaDugme id="5.x4" varijanta="plavo" nakon={l('X5', { oglas: oglas.id, ponuda: p.id })} poruka={false} pregled={l('X5', { oglas: oglas.id, ponuda: p.id })}>
                        Detalji
                      </RadnjaDugme>
                    ) : (
                      <Veza ekran="X5" parametri={{ oglas: oglas.id, ponuda: p.id }} className="dugme dugme-plavo">
                        Detalji
                      </Veza>
                    )}
                    {anina && zakljucaj ? (
                      <button type="button" className="dugme-krug dugme-zeleno" disabled aria-label={`Prihvati ponudu: ${p.od}. ${RAZLOG_ZAKLJUCANO}`} title={RAZLOG_ZAKLJUCANO}>
                        <Check size={22} strokeWidth={2} aria-hidden />
                      </button>
                    ) : (
                      <Veza ekran="X7" parametri={{ oglas: oglas.id, ponuda: p.id }} className="dugme-krug dugme-zeleno" ariaLabel={`Prihvati ponudu: ${p.od}`}>
                        <Check size={22} strokeWidth={2} aria-hidden />
                      </Veza>
                    )}
                    <Veza ekran="X6" parametri={{ oglas: oglas.id, ponuda: p.id }} className="dugme-krug dugme-crveno" ariaLabel={`Odbij ponudu: ${p.od}`}>
                      <X size={22} strokeWidth={2} aria-hidden />
                    </Veza>
                  </div>
                  {anina && zakljucaj && (
                    <span className="razlog-neaktivno" data-razlog-zakljucano>
                      {RAZLOG_ZAKLJUCANO}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {ponude.some((p) => p.stvari.some((st) => st.vrsta === 'ideja')) && <ObavestenjeIdeja />}
          {uradjeno('6.jovana') && grana === 'lanac' && (
            <Obavestenje>
              Bicikl je dogovoren u lancu razmene. Preostale ponude ({broj(ponude.length)}) čekaju tvoj odgovor.
            </Obavestenje>
          )}
          {uradjeno('5.x6') && (
            <Obavestenje stanje="uspeh" uloga="status">
              Odbijena ponuda: {ANA_ID}. Ana je obaveštena.
            </Obavestenje>
          )}
        </section>
      </div>
    </div>
  )
}

function X5Prica() {
  const demo = useDemo()
  const { ugao, parametri } = useEkran()
  const { s, uradjeno } = useStanjePrice()
  const l = useLink()
  const oglas = oglasPoId(parametri.oglas) ?? oglasPoId(OGLAS)!
  const ponuda = PONUDE_MARKO.find((p) => p.id === parametri.ponuda) ?? PONUDE_MARKO[0]
  if (ugao !== 'marko') return <SamoMarko naslov="Detalj ponude" />
  if (ponuda.id === ANINA && !uradjeno('4.x2')) return <JosNijePocelo naslov="Detalj ponude" opis="Anina ponuda stiže kad je Ana pošalje." korak={4} />
  const k = s.korisnici[ponuda.od]
  const anina = ponuda.id === ANINA
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X5">
      <h1>Detalj ponude</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <KorisnikRed id={ponuda.od} velicina={48} />
          {k && (
            <p data-ponudjac-ocena>
              {k.recenzije > 0 ? (
                <>
                  <Zvezdice ocena={zvezdice(k.zbirOcena, k.recenzije)} /> <b className="num">{ocena(k.zbirOcena, k.recenzije)}</b>
                </>
              ) : (
                'Još nema recenzija'
              )}{' '}
              · <span className="num">{broj(k.razmene)}</span> razmena
            </p>
          )}
        </div>
      </div>
      <h2>Nudi</h2>
      <div className="mala-ponuda">
        {ponuda.stvari.map((st) => (
          <MalaStvar key={st.naslov} stvar={st} />
        ))}
      </div>
      {anina && <KarticaOglasa oglas={oglasPoId(ANINA)!} />}
      <div>
        <h2>Poruka</h2>
        <p className="mt-1">{ponuda.poruka}</p>
      </div>
      {ponuda.stvari.some((st) => st.vrsta === 'ideja') && <ObavestenjeIdeja />}
      <Obavestenje>Telefon ponuđača se ne vidi. Otkriva se tek posle prihvaćene ponude.</Obavestenje>
      <div className="red-dugmad">
        {anina && demo.rezim === 'vodjena' ? (
          <span className="radnja-dugme">
            <button type="button" className="dugme dugme-zeleno" disabled>
              <Check size={18} strokeWidth={2} aria-hidden /> Prihvati
            </button>
            <span className="razlog-neaktivno" data-razlog-zakljucano>
              {RAZLOG_ZAKLJUCANO}
            </span>
          </span>
        ) : (
          <Veza ekran="X7" parametri={{ oglas: oglas.id, ponuda: ponuda.id }} className="dugme dugme-zeleno">
            <Check size={18} strokeWidth={2} aria-hidden /> Prihvati
          </Veza>
        )}
        {anina ? (
          <RadnjaDugme id="5.x5" varijanta="crveno" nakon={l('X6', { oglas: oglas.id, ponuda: ponuda.id })} poruka={false} pregled={l('X6', { oglas: oglas.id, ponuda: ponuda.id })} ikona={<X size={18} strokeWidth={2} aria-hidden />}>
            Odbij
          </RadnjaDugme>
        ) : (
          <Veza ekran="X6" parametri={{ oglas: oglas.id, ponuda: ponuda.id }} className="dugme dugme-crveno">
            <X size={18} strokeWidth={2} aria-hidden /> Odbij
          </Veza>
        )}
        <Veza ekran="C2" parametri={{ razgovor: ponuda.od }} upit={{ iz: 'ponuda' }} className="dugme dugme-linija">
          Pitaj
        </Veza>
        <Veza ekran="O5" parametri={{ oglas: oglas.id }} className="dugme dugme-tekst">
          Prijavi
        </Veza>
      </div>
    </section>
  )
}

function X6Prica() {
  const { ugao, parametri } = useEkran()
  const { uradjeno } = useStanjePrice()
  const demo = useDemo()
  const [razlog, setRazlog] = useState(RAZLOZI_ODBIJANJA[0])
  const [lokalnoOdbijeno, setLokalnoOdbijeno] = useState(false)
  const [javi, setJavi] = useState(true)
  const ponuda = PONUDE_MARKO.find((p) => p.id === parametri.ponuda) ?? PONUDE_MARKO[0]
  if (ugao !== 'marko') return <SamoMarko naslov="Odbij ponudu" />
  const anina = ponuda.id === ANINA
  if (anina && !uradjeno('4.x2')) return <JosNijePocelo naslov="Odbij ponudu" opis="Ponuda stiže u koraku 4, a Marko je odbija u koraku 5." korak={5} />
  const odbijeno = anina ? uradjeno('5.x6') : lokalnoOdbijeno
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X6">
      <h1>Odbij ponudu</h1>
      {odbijeno ? (
        <div className="stog" data-odbijeno>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Ponuda odbijena;</b> {ponuda.od} je obaveštena.
          </Obavestenje>
          <p>
            Upisao si šta tražiš: <b>{TRAZI_TEKST[OGLAS]}</b>. {javi && 'Javićemo ti ako postoji lanac razmene.'}
          </p>
          <div className="red-dugmad">
            <Veza ekran="X12" className="dugme dugme-zeleno">
              Moje razmene i ponude
            </Veza>
            <Veza ekran="X4" parametri={{ oglas: OGLAS }} className="dugme dugme-linija">
              Primljene ponude
            </Veza>
          </div>
        </div>
      ) : (
        <>
          <div className="grupa-polja">
            <span className="polje-oznaka">Razlog</span>
            <Pilule oznaka="Razlog odbijanja" vrednost={razlog} onChange={setRazlog} opcije={RAZLOZI_ODBIJANJA.map((r) => ({ v: r, naziv: r }))} />
          </div>
          <div className="grupa-polja">
            <span className="polje-oznaka">Šta tražim</span>
            <div className="mala-ponuda">
              <span className="mala-stvar" data-trazim>
                <Check size={18} strokeWidth={2} aria-hidden /> {TRAZI_TEKST[OGLAS]}
              </span>
            </div>
            <span className="polje-pomoc">Iz tvoje liste želja.</span>
          </div>
          <Kvacica oznaka="Javi mi ako postoji lanac razmene" checked={javi} onChange={setJavi} />
          <div className="red-dugmad">
            {anina ? (
              <RadnjaDugme id="5.x6" varijanta="crveno" poruka={false}>
                Odbij ponudu
              </RadnjaDugme>
            ) : (
              <button
                type="button"
                className="dugme dugme-crveno"
                onClick={() => {
                  setLokalnoOdbijeno(true)
                  demo.obavesti(PORUKE.simulacija)
                }}
              >
                Odbij ponudu
              </button>
            )}
            <Veza ekran="X5" parametri={{ oglas: OGLAS, ponuda: ponuda.id }} className="dugme dugme-tekst">
              Nazad
            </Veza>
          </div>
        </>
      )}
    </section>
  )
}

function X7Prica() {
  const { ugao, parametri } = useEkran()
  const ponuda = PONUDE_MARKO.find((p) => p.id === parametri.ponuda) ?? PONUDE_MARKO[0]
  if (ugao !== 'marko') return <SamoMarko naslov="Ponuda prihvaćena" />
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X7">
      <Obavestenje stanje="uspeh" uloga="status">
        <b>Prihvaćeno</b> — dogovorite primopredaju.
      </Obavestenje>
      <h1>Ponuda prihvaćena</h1>
      <div className="mala-ponuda">
        {ponuda.stvari.map((st) => (
          <MalaStvar key={st.naslov} stvar={st} />
        ))}
      </div>
      <p>Telefon se otkriva tek sada i samo ako oboje želite.</p>
      <div className="red-dugmad">
        <Veza ekran="X8" parametri={{ razmena: ponuda.id }} className="dugme dugme-zeleno">
          Idi na dogovor
        </Veza>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Ponude za Markov bicikl u vođenoj priči ostaju vezane za radnje priče; ponude za svaki drugi oglas su slobodni tok (PrimljeneSlobodno.tsx).
// ---------------------------------------------------------------------------------------------------------------------
export function X4() {
  const { parametri } = useEkran()
  const demo = useDemo()
  return parametri.oglas === OGLAS && demo.rezim === 'vodjena' ? <X4Prica /> : <X4Slobodno />
}
export function X5() {
  const { parametri } = useEkran()
  return parametri.oglas === OGLAS ? <X5Prica /> : <X5Slobodno />
}
export function X6() {
  const { parametri } = useEkran()
  return parametri.oglas === OGLAS ? <X6Prica /> : <X6Slobodno />
}
export function X7() {
  const { parametri } = useEkran()
  return parametri.oglas === OGLAS ? <X7Prica /> : <X7Slobodno />
}
