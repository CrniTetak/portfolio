// W3 „Lista želja“ i W4 „Poklapanje“ (UX 6.7). Korak 2: Ana upisuje dečji bicikl; korak 3: aplikacija javlja poklapanje.
// Marko ima udžbenike za 3. razred u svojoj listi od početka; njemu se poklapa Jovanin oglas.
// Slobodni tok: želje se dodaju izborom iz liste primera (ništa se ne kuca), poklapanja se traže među oglasima demoa, a sačuvane pretrage stoje ovde.
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { useStanjePrice } from '../../demo/useStanje'
import { useDemo } from '../../demo/DemoProvider'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Padajuce, Prekidac } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { odgovara } from '../../pretraga/pretrazi'
import { km, broj } from '../../scenario/format'
import { RADIJUS_KM, RASTOJANJE_KM, TRAZI_TEKST } from '../../scenario/prica'
import { ZELJA_PO_ID, ZELJE_PRIMERI } from '../../scenario/slobodno'
import { nadjiOglas, type Oglas } from '../../scenario/svet'
import { dodajZelju } from '../../tokovi/operacije'
import { PORUKE } from '../../tekstovi/okvir'

type Zelja = { id: string; naziv: string; vrsta: string; grad: string; trazi?: string; /** N7: želja nastala iz „Šta tražim zauzvrat“ pri objavi oglasa za razmenu */ izOglasa?: boolean }
const VRSTA_NAZIV = { roba: 'Roba', usluga: 'Usluga', ideja: 'Ideja' } as const

/** Lista želja gledaoca: priča (Ana tek posle koraka 2, Marko od početka) + želje koje je dodao u slobodnom toku. */
function listaZelja(ugao: string, uradjeno: (id: string) => boolean, slobodno: boolean, tok: { k: string; id: string }[], ja: string | null, noviOglasi: Oglas[]): Zelja[] {
  const izPrice: Zelja[] = []
  if (!slobodno) {
    if (ugao === 'ana' && uradjeno('2.zelja')) izPrice.push({ id: 'prica', naziv: TRAZI_TEKST['ana-ps2'], vrsta: 'Roba', grad: 'Beograd' })
    if (ugao === 'marko') izPrice.push({ id: 'prica', naziv: TRAZI_TEKST['markov-bicikl'], vrsta: 'Roba', grad: 'Beograd' })
  }
  const svoje = tok.filter((z) => z.k === ja).map((z) => ({ id: z.id, naziv: ZELJA_PO_ID[z.id].naziv, vrsta: ZELJA_PO_ID[z.id].vrsta, grad: 'Beograd', trazi: ZELJA_PO_ID[z.id].trazi }))
  // N7: „Šta tražim zauzvrat“ pri objavi oglasa za razmenu dodaje stavku i u listu želja
  const izOglasa: Zelja[] = noviOglasi
    .filter((o) => o.vlasnik === ja && o.nacin === 'razmena' && !!o.trazi)
    .map((o) => ({ id: `oglas-${o.id}`, naziv: `Tražim zauzvrat za „${o.naslov}“`, vrsta: VRSTA_NAZIV[o.trazi!], grad: 'Beograd', izOglasa: true }))
  return [...izPrice, ...svoje, ...izOglasa]
}

/** Prvi oglas koji odgovara želji (slobodni tok); tuđ oglas, aktivan u Beogradu. */
function poklapanja(oglasi: Oglas[], ja: string | null, trazi: string): Oglas[] {
  return oglasi.filter((o) => o.vlasnik !== ja && odgovara(o, trazi))
}

export function W3() {
  const demo = useDemo()
  const { ugao, uradjeno, korak, slobodno, tokovi, ja, s, promeni } = useStanjePrice()
  const [dodaj, setDodaj] = useState(false)
  const [obavestenja, setObavestenja] = useState(true)
  const slobodnih = ZELJE_PRIMERI.filter((z) => !tokovi.zelje.some((t) => t.k === ja && t.id === z.id))
  const [izbor, setIzbor] = useState(slobodnih[0]?.naziv ?? '')
  const zelje = listaZelja(ugao, uradjeno, slobodno, tokovi.zelje, ja, tokovi.noviOglasi)
  const pretrage = tokovi.pretrage.filter((p) => p.k === ja)
  if (zelje.length === 0 && !slobodno && pretrage.length === 0)
    return <JosNijePocelo naslov="Lista želja" opis="Ovde se skupljaju stvari koje tražiš. Ana upisuje dečji bicikl kad objavi oglas." korak={2} />
  const poklapanjaPrice = korak >= 3 && !slobodno ? 1 : 0
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W3">
      <div className="naslov-reda">
        <h1>Lista želja</h1>
        <button type="button" className="dugme dugme-plavo" aria-expanded={dodaj} onClick={() => setDodaj(!dodaj)}>
          <Plus size={18} strokeWidth={1.75} aria-hidden /> Dodaj želju
        </button>
      </div>
      {zelje.length === 0 && (
        <p className="prazno-stanje" data-nema-zelja>
          Još nemaš nijednu želju. Dodaj prvu ili sačuvaj pretragu.
        </p>
      )}
      <ul className="stog-sm" data-zelje>
        {zelje.map((z) => {
          const n = z.izOglasa ? 0 : z.trazi ? poklapanja(s.oglasi, ja, z.trazi).length : poklapanjaPrice
          return (
            <li key={z.id} className="stavka" data-zelja={z.id}>
              <div className="stavka-glavna">
                <h2>{z.naziv}</h2>
                <p className="pomocni-tekst">
                  {z.vrsta} · {z.grad} · radijus {km(RADIJUS_KM)} <span className="znacka znacka-model">samo prikaz</span>
                </p>
              </div>
              <div className="stavka-akcije">
                {n > 0 ? (
                  <Veza ekran="W4" upit={z.trazi ? { z: z.id } : undefined} className="dugme dugme-zeleno">
                    Poklapanja ({broj(n)})
                  </Veza>
                ) : (
                  <span className="pomocni-tekst">Poklapanja ({broj(n)})</span>
                )}
                {!z.izOglasa && (
                  <Veza ekran="P5" upit={{ q: (z.trazi ?? z.naziv.split(' ')[0]).toLowerCase() }} className="dugme dugme-linija">
                    Pretraži
                  </Veza>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {dodaj && (
        <div className="kartica kartica-mirna stog" data-nova-zelja>
          <h2>Nova želja</h2>
          {slobodnih.length === 0 ? (
            <p>Dodate su sve želje iz primera. „Restart demo“ vraća listu na početak.</p>
          ) : (
            <>
              <PrikaznoPolje oznaka="Naziv" vrednost={slobodnih.find((z) => z.naziv === izbor)?.naziv ?? slobodnih[0].naziv} napomena />
              {slobodnih.length > 1 && <Padajuce oznaka="Izaberi primer želje" vrednost={izbor} onChange={setIzbor} opcije={slobodnih.map((z) => z.naziv)} />}
              <PrikaznoPolje oznaka="Kategorija" vrednost={slobodnih.find((z) => z.naziv === izbor)?.kategorija ?? slobodnih[0].kategorija} />
              <PrikaznoPolje oznaka="Grad" vrednost="Beograd" />
              <PrikaznoPolje oznaka="Radijus" vrednost={km(RADIJUS_KM)} />
            </>
          )}
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-zeleno"
              aria-disabled={(slobodnih.length === 0 || !ja) || undefined}
              onClick={() => {
                const z = slobodnih.find((x) => x.naziv === izbor) ?? slobodnih[0]
                if (ja && z) promeni((t) => dodajZelju(t, ja, z.id))
                demo.obavesti(PORUKE.simulacija)
                setDodaj(false)
                setIzbor(slobodnih.find((x) => x.id !== z?.id)?.naziv ?? '')
              }}
            >
              Dodaj
            </button>
            <button type="button" className="dugme dugme-tekst" onClick={() => setDodaj(false)}>
              Odustani
            </button>
          </div>
        </div>
      )}
      {pretrage.length > 0 && (
        <section className="stog-sm" aria-label="Sačuvane pretrage" data-sacuvane-pretrage>
          <h2>Sačuvane pretrage ({broj(pretrage.length)})</h2>
          <ul className="stog-sm">
            {pretrage.map((p) => {
              const q = Object.fromEntries(new URLSearchParams(p.q).entries())
              return (
                <li key={p.q} className="stavka">
                  <div className="stavka-glavna">
                    <b>{q.q ?? 'Pretraga sa filterima'}</b>
                  </div>
                  <div className="stavka-akcije">
                    <Veza ekran="P5" upit={q} className="dugme dugme-linija">
                      Otvori
                    </Veza>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <Prekidac oznaka="Javi mi kad se pojavi poklapanje" ukljucen={obavestenja} onChange={setObavestenja} />
      <p className="pomocni-tekst">Obaveštenja stižu u „Moje razmene i ponude“.</p>
    </section>
  )
}

export function W4() {
  const l = useLink()
  const demo = useDemo()
  const { ugao, korak, uradjeno, slobodno, tokovi, ja, s } = useStanjePrice()
  const [odbaceno, setOdbaceno] = useState<string[]>([])
  const zahtevaneId = new URLSearchParams(useLocation().search).get('z')

  // ---- slobodni tok: poklapanje sa željom koju je gledalac dodao
  if (slobodno || zahtevaneId) {
    const zelje = tokovi.zelje.filter((z) => z.k === ja)
    const prve = zelje
      .filter((z) => !zahtevaneId || z.id === zahtevaneId)
      .map((z) => ({ z, o: poklapanja(s.oglasi, ja, ZELJA_PO_ID[z.id].trazi).find((x) => !odbaceno.includes(x.id)) }))
      .find((x) => x.o)
    if (!prve)
      return (
        <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W4" data-nema-poklapanja>
          <h1>Poklapanje</h1>
          <Obavestenje>{zelje.length === 0 ? 'Još nemaš nijednu želju, pa nema šta da se poklopi.' : 'Za sada nema novih poklapanja. Javićemo kad se pojavi.'}</Obavestenje>
          <Veza ekran="W3" className="dugme dugme-zeleno self-start">
            Lista želja
          </Veza>
        </section>
      )
    const { z, o } = prve
    const oglas = nadjiOglas(s, o!.id, tokovi)!
    return (
      <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W4" data-slobodan-tok>
        <h1>Poklapanje</h1>
        <Obavestenje stanje="uspeh" uloga="status">
          <b>Pronađen je oglas koji odgovara tvojoj želji:</b> {ZELJA_PO_ID[z.id].naziv}.
        </Obavestenje>
        <div className="flex flex-wrap items-center gap-4">
          <KarticaOglasa oglas={oglas} prva />
          <div className="stog-sm">
            <div className="znacke">
              <Znacka vrsta={oglas.firma ? 'firma' : 'gradjanin'} />
            </div>
            <p className="pomocni-tekst">Lokacija je samo približna.</p>
          </div>
        </div>
        <div className="red-dugmad">
          <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-zeleno">
            Pogledaj oglas
          </Veza>
          <Veza ekran={oglas.nacin === 'poklon' ? 'W5' : oglas.nacin === 'poeni' ? 'W2' : 'X1'} parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
            {oglas.nacin === 'poklon' ? 'Zatraži poklon' : oglas.nacin === 'poeni' ? 'Uzmi za poene' : 'Ponudi razmenu'}
          </Veza>
          <button type="button" className="dugme dugme-tekst" onClick={() => setOdbaceno((x) => [...x, oglas.id])}>
            Ne zanima me
          </button>
        </div>
      </section>
    )
  }

  // ---- priča: Ana vidi Markov bicikl, Marko Jovanine udžbenike
  const oglasId = ugao === 'marko' ? 'jovanini-udzbenici' : 'markov-bicikl'
  const oglas = nadjiOglas(s, oglasId, tokovi)!
  if (korak < 3) return <JosNijePocelo naslov="Poklapanje" opis="Aplikacija javlja kad se pojavi oglas koji odgovara tvojoj želji." korak={3} />
  const lanac = uradjeno('5.x6')
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W4">
      <h1>Poklapanje</h1>
      <Obavestenje stanje="uspeh" uloga="status">
        <b>Pronađen je oglas koji odgovara tvojoj želji:</b> {ugao === 'marko' ? TRAZI_TEKST['markov-bicikl'] : TRAZI_TEKST['ana-ps2']}.
      </Obavestenje>
      <div className="flex flex-wrap items-center gap-4">
        <KarticaOglasa oglas={oglas} prva />
        <div className="stog-sm">
          <p>
            Oko <b className="num">{km(RASTOJANJE_KM[oglasId])}</b> od tebe (približno).
          </p>
          <div className="znacke">
            <Znacka vrsta="gradjanin" />
            <Znacka vrsta="verifikovan" />
          </div>
          <p className="pomocni-tekst">Lokacija je samo približna.</p>
        </div>
      </div>
      <div className="red-dugmad">
        <RadnjaDugme id="3.w4" nakon={l('O1', { oglas: oglasId })} poruka={false} pregled={l('O1', { oglas: oglasId })}>
          Pogledaj oglas
        </RadnjaDugme>
        <Veza ekran="X1" parametri={{ oglas: oglasId }} className="dugme dugme-plavo">
          Ponudi razmenu
        </Veza>
        <button type="button" className="dugme dugme-tekst" onClick={() => demo.obavesti(PORUKE.simulacija)}>
          Ne zanima me
        </button>
      </div>
      {lanac && (
        <div className="kartica kartica-mirna stog" data-moguc-lanac>
          <h2>Moguć lanac razmene</h2>
          <p>Tvoja lista želja se spaja sa listama još dve osobe. Svako dobija ono što traži.</p>
          <Veza ekran="X13" className="dugme dugme-zeleno self-start">
            Vidi predlog lanca
          </Veza>
        </div>
      )}
    </section>
  )
}
