// O2, O3, O4 u SLOBODNOM toku: novi oglas građanina ili firme (jednostavan obrazac oglasa firme: samo roba ili usluga „za razmenu“) i izmena postojećeg oglasa.
// Tekstovi se ne kucaju: bira se primer (naslov i opis), a tip, kategorija, način, stanje i preuzimanje se biraju izborima. Nacrt putuje kroz link
// (?p=primer&t=vrsta&k=kategorija&nacin=…), pa osvežavanje ne gubi izbor. Objava je besplatna i dodaje oglas u tokove (brojači, Moji oglasi).
import { imaKljuc, uzmi } from '../../scenario/kljuc'
import { Camera } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { Ilustracija } from '../../komponente/Ilustracija'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja, ObavestenjeNekretnine } from '../../komponente/Obavestenja'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import type { Ugao } from '../../prica/tipovi'
import { poeni } from '../../scenario/format'
import { ZIVOTINJE_NAPOMENA } from '../../scenario/poslovno'
import { STANJA_ROBE, TIPOVI_RAZMENE } from '../../scenario/prica'
import { PRIMERI_OGLASA, PRIMERI_OGLASA_FIRME, PRIMER_PO_ID } from '../../scenario/slobodno'
import { FIRMA_PO_ID, KATEGORIJE, KATEGORIJA_PO_ID, KATEGORIJE_SA_OBAVESTENJEM, KORISNIK_PO_ID, VREDNOSTI_POENA, jeRezervisan, nadjiOglas, nazivOpstine, preuzimanjeTekst } from '../../scenario/svet'
import { useJednom } from '../../demo/useJednom'
import { idNovogOglasa, izmeniOglas, napraviOglas, type Nacrt } from '../../tokovi/operacije'
import { dodajNoviOglas, NAJVISE_NOVIH_OGLASA, type Nacin, type Vrsta } from '../../tokovi/tokovi'
import { PORUKE, PREDMET_PRICE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const VRSTE_NAZIV: Record<Vrsta, string> = { roba: 'Roba', usluga: 'Usluga', ideja: 'Ideja' }
const TRAZI_NAZIV: Record<Vrsta, string> = { roba: 'Robu', usluga: 'Uslugu', ideja: 'Ideju' }
const NACINI: { v: Nacin; naziv: string }[] = [
  { v: 'razmena', naziv: 'Za razmenu' },
  { v: 'poeni', naziv: 'Za poene' },
  { v: 'poklon', naziv: 'Poklanjam' },
]
const jeVrsta = (x: unknown): x is Vrsta => x === 'roba' || x === 'usluga' || x === 'ideja'
const jeNacin = (x: unknown): x is Nacin => x === 'razmena' || x === 'poeni' || x === 'poklon'

/** Zajednički deo: ko objavljuje (građanin ili firma) i njegova opština. */
function useVlasnik() {
  const { ugao } = useEkran()
  const { ja } = useStanjePrice()
  const firma = ugao === 'prodavnica'
  const opstina = firma ? uzmi(FIRMA_PO_ID, ja)?.opstina : uzmi(KORISNIK_PO_ID, ja)?.opstina
  return { ugao, ja, firma, opstina }
}

function Nema({ naslov, tekst }: { naslov: string; tekst: string }) {
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="O2">
      <h1>{naslov}</h1>
      <Obavestenje>{tekst}</Obavestenje>
      <Veza ekran="P1" className="dugme dugme-plavo self-start">
        Nazad na početnu
      </Veza>
    </section>
  )
}

/** O2 „Novi oglas, 1 od 2“ (slobodni tok) i „Uredi“. */
export function O2Slobodno() {
  const { search } = useLocation()
  const q = new URLSearchParams(search)
  const { s, tokovi } = useStanjePrice()
  const { ugao, ja, firma } = useVlasnik()
  const urediId = q.get('uredi')
  const primeri = firma ? PRIMERI_OGLASA_FIRME : PRIMERI_OGLASA
  const prvi = primeri.find((p) => p.id === q.get('p')) ?? primeri[0]
  const [primerId, setPrimerId] = useState(prvi.id)
  const primer = PRIMER_PO_ID[primerId]
  const [tip, setTip] = useState<Vrsta>(jeVrsta(q.get('t')) ? (q.get('t') as Vrsta) : primer.vrsta)
  const [kat, setKat] = useState(imaKljuc(KATEGORIJA_PO_ID, q.get('k')) ? (q.get('k') as string) : primer.kat)
  const nacinIzLinka = q.get('nacin')

  const promeniPrimer = (id: string) => {
    setPrimerId(id)
    setTip(PRIMER_PO_ID[id].vrsta)
    setKat(PRIMER_PO_ID[id].kat)
  }
  // ---- izmena postojećeg oglasa (O6 „Uredi“)
  if (urediId) {
    const oglas = nadjiOglas(s, urediId, tokovi)
    if (!oglas) return <NemaStranice />
    return <Izmena oglasId={oglas.id} ugao={ugao} />
  }
  if (!ja || !(ugao === 'ana' || ugao === 'marko' || ugao === 'prodavnica')) return <Nema naslov="Novi oglas" tekst="Oglase objavljuju građani i firme. Prebaci se na ugao Ana, Marko ili Prodavnica." />
  const katNaziv = KATEGORIJA_PO_ID[kat].naziv
  const dalje = link('O3', ugao, {}, { p: primerId, t: tip, k: kat, ...(jeNacin(nacinIzLinka) ? { nacin: nacinIzLinka } : {}) })
  return (
    <div data-ekran-sadrzaj="O2" data-slobodan-tok>
      <section className="kartica ekran-srednji stog">
        <div>
          <p className="pomocni-tekst">Korak 1 od 2</p>
          <h1>{firma ? 'Novi oglas firme' : 'Novi oglas'}</h1>
          <p className="pomocni-tekst">Objava je besplatna.</p>
        </div>
        <Padajuce oznaka="Primer oglasa za demo" vrednost={primer.naslov} onChange={(naslov) => promeniPrimer(primeri.find((p) => p.naslov === naslov)?.id ?? primerId)} opcije={primeri.map((p) => p.naslov)} />
        <div className="grupa-polja">
          <span className="polje-oznaka">Šta objavljuješ</span>
          <Pilule<Vrsta>
            oznaka="Tip oglasa"
            vrednost={tip}
            onChange={setTip}
            opcije={(firma ? (['roba', 'usluga'] as const) : (['roba', 'usluga', 'ideja'] as const)).map((v) => ({ v, naziv: VRSTE_NAZIV[v] }))}
          />
        </div>
        <Padajuce oznaka="Kategorija" vrednost={katNaziv} onChange={(naziv) => setKat(KATEGORIJE.find((k) => k.naziv === naziv)?.id ?? kat)} opcije={KATEGORIJE.map((k) => k.naziv)} />
        <p className="pomocni-tekst">{ZIVOTINJE_NAPOMENA}</p>
        {KATEGORIJE_SA_OBAVESTENJEM.includes(kat) && <ObavestenjeNekretnine />}
        <PrikaznoPolje oznaka="Naslov" vrednost={primer.naslov} napomena />
        <PrikaznoPolje oznaka="Opis" vrednost={primer.opis} />
        {tip === 'ideja' && <ObavestenjeIdeja />}
        <div className="grupa-polja">
          <span className="polje-oznaka">Fotografije</span>
          <div className="foto-trake" data-fotografije>
            <div className="foto-polje">
              <Ilustracija ikonica={KATEGORIJA_PO_ID[kat].ikonica} velicina={36} />
            </div>
            <div className="foto-polje">
              <Ilustracija ikonica="image" velicina={36} />
            </div>
            <div className="foto-polje">
              <Ilustracija ikonica="image" velicina={36} />
            </div>
          </div>
          <button type="button" className="dugme dugme-linija self-start" disabled>
            <Camera size={18} strokeWidth={1.75} aria-hidden /> Dodaj fotografije
          </button>
          <span className="razlog-neaktivno">Tri fotografije su izabrane za demo; ništa se ne šalje.</span>
        </div>
        <Veza ekran="S2" className="dugme dugme-tekst self-start">
          Šta ne sme da se objavi
        </Veza>
        <div className="red-dugmad">
          <a className="dugme dugme-zeleno" href={`#${dalje}`} data-dalje>
            Dalje
          </a>
        </div>
      </section>
    </div>
  )
}

/** Izmena postojećeg oglasa: način i vrednost poena (stvarno menja ishod: kartica, brojači, Moji oglasi). */
function Izmena({ oglasId, ugao }: { oglasId: string; ugao: Ugao }) {
  const navigate = useNavigate()
  const demo = useDemo()
  const { s, tokovi, ja, promeni } = useStanjePrice()
  const oglas = nadjiOglas(s, oglasId, tokovi)!
  const [nacin, setNacin] = useState<Nacin>(oglas.nacin)
  const [vrednost, setVrednost] = useState<number>(oglas.poeni ?? VREDNOSTI_POENA[2])
  const firma = oglas.firma
  const moj = !!ja && oglas.vlasnik === ja
  const zakljucan = jeRezervisan(oglas)
  // V8: usluge i ideje su samo „za razmenu“ (isto pravilo kao pri objavi)
  const samoRazmena = firma || oglas.vrsta !== 'roba'
  const razlog = !moj ? 'Možeš da menjaš samo svoje oglase' : zakljucan ? PREDMET_PRICE : undefined
  return (
    <div data-ekran-sadrzaj="O2" data-slobodan-tok data-uredi={oglas.id}>
      <section className="kartica ekran-srednji stog">
        <div>
          <h1>Uredi oglas</h1>
          <p className="pomocni-tekst">Izmene se primenjuju kad ih sačuvaš.</p>
        </div>
        <PrikaznoPolje oznaka="Naslov" vrednost={oglas.naslov} napomena />
        <div className="grupa-polja" data-nacin-uredi>
          <span className="polje-oznaka">Način</span>
          <Pilule<Nacin> oznaka="Način" vrednost={nacin} onChange={setNacin} onemoguceno={samoRazmena || zakljucan || !moj ? NACINI.filter((n) => n.v !== oglas.nacin).map((n) => n.v) : []} opcije={NACINI} />
          {nacin === 'poklon' && (
            <p className="pomocni-tekst" data-poklon-napomena>
              SWAPIT ti dodeljuje poene tek kad primalac potvrdi prijem poklona. <Znacka vrsta="model" />
            </p>
          )}
          {nacin === 'poeni' && (
            <div className="stog-sm">
              <Pilule<string> oznaka="Vrednost u poenima" vrednost={String(vrednost)} onChange={(v) => setVrednost(Number(v))} opcije={VREDNOSTI_POENA.map((v) => ({ v: String(v), naziv: poeni(v) }))} />
            </div>
          )}
          {samoRazmena && <span className="pomocni-tekst">{firma ? 'Firme objavljuju samo „za razmenu“.' : 'Usluge i ideje su samo „za razmenu“.'}</span>}
        </div>
        {razlog && <Obavestenje stanje="upozorenje" id="o2-razlog">{razlog}</Obavestenje>}
        <div className="red-dugmad">
          <button
            type="button"
            className="dugme dugme-zeleno"
            aria-disabled={!!razlog || undefined}
            aria-describedby={razlog ? 'o2-razlog' : undefined} // D8: vidljiv razlog je odmah iznad dugmeta
            onClick={() => {
              promeni((t) => izmeniOglas(t, oglas.id, { nacin, ...(nacin === 'poeni' ? { poeni: vrednost } : {}) }))
              demo.obavesti('Izmene su sačuvane')
              navigate(link('O6', ugao))
              window.scrollTo(0, 0)
            }}
          >
            Sačuvaj izmene
          </button>
          <Veza ekran="O6" className="dugme dugme-tekst">
            Moji oglasi
          </Veza>
        </div>
      </section>
    </div>
  )
}

/** O3 „Novi oglas, 2 od 2“ (slobodni tok). */
export function O3Slobodno() {
  const navigate = useNavigate()
  const demo = useDemo()
  const q = new URLSearchParams(useLocation().search)
  const { tokovi, promeni } = useStanjePrice()
  const { ugao, ja, firma, opstina } = useVlasnik()
  const jednom = useJednom()
  const primer = uzmi(PRIMER_PO_ID, q.get('p')) ?? (firma ? PRIMERI_OGLASA_FIRME[0] : PRIMERI_OGLASA[0])
  const vrsta: Vrsta = jeVrsta(q.get('t')) ? (q.get('t') as Vrsta) : primer.vrsta
  const kat = imaKljuc(KATEGORIJA_PO_ID, q.get('k')) ? (q.get('k') as string) : primer.kat
  const [stanje, setStanje] = useState('Korišćeno')
  const [nacin, setNacin] = useState<Nacin>(!firma && jeNacin(q.get('nacin')) ? (q.get('nacin') as Nacin) : 'razmena')
  const [vrednost, setVrednost] = useState<number>(VREDNOSTI_POENA[1])
  const [trazi, setTrazi] = useState<Vrsta>('roba')
  const [preuzimanje, setPreuzimanje] = useState<'licno' | 'licno-kurir'>('licno')
  if (!ja || !opstina) return <Nema naslov="Novi oglas" tekst="Oglase objavljuju građani i firme. Prebaci se na ugao Ana, Marko ili Prodavnica." />
  // poeni i poklon su samo za robu i samo za građane (UX 12.14)
  const mozeNacine = firma || vrsta !== 'roba' ? NACINI.filter((n) => n.v === 'razmena') : NACINI
  const nacinOk: Nacin = mozeNacine.some((n) => n.v === nacin) ? nacin : 'razmena'
  const tipKod = (vrsta === 'roba' ? 'r' : vrsta === 'usluga' ? 'u' : 'i') + (trazi === 'roba' ? 'r' : trazi === 'usluga' ? 'u' : 'i')
  const punoOglasa = tokovi.noviOglasi.length >= NAJVISE_NOVIH_OGLASA
  const novId = idNovogOglasa(tokovi, ja)
  const nacrt: Nacrt = { primer: primer.id, vrsta, kat, nacin: nacinOk, poeni: nacinOk === 'poeni' ? (vrednost as 10 | 25 | 50 | 100) : undefined, trazi, stanje: vrsta === 'roba' ? stanje : undefined, preuzimanje }
  return (
    <div data-ekran-sadrzaj="O3" data-slobodan-tok>
      <section className="kartica ekran-srednji stog">
        <div>
          <p className="pomocni-tekst">Korak 2 od 2</p>
          <h1>{firma ? 'Novi oglas firme' : 'Novi oglas'}</h1>
          <p className="pomocni-tekst" data-sazetak>
            {primer.naslov}
          </p>
        </div>
        {vrsta === 'roba' && (
          <div className="grupa-polja">
            <span className="polje-oznaka">Stanje (samo za robu)</span>
            <Pilule oznaka="Stanje" vrednost={stanje} onChange={setStanje} opcije={STANJA_ROBE.map((x) => ({ v: x, naziv: x }))} />
          </div>
        )}
        <div className="grupa-polja">
          <span className="polje-oznaka">Način</span>
          <Pilule<Nacin> oznaka="Način" vrednost={nacinOk} onChange={setNacin} opcije={mozeNacine} />
          {firma && <span className="pomocni-tekst">Firme objavljuju samo „za razmenu“; poeni nisu za firme.</span>}
          {nacinOk === 'poeni' && (
            <div className="stog-sm" data-predlog-poena>
              <span className="pomocni-tekst">
                Aplikacija predlaže vrednost: {VREDNOSTI_POENA.map((v) => poeni(v)).join(' · ')}. <span className="znacka znacka-model">model u proveri</span>
              </span>
              <Pilule<string> oznaka="Vrednost u poenima" vrednost={String(vrednost)} onChange={(v) => setVrednost(Number(v))} opcije={VREDNOSTI_POENA.map((v) => ({ v: String(v), naziv: poeni(v) }))} />
            </div>
          )}
          {nacinOk === 'poklon' && <span className="pomocni-tekst">SWAPIT ti dodeljuje poene tek kad primalac potvrdi prijem poklona.</span>}
        </div>
        {nacinOk === 'razmena' && (
          <>
            <div className="grupa-polja">
              <span className="polje-oznaka">Šta tražim zauzvrat (dodaje se i u tvoju listu želja)</span>
              <Pilule<Vrsta> oznaka="Šta tražim zauzvrat (dodaje se i u tvoju listu želja)" vrednost={trazi} onChange={setTrazi} opcije={(['roba', 'usluga', 'ideja'] as const).map((v) => ({ v, naziv: TRAZI_NAZIV[v] }))} />
              <p className="pomocni-tekst">Ovo ulazi u tvoju listu želja.</p>
            </div>
            <p data-tip-razmene>
              Tip razmene: <b>{TIPOVI_RAZMENE.find((t) => t.kod === tipKod)?.naziv}</b>
            </p>
          </>
        )}
        {vrsta === 'roba' && (
          <div className="grupa-polja">
            <span className="polje-oznaka">Preuzimanje</span>
            <Pilule<'licno' | 'licno-kurir'>
              oznaka="Preuzimanje"
              vrednost={preuzimanje}
              onChange={setPreuzimanje}
              opcije={[
                { v: 'licno', naziv: 'Lično' },
                { v: 'licno-kurir', naziv: 'Lično ili dostava kurirom' },
              ]}
            />
            <span className="pomocni-tekst" data-preuzimanje>
              {preuzimanjeTekst({ vrsta, preuzimanje })}
            </span>
          </div>
        )}
        <PrikaznoPolje oznaka="Grad i opština" vrednost={`Beograd, ${nazivOpstine(opstina)}`} />
        <Obavestenje>Telefon neće biti javan; otkriva se tek posle prihvaćene ponude. Objava je besplatna.</Obavestenje>
        {punoOglasa && <Obavestenje stanje="upozorenje">U demou možeš da objaviš najviše nekoliko oglasa. „Restart demo“ vraća sve na početak.</Obavestenje>}
        <div className="red-dugmad">
          <button
            type="button"
            className="dugme dugme-zeleno"
            aria-disabled={(punoOglasa) || undefined}
            onClick={() =>
              jednom(() => {
                promeni((t) => dodajNoviOglas(t, napraviOglas(t, ja, firma, opstina, nacrt)))
                demo.obavesti(PORUKE.simulacija)
                navigate(link('O4', ugao, {}, { id: novId }))
                window.scrollTo(0, 0)
              })
            }
          >
            Objavi
          </button>
          <Veza ekran="O2" upit={{ p: primer.id, t: vrsta, k: kat }} className="dugme dugme-tekst">
            Nazad
          </Veza>
        </div>
      </section>
    </div>
  )
}

/** O4 „Oglas objavljen“ (slobodni tok). */
export function O4Slobodno() {
  const q = new URLSearchParams(useLocation().search)
  const { s, tokovi } = useStanjePrice()
  const { firma } = useVlasnik()
  const oglas = nadjiOglas(s, q.get('id') ?? '', tokovi)
  if (!oglas) return <NemaStranice />
  return (
    <div data-ekran-sadrzaj="O4" data-slobodan-tok data-oglas-id={oglas.id}>
      <section className="kartica ekran-srednji stog">
        <Obavestenje stanje="uspeh" uloga="status">
          <b>Oglas je objavljen</b> — besplatno.
        </Obavestenje>
        <h1>Oglas je objavljen</h1>
        <div>
          <KarticaOglasa oglas={oglas} prva />
        </div>
        <div className="red-dugmad">
          <Veza ekran="Z1" parametri={{ oglas: oglas.id }} className="dugme dugme-linija">
            Istakni oglas
          </Veza>
          <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
            Pogledaj oglas
          </Veza>
          {!firma && (
            <Veza ekran="W3" className="dugme dugme-linija">
              Dodaj u listu želja
            </Veza>
          )}
          <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-tekst">
            Objavi još jedan
          </Veza>
        </div>
      </section>
    </div>
  )
}

