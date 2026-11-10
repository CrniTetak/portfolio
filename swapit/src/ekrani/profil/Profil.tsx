// N1 „Profil drugog korisnika“ (UX 6.10): avatar, oznake, broj razmena, ocena, oglasi korisnika i 5 poslednjih recenzija.
// Recenzije koje nastaju u koraku 8 stoje na vrhu; broj i prosek dolaze iz svet(), pa se uvek slažu sa onim što se vidi.
import { Flag, MessageCircle, UserPlus } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { Inicijali } from '../../komponente/Inicijali'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { broj, datum, ocena, poeni, zvezdice } from '../../scenario/format'
import { DATUM_POCETKA } from '../../scenario/datumi'
import { CLAN_OD, CLAN_OD_PODRAZUMEVANO } from '../../scenario/prica'
import { ANA_ID, KORISNIK_PO_ID, MARKO_ID, recenzijeKorisnika } from '../../scenario/svet'
import { PORUKE } from '../../tekstovi/okvir'
import { prebaciPratim } from '../../tokovi/operacije'
import { NemaStranice } from '../NemaStranice'

export function N1() {
  const { parametri, ugao } = useEkran()
  const demo = useDemo()
  const { s, tokovi, ja, promeni } = useStanjePrice()
  const id = parametri.korisnik
  const k = s.korisnici[id]
  if (!k || !Object.hasOwn(KORISNIK_PO_ID, id)) return <NemaStranice />
  const prati = !!ja && tokovi.pratim.some((p) => p.k === ja && p.id === id)
  const oglasi = s.oglasi.filter((o) => o.vlasnik === id)
  const recenzije = recenzijeKorisnika(id, demo.poz, 5, tokovi)
  const prosek = ocena(k.zbirOcena, k.recenzije)
  const clanOd = id === ANA_ID ? datum(DATUM_POCETKA) : (CLAN_OD[id] ?? CLAN_OD_PODRAZUMEVANO)
  const citalac = ugao === 'ana' || ugao === 'marko'
  const jaSam = (ugao === 'ana' && id === ANA_ID) || (ugao === 'marko' && id === MARKO_ID)
  return (
    <div className="stog" data-ekran-sadrzaj="N1" data-korisnik={id}>
      <section className="kartica stog">
        <div className="flex flex-wrap items-center gap-4">
          <Inicijali ime={id} velicina={72} />
          <div className="stog-sm">
            <h1>{id}</h1>
            <div className="znacke">
              {k.verifikovan && <Znacka vrsta="verifikovan" />}
              <Znacka vrsta="gradjanin" />
            </div>
            <p className="pomocni-tekst">Član od: {clanOd}</p>
          </div>
        </div>
        <dl className="podaci-oglasa" data-statistika>
          <dt>Broj razmena</dt>
          <dd className="num" data-razmene>
            {broj(k.razmene)}
          </dd>
          <dt>Ocena</dt>
          <dd data-ocena>
            {k.recenzije > 0 ? (
              <>
                <Zvezdice ocena={zvezdice(k.zbirOcena, k.recenzije)} /> <b className="num">{prosek}</b> ({broj(k.recenzije)} recenzija)
              </>
            ) : (
              'Još nema recenzija'
            )}
          </dd>
          {jaSam && (
            <>
              <dt>Poeni</dt>
              <dd className="num">
                {poeni(k.poeni)} <Znacka vrsta="model" />
              </dd>
            </>
          )}
        </dl>
        {citalac && !jaSam && (
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-plavo"
              aria-pressed={prati}
              onClick={() => {
                if (ja) promeni((t) => prebaciPratim(t, ja, id))
                demo.obavesti(PORUKE.simulacija)
              }}
            >
              <UserPlus size={18} strokeWidth={1.75} aria-hidden /> {prati ? 'Pratiš' : 'Prati'}
            </button>
            <Veza ekran="C2" parametri={{ razgovor: id }} upit={{ iz: 'profil' }} className="dugme dugme-linija">
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Poruka
            </Veza>
            <Veza ekran="O5" parametri={{ oglas: oglasi[0]?.id ?? 'markov-bicikl' }} className="dugme dugme-tekst">
              <Flag size={16} strokeWidth={1.75} aria-hidden /> Prijavi
            </Veza>
          </div>
        )}
      </section>

      <section className="stog" aria-label="Oglasi korisnika">
        <h2>Oglasi korisnika ({broj(oglasi.length)})</h2>
        {oglasi.length === 0 ? (
          <p>Korisnik trenutno nema aktivnih oglasa.</p>
        ) : (
          <div className="flex flex-wrap gap-4" data-oglasi-korisnika>
            {oglasi.map((o) => (
              <KarticaOglasa key={o.id} oglas={o} />
            ))}
          </div>
        )}
      </section>

      <section className="kartica stog" aria-label="Recenzije">
        <div className="naslov-reda">
          <h2>Poslednje recenzije</h2>
          <Veza ekran="N4" parametri={{ korisnik: id }}>
            Sve recenzije
          </Veza>
        </div>
        <Obavestenje>Recenziju može da ostavi samo ko je obavio razmenu.</Obavestenje>
        {recenzije.length === 0 ? (
          <p>Još nema recenzija.</p>
        ) : (
          <ul data-recenzije>
            {recenzije.map((r, i) => (
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
      </section>
    </div>
  )
}
