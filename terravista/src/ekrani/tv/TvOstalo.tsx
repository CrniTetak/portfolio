// Preostali TV ekrani (talas 2): T4 Emisija, T6 Žanr, T7 Zemlja, T11 Gledanje unazad, T17 Pretraga, T18 Rezultati, T21–T24 Podešavanja,
// T28 Uređaji i nalog, T29 Pomoć, T30 Pomoć — odgovor, T31 Zašto vidim ovu reklamu. Imena, brojke i cene dolaze iz podaci/.
import { useState } from 'react'
import { Lock, Play } from '../../okvir/Ikone'
import { useDemo } from '../../okvir/stanje'
import { useToast } from '../../okvir/Toast'
import { KarticaEmisije, KarticaKanala } from '../../komponente/tv/Kartice'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { Red } from '../../komponente/tv/Red'
import { TvGrupa, TvStrana } from '../../komponente/tv/TvStrana'
import { Znacka } from '../../komponente/tv/Znacka'
import { cenaMesecno, vreme } from '../../podaci/format'
import { CENA_ZAVISI_OD_ZEMLJE, JEZIK_PORUKA } from '../../podaci/stalni-tekstovi'
import {
  KANAL_GLAVNI,
  KANALI,
  dostupan,
  PAKETI,
  UPITI,
  UREDJAJI,
  ZEMLJE_POREKLA,
  emisija,
  emisijeKanala,
  emisijeZaUpit,
  gradijentZa,
  kanal,
  kanaliZaUpit,
  lik,
  opisEmisije,
  paketZaZemljuPorekla,
  PREZIME_PORODICE,
  SPISAK_ZANROVA,
  zemlja,
  cenaPaketa,
} from '../../podaci/svet'
import { POMOC, pitanje } from '../../tekstovi/pomoc'
import type { Uzrast, VelicinaTitlova } from '../../slobodno/slobodno'
import { sastavi, type Parametri } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'

type Svojstva = { parametri: Parametri }

const DUGME = 'tv-dugme tv-dugme--sporedno'

export function T4Emisija({ parametri }: Svojstva) {
  const d = useDemo()
  const { idi, nazad } = useTvRuta()
  const e = emisija(parametri.id)
  const k = kanal(e.kanalId)
  const nedostupan = !dostupan(k, d.zemlja)
  const mozeDaGleda = !nedostupan && (k.deo === 'besplatni' || d.jePretplacenKanal(k.id, k.paket))
  const pretplata = () => idi(k.deo === 'paket' ? sastavi('T16', { id: k.paket! }) : sastavi('T13', { proizvod: k.id }))
  return (
    <TvStrana id="T4" trenutni="T3">
      <TvGrupa klasa="emisija-panel">
        <div className={`emisija-slika gradijent-${gradijentZa(e.id)}`} role="img" aria-label="Slika programa: primer" />
        <div className="emisija-tekst">
          <h2>{e.naziv}</h2>
          <PlocicaLogotipa kanalId={k.id} velicina="mala" />
          <span className="meta">
            {k.naziv} · {vreme(e.pocetak)} – {vreme(e.kraj)} · {e.uzrast}
          </span>
          <p>{opisEmisije(e)}</p>
          <div className="kanal-dugmad">
            {nedostupan ? (
              <TvFokus id="emisija-glavno" etiketa="Šta znači „nije dostupno“?" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T12', { id: k.id }))}>
                Šta znači „nije dostupno“?
              </TvFokus>
            ) : mozeDaGleda ? (
              <TvFokus id="emisija-glavno" etiketa="Gledaj" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T9', { id: k.id }))}>
                <Play className="ic" aria-hidden="true" />
                Gledaj
              </TvFokus>
            ) : (
              <TvFokus id="emisija-glavno" etiketa="Pretplati se" className="tv-dugme tv-dugme--glavno" onAktiviraj={pretplata}>
                Pretplati se
              </TvFokus>
            )}
            <TvFokus id="emisija-unazad" etiketa="Od početka" onemogucen={!e.unazad || !mozeDaGleda} className={DUGME} onAktiviraj={() => idi(sastavi('T11', { id: k.id }))}>
              Od početka
            </TvFokus>
            <TvFokus id="emisija-kanal" etiketa="Stranica kanala" className={DUGME} onAktiviraj={() => idi(sastavi('T8', { id: k.id }))}>
              Stranica kanala
            </TvFokus>
            <TvFokus id="emisija-nazad" etiketa="Nazad" className={DUGME} onAktiviraj={nazad}>
              Nazad
            </TvFokus>
          </div>
          {!e.unazad && <span className="meta">Nije dostupno za ovu emisiju (primer)</span>}
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T6Zanr() {
  const d = useDemo()
  const { idi } = useTvRuta()
  const [izabran, setIzabran] = useState<string>(SPISAK_ZANROVA[0])
  const kanali = KANALI.filter((k) => k.zanr === izabran)
  const zanrPaketi = PAKETI.filter((p) => p.vrsta === 'zanr')
  return (
    <TvStrana id="T6" trenutni="T5">
      <TvGrupa klasa="dve-kolone">
        <div className="lista">
          {SPISAK_ZANROVA.map((z, i) => (
            <TvFokus key={z} id={`zanr-${i}`} etiketa={z} className="lista-red" aria-pressed={izabran === z} onAktiviraj={() => setIzabran(z)}>
              {z}
              <span className="meta">{KANALI.filter((k) => k.zanr === z).length}</span>
            </TvFokus>
          ))}
        </div>
        <div className="tv-mreza tv-mreza--uska">
          {kanali.length === 0 && <p className="tv-napomena">Nema kanala u ovom žanru.</p>}
          {kanali.map((k) => (
            <KarticaKanala key={k.id} kanalId={k.id} zemlja={d.zemlja} pretplacen={d.jePretplacenKanal(k.id, k.paket)} fokusId={`zanr-kanal-${k.id}`} onAktiviraj={() => idi(sastavi('T8', { id: k.id }))} />
          ))}
        </div>
      </TvGrupa>
      <TvGrupa>
        <p className="tv-napomena">Plaćeni žanrovski paketi: {zanrPaketi.map((p) => p.naziv).join(' i ')} (pogledaj Pakete).</p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T7Zemlja() {
  const d = useDemo()
  const { idi } = useTvRuta()
  const [izabrana, setIzabrana] = useState<string>(ZEMLJE_POREKLA[0])
  const kanali = KANALI.filter((k) => k.zemljaPorekla === izabrana)
  const p = paketZaZemljuPorekla(izabrana)
  return (
    <TvStrana id="T7" trenutni="T5">
      <TvGrupa klasa="dve-kolone">
        <div className="lista">
          {ZEMLJE_POREKLA.map((z, i) => (
            <TvFokus key={z} id={`poreklo-${i}`} etiketa={z} className="lista-red" aria-pressed={izabrana === z} onAktiviraj={() => setIzabrana(z)}>
              {z}
            </TvFokus>
          ))}
        </div>
        <div>
          {p && (
            <div className="kanal-dugmad">
              <TvFokus id="poreklo-paket" etiketa={p.naziv} className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T16', { id: p.id }))}>
                {p.naziv} — {cenaMesecno(cenaPaketa(p))}
              </TvFokus>
              <span className="tv-napomena">{CENA_ZAVISI_OD_ZEMLJE}</span>
            </div>
          )}
          <div className="tv-mreza tv-mreza--uska">
            {kanali.map((k) => (
              <KarticaKanala key={k.id} kanalId={k.id} zemlja={d.zemlja} pretplacen={d.jePretplacenKanal(k.id, k.paket)} fokusId={`poreklo-kanal-${k.id}`} onAktiviraj={() => idi(sastavi('T8', { id: k.id }))} />
            ))}
          </div>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

const DANI = ['Danas', 'Juče', 'Prekjuče']

export function T11Unazad({ parametri }: Svojstva) {
  const d = useDemo()
  const { idi } = useTvRuta()
  const { pokazi } = useToast()
  const k = kanal(parametri.id)
  const [dan, setDan] = useState(1)
  // svaki dan ima drugačiji redosled emisija (isti skup, pomeren), da se vidi da je dan zaista promenjen
  const svi = emisijeKanala(k.id)
  const programi = [...svi.slice(dan % svi.length), ...svi.slice(0, dan % svi.length)]
  // ekran se ne crta za kanal koji nije dostupan / nije pretplaćen: ruter ga preusmerava (ekrani/index.tsx, preusmeri)
  if (!dostupan(k, d.zemlja) || (k.deo !== 'besplatni' && !d.jePretplacenKanal(k.id, k.paket))) return null
  return (
    <TvStrana id="T11" trenutni="T3">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Gledanje unazad — {k.naziv}</h1>
        <div className="tv-trake-filtera">
          {DANI.map((n, i) => (
            <TvFokus
              key={n}
              id={`unazad-dan-${i}`}
              red="dani"
              indeks={i}
              etiketa={n}
              aria-pressed={dan === i}
              className={`tv-prekidac ${dan === i ? 'tv-prekidac--izabran' : ''}`}
              onAktiviraj={() => setDan(i)}
            >
              {n}
            </TvFokus>
          ))}
        </div>
      </TvGrupa>
      <Red naslov="Emisije" napomena={DANI[dan].toLowerCase()}>
        {programi.map((e, i) => {
          const nedostupno = dan > 0 && i === programi.length - 1
          return (
            <KarticaEmisije
              key={e.id}
              emisija={e}
              nedostupno={nedostupno}
              fokusId={`unazad-emisija-${i}`}
              red="unazad"
              indeks={i}
              onAktiviraj={() => (nedostupno ? pokazi('Nije dostupno (primer)') : idi(sastavi('T9', { id: k.id })))}
            />
          )
        })}
      </Red>
      <TvGrupa>
        <p className="tv-napomena">Gledanje unazad je dostupno samo tamo gde prava to dozvoljavaju (primer).</p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T17Pretraga() {
  const { idi } = useTvRuta()
  return (
    <TvStrana id="T17" trenutni="T17">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Pretraga</h1>
        <span className="prikaz-polje-tv" aria-label="Prikaz polja pretrage (bez unosa)">
          {UPITI[0]}
        </span>
        <div className="upiti">
          {UPITI.map((u, i) => (
            <TvFokus key={u} id={`upit-${i}`} red="upiti" indeks={i} etiketa={u} className="upit-pocka" onAktiviraj={() => idi(sastavi('T18', { upit: u }))}>
              {u}
            </TvFokus>
          ))}
        </div>
        <p className="tv-napomena">Ovde se bira gotov upit; kucanje nije deo demoa.</p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T18Rezultati({ parametri }: Svojstva) {
  const d = useDemo()
  const { idi, nazad } = useTvRuta()
  const kanali = kanaliZaUpit(parametri.upit)
  const programi = emisijeZaUpit(parametri.upit)
  return (
    <TvStrana id="T18" trenutni="T17">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Rezultati za „{parametri.upit}“</h1>
        {kanali.length + programi.length === 0 && (
          <>
            <p>Nema rezultata (primer) — probaj drugi upit</p>
            <TvFokus id="rezultat-nazad" etiketa="Nazad" className={DUGME} onAktiviraj={nazad}>
              Nazad
            </TvFokus>
          </>
        )}
      </TvGrupa>
      {kanali.length > 0 && (
        <Red naslov="Kanali">
          {kanali.map((k, i) => (
            <KarticaKanala key={k.id} kanalId={k.id} zemlja={d.zemlja} pretplacen={d.jePretplacenKanal(k.id, k.paket)} fokusId={`rezultat-kanal-${k.id}`} red="rez-kanali" indeks={i} onAktiviraj={() => idi(sastavi('T8', { id: k.id }))} />
          ))}
        </Red>
      )}
      {programi.length > 0 && (
        <Red naslov="Emisije">
          {programi.map((e, i) => (
            <KarticaEmisije key={e.id} emisija={e} fokusId={`rezultat-emisija-${e.id}`} red="rez-emisije" indeks={i} onAktiviraj={() => idi(sastavi('T4', { id: e.id }))} />
          ))}
        </Red>
      )}
    </TvStrana>
  )
}

function Prekidac({ id, naziv, uklj, onPromena }: { id: string; naziv: string; uklj: boolean; onPromena: () => void }) {
  return (
    <TvFokus id={id} etiketa={`${naziv}: ${uklj ? 'uključeni' : 'isključeni'}`} className="lista-red" aria-pressed={uklj} onAktiviraj={onPromena}>
      {naziv}
      <span className="meta">{uklj ? 'uključeno' : 'isključeno'}</span>
    </TvFokus>
  )
}

export function T21Podesavanja() {
  const d = useDemo()
  const { idi } = useTvRuta()
  const red = (id: string, naziv: string, vrednost: string, cilj: string) => (
    <TvFokus key={id} id={id} etiketa={naziv} className="lista-red" onAktiviraj={() => idi(sastavi(cilj))}>
      {naziv}
      <span className="meta">{vrednost}</span>
    </TvFokus>
  )
  return (
    <TvStrana id="T21" trenutni="T21">
      <TvGrupa>
        <div className="lista">
          {red('podesavanja-jezik', 'Jezik', 'Srpski', 'T22')}
          {red('podesavanja-titlovi', 'Titlovi', d.sloj.titlovi ? 'uključeni' : 'isključeni', 'T23')}
          {red('podesavanja-roditeljska', 'Roditeljska zaštita', d.sloj.roditeljska ? `uključena · ${d.sloj.uzrast}` : 'isključena', 'T24')}
          {red('podesavanja-zemlja', 'Zemlja (demo)', zemlja(d.zemlja).naziv, 'T25')}
          {red('podesavanja-nalog', 'Uređaji i nalog', '', 'T28')}
          {red('podesavanja-pomoc', 'Pomoć', '', 'T29')}
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T22Jezik() {
  const { pokazi } = useToast()
  const jezici = ['Srpski', 'Nemački', 'Engleski']
  return (
    <TvStrana id="T22" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Jezik</h1>
        <div className="lista">
          {jezici.map((j, i) => (
            <TvFokus key={j} id={i === 0 ? 'jezik-srpski' : `jezik-${i}`} etiketa={j} className="lista-red" onAktiviraj={() => i > 0 && pokazi(JEZIK_PORUKA)}>
              {j}
              {i === 0 && <span className="meta">(izabran)</span>}
            </TvFokus>
          ))}
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

const VELICINE: VelicinaTitlova[] = ['mali', 'srednji', 'veliki']

export function T23Titlovi() {
  const d = useDemo()
  return (
    <TvStrana id="T23" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Titlovi</h1>
        <div className="lista">
          <Prekidac id="titlovi-prekidac" naziv="Titlovi" uklj={d.sloj.titlovi} onPromena={() => d.podesavanje({ titlovi: !d.sloj.titlovi })} />
        </div>
        <div className="uzrast-red" role="group" aria-label="Veličina titlova">
          {VELICINE.map((v, i) => (
            <TvFokus
              key={v}
              id={`titlovi-velicina-${v}`}
              red="velicina"
              indeks={i}
              etiketa={`Veličina: ${v}`}
              aria-pressed={d.sloj.velicinaTitlova === v}
              className={`tv-prekidac ${d.sloj.velicinaTitlova === v ? 'tv-prekidac--izabran' : ''}`}
              onAktiviraj={() => d.podesavanje({ velicinaTitlova: v })}
            >
              {v}
            </TvFokus>
          ))}
        </div>
        <div className="titlovi-pregled gradijent-3" role="img" aria-label="Pregled titlova (slika programa: primer)">
          {d.sloj.titlovi && <span className={`titl titl--${d.sloj.velicinaTitlova}`}>Primer titla za pregled</span>}
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

const UZRASTI: Uzrast[] = ['6+', '12+', '16+', '18+']

export function T24Roditeljska() {
  const d = useDemo()
  const [prvaEmisija, drugaEmisija] = emisijeKanala(KANAL_GLAVNI.id)
  // emisija iznad izabranog uzrasta traži PIN samo dok je zaštita uključena
  const zakljucana = d.sloj.roditeljska && parseInt(drugaEmisija.uzrast, 10) > parseInt(d.sloj.uzrast, 10)
  return (
    <TvStrana id="T24" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Roditeljska zaštita</h1>
        <div className="lista">
          <Prekidac id="roditeljska-prekidac" naziv="Roditeljska zaštita" uklj={d.sloj.roditeljska} onPromena={() => d.podesavanje({ roditeljska: !d.sloj.roditeljska })} />
        </div>
        <div className="uzrast-red" role="group" aria-label="Najveći uzrast">
          {UZRASTI.map((u, i) => (
            <TvFokus
              key={u}
              id={`roditeljska-uzrast-${i}`}
              red="uzrast"
              indeks={i}
              etiketa={`Uzrast ${u}`}
              aria-pressed={d.sloj.uzrast === u}
              className={`tv-prekidac ${d.sloj.uzrast === u ? 'tv-prekidac--izabran' : ''}`}
              onAktiviraj={() => d.podesavanje({ uzrast: u })}
            >
              {u}
            </TvFokus>
          ))}
        </div>
        <p className="meta">
          PIN: <span className="pin-tekst">••••</span> · Emisije iznad izabranog uzrasta traže PIN (primer)
        </p>
      </TvGrupa>
      <Red naslov="Pregled">
        <KarticaEmisije emisija={prvaEmisija} fokusId="roditeljska-pregled-0" red="pregled" indeks={0} />
        <KarticaEmisije emisija={drugaEmisija} nedostupno={zakljucana} fokusId="roditeljska-pregled-1" red="pregled" indeks={1} napomena="Traži PIN (primer)" />
      </Red>
      <TvGrupa>
        <span className="zakljucano-oznaka meta">
          <Lock className="ic" aria-hidden="true" /> {zakljucana ? 'Druga emisija traži PIN (primer)' : 'Zaštita je isključena ili uzrast dozvoljava obe emisije (primer)'}
        </span>
      </TvGrupa>
    </TvStrana>
  )
}

const ODJAVA_PORUKA = 'Demo — ostaješ prijavljen'

export function T28Nalog() {
  const { idi, nazad } = useTvRuta()
  const d = useDemo()
  const { pokazi } = useToast()
  const imaPretplatu = d.pretplate.kanali.length + d.pretplate.paketi.length > 0
  const glavni = lik('ana')
  return (
    <TvStrana id="T28" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Nalog</h1>
        <p>
          Prijavljen: {glavni.ime} {PREZIME_PORODICE} (demo)
        </p>
        <ul className="kanal-lista">
          {UREDJAJI.map((u) => (
            <li key={u.id}>{u.naziv}</li>
          ))}
        </ul>
        <p className="meta">2 od 3 uređaja (primer)</p>
        <div className="kanal-dugmad">
          {imaPretplatu ? (
            <TvFokus id="nalog-prijava" etiketa="Odjavi se (prikaz)" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => pokazi(ODJAVA_PORUKA)}>
              Odjavi se (prikaz)
            </TvFokus>
          ) : (
            <TvFokus id="nalog-prijava" etiketa="Prijavi se" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T13', { proizvod: KANAL_GLAVNI.id }))}>
              Prijavi se
            </TvFokus>
          )}
          <TvFokus id="nalog-nazad" etiketa="Nazad" className={DUGME} onAktiviraj={nazad}>
            Nazad
          </TvFokus>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T29Pomoc() {
  const { idi } = useTvRuta()
  return (
    <TvStrana id="T29" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Pomoć</h1>
        <div className="lista">
          {POMOC.map((p, i) => (
            <TvFokus key={p.id} id={`pomoc-${i}`} etiketa={p.pitanje} className="lista-red" onAktiviraj={() => idi(sastavi('T30', { pitanje: p.id }))}>
              {p.pitanje}
            </TvFokus>
          ))}
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T30Odgovor({ parametri }: Svojstva) {
  const { nazad } = useTvRuta()
  const p = pitanje(parametri.pitanje)
  return (
    <TvStrana id="T30" trenutni="T21">
      <TvGrupa klasa="potvrda">
        <h1 className="tv-naslov-ekrana">{p.pitanje}</h1>
        <p>{p.odgovor}</p>
        <TvFokus id="pomoc-nazad" etiketa="Nazad" className={DUGME} onAktiviraj={nazad}>
          Nazad
        </TvFokus>
      </TvGrupa>
    </TvStrana>
  )
}

export function T31Reklame() {
  const d = useDemo()
  const { nazad } = useTvRuta()
  return (
    <TvStrana id="T31" trenutni="T21">
      <TvGrupa klasa="potvrda">
        <h1 className="tv-naslov-ekrana">Zašto vidim ovu reklamu?</h1>
        <p>
          Besplatni kanali se plaćaju reklamama. Svaka reklama je označena rečju <Znacka vrsta="reklama">Reklama</Znacka>
        </p>
        <div className="lista">
          <Prekidac id="reklame-prekidac" naziv="Personalizovane reklame" uklj={d.sloj.personalizovane} onPromena={() => d.podesavanje({ personalizovane: !d.sloj.personalizovane })} />
        </div>
        <p className="meta">Personalizovane reklame zahtevaju tvoju saglasnost (primer).</p>
        <TvFokus id="reklame-nazad" etiketa="Nazad" className={DUGME} onAktiviraj={nazad}>
          Nazad
        </TvFokus>
      </TvGrupa>
    </TvStrana>
  )
}
