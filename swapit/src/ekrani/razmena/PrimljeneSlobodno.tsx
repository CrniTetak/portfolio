// X4–X7 u SLOBODNOM toku (primalac): ponude za bilo koji oglas gledaoca koji nije predmet priče. Namenski primer je Markova dečja jakna sa ponudama
// Irene i Stefana; ponude koje pošalje drugi građanin (Ana ili Marko kroz X1–X3) stižu ovde iz tokova. Prihvatanje pravi razmenu (X8–X11).
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTelefon } from '../../okvir/useMedia'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { Kvacica, Pilule } from '../../komponente/Kontrole'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja } from '../../komponente/Obavestenja'
import { OvoRadi } from '../../komponente/OvoRadi'
import { Veza, useLink } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { useEkran } from '../../okvir/kontekst'
import type { Ugao } from '../../prica/tipovi'
import { broj, ocena, zvezdice } from '../../scenario/format'
import { RAZLOZI_ODBIJANJA, TRAZI_TEKST } from '../../scenario/prica'
import { ANA_ID, MARKO_ID, nadjiOglas } from '../../scenario/svet'
import { nadjiRazmenu, odgovoriNaPonudu, ponudeZaOglas, prihvatiPonuduIPokreni, type PonudaPrikaz } from '../../tokovi/operacije'
import { NEUSPEH, PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const NAZIV_STATUSA = { ceka: 'Čeka odgovor', odbijena: 'Odbijena', prihvacena: 'Prihvaćena' } as const
const uglaIz = (id: string): Ugao | null => (id === ANA_ID ? 'ana' : id === MARKO_ID ? 'marko' : null)

/** Zajednički deo: oglas čije ponude se gledaju, ponude i (ako ima) ponuda iz linka. */
function useTok() {
  const { parametri } = useEkran()
  const st = useStanjePrice()
  const oglas = nadjiOglas(st.s, parametri.oglas, st.tokovi)
  const ponude = oglas ? ponudeZaOglas(st.tokovi, oglas.id, st.slobodno) : []
  const ponuda = ponude.find((p) => p.id === parametri.ponuda)
  return { ...st, oglas, ponude, ponuda }
}

/** Ponude prima vlasnik oglasa; ko nije vlasnik vidi kome oglas pripada. */
function ProveraVlasnika({ naslov, vlasnik }: { naslov: string; vlasnik: string }) {
  const ko = uglaIz(vlasnik)
  return ko ? (
    <OvoRadi ko={ko} naslov={naslov} opis="Ovde vlasnik oglasa vidi ponude koje je primio." nazad={{ ekran: 'X12', naziv: 'Moje razmene i ponude' }} />
  ) : (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X-poruka">
      <h1>{naslov}</h1>
      <Obavestenje>Ponude za ovaj oglas prima njegov vlasnik. Tvoje ponude su u „Moje razmene i ponude“.</Obavestenje>
      <Veza ekran="X12" className="dugme dugme-zeleno self-start">
        Moje razmene i ponude
      </Veza>
    </section>
  )
}

export function X4Slobodno() {
  const l = useLink()
  const navigate = useNavigate()
  const demo = useDemo()
  const { s, ja, ugao, oglas, ponude, promeni, slobodno } = useTok()
  const telefon = useTelefon()
  if (!oglas) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <ProveraVlasnika naslov="Primljene ponude" vlasnik={MARKO_ID} />
  if (oglas.vlasnik !== ja) return <ProveraVlasnika naslov="Primljene ponude" vlasnik={oglas.vlasnik} />
  const mojiOglasi = s.oglasi.filter((o) => o.vlasnik === ja)
  const prihvati = (p: PonudaPrikaz) => {
    const novo = promeni((t) => prihvatiPonuduIPokreni(t, p.id, oglas.id, { id: p.id, tip: 'razmena', cilj: oglas.id, naslov: oglas.naslov, vlasnik: oglas.vlasnik, od: p.od, stvari: p.stvari }))
    if (!nadjiRazmenu(novo, p.id)) return demo.obavesti(NEUSPEH.razmena) // D6
    demo.obavesti(PORUKE.simulacija)
    navigate(l('X7', { oglas: oglas.id, ponuda: p.id }))
    window.scrollTo(0, 0)
  }
  const naCekanju = ponude.filter((p) => p.status === 'ceka').length
  return (
    <div className="stog" data-ekran-sadrzaj="X4" data-slobodan-tok>
      <h1>Primljene ponude</h1>
      <div className="dva-stupca dva-stupca-jednaka">
        <section className="kartica stog" aria-label="Moji oglasi">
          <h2>Moji oglasi</h2>
          <ul className="stog-sm">
            {mojiOglasi.slice(0, 6).map((o) => (
              <li key={o.id} className="stavka" aria-current={o.id === oglas.id ? 'true' : undefined}>
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id }} />
                {o.id === oglas.id ? (
                  <span className="znacka znacka-poklon">Izabrano</span>
                ) : (
                  <Veza ekran="X4" parametri={{ oglas: o.id }} className="dugme dugme-tekst">
                    Ponude
                  </Veza>
                )}
              </li>
            ))}
          </ul>
          {/* N4: na telefonu je izabrani oglas već u listi iznad (oznaka „Izabrano“), pa se ne ponavlja kao kartica */}
          {!telefon && <KarticaOglasa oglas={oglas} />}
        </section>
        <section className="kartica stog" aria-label="Primljene ponude" data-primljene>
          <h2>Primljene ponude ({broj(ponude.length)})</h2>
          {ponude.length === 0 && (
            <p className="prazno-stanje" data-nema-ponuda>
              {oglas.id === 'markov-bicikl' && slobodno ? 'Ponude za slobodan tok stoje uz dečju jaknu.' : 'Za ovaj oglas još nema ponuda. Kad neko pošalje ponudu, pojaviće se ovde.'}
            </p>
          )}
          <ul className="stog-sm">
            {ponude.map((p) => (
              <li key={p.id} className="stavka" data-ponuda={p.id} data-status={p.status}>
                <div className="stavka-glavna stog-sm">
                  <KorisnikRed id={p.od} />
                  <div className="mala-ponuda">
                    {p.stvari.map((st) => (
                      <MalaStvar key={st.naslov} stvar={st} />
                    ))}
                  </div>
                  {p.status !== 'ceka' && (
                    <p data-status-ponude>
                      Status: <b>{NAZIV_STATUSA[p.status]}</b>
                      {p.razlog ? ` (${p.razlog})` : ''}
                    </p>
                  )}
                </div>
                <div className="stavka-akcije">
                  <Veza ekran="X5" parametri={{ oglas: oglas.id, ponuda: p.id }} className="dugme dugme-plavo" ariaLabel={`Detalji ponude: ${p.od}`}>
                    Detalji
                  </Veza>
                  {p.status === 'ceka' && (
                    <>
                      <button type="button" className="dugme-krug dugme-zeleno" aria-label={`Prihvati ponudu: ${p.od}`} onClick={() => prihvati(p)}>
                        <Check size={22} strokeWidth={2} aria-hidden />
                      </button>
                      <Veza ekran="X6" parametri={{ oglas: oglas.id, ponuda: p.id }} className="dugme-krug dugme-crveno" ariaLabel={`Odbij ponudu: ${p.od}`}>
                        <X size={22} strokeWidth={2} aria-hidden />
                      </Veza>
                    </>
                  )}
                  {p.status === 'prihvacena' && (
                    <Veza ekran="X8" parametri={{ razmena: p.id }} className="dugme dugme-zeleno">
                      Idi na dogovor
                    </Veza>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {ponude.some((p) => p.stvari.some((st) => st.vrsta === 'ideja')) && <ObavestenjeIdeja />}
          {ponude.length > 0 && naCekanju === 0 && <Obavestenje stanje="uspeh">Na sve ponude je odgovoreno.</Obavestenje>}
          <p className="pomocni-tekst">{TRAZI_TEKST[oglas.id] ? `Tražiš: ${TRAZI_TEKST[oglas.id]}.` : ''}</p>
        </section>
      </div>
    </div>
  )
}

export function X5Slobodno() {
  const l = useLink()
  const navigate = useNavigate()
  const demo = useDemo()
  const { s, ja, ugao, oglas, ponuda, promeni } = useTok()
  if (!oglas || !ponuda) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <ProveraVlasnika naslov="Detalj ponude" vlasnik={oglas.vlasnik} />
  if (oglas.vlasnik !== ja) return <ProveraVlasnika naslov="Detalj ponude" vlasnik={oglas.vlasnik} />
  const k = s.korisnici[ponuda.od]
  const prihvati = () => {
    const novo = promeni((t) => prihvatiPonuduIPokreni(t, ponuda.id, oglas.id, { id: ponuda.id, tip: 'razmena', cilj: oglas.id, naslov: oglas.naslov, vlasnik: oglas.vlasnik, od: ponuda.od, stvari: ponuda.stvari }))
    if (!nadjiRazmenu(novo, ponuda.id)) return demo.obavesti(NEUSPEH.razmena) // D6
    demo.obavesti(PORUKE.simulacija)
    navigate(l('X7', { oglas: oglas.id, ponuda: ponuda.id }))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X5" data-slobodan-tok>
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
      <div>
        <h2>Poruka</h2>
        <p className="mt-1">{ponuda.poruka}</p>
      </div>
      {ponuda.stvari.some((st) => st.vrsta === 'ideja') && <ObavestenjeIdeja />}
      <Obavestenje>Telefon ponuđača se ne vidi. Otkriva se tek posle prihvaćene ponude.</Obavestenje>
      {ponuda.status !== 'ceka' && (
        <Obavestenje stanje={ponuda.status === 'prihvacena' ? 'uspeh' : 'info'} uloga="status">
          Status ponude: <b>{NAZIV_STATUSA[ponuda.status]}</b>
          {ponuda.razlog ? ` (${ponuda.razlog})` : ''}
        </Obavestenje>
      )}
      <div className="red-dugmad">
        {ponuda.status === 'ceka' ? (
          <>
            <button type="button" className="dugme dugme-zeleno" onClick={prihvati}>
              <Check size={18} strokeWidth={2} aria-hidden /> Prihvati
            </button>
            <Veza ekran="X6" parametri={{ oglas: oglas.id, ponuda: ponuda.id }} className="dugme dugme-crveno">
              <X size={18} strokeWidth={2} aria-hidden /> Odbij
            </Veza>
          </>
        ) : ponuda.status === 'prihvacena' ? (
          <Veza ekran="X8" parametri={{ razmena: ponuda.id }} className="dugme dugme-zeleno">
            Idi na dogovor
          </Veza>
        ) : null}
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

export function X6Slobodno() {
  const { ja, ugao, oglas, ponuda, promeni } = useTok()
  const demo = useDemo()
  const [razlog, setRazlog] = useState(RAZLOZI_ODBIJANJA[0])
  const [javi, setJavi] = useState(true)
  if (!oglas || !ponuda) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <ProveraVlasnika naslov="Odbij ponudu" vlasnik={oglas.vlasnik} />
  if (oglas.vlasnik !== ja) return <ProveraVlasnika naslov="Odbij ponudu" vlasnik={oglas.vlasnik} />
  const odbijeno = ponuda.status === 'odbijena'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X6" data-slobodan-tok>
      <h1>Odbij ponudu</h1>
      {odbijeno ? (
        <div className="stog" data-odbijeno>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Ponuda odbijena;</b> {ponuda.od} je obaveštena{ponuda.razlog ? ` (${ponuda.razlog})` : ''}.
          </Obavestenje>
          {TRAZI_TEKST[oglas.id] && (
            <p>
              Upisao/la si šta tražiš: <b>{TRAZI_TEKST[oglas.id]}</b>. {javi && 'Javićemo ti ako postoji lanac razmene.'}
            </p>
          )}
          <div className="red-dugmad">
            <Veza ekran="X12" className="dugme dugme-zeleno">
              Moje razmene i ponude
            </Veza>
            <Veza ekran="X4" parametri={{ oglas: oglas.id }} className="dugme dugme-linija">
              Primljene ponude
            </Veza>
          </div>
        </div>
      ) : ponuda.status === 'prihvacena' ? (
        <Obavestenje>Ova ponuda je već prihvaćena. <Veza ekran="X8" parametri={{ razmena: ponuda.id }}>Idi na dogovor</Veza></Obavestenje>
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
                <Check size={18} strokeWidth={2} aria-hidden /> {TRAZI_TEKST[oglas.id] ?? 'Nešto drugo'}
              </span>
            </div>
            <span className="polje-pomoc">Iz tvoje liste želja.</span>
          </div>
          <Kvacica oznaka="Javi mi ako postoji lanac razmene" checked={javi} onChange={setJavi} />
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-crveno"
              onClick={() => {
                promeni((t) => odgovoriNaPonudu(t, ponuda.id, 'odbijena', razlog))
                demo.obavesti(PORUKE.simulacija)
              }}
            >
              Odbij ponudu
            </button>
            <Veza ekran="X5" parametri={{ oglas: oglas.id, ponuda: ponuda.id }} className="dugme dugme-tekst">
              Nazad
            </Veza>
          </div>
        </>
      )}
    </section>
  )
}

export function X7Slobodno() {
  const { ja, ugao, oglas, ponuda } = useTok()
  if (!oglas || !ponuda) return <NemaStranice />
  if (ugao !== 'ana' && ugao !== 'marko') return <ProveraVlasnika naslov="Ponuda prihvaćena" vlasnik={oglas.vlasnik} />
  if (oglas.vlasnik !== ja) return <ProveraVlasnika naslov="Ponuda prihvaćena" vlasnik={oglas.vlasnik} />
  if (ponuda.status !== 'prihvacena')
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X7" data-nije-prihvacena>
        <h1>Ponuda prihvaćena</h1>
        <Obavestenje>Ova ponuda još nije prihvaćena.</Obavestenje>
        <Veza ekran="X5" parametri={{ oglas: oglas.id, ponuda: ponuda.id }} className="dugme dugme-zeleno self-start">
          Detalj ponude
        </Veza>
      </section>
    )
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X7" data-slobodan-tok>
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
