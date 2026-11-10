// P4 „Pretraga i filteri“ i P5 „Rezultati pretrage“ (UX 6.3). Jedino pravo polje u demou je pretraga (PoljePretrage): ona samo filtrira oglase demoa.
// Izbor filtera putuje kroz link, pa osvežavanje i „Nazad“ čuvaju rezultat. Radijus je samo prikaz (UX 12, stavka 5); filtrira se grad i zemlja.
import { uzmi } from '../../scenario/kljuc'
import { Search, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useState, type ReactNode } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Kvacica, Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PoljeNaTelefonu } from '../../komponente/PoljeNaTelefonu'
import { Veza } from '../../komponente/Veza'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { odgovaraTekstu } from '../../pretraga/pretrazi'
import { GOTOVI_UPITI } from '../../pretraga/sinonimi'
import { GRAD_PODRAZUMEVAN, PRAZNI_FILTERI, SORTIRANJA, SVE_ZEMLJE, SVI_GRADOVI, ZEMLJA_PODRAZUMEVANA, brojAktivnih, izLinka, rezultati, uLink, type Filteri, type Sortiranje } from '../../pretraga/filteri'
import { broj, km } from '../../scenario/format'
import { RADIJUS_KM, TIPOVI_RAZMENE, TRAZI_TEKST } from '../../scenario/prica'
import { STANJA_ROBE } from '../../scenario/prica'
import { ZELJA_PO_ID } from '../../scenario/slobodno'
import { FIRMA_PO_ID, KATEGORIJA_PO_ID, KATEGORIJE, KORISNIK_PO_ID, REGION_KORISNICI } from '../../scenario/svet'
import { sacuvajPretragu } from '../../tokovi/operacije'
import { PORUKE } from '../../tekstovi/okvir'

const NAJVECI_RADIJUS_KM = 100
const GRADOVI = [GRAD_PODRAZUMEVAN, ...REGION_KORISNICI.map((r) => r.grad), SVI_GRADOVI]
const ZEMLJE = [ZEMLJA_PODRAZUMEVANA, ...[...new Set(REGION_KORISNICI.map((r) => r.drzava))].filter((d) => d !== ZEMLJA_PODRAZUMEVANA), SVE_ZEMLJE]
const NACINI: { v: Filteri['nacin']; naziv: string }[] = [
  { v: '', naziv: 'Svi načini' },
  { v: 'razmena', naziv: 'Za razmenu' },
  { v: 'poeni', naziv: 'Za poene' },
  { v: 'poklon', naziv: 'Poklanjam' },
]
const SVE_KATEGORIJE = 'Sve kategorije'
const SVA_STANJA = 'Sva stanja'

function Sekcija({ naslov, otvoreno = false, children }: { naslov: string; otvoreno?: boolean; children: ReactNode }) {
  return (
    <details className="filter-sekcija" open={otvoreno}>
      <summary>{naslov}</summary>
      <div className="stog-sm mt-2">{children}</div>
    </details>
  )
}

export function P4() {
  const navigate = useNavigate()
  const { ugao } = useEkran()
  const { search } = useLocation()
  const pocetno = izLinka(new URLSearchParams(search))
  const [f, setF] = useState<Filteri>(pocetno.filteri)
  const [radijus, setRadijus] = useState(RADIJUS_KM)
  const postavi = (d: Partial<Filteri>) => setF((x) => ({ ...x, ...d }))
  const prebaciTip = (kod: string) => postavi({ tip: f.tip.includes(kod) ? f.tip.filter((x) => x !== kod) : [...f.tip, kod] })
  const gradIzbor = (grad: string) => {
    // grad određuje zemlju (region): Beograd → Srbija, Zagreb → Hrvatska
    const r = REGION_KORISNICI.find((x) => x.grad === grad)
    postavi({ grad, zemlja: grad === SVI_GRADOVI ? SVE_ZEMLJE : (r?.drzava ?? ZEMLJA_PODRAZUMEVANA) })
  }
  const trazi = () => {
    navigate(link('P5', ugao, {}, uLink(pocetno.upit, f)))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="P4">
      <h1>Pretraga i filteri</h1>
      <PoljeNaTelefonu />
      <p className="pomocni-tekst">{PORUKE.uzoraPretrage}</p>
      <div className="cipovi" data-gotovi-upiti aria-label="Gotovi upiti" role="group">
        {GOTOVI_UPITI.map((u) => (
          <Veza key={u} ekran="P5" upit={{ q: u }} className="pilula">
            {u}
          </Veza>
        ))}
      </div>
      <div className="stog-sm" data-panel-filtera>
        <Sekcija naslov="Tip razmene" otvoreno>
          <div className="cipovi" role="group" aria-label="Tip razmene">
            {TIPOVI_RAZMENE.map((t) => (
              <button key={t.kod} type="button" className="pilula" aria-pressed={f.tip.includes(t.kod)} onClick={() => prebaciTip(t.kod)}>
                {t.naziv}
              </button>
            ))}
          </div>
        </Sekcija>
        <Sekcija naslov="Način" otvoreno>
          <Pilule<Filteri['nacin']> oznaka="Način" vrednost={f.nacin} onChange={(v) => postavi({ nacin: v })} opcije={NACINI} />
        </Sekcija>
        <Sekcija naslov="Kategorija">
          <Padajuce oznaka="Kategorija" vrednost={f.kat ? (uzmi(KATEGORIJA_PO_ID, f.kat)?.naziv ?? SVE_KATEGORIJE) : SVE_KATEGORIJE} onChange={(naziv) => postavi({ kat: KATEGORIJE.find((k) => k.naziv === naziv)?.id ?? '' })} opcije={[SVE_KATEGORIJE, ...KATEGORIJE.map((k) => k.naziv)]} />
        </Sekcija>
        <Sekcija naslov="Lokacija">
          <Padajuce oznaka="Grad" vrednost={f.grad} onChange={gradIzbor} opcije={GRADOVI} />
          <Padajuce oznaka="Zemlja" vrednost={f.zemlja} onChange={(zemlja) => postavi({ zemlja })} opcije={ZEMLJE} />
          <div className="grupa-polja">
            <label className="polje-oznaka" htmlFor="p4-radijus">
              Radijus: {km(radijus)} <span className="znacka znacka-model">samo prikaz</span>
            </label>
            <input id="p4-radijus" type="range" min={1} max={NAJVECI_RADIJUS_KM} value={radijus} onChange={(e) => setRadijus(Number(e.target.value))} className="klizac" />
          </div>
        </Sekcija>
        <Sekcija naslov="Stanje (samo za robu)">
          <Pilule<string> oznaka="Stanje" vrednost={f.stanje || SVA_STANJA} onChange={(v) => postavi({ stanje: v === SVA_STANJA ? '' : v })} opcije={[SVA_STANJA, ...STANJA_ROBE].map((x) => ({ v: x, naziv: x }))} />
        </Sekcija>
        <Sekcija naslov="Još filtera">
          <Kvacica checked={f.slika} onChange={(v) => postavi({ slika: v })} oznaka="Samo sa slikom" />
          <Kvacica checked={f.dostava} onChange={(v) => postavi({ dostava: v })} oznaka="Dostava" />
          <Kvacica checked={f.licno} onChange={(v) => postavi({ licno: v })} oznaka="Lično preuzimanje" />
          <Kvacica checked={f.odmah} onChange={(v) => postavi({ odmah: v })} oznaka="Dostupno odmah" />
        </Sekcija>
        <Sekcija naslov="Građanin / Firma">
          <Pilule<string>
            oznaka="Građanin ili firma"
            vrednost={f.ko || 'svi'}
            onChange={(v) => postavi({ ko: v === 'gradjanin' || v === 'firma' ? v : '' })}
            opcije={[
              { v: 'svi', naziv: 'Svi' },
              { v: 'gradjanin', naziv: 'Građanin' },
              { v: 'firma', naziv: 'Firma' },
            ]}
          />
        </Sekcija>
      </div>
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-zeleno" onClick={trazi}>
          <Search size={18} strokeWidth={1.75} aria-hidden /> Traži
        </button>
        <button type="button" className="dugme dugme-linija" onClick={() => setF(PRAZNI_FILTERI)}>
          Poništi filtere
        </button>
      </div>
      <p className="pomocni-tekst">
        Aktivnih filtera: <b className="num">{broj(brojAktivnih(f))}</b>.
      </p>
    </section>
  )
}

/** Opis aktivnog filtera za čip na P5 i ključ(evi) koje uklanja. */
function cipovi(f: Filteri): { kljuc: string; naziv: string; ukloni: Partial<Filteri> }[] {
  const lista: { kljuc: string; naziv: string; ukloni: Partial<Filteri> }[] = []
  for (const kod of f.tip) lista.push({ kljuc: `tip-${kod}`, naziv: TIPOVI_RAZMENE.find((t) => t.kod === kod)?.naziv ?? kod, ukloni: { tip: f.tip.filter((x) => x !== kod) } })
  if (f.nacin) lista.push({ kljuc: 'nacin', naziv: NACINI.find((n) => n.v === f.nacin)?.naziv ?? f.nacin, ukloni: { nacin: '' } })
  if (f.kat) lista.push({ kljuc: 'kat', naziv: uzmi(KATEGORIJA_PO_ID, f.kat)?.naziv ?? f.kat, ukloni: { kat: '' } })
  if (f.grad !== GRAD_PODRAZUMEVAN) lista.push({ kljuc: 'grad', naziv: f.grad, ukloni: { grad: GRAD_PODRAZUMEVAN, zemlja: ZEMLJA_PODRAZUMEVANA } })
  else if (f.zemlja !== ZEMLJA_PODRAZUMEVANA) lista.push({ kljuc: 'zemlja', naziv: f.zemlja, ukloni: { zemlja: ZEMLJA_PODRAZUMEVANA } })
  if (f.stanje) lista.push({ kljuc: 'stanje', naziv: f.stanje, ukloni: { stanje: '' } })
  if (f.slika) lista.push({ kljuc: 'slika', naziv: 'Samo sa slikom', ukloni: { slika: false } })
  if (f.dostava) lista.push({ kljuc: 'dostava', naziv: 'Dostava', ukloni: { dostava: false } })
  if (f.licno) lista.push({ kljuc: 'licno', naziv: 'Lično preuzimanje', ukloni: { licno: false } })
  if (f.odmah) lista.push({ kljuc: 'odmah', naziv: 'Dostupno odmah', ukloni: { odmah: false } })
  if (f.ko) lista.push({ kljuc: 'ko', naziv: f.ko === 'firma' ? 'Firma' : 'Građanin', ukloni: { ko: '' } })
  return lista
}

export function P5() {
  const navigate = useNavigate()
  const demo = useDemo()
  const { ugao } = useEkran()
  const { search } = useLocation()
  const { s, tokovi, ja, uradjeno, promeni } = useStanjePrice()
  const { upit, filteri } = izLinka(new URLSearchParams(search))
  const [sacuvano, setSacuvano] = useState(false)
  const opstina = ja ? (KORISNIK_PO_ID[ja]?.opstina ?? FIRMA_PO_ID[ja]?.opstina) : undefined
  const zelje = [
    ...tokovi.zelje.filter((z) => z.k === ja).map((z) => ZELJA_PO_ID[z.id].trazi),
    ...(ugao === 'ana' && uradjeno('2.zelja') ? [TRAZI_TEKST['ana-ps2']] : []),
    ...(ugao === 'marko' ? [TRAZI_TEKST['markov-bicikl']] : []),
  ]
  const lista = rezultati([...s.oglasi, ...s.region], upit, filteri, { opstina, zelje })
  const bezPretrage = !upit.trim() && brojAktivnih(filteri) === 0
  const idiNa = (q: string, f: Filteri) => navigate(link('P5', ugao, {}, uLink(q, f)), { replace: true })
  const aktivni = cipovi(filteri)
  const istaknuti = lista.filter((o) => o.istaknuto && odgovaraTekstu(o, upit)).slice(0, 2) // D3: isto pravilo kao u poredaj()
  const ostali = lista.filter((o) => !istaknuti.includes(o))
  const upitZaMapu = uLink(upit, filteri)
  const zaCuvanje = new URLSearchParams(uLink(upit, filteri)).toString()
  const vecSacuvano = sacuvano || tokovi.pretrage.some((p) => p.k === ja && p.q === zaCuvanje)
  return (
    <section className="stog" data-ekran-sadrzaj="P5" data-broj-rezultata={lista.length}>
      <div className="kartica stog">
        <h1>Rezultati pretrage</h1>
        <PoljeNaTelefonu />
        <p className="pomocni-tekst">{PORUKE.uzoraPretrage}</p>
        {aktivni.length > 0 && (
          <div className="cipovi" aria-label="Izabrani filteri" role="group" data-cipovi-filtera>
            {aktivni.map((c) => (
              <button key={c.kljuc} type="button" className="pilula" aria-label={`Ukloni filter: ${c.naziv}`} onClick={() => idiNa(upit, { ...filteri, ...c.ukloni })}>
                {c.naziv} <X size={14} strokeWidth={2} aria-hidden />
              </button>
            ))}
          </div>
        )}
        {!bezPretrage && (
          <div className="naslov-reda">
            <p data-pronadjeno>
              Pronađeno: <b className="num">{broj(lista.length)}</b> oglasa
            </p>
            <Padajuce oznaka="Sortiranje" vrednost={SORTIRANJA.find((x) => x.v === filteri.sort)?.naziv ?? SORTIRANJA[0].naziv} onChange={(naziv) => idiNa(upit, { ...filteri, sort: (SORTIRANJA.find((x) => x.naziv === naziv)?.v ?? 'najblize') as Sortiranje })} opcije={SORTIRANJA.map((x) => x.naziv)} />
          </div>
        )}
        <p className="pomocni-tekst">
          <Veza ekran="P10" className="veza-tekst">Kako ređamo oglase</Veza> · <Veza ekran="P4" upit={upitZaMapu} className="veza-tekst">Filteri</Veza>
        </p>
      </div>

      {bezPretrage ? (
        <div className="kartica stog" data-bez-pretrage>
          <h2>Šta tražiš?</h2>
          <p>Upiši pojam u polje iznad ili izaberi jedan od gotovih upita.</p>
          <div className="cipovi" role="group" aria-label="Gotovi upiti">
            {GOTOVI_UPITI.map((u) => (
              <Veza key={u} ekran="P5" upit={{ q: u }} className="pilula">
                {u}
              </Veza>
            ))}
          </div>
          <Veza ekran="P4" className="dugme dugme-plavo self-start">
            Pretraga i filteri
          </Veza>
        </div>
      ) : lista.length === 0 ? (
        <div className="kartica stog" data-prazan-rezultat>
          <h2>Nema rezultata</h2>
          <p>Nema rezultata. Dodaj želju — javićemo kad se pojavi.</p>
          <div className="red-dugmad">
            <Veza ekran="W3" className="dugme dugme-zeleno">
              Dodaj želju
            </Veza>
            <Veza ekran="P4" className="dugme dugme-linija">
              Promeni filtere
            </Veza>
          </div>
        </div>
      ) : (
        <>
          {istaknuti.length > 0 && (
            <div className="stog-sm" data-istaknuti-rezultati>
              <h2 className="naslov-placeno">Istaknuto · plaćeno</h2>
              <p className="pomocni-tekst">Ovde su najviše dva plaćena oglasa čiji naslov ili opis odgovara pretrazi. Označeni su i ne utiču na to šta je pronađeno.</p>
              <div className="mreza-kartica">
                {istaknuti.map((o) => (
                  <KarticaOglasa key={o.id} oglas={o} />
                ))}
              </div>
            </div>
          )}
          <div className="mreza-kartica" data-mreza>
            {ostali.map((o) => (
              <KarticaOglasa key={o.id} oglas={o} />
            ))}
          </div>
        </>
      )}
      {!bezPretrage && (
        <div className="red-dugmad">
          <Veza ekran="P6" upit={upitZaMapu} className="dugme dugme-plavo">
            Prikaži na mapi
          </Veza>
          <button
            type="button"
            className="dugme dugme-linija"
            aria-disabled={vecSacuvano || !ja || undefined}
            aria-describedby={!ja ? 'p5-razlog-ja' : vecSacuvano ? 'p5-razlog-sacuvano' : undefined}
            onClick={() => {
              if (ja) promeni((t) => sacuvajPretragu(t, ja, zaCuvanje))
              setSacuvano(true)
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            Sačuvaj pretragu u listu želja
          </button>
          {!ja && (
            <span id="p5-razlog-ja" className="razlog-neaktivno">
              Pretrage čuvaju građani i firme (Gledaj kao Ana).
            </span>
          )}
          {vecSacuvano && (
            <>
              <span id="p5-razlog-sacuvano" className="razlog-neaktivno">
                Pretraga je već sačuvana.
              </span>
              <Veza ekran="W3" className="dugme dugme-tekst">
                Lista želja
              </Veza>
            </>
          )}
        </div>
      )}
      {!bezPretrage && lista.length === 0 && ugao === 'moderacija' && <Obavestenje>Moderacija pretražuje samo radi pregleda; ponude i želje šalju građani.</Obavestenje>}
    </section>
  )
}
