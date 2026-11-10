// W6 „Omiljeno“ (UX 6.7): tabovi Oglasi · Korisnici · Pretrage. Zvezdica na kartici dodaje oglas, „Prati“ na profilu dodaje korisnika, a „Sačuvaj pretragu“
// na rezultatima dodaje pretragu. Sve je u tokovima (nestaje sa „Restart demo“).
import { useState } from 'react'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { Veza } from '../../komponente/Veza'
import { broj } from '../../scenario/format'
import { nadjiOglas, type Oglas } from '../../scenario/svet'
import { prebaciPratim } from '../../tokovi/operacije'

type Tab = 'oglasi' | 'korisnici' | 'pretrage'

export function W6() {
  const { s, tokovi, ja, promeni } = useStanjePrice()
  const [tab, setTab] = useState<Tab>('oglasi')
  const oglasi = tokovi.omiljeno.map((id) => nadjiOglas(s, id, tokovi)).filter((o): o is Oglas => !!o)
  const korisnici = tokovi.pratim.filter((p) => p.k === ja)
  const pretrage = tokovi.pretrage.filter((p) => p.k === ja)
  const TABOVI: { id: Tab; naziv: string; n: number }[] = [
    { id: 'oglasi', naziv: 'Oglasi', n: oglasi.length },
    { id: 'korisnici', naziv: 'Korisnici', n: korisnici.length },
    { id: 'pretrage', naziv: 'Pretrage', n: pretrage.length },
  ]
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W6">
      <h1>Omiljeno</h1>
      <div className="tabovi" role="group" aria-label="Omiljeno">
        {TABOVI.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
            {t.naziv} ({broj(t.n)})
          </button>
        ))}
      </div>
      <div role="group" aria-label="Sadržaj izabranog prikaza" className="stog-sm" data-tab-panel={tab}>
        {tab === 'oglasi' &&
          (oglasi.length === 0 ? (
            <p className="prazno-stanje" data-prazno="oglasi">
              Nema omiljenih oglasa. Zvezdica na kartici oglasa ga dodaje ovde.
            </p>
          ) : (
            <div className="mreza-kartica" data-omiljeni-oglasi>
              {oglasi.map((o) => (
                <KarticaOglasa key={o.id} oglas={o} />
              ))}
            </div>
          ))}
        {tab === 'korisnici' &&
          (korisnici.length === 0 ? (
            <p className="prazno-stanje" data-prazno="korisnici">
              Ne pratiš nijednog korisnika. Dugme „Prati“ na profilu ga dodaje ovde.
            </p>
          ) : (
            <ul className="stog-sm" data-pracen>
              {korisnici.map((p) => (
                <li key={p.id} className="stavka">
                  <div className="stavka-glavna">
                    <KorisnikRed id={p.id} />
                  </div>
                  <div className="stavka-akcije">
                    <Veza ekran="N1" parametri={{ korisnik: p.id }} className="dugme dugme-linija">
                      Profil
                    </Veza>
                    <button type="button" className="dugme dugme-tekst" onClick={() => ja && promeni((t) => prebaciPratim(t, ja, p.id))}>
                      Prestani da pratiš
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        {tab === 'pretrage' &&
          (pretrage.length === 0 ? (
            <p className="prazno-stanje" data-prazno="pretrage">
              Nema sačuvanih pretraga. „Sačuvaj pretragu u listu želja“ na rezultatima ih dodaje ovde.
            </p>
          ) : (
            <ul className="stog-sm" data-pretrage>
              {pretrage.map((p) => {
                const q = Object.fromEntries(new URLSearchParams(p.q).entries())
                return (
                  <li key={p.q} className="stavka">
                    <div className="stavka-glavna">
                      <b>{q.q ?? 'Pretraga sa filterima'}</b>
                    </div>
                    <div className="stavka-akcije">
                      <Veza ekran="P5" upit={q} className="dugme dugme-plavo">
                        Otvori
                      </Veza>
                    </div>
                  </li>
                )
              })}
            </ul>
          ))}
      </div>
    </section>
  )
}
