// X1 „Izaberi šta nudiš“, X2 „Tvoja ponuda“, X3 „Ponuda poslata“ (UX 6.5). Korak 4 priče: Ana nudi PlayStation 2 za Markov bicikl.
// Slobodni tok: ponuda na bilo koji oglas koji nije predmet priče; izbor stvari živi u linku (?s=id1,id2), a poslata ponuda u tokovima (vidi X12 i X4).
// Predmeti priče su „rezervisani za priču“ (PLAN B5.1): ne mogu se nuditi, a ponuda na njih se ovde samo pregleda (izuzetak: Markova dečja jakna).
import { Plus, Trash2 } from 'lucide-react'
import { BICIKL_ID, PS2_ID } from '../../scenario/svet'
import { useLocation, useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Kvacica } from '../../komponente/Kontrole'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja, ObavestenjeNekretnine, PravaPotrosaca } from '../../komponente/Obavestenja'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { PONUDE_MARKO, TIPOVI_RAZMENE } from '../../scenario/prica'
import { PORUKA_PONUDE_SLOBODNA, SLOBODNE_PONUDE_NA } from '../../scenario/slobodno'
import { KATEGORIJA_PO_ID, KATEGORIJE_SA_OBAVESTENJEM, nadjiOglas, oglasPoId, tipRazmene, type Oglas } from '../../scenario/svet'
import { useJednom } from '../../demo/useJednom'
import { jeUgaoKorisnik, posaljiPonudu } from '../../tokovi/operacije'
import type { StvarZapis } from '../../tokovi/tokovi'
import { PORUKE, PREDMET_PRICE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const PRICA_OGLAS = BICIKL_ID
const PS2 = PS2_ID
const NAJVISE_STVARI = 4

/** Zajednički deo: oglas za koji se nudi, ili poruka zašto se ne može. */
function useCilj() {
  const { parametri, ugao } = useEkran()
  const { s, ja, tokovi } = useStanjePrice()
  const cilj = nadjiOglas(s, parametri.oglas, tokovi)
  const gradjanin = ugao === 'ana' || ugao === 'marko'
  const jePrica = cilj?.id === PRICA_OGLAS
  // slobodni tok: predmeti priče se ne nude; u priči (Markov bicikl) Ana nudi PlayStation 2
  const moj = gradjanin && ja ? s.oglasi.filter((o) => o.vlasnik === ja && o.nacin !== 'poklon' && !o.aukcija && o.id !== cilj?.id && (jePrica || !o.rezervisan)) : []
  const rezervisanaMeta = !!cilj?.rezervisan && !jePrica && !SLOBODNE_PONUDE_NA.includes(cilj.id)
  let razlog: string | undefined
  if (!cilj) razlog = 'Ovaj oglas ne postoji u demou.'
  else if (!gradjanin) razlog = 'Ponude šalju građani. Prebaci se na ugao građanina (Gledaj kao Ana).'
  else if (cilj.vlasnik === ja) razlog = 'Ne možeš da ponudiš razmenu na sopstveni oglas.'
  return { cilj, razlog, moj, jePrica, rezervisanaMeta, ja }
}

/** Stvari izabrane za slobodnu ponudu (ids iz linka, samo one koje gledalac zaista ima). */
function useIzabrano(moj: Oglas[]): string[] {
  const q = new URLSearchParams(useLocation().search).get('s') ?? ''
  const ids = q.split(',').filter(Boolean)
  return ids.filter((id, i) => ids.indexOf(id) === i && moj.some((o) => o.id === id)).slice(0, NAJVISE_STVARI)
}

function Cilj({ cilj }: { cilj: Oglas }) {
  const kod = tipRazmene(cilj)
  const naziv = TIPOVI_RAZMENE.find((t) => t.kod === kod)?.naziv
  return (
    <div className="flex flex-wrap items-center gap-4" data-cilj-ponude>
      <KarticaOglasa oglas={cilj} prva />
      <div className="stog-sm">
        <p className="pomocni-tekst">Oglas koji želiš</p>
        {naziv && (
          <p>
            Tip razmene: <b>{naziv}</b>
          </p>
        )}
        <Znacka vrsta={cilj.firma ? 'firma' : 'gradjanin'} />
      </div>
    </div>
  )
}

function Greska({ naslov, razlog }: { naslov: string; razlog: string }) {
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X-poruka">
      <h1>{naslov}</h1>
      <Obavestenje stanje="upozorenje">{razlog}</Obavestenje>
      <Veza ekran="P1" className="dugme dugme-plavo self-start">
        Nazad na početnu
      </Veza>
    </section>
  )
}

const uStvar = (o: Oglas): StvarZapis => ({ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: KATEGORIJA_PO_ID[o.kat]?.ikonica })

export function X1() {
  const l = useLink()
  const navigate = useNavigate()
  const { ugao } = useEkran()
  const { cilj, razlog, moj, jePrica, rezervisanaMeta } = useCilj()
  const [izabranoPs2, setIzabranoPs2] = useSaglasnost('x1_izbor')
  const izabrano = useIzabrano(moj)
  if (!cilj) return <NemaStranice />
  if (razlog) return <Greska naslov="Izaberi šta nudiš" razlog={razlog} />
  const imaIzbor = jePrica ? izabranoPs2 || false : izabrano.length > 0
  const jeIzabrano = (id: string) => (jePrica ? id === PS2 && izabranoPs2 : izabrano.includes(id))
  const prebaci = (id: string) => {
    if (jePrica) {
      if (id === PS2) setIzabranoPs2(!izabranoPs2)
      return
    }
    const sledece = izabrano.includes(id) ? izabrano.filter((x) => x !== id) : izabrano.length >= NAJVISE_STVARI ? izabrano : [...izabrano, id]
    navigate(link('X1', ugao, { oglas: cilj.id }, sledece.length ? { s: sledece.join(',') } : undefined), { replace: true })
  }
  const dalje = link('X2', ugao, { oglas: cilj.id }, izabrano.length ? { s: izabrano.join(',') } : undefined)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X1">
      <h1>Izaberi šta nudiš</h1>
      <Cilj cilj={cilj} />
      {rezervisanaMeta && (
        <Obavestenje stanje="upozorenje">
          <b data-rezervisano>{PREDMET_PRICE}.</b> Ovaj oglas je predmet vođene priče, pa se ponuda na njega ovde samo pregleda. Probaj ponudu na neki drugi oglas.
        </Obavestenje>
      )}
      <hr className="razdvojnik" />
      <h2>Moji oglasi</h2>
      {moj.length === 0 ? (
        <p data-nema-oglasa>Još nemaš nijedan oglas koji možeš da nudiš. Objavi stvar koju nudiš.</p>
      ) : (
        <ul className="stog-sm" data-moji-oglasi>
          {moj.map((o) => (
            <li key={o.id} className="stavka">
              <div className="stavka-glavna">
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: KATEGORIJA_PO_ID[o.kat]?.ikonica }} />
              </div>
              <div className="stavka-akcije">
                <button type="button" className="pilula" aria-pressed={jeIzabrano(o.id)} disabled={rezervisanaMeta} onClick={() => prebaci(o.id)}>
                  {jeIzabrano(o.id) ? 'Izabrano' : 'Izaberi'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-linija self-start">
        <Plus size={18} strokeWidth={1.75} aria-hidden /> Dodaj novu stvar
      </Veza>
      <Obavestenje>Doplata novcem nije moguća.</Obavestenje>
      {(cilj.vrsta === 'ideja' || moj.some((o) => o.vrsta === 'ideja' && jeIzabrano(o.id))) && <ObavestenjeIdeja />}
      <div className="red-dugmad">
        {jePrica ? (
          <RadnjaDugme id="4.x1" nakon={l('X2', { oglas: cilj.id })} poruka={false} pregled={l('X2', { oglas: cilj.id })} blokirano={imaIzbor ? undefined : 'Izaberi bar jednu stvar'}>
            Nastavi
          </RadnjaDugme>
        ) : (
          <>
            <a className={`dugme dugme-zeleno${imaIzbor && !rezervisanaMeta ? '' : ' pointer-events-none opacity-60'}`} href={`#${dalje}`} aria-disabled={!imaIzbor || rezervisanaMeta} tabIndex={imaIzbor && !rezervisanaMeta ? undefined : -1}>
              Nastavi
            </a>
            {!imaIzbor && !rezervisanaMeta && <span className="razlog-neaktivno">Izaberi bar jednu stvar</span>}
          </>
        )}
      </div>
    </section>
  )
}

export function X2() {
  const l = useLink()
  const navigate = useNavigate()
  const demo = useDemo()
  const { ugao } = useEkran()
  const { promeni } = useStanjePrice()
  const { cilj, razlog, moj, jePrica, rezervisanaMeta, ja } = useCilj()
  const jednom = useJednom()
  const [izabranoPs2, setIzabranoPs2] = useSaglasnost('x1_izbor')
  const [razumem, setRazumem] = useSaglasnost('x2_razumem')
  const izabrano = useIzabrano(moj)
  if (!cilj) return <NemaStranice />
  if (razlog) return <Greska naslov="Tvoja ponuda" razlog={razlog} />
  const ps2 = oglasPoId(PS2)!
  const obavestenje = KATEGORIJE_SA_OBAVESTENJEM.includes(cilj.kat)
  const stavke = jePrica ? (izabranoPs2 ? [ps2] : []) : izabrano.map((id) => moj.find((o) => o.id === id)!).filter(Boolean)
  const nedostaje = stavke.length === 0 ? 'Dodaj bar jednu stvar' : !razumem ? 'Označi obavezna polja' : rezervisanaMeta ? PREDMET_PRICE : undefined
  const ukloni = (id: string) => {
    if (jePrica) return setIzabranoPs2(false)
    const sledece = izabrano.filter((x) => x !== id)
    navigate(link('X2', ugao, { oglas: cilj.id }, sledece.length ? { s: sledece.join(',') } : undefined), { replace: true })
  }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X2">
      <h1>Tvoja ponuda</h1>
      <Cilj cilj={cilj} />
      <hr className="razdvojnik" />
      <h2>Tvoja ponuda</h2>
      {stavke.length > 0 ? (
        <ul className="stog-sm" data-stavke-ponude>
          {stavke.map((o) => (
            <li key={o.id} className="stavka">
              <div className="stavka-glavna">
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: jePrica ? 'gamepad-2' : KATEGORIJA_PO_ID[o.kat]?.ikonica }} />
              </div>
              <div className="stavka-akcije">
                <button type="button" className="dugme dugme-tekst" aria-label={`Ukloni iz ponude: ${o.naslov}`} onClick={() => ukloni(o.id)}>
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden /> Ukloni
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p data-prazna-ponuda>Ponuda je prazna.</p>
      )}
      <Veza ekran="X1" parametri={{ oglas: cilj.id }} upit={!jePrica && izabrano.length ? { s: izabrano.join(',') } : undefined} className="dugme dugme-linija self-start">
        <Plus size={18} strokeWidth={1.75} aria-hidden /> Dodaj još
      </Veza>
      <PrikaznoPolje oznaka="Poruka uz ponudu" vrednost={jePrica ? PONUDE_MARKO[0].poruka : PORUKA_PONUDE_SLOBODNA} napomena />
      <PravaPotrosaca firma={cilj.firma} />
      {cilj.vrsta === 'ideja' && <ObavestenjeIdeja />}
      {obavestenje && <ObavestenjeNekretnine />}
      <Kvacica obavezna checked={razumem} onChange={setRazumem} dataKljuc="x2_razumem" oznaka="Razumem" />
      <Obavestenje>Doplata novcem nije moguća. Demo — ništa se ne šalje.</Obavestenje>
      <div className="red-dugmad">
        {jePrica ? (
          <RadnjaDugme id="4.x2" nakon={l('X3', { oglas: cilj.id })} blokirano={nedostaje}>
            Pošalji ponudu
          </RadnjaDugme>
        ) : (
          <>
            <button
              type="button"
              className="dugme dugme-zeleno"
              aria-disabled={(!!nedostaje || !ja) || undefined}
              onClick={() =>
                jednom(() => {
                  if (ja) promeni((t) => posaljiPonudu(t, { cilj: cilj.id, od: ja, stvari: stavke.map(uStvar) }).tokovi)
                  // D7: saglasnost i izbor važe za JEDNU ponudu; sledeća ponuda počinje sa praznom kvačicom (priča ostaje kako je)
                  setRazumem(false)
                  setIzabranoPs2(false)
                  demo.obavesti(PORUKE.simulacija)
                  navigate(l('X3', { oglas: cilj.id }))
                  window.scrollTo(0, 0)
                })
              }
            >
              Pošalji ponudu
            </button>
            {nedostaje && <span className="razlog-neaktivno">{nedostaje}</span>}
          </>
        )}
        <Veza ekran="X1" parametri={{ oglas: cilj.id }} upit={!jePrica && izabrano.length ? { s: izabrano.join(',') } : undefined} className="dugme dugme-tekst">
          Nazad
        </Veza>
      </div>
    </section>
  )
}

export function X3() {
  const { cilj, razlog, jePrica, ja } = useCilj()
  const { uradjeno, tokovi } = useStanjePrice()
  if (!cilj) return <NemaStranice />
  if (razlog) return <Greska naslov="Ponuda poslata" razlog={razlog} />
  if (jePrica && !uradjeno('4.x2')) return <JosNijePocelo naslov="Ponuda poslata" opis="Ovde se vidi poslata ponuda i odgovor druge strane." korak={4} />
  const ps2 = oglasPoId(PS2)!
  // slobodni tok: poslednja ponuda ovog gledaoca na ovaj oglas
  const poslata = jePrica ? undefined : [...tokovi.ponude].reverse().find((p) => p.cilj === cilj.id && p.od === ja)
  if (!jePrica && !poslata)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X3" data-nema-ponude>
        <h1>Ponuda poslata</h1>
        <Obavestenje>Za ovaj oglas još nisi poslao/la ponudu.</Obavestenje>
        <Veza ekran="X1" parametri={{ oglas: cilj.id }} className="dugme dugme-zeleno self-start">
          Izaberi šta nudiš
        </Veza>
      </section>
    )
  const odbijena = jePrica ? uradjeno('5.x6') : poslata?.status === 'odbijena'
  const stvari = jePrica ? [{ naslov: ps2.naslov, vrsta: ps2.vrsta, oglas: ps2.id, ikonica: 'gamepad-2' }] : (poslata?.stvari ?? [])
  const statusTekst = odbijena ? 'Odbijena' : poslata?.status === 'prihvacena' ? 'Prihvaćena' : 'Čeka odgovor'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X3">
      <Obavestenje stanje="uspeh" uloga="status">
        <b>Ponuda je poslata</b> korisniku {cilj.vlasnik}.
      </Obavestenje>
      <h1>Ponuda poslata</h1>
      <Cilj cilj={cilj} />
      <div className="stog-sm">
        <h2>Tvoja ponuda</h2>
        {stvari.map((st) => (
          <MalaStvar key={st.naslov} stvar={st} />
        ))}
      </div>
      <p data-status-ponude>
        Status: <b>{statusTekst}</b>
        {odbijena && jePrica && <> · {cilj.vlasnik} traži udžbenike za 3. razred.</>}
      </p>
      {!jePrica && poslata?.status === 'ceka' && !jeUgaoKorisnik(cilj.vlasnik) && (
        <p className="pomocni-tekst" data-izmisljen-ne-odgovara>
          U demou ovaj korisnik ne odgovara. Odgovor možeš da vidiš samo ako ponudu primi Ana ili Marko (Gledaj kao).
        </p>
      )}
      <div className="red-dugmad">
        {poslata?.status === 'prihvacena' && (
          <Veza ekran="X8" parametri={{ razmena: poslata.id }} className="dugme dugme-zeleno">
            Idi na dogovor
          </Veza>
        )}
        <Veza ekran="X12" className="dugme dugme-zeleno">
          Moje razmene i ponude
        </Veza>
        <Veza ekran="O1" parametri={{ oglas: cilj.id }} className="dugme dugme-linija">
          Nazad na oglas
        </Veza>
      </div>
    </section>
  )
}

