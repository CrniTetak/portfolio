// N2 „Moj profil“, N3 „Podešavanja naloga“, N4 „Sve recenzije“ (UX 6.10). N2 je isto što i N1, uz „Uredi“ i blokove o sopstvenom nalogu (oglasi, ponude,
// recenzije, poeni, paketi aukcija, poslovni nalog). Za firmu (Prodavnica) N2 je sažetak poslovnog naloga. Recenzije: samo posle potvrđene razmene.
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { Inicijali } from '../../komponente/Inicijali'
import { Kvacica, Padajuce, Pilule, Prekidac } from '../../komponente/Kontrole'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { Znacka } from '../../komponente/Znacka'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { broj, datum, din, ocena, poeni, zvezdice } from '../../scenario/format'
import { DATUM_POCETKA } from '../../scenario/datumi'
import { CLAN_OD, CLAN_OD_PODRAZUMEVANO } from '../../scenario/prica'
import { ANA_ID, CENE, FIRMA_PO_ID, KATEGORIJA_PO_ID, KORISNIK_PO_ID, REGION_KORISNICI, ZUPCANIK_ID, recenzijeKorisnika, sveRecenzije } from '../../scenario/svet'
import { ponudeZaOglas } from '../../tokovi/operacije'
import { NemaStranice } from '../NemaStranice'

const NAJVISE_NA_PROFILU = 3

export function N2() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const { s, tokovi, ja, slobodno } = useStanjePrice()
  if (ugao === 'prodavnica') return <ProfilFirme />
  const k = ja ? s.korisnici[ja] : undefined
  if (!ja || !k) return <NemaStranice />
  const moji = s.oglasi.filter((o) => o.vlasnik === ja)
  const ponude = moji.flatMap((o) => ponudeZaOglas(tokovi, o.id, slobodno).filter((p) => p.status === 'ceka').map((p) => ({ oglas: o, p })))
  const recenzije = recenzijeKorisnika(ja, demo.poz, NAJVISE_NA_PROFILU, tokovi)
  const clanOd = ja === ANA_ID ? datum(DATUM_POCETKA) : (CLAN_OD[ja] ?? CLAN_OD_PODRAZUMEVANO)
  return (
    <div className="stog" data-ekran-sadrzaj="N2" data-korisnik={ja}>
      <section className="kartica stog">
        <div className="flex flex-wrap items-center gap-4">
          <Inicijali ime={ja} velicina={72} />
          <div className="stog-sm">
            <h1>Moj profil</h1>
            <p className="font-extrabold">{ja}</p>
            <div className="znacke">
              {k.verifikovan && <Znacka vrsta="verifikovan" />}
              <Znacka vrsta="gradjanin" />
            </div>
            <p className="pomocni-tekst">Član od: {clanOd}</p>
          </div>
        </div>
        <dl className="podaci-oglasa" data-statistika>
          <dt>Broj razmena</dt>
          <dd className="num">{broj(k.razmene)}</dd>
          <dt>Ocena</dt>
          <dd>
            {k.recenzije > 0 ? (
              <>
                <Zvezdice ocena={zvezdice(k.zbirOcena, k.recenzije)} /> <b className="num">{ocena(k.zbirOcena, k.recenzije)}</b> ({broj(k.recenzije)} recenzija)
              </>
            ) : (
              'Još nema recenzija'
            )}
          </dd>
          <dt>Poeni</dt>
          <dd className="num">
            {poeni(k.poeni)} <Znacka vrsta="model" />
          </dd>
          <dt>Paketi aukcija</dt>
          <dd className="num" data-paket-aukcija>
            {broj(tokovi.paketAukcija)}
          </dd>
        </dl>
        <div className="red-dugmad">
          <Veza ekran="N3" className="dugme dugme-plavo">
            Uredi
          </Veza>
          <Veza ekran="W1" className="dugme dugme-linija">
            Moji poeni
          </Veza>
          <Veza ekran="Z2" className="dugme dugme-linija">
            Paketi aukcija
          </Veza>
          <Veza ekran="F1" className="dugme dugme-linija">
            Poslovni nalog
          </Veza>
        </div>
      </section>
      <section className="kartica stog" aria-label="Moji oglasi">
        <div className="naslov-reda">
          <h2>Moji oglasi ({broj(moji.length)})</h2>
          <Veza ekran="O6">Svi moji oglasi</Veza>
        </div>
        {moji.length === 0 ? (
          <p>Još nemaš nijedan oglas.</p>
        ) : (
          <ul className="stog-sm">
            {moji.slice(0, NAJVISE_NA_PROFILU).map((o) => (
              <li key={o.id} className="stavka">
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: KATEGORIJA_PO_ID[o.kat]?.ikonica }} />
              </li>
            ))}
          </ul>
        )}
        <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-linija self-start">
          Novi oglas
        </Veza>
      </section>
      <section className="kartica stog" aria-label="Primljene ponude">
        <div className="naslov-reda">
          <h2>Primljene ponude ({broj(ponude.length)})</h2>
          <Veza ekran="X4" parametri={{ oglas: ponude[0]?.oglas.id ?? moji[0]?.id ?? 'markov-bicikl' }}>
            Pogledaj ponude
          </Veza>
        </div>
        {ponude.length === 0 ? (
          <p>Trenutno nema ponuda koje čekaju odgovor.</p>
        ) : (
          <ul className="stog-sm">
            {ponude.slice(0, NAJVISE_NA_PROFILU).map(({ oglas, p }) => (
              <li key={p.id} className="stavka">
                <span>
                  {p.od} nudi {p.stvari.map((st) => st.naslov).join(', ')} za {oglas.naslov}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="kartica stog" aria-label="Moje recenzije">
        <div className="naslov-reda">
          <h2>Moje recenzije</h2>
          <Veza ekran="N4" parametri={{ korisnik: ja }}>
            Sve recenzije
          </Veza>
        </div>
        <Obavestenje>Recenziju može da ostavi samo ko je obavio razmenu.</Obavestenje>
        {recenzije.length === 0 ? (
          <p>Još nema recenzija.</p>
        ) : (
          <ul>
            {recenzije.map((r, i) => (
              <li key={i} className="recenzija">
                <div className="znacke">
                  <Zvezdice ocena={r.ocena} />
                  <b>{r.autor}</b>
                  <Znacka vrsta="provereno" />
                </div>
                <p className="mt-1">{r.tekst}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** N2 za firmu (Prodavnica): sažetak poslovnog naloga. */
function ProfilFirme() {
  const { s, tokovi } = useStanjePrice()
  const f = FIRMA_PO_ID[ZUPCANIK_ID]
  const cena = s.zupcanik.plan === 'Majstor' ? CENE.pretplataMajstor : CENE.pretplataRadnja
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="N2" data-firma-profil>
      <div className="znacke">
        <Znacka vrsta="firma" />
      </div>
      <h1>Moj profil</h1>
      <p className="font-extrabold">{f.naziv}</p>
      <p className="pomocni-tekst">{f.delatnost}</p>
      <dl className="podaci-oglasa">
        <dt>Plan</dt>
        <dd>
          {s.zupcanik.plan} · <b className="num">{din(cena)}</b> mesečno, sa PDV-om <Znacka vrsta="ilustrativno" />
        </dd>
        <dt>Pretplata</dt>
        <dd>{tokovi.poslovno.otkazana ? 'Otkazana' : 'Aktivna'}</dd>
        <dt>Aktivni oglasi</dt>
        <dd className="num">{broj(s.zupcanik.oglasa)}</dd>
      </dl>
      <p className="pomocni-tekst">Firme ne drže poene i ne primaju recenzije van potvrđenih razmena.</p>
      <div className="red-dugmad">
        <Veza ekran="F5" className="dugme dugme-plavo">
          Uredi profil firme
        </Veza>
        <Veza ekran="F4" parametri={{ firma: f.id }} className="dugme dugme-linija">
          Javni profil
        </Veza>
        <Veza ekran="F8" className="dugme dugme-linija">
          Pretplata
        </Veza>
        <Veza ekran="O6" className="dugme dugme-linija">
          Moji oglasi
        </Veza>
        <Veza ekran="N3" className="dugme dugme-tekst">
          Podešavanja
        </Veza>
      </div>
    </section>
  )
}

export function N3() {
  const idi = useIdi()
  const { ugao } = useEkran()
  const { ja } = useStanjePrice()
  const [grad, setGrad] = useState('Beograd')
  const [javi, setJavi] = useState(true)
  const [porukeJavi, setPorukeJavi] = useState(true)
  const [pomocna, setPomocna] = useState(false)
  const gradjanin = ugao === 'ana' || ugao === 'marko'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="N3">
      <h1>Podešavanja naloga</h1>
      <p className="pomocni-tekst">Nalog: {ja ? (KORISNIK_PO_ID[ja]?.id ?? FIRMA_PO_ID[ja]?.naziv ?? ja) : ''}</p>
      {gradjanin && <Padajuce oznaka="Grad" vrednost={grad} onChange={setGrad} opcije={['Beograd']} grupe={[{ naziv: 'U regionu', opcije: REGION_KORISNICI.map((r) => r.grad) }]} />}
      <div className="grupa-polja">
        <span className="polje-oznaka">Obaveštenja</span>
        <Prekidac oznaka="Javi mi kad se pojavi poklapanje sa listom želja" ukljucen={javi} onChange={setJavi} />
        <Prekidac oznaka="Javi mi kad stigne poruka ili ponuda" ukljucen={porukeJavi} onChange={setPorukeJavi} />
        <Kvacica checked={pomocna} onChange={setPomocna} oznaka="Šalji mi nedeljni pregled (demo, ništa se ne šalje)" />
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Prikaz i jezik</span>
        <Veza ekran="P2" className="dugme dugme-linija self-start">
          Prikaz i jezik
        </Veza>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Privatnost</span>
        <p data-privatnost>Telefon se otkriva tek posle prihvaćene ponude.</p>
        <Veza ekran="S4" parametri={{ tekst: 'privatnost' }}>
          Politika privatnosti
        </Veza>
      </div>
      <div className="red-dugmad">
        <span className="radnja-dugme">
          <button type="button" className="dugme dugme-crveno" disabled>
            Obriši nalog
          </button>
          <span className="razlog-neaktivno">Brisanje naloga je isključeno u demou</span>
        </span>
        <button type="button" className="dugme dugme-linija" onClick={() => idi('R1')}>
          Odjavi se
        </button>
      </div>
    </section>
  )
}

type Filter = 'sve' | '5' | '4' | '3'

export function N4() {
  const { parametri } = useEkran()
  const demo = useDemo()
  const { s, tokovi } = useStanjePrice()
  const [filter, setFilter] = useState<Filter>('sve')
  const id = parametri.korisnik
  const k = s.korisnici[id]
  if (!k || !Object.hasOwn(KORISNIK_PO_ID, id)) return <NemaStranice />
  const sve = sveRecenzije(id, demo.poz, tokovi)
  const lista = filter === 'sve' ? sve : sve.filter((r) => String(r.ocena) === filter)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="N4" data-korisnik={id}>
      <h1>Sve recenzije</h1>
      <p>
        Korisnik: <Veza ekran="N1" parametri={{ korisnik: id }}>{id}</Veza> ·{' '}
        {k.recenzije > 0 ? (
          <>
            <b className="num">{ocena(k.zbirOcena, k.recenzije)}</b> ({broj(k.recenzije)} recenzija)
          </>
        ) : (
          'Još nema recenzija'
        )}
      </p>
      <Obavestenje>Recenziju može da ostavi samo ko je obavio razmenu. Proveravamo da je razmena potvrđena sa obe strane.</Obavestenje>
      <div className="grupa-polja">
        <span className="polje-oznaka">Filter po zvezdicama</span>
        <Pilule<Filter>
          oznaka="Filter po zvezdicama"
          vrednost={filter}
          onChange={setFilter}
          opcije={[
            { v: 'sve', naziv: 'Sve' },
            { v: '5', naziv: '5' },
            { v: '4', naziv: '4' },
            { v: '3', naziv: '3' },
          ]}
        />
      </div>
      <p className="pomocni-tekst" data-broj-recenzija>
        Prikazano: {broj(lista.length)} od {broj(sve.length)}
      </p>
      {lista.length === 0 ? (
        <p className="prazno-stanje">Nema recenzija za izabrani filter.</p>
      ) : (
        <ul data-recenzije>
          {lista.map((r, i) => (
            <li key={i} className="recenzija" data-recenzija>
              <div className="znacke">
                <Zvezdice ocena={r.ocena} />
                <b>{r.autor}</b>
                <Znacka vrsta="provereno" />
              </div>
              <p className="mt-1">{r.tekst}</p>
            </li>
          ))}
        </ul>
      )}
      <Veza ekran="P10" className="dugme dugme-tekst self-start">
        Kako proveravamo recenzije
      </Veza>
    </section>
  )
}
