// T1 Pokretanje, T8 Stranica kanala, T9 Gledanje, T10 Reklamna pauza, T12 Nije dostupno u ovoj zemlji (talas 1).
// Dugmad koja su radnje priče nose data-radnja i idu kroz useAkcija; ostalo je običan izbor.
import { Coffee, Luggage, Play } from '../../okvir/Ikone'
import { useAkcija } from '../../okvir/akcija'
import { useDemo } from '../../okvir/stanje'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { TvGrupa, TvStrana } from '../../komponente/tv/TvStrana'
import { Znacka } from '../../komponente/tv/Znacka'
import { ZnakTerraVista } from '../../komponente/tv/ZnakTerraVista'
import { cenaMesecno } from '../../podaci/format'
import { CENA_ZAVISI_OD_ZEMLJE, NEDOSTUPNO, SA_PDV } from '../../podaci/stalni-tekstovi'
import {
  KANAL_BESPLATNI_FILM,
  KANAL_GLAVNI,
  MATICNA_ZEMLJA,
  cenaPaketa,
  paket,
  REKLAME,
  ZEMLJE,
  cenaKanala,
  dostupan,
  emisijeKanala,
  emisijaSada,
  gradijentZa,
  kanal,
  reklama,
  slikaProgramaZa,
  zemlja,
} from '../../podaci/svet'
import { vreme } from '../../podaci/format'
import { sastavi, type Parametri } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'

type Svojstva = { parametri: Parametri }

export function T1Pokretanje() {
  const akcija = useAkcija()
  const { idi } = useTvRuta()
  return (
    <TvStrana id="T1" pun>
      <div className="pokretanje">
        <ZnakTerraVista klasa="tv-znak tv-znak--velik" />
        <div className="pokretanje-linija" />
        <p className="meta">Televizija bez ugovora</p>
        <TvFokus id="pocni" etiketa="Počni" className="tv-dugme tv-dugme--glavno" data-radnja="pocni" onAktiviraj={() => akcija('pocni', () => idi(sastavi('T2'), { koren: true }))}>
          Počni
        </TvFokus>
      </div>
    </TvStrana>
  )
}

/** Pretplaćen kanal: sam kanal (po izboru) ili kanal u pretplaćenom paketu (priča + slobodni sloj). */
function useJePretplacen(kanalId: string): boolean {
  const d = useDemo()
  return d.jePretplacenKanal(kanalId, kanal(kanalId).paket)
}

function useDemoPretplate() {
  const d = useDemo()
  return { zemljaKod: d.zemlja }
}

export function T8Kanal({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const { idi } = useTvRuta()
  const { zemljaKod } = useDemoPretplate()
  const k = kanal(parametri.id)
  const pretplacen = useJePretplacen(k.id)
  const nedostupan = !dostupan(k, zemljaKod)
  const cena = cenaKanala(k)
  const radi = ZEMLJE.filter((z) => dostupan(k, z.kod)).map((z) => z.naziv)
  const nije = ZEMLJE.filter((z) => !dostupan(k, z.kod)).map((z) => z.naziv)
  const danas = emisijeKanala(k.id)

  return (
    <TvStrana id="T8" trenutni="T5">
      <TvGrupa klasa="kanal-strana">
        <div className="kanal-leva">
          <PlocicaLogotipa kanalId={k.id} velicina="kartica" />
          <h1 className="tv-naslov-ekrana">{k.naziv}</h1>
          <span className="meta">
            {k.zemljaPorekla} · {k.zanr}
          </span>
          {nedostupan ? (
            <Znacka vrsta="nije">Nije dostupno</Znacka>
          ) : pretplacen ? (
            <Znacka vrsta="pretplacen">Pretplaćen</Znacka>
          ) : k.deo === 'besplatni' ? (
            <Znacka vrsta="besplatno">Besplatno uz reklame</Znacka>
          ) : cena !== null ? (
            <Znacka vrsta="cena">{cenaMesecno(cena)} · otkaz bilo kad</Znacka>
          ) : (
            <Znacka vrsta="cena">
              {paket(k.paket!).naziv} — {cenaMesecno(cenaPaketa(paket(k.paket!)))}
            </Znacka>
          )}
        </div>
        <div className="kanal-sredina">
          <p>{k.opis}</p>
          <p className="meta">Radi u: {radi.join(', ')} (primer)</p>
          {nije.length > 0 && <p className="meta">Nije dostupno u: {nije.join(', ')} (primer)</p>}
          <div className="kanal-dugmad">
            {nedostupan ? (
              <TvFokus id="kanal-glavno" etiketa="Šta znači „nije dostupno“?" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T12', { id: k.id }))}>
                Šta znači „nije dostupno“?
              </TvFokus>
            ) : cena === null && !pretplacen ? (
              <TvFokus id="kanal-glavno" etiketa={`Pogledaj ${paket(k.paket!).naziv}`} className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T16', { id: k.paket! }))}>
                Pogledaj {paket(k.paket!).naziv}
              </TvFokus>
            ) : k.deo === 'besplatni' || pretplacen ? (
              <TvFokus id="kanal-glavno" etiketa="Gledaj" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T9', { id: k.id }))}>
                <Play className="ic" aria-hidden="true" />
                Gledaj
              </TvFokus>
            ) : (
              <TvFokus
                id="kanal-glavno"
                etiketa="Pretplati se"
                className="tv-dugme tv-dugme--glavno"
                data-radnja={k.id === KANAL_GLAVNI.id ? 'pretplati' : undefined}
                onAktiviraj={() => {
                  const dalje = () => idi(sastavi('T13', { proizvod: k.id }))
                  if (k.id === KANAL_GLAVNI.id) akcija('pretplati', dalje)
                  else dalje()
                }}
              >
                Pretplati se — {cenaMesecno(cena ?? 0)}
              </TvFokus>
            )}
          </div>
          {((cena !== null && k.deo === 'po-izboru') || (k.deo === 'paket' && !pretplacen)) && (
            <p className="tv-napomena">
              {CENA_ZAVISI_OD_ZEMLJE} {SA_PDV}
            </p>
          )}
        </div>
        <div className="kanal-desna">
          <h3 className="tv-naslov-reda">Danas na kanalu</h3>
          <ul className="kanal-lista">
            {danas.map((e) => (
              <li key={e.id}>
                <span className="vodic-naziv">{e.naziv}</span>
                <span className="vodic-vreme">
                  {vreme(e.pocetak)} – {vreme(e.kraj)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T9Gledanje({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const { idi } = useTvRuta()
  const d = useDemo()
  const k = kanal(parametri.id)
  const e = emisijaSada(k.id)
  const slika = slikaProgramaZa(e.id)
  // ekran se ne crta za kanal koji nije dostupan / nije pretplaćen: ruter ga preusmerava (ekrani/index.tsx, preusmeri)
  if (!dostupan(k, d.zemlja) || (k.deo !== 'besplatni' && !d.jePretplacenKanal(k.id, k.paket))) return null
  const sledece = emisijeKanala(k.id).find((x) => x.pocetak >= e.kraj)
  return (
    <TvStrana id="T9" pun>
      <div className={`plejer gradijent-${gradijentZa(e.id)}`}>
        {slika && <img className="plejer-slika" src={slika.adresa} alt={slika.alt} draggable={false} />}
        <div className="plejer-logo">
          <PlocicaLogotipa kanalId={k.id} velicina="mala" />
        </div>
        <div className="plejer-traka">
          <div className="plejer-info">
            <Znacka vrsta="u-toku">U toku</Znacka>
            <span className="plejer-naziv">{e.naziv}</span>
            {sledece && (
              <span className="meta">
                Sledeće: {sledece.naziv} · {vreme(sledece.pocetak)}
              </span>
            )}
          </div>
          <div className="plejer-dugmad">
            <TvFokus id="plejer-od-pocetka" etiketa="Od početka" onemogucen={!k.gledanjeUnazad} className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T11', { id: k.id }))}>
              Od početka
            </TvFokus>
            <TvFokus id="plejer-info" etiketa="Info" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T4', { id: e.id }))}>
              Info
            </TvFokus>
            {k.deo === 'besplatni' && (
              <TvFokus
                id="plejer-pokazi-reklamu"
                etiketa="Pokaži reklamnu pauzu"
                className="tv-dugme tv-dugme--sporedno"
                data-radnja={k.id === KANAL_BESPLATNI_FILM.id ? 'pokazi-reklamu' : undefined}
                onAktiviraj={() => {
                  const dalje = () => idi(sastavi('T10', { id: REKLAME[0].id }))
                  if (k.id === KANAL_BESPLATNI_FILM.id) akcija('pokazi-reklamu', dalje)
                  else dalje()
                }}
              >
                Pokaži reklamnu pauzu
              </TvFokus>
            )}
          </div>
          {!k.gledanjeUnazad && <span className="meta">„Od početka“ nije dostupno za ovu emisiju (primer).</span>}
        </div>
        <p className="plejer-kredit">{slika ? `Slika programa: primer, autor ${slika.autor} · licenca ${slika.licenca} (isečeno i smanjeno)` : 'Slika programa: primer'}</p>
      </div>
    </TvStrana>
  )
}

export function T10Reklama({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const { idi, nazad } = useTvRuta()
  const r = reklama(parametri.id)
  const Ikona = r.ikonica === 'coffee' ? Coffee : Luggage
  const redni = REKLAME.findIndex((x) => x.id === r.id) + 1
  return (
    <TvStrana id="T10" pun>
      <div className={`reklama gradijent-${r.ton}`}>
        <Ikona className="reklama-ikona" aria-hidden="true" strokeWidth={1.5} />
        <div className="reklama-tekst">
          <h2>{r.proizvod}</h2>
          <p>{r.slogan}</p>
        </div>
        <div className="reklama-oznaka">
          <Znacka vrsta="reklama">Reklama</Znacka>
          <span className="meta">
            Reklama {redni} od {REKLAME.length}
          </span>
        </div>
        <div className="reklama-dugmad">
          <TvFokus
            id="reklama-nastavi"
            etiketa="Nastavi program"
            className="tv-dugme tv-dugme--glavno"
            data-radnja="nastavi-program"
            onAktiviraj={() => akcija('nastavi-program', nazad)}
          >
            Nastavi program
          </TvFokus>
          <TvFokus id="reklama-zasto" etiketa="Zašto vidim ovu reklamu?" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T31'))}>
            Zašto vidim ovu reklamu?
          </TvFokus>
        </div>
      </div>
    </TvStrana>
  )
}

export function T12Nedostupno({ parametri }: Svojstva) {
  const { idi } = useTvRuta()
  const { zemljaKod } = useDemoPretplate()
  const k = kanal(parametri.id)
  const zemljaNedostupnosti = k.nedostupanU[0] ?? zemljaKod
  return (
    <TvStrana id="T12" trenutni="T5">
      <TvGrupa klasa="nedostupno">
        <div className="nedostupno-logo">
          <PlocicaLogotipa kanalId={k.id} velicina="kartica" />
        </div>
        <h1 className="tv-naslov-ekrana">Ovaj kanal nije dostupan u {zemlja(zemljaNedostupnosti).lokativ} (primer)</h1>
        <p>{NEDOSTUPNO}</p>
        <p className="meta">Ostali tvoji kanali rade. Kad se vratiš u {zemlja(MATICNA_ZEMLJA).akuzativ}, kanal ponovo radi.</p>
        <div className="kanal-dugmad">
          <TvFokus id="nedostupno-nazad" etiketa="Nazad na kanale koji rade" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T5'))}>
            Nazad na kanale koji rade
          </TvFokus>
          <TvFokus id="nedostupno-pomoc" etiketa="Pomoć" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T29'))}>
            Pomoć
          </TvFokus>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}
