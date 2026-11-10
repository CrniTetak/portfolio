// O2, O3, O4: novi oglas u dva koraka i potvrda (UX 6.4). Korak 2 priče: Ana objavljuje PlayStation 2 „za razmenu“.
// Tekstovi su unapred popunjeni (prikaz); biraju se tip, stanje, način, tip razmene i preuzimanje. Objava je besplatna.
import { Camera } from 'lucide-react'
import { PS2_ID } from '../../scenario/svet'
import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { Ilustracija } from '../../komponente/Ilustracija'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeIdeja, ObavestenjeNekretnine } from '../../komponente/Obavestenja'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { SlikaOglasa } from '../../komponente/SlikaOglasa'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useStanjePrice } from '../../demo/useStanje'
import { poeni } from '../../scenario/format'
import { ZIVOTINJE_NAPOMENA } from '../../scenario/poslovno'
import { OPIS_PRICE, STANJA_ROBE, TIPOVI_RAZMENE, TRAZI_TEKST } from '../../scenario/prica'
import { KATEGORIJE, KATEGORIJE_SA_OBAVESTENJEM, POENI_PS2, nazivOpstine, oglasPoId, VREDNOSTI_POENA } from '../../scenario/svet'
import { O2Slobodno, O3Slobodno, O4Slobodno } from './NoviOglasSlobodno'
import { useEkran } from '../../okvir/kontekst'

const PS2 = PS2_ID
type Tip = 'roba' | 'usluga' | 'ideja'
type Nacin = 'razmena' | 'poeni' | 'poklon'

function Zajednicko({ children }: { children: ReactNode }) {
  return <section className="kartica ekran-srednji stog">{children}</section>
}

function O2Prica() {
  const l = useLink()
  const { ugao, grana, uradjeno } = useStanjePrice()
  // PK2-2: „Uredi“ u priči postoji samo za Anu u račvi „za poene“ posle izbora „Pokloni PlayStation 2“ (korak 7R); ostalo je slobodni tok
  const izPrice = ugao === 'ana' && grana === 'poeni' && uradjeno('6R.pokloni')
  const uredi = izPrice
  const oglas = oglasPoId(PS2)!
  const [tip, setTip] = useState<Tip>(oglas.vrsta)
  const [kat, setKat] = useState(KATEGORIJE.find((k) => k.id === oglas.kat)!.naziv)
  const [nacin, setNacin] = useState<Nacin>(izPrice ? 'poklon' : oglas.nacin)
  return (
    <div data-ekran-sadrzaj="O2">
      <Zajednicko>
        <div>
          {!uredi && <p className="pomocni-tekst">Korak 1 od 2</p>}
          <h1>{uredi ? 'Uredi oglas' : 'Novi oglas'}</h1>
          <p className="pomocni-tekst">{uredi ? 'Izmene se primenjuju kad ih sačuvaš.' : 'Objava je besplatna.'}</p>
        </div>
        <div className="grupa-polja">
          <span className="polje-oznaka">Šta objavljuješ</span>
          <Pilule<Tip>
            oznaka="Tip oglasa"
            vrednost={tip}
            onChange={setTip}
            opcije={[
              { v: 'roba', naziv: 'Roba' },
              { v: 'usluga', naziv: 'Usluga' },
              { v: 'ideja', naziv: 'Ideja' },
            ]}
          />
        </div>
        <Padajuce oznaka="Kategorija" vrednost={kat} onChange={setKat} opcije={KATEGORIJE.map((k) => k.naziv)} />
        <p className="pomocni-tekst">{ZIVOTINJE_NAPOMENA}</p>
        {/* N8: izbor Nekretnine ili Vozila odmah pokazuje obaveštenje o notaru i MUP-u */}
        {KATEGORIJE_SA_OBAVESTENJEM.includes(KATEGORIJE.find((k) => k.naziv === kat)?.id ?? '') && <ObavestenjeNekretnine />}
        {uredi && (
          <div className="grupa-polja" data-nacin-uredi>
            <span className="polje-oznaka">Način</span>
            <Pilule<Nacin>
              oznaka="Način"
              vrednost={nacin}
              onChange={setNacin}
              onemoguceno={izPrice ? ['razmena', 'poeni'] : []}
              opcije={[
                { v: 'razmena', naziv: 'Za razmenu' },
                { v: 'poeni', naziv: 'Za poene' },
                { v: 'poklon', naziv: 'Poklanjam' },
              ]}
            />
            {izPrice && (
              <p className="pomocni-tekst" data-nacin-zakljucan>
                U priči Ana poklanja PlayStation 2, pa je način zaključan na „Poklanjam“. U slobodnom klikanju izbor stvarno menja oglas.
              </p>
            )}
            {nacin === 'poklon' && (
              <p className="pomocni-tekst" data-poklon-napomena>
                SWAPIT ti dodeljuje {poeni(POENI_PS2)} tek kad primalac potvrdi prijem poklona. <Znacka vrsta="model" />
              </p>
            )}
          </div>
        )}
        <PrikaznoPolje oznaka="Naslov" vrednost={oglas.naslov} napomena />
        <PrikaznoPolje oznaka="Opis" vrednost={OPIS_PRICE[oglas.id] ?? oglas.opis} />
        {tip === 'ideja' && <ObavestenjeIdeja />}
        <div className="grupa-polja">
          <span className="polje-oznaka">Fotografije</span>
          <div className="foto-trake" data-fotografije>
            <div className="foto-polje">
              <SlikaOglasa oglas={oglas} namena="kartica" />
            </div>
            <div className="foto-polje">
              <Ilustracija ikonica="gamepad-2" velicina={36} />
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
          {izPrice ? (
            <RadnjaDugme id="7R.uredi" nakon={l('W5', { oglas: PS2 })} poruka="Izmene su sačuvane: oglas je sada „Poklanjam“">
              Sačuvaj izmene
            </RadnjaDugme>
          ) : (
            <RadnjaDugme id="2.o2" nakon={l('O3')} poruka={false} pregled={l('O3')}>
              Dalje
            </RadnjaDugme>
          )}
        </div>
      </Zajednicko>
    </div>
  )
}

function O3Prica() {
  const l = useLink()
  const oglas = oglasPoId(PS2)!
  const [stanje, setStanje] = useState('Korišćeno')
  const [nacin, setNacin] = useState<Nacin>('razmena')
  const [tipRazmene, setTipRazmene] = useState('rr')
  const [preuzimanje, setPreuzimanje] = useState('licno')
  return (
    <div data-ekran-sadrzaj="O3">
      <Zajednicko>
        <div>
          <p className="pomocni-tekst">Korak 2 od 2</p>
          <h1>Novi oglas</h1>
        </div>
        <div className="grupa-polja">
          <span className="polje-oznaka">Stanje (samo za robu)</span>
          <Pilule oznaka="Stanje" vrednost={stanje} onChange={setStanje} opcije={STANJA_ROBE.map((s) => ({ v: s, naziv: s }))} />
        </div>
        <div className="grupa-polja">
          <span className="polje-oznaka">Način</span>
          <Pilule<Nacin>
            oznaka="Način"
            vrednost={nacin}
            onChange={setNacin}
            opcije={[
              { v: 'razmena', naziv: 'Za razmenu' },
              { v: 'poeni', naziv: 'Za poene' },
              { v: 'poklon', naziv: 'Poklanjam' },
            ]}
          />
          {nacin === 'poeni' && (
            <p className="pomocni-tekst" data-predlog-poena>
              Aplikacija predlaže vrednost: {VREDNOSTI_POENA.map((v) => poeni(v)).join(' · ')}. <span className="znacka znacka-model">model u proveri</span>
            </p>
          )}
        </div>
        {nacin === 'razmena' && (
          <>
            <PrikaznoPolje oznaka="Šta tražim zauzvrat (dodaje se i u tvoju listu želja)" vrednost={TRAZI_TEKST[PS2]} napomena />
            <p className="pomocni-tekst">Ovo ulazi u tvoju listu želja.</p>
            <div className="grupa-polja">
              <span className="polje-oznaka">Tip razmene</span>
              <Pilule oznaka="Tip razmene" vrednost={tipRazmene} onChange={setTipRazmene} opcije={TIPOVI_RAZMENE.map((t) => ({ v: t.kod, naziv: t.naziv }))} />
            </div>
          </>
        )}
        <div className="grupa-polja">
          <span className="polje-oznaka">Preuzimanje</span>
          <Pilule
            oznaka="Preuzimanje"
            vrednost={preuzimanje}
            onChange={setPreuzimanje}
            opcije={[
              { v: 'licno', naziv: 'Lično' },
              { v: 'kurir', naziv: 'Dostava kurirom' },
            ]}
          />
        </div>
        <PrikaznoPolje oznaka="Grad i opština" vrednost={`${oglas.grad}, ${nazivOpstine(oglas.opstina!)}`} />
        <Obavestenje>Telefon neće biti javan; otkriva se tek posle prihvaćene ponude. Objava je besplatna.</Obavestenje>
        <div className="red-dugmad">
          <RadnjaDugme id="2.o3" nakon={l('O4')}>
            Objavi
          </RadnjaDugme>
          <Veza ekran="O2" className="dugme dugme-tekst">
            Nazad
          </Veza>
        </div>
      </Zajednicko>
    </div>
  )
}

function O4Prica() {
  const l = useLink()
  const { s, uradjeno } = useStanjePrice()
  const objavljen = uradjeno('2.o3')
  const oglas = s.oglasi.find((o) => o.id === PS2) ?? oglasPoId(PS2)!
  if (!objavljen) return <JosNijePocelo naslov="Oglas objavljen" opis="Potvrda se prikazuje kad Ana objavi oglas." korak={2} />
  return (
    <div data-ekran-sadrzaj="O4">
      <Zajednicko>
        <Obavestenje stanje="uspeh" uloga="status">
          <b>Oglas je objavljen</b> — besplatno.
        </Obavestenje>
        <h1>Oglas je objavljen</h1>
        <div>
          <KarticaOglasa oglas={oglas} prva />
        </div>
        <div className="red-dugmad">
          <Veza ekran="Z1" parametri={{ oglas: PS2 }} className="dugme dugme-linija">
            Istakni oglas
          </Veza>
          <Veza ekran="O1" parametri={{ oglas: PS2 }} className="dugme dugme-plavo">
            Pogledaj oglas
          </Veza>
          <RadnjaDugme id="2.zelja" nakon={l('W3')} poruka={false} pregled={l('W3')}>
            Dodaj u listu želja
          </RadnjaDugme>
          <Veza ekran="O2" className="dugme dugme-tekst">
            Objavi još jedan
          </Veza>
        </div>
      </Zajednicko>
    </div>
  )
}

// Novi oglas Ane u vođenoj priči (korak 2, PlayStation 2) je vezan za radnje priče. Slobodni tok: režim „Slobodno klikanje“, link sa ?novi=1 (plus, O6,
// „Pokloni nešto“, „Dodaj novu stvar“), izmena tuđeg ili običnog oglasa (?uredi=id) i uvek oglasi firme (jednostavan obrazac oglasa firme).
function slobodanObrazac(ugao: string, rezim: string, grana: string, korak6Pokloni: boolean, q: URLSearchParams): boolean {
  if (ugao === 'prodavnica' || rezim === 'slobodno' || q.has('novi')) return true
  const uredi = q.get('uredi')
  if (uredi) return !(uredi === PS2 && ugao === 'ana' && grana === 'poeni' && korak6Pokloni)
  return false
}

export function O2() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const { grana, uradjeno } = useStanjePrice()
  const q = new URLSearchParams(useLocation().search)
  return slobodanObrazac(ugao, demo.rezim, grana, uradjeno('6R.pokloni'), q) ? <O2Slobodno /> : <O2Prica />
}
export function O3() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const q = new URLSearchParams(useLocation().search)
  return ugao === 'prodavnica' || demo.rezim === 'slobodno' || q.has('p') ? <O3Slobodno /> : <O3Prica />
}
export function O4() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const q = new URLSearchParams(useLocation().search)
  return ugao === 'prodavnica' || demo.rezim === 'slobodno' || q.has('id') ? <O4Slobodno /> : <O4Prica />
}
