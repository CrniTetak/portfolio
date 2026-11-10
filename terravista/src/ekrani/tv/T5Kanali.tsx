// T5 Kanali — pregled — PROBNI ekran faze 0 (mreža kartica sa prelomom): provera kretanja u mreži (nema kruženja, nema „bega“ u traku).
import { useState } from 'react'
import { GornjaTraka } from '../../komponente/tv/GornjaTraka'
import { KarticaKanala } from '../../komponente/tv/Kartice'
import { sastavi } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'
import { KANALI, KANAL_GLAVNI } from '../../podaci/svet'
import { useAkcija } from '../../okvir/akcija'
import { useDemo } from '../../okvir/stanje'

type Prikaz = 'besplatni' | 'po-izboru' | 'svi'
const PREKIDACI: { id: Prikaz; naziv: string }[] = [
  { id: 'besplatni', naziv: 'Besplatni' },
  { id: 'po-izboru', naziv: 'Po izboru' },
  { id: 'svi', naziv: 'Svi' },
]

export function T5Kanali() {
  const { idi } = useTvRuta()
  const akcija = useAkcija()
  const d = useDemo()
  const { korak } = d
  const [prikaz, setPrikaz] = useState<Prikaz>(korak === 3 ? 'po-izboru' : 'besplatni')
  const kanali = prikaz === 'svi' ? KANALI : KANALI.filter((k) => k.deo === prikaz)
  const broj = (p: Prikaz) => (p === 'svi' ? KANALI.length : KANALI.filter((k) => k.deo === p).length)

  return (
    <div className="tv-ekran" data-ekran="T5">
      <GornjaTraka trenutni="T5" />
      <div className="tv-sadrzaj" data-tv-skrol="y">
        <section className="tv-grupa" data-tv-grupa>
          <h1 className="tv-naslov-ekrana">Kanali</h1>
          <div className="tv-trake-filtera">
            {PREKIDACI.map((p, i) => (
              <TvFokus
                key={p.id}
                id={`kanali-prekidac-${p.id === 'po-izboru' ? 'poizboru' : p.id}`}
                red="prekidaci"
                indeks={i}
                etiketa={p.naziv}
                aria-pressed={prikaz === p.id}
                className={`tv-prekidac ${prikaz === p.id ? 'tv-prekidac--izabran' : ''}`}
                onAktiviraj={() => setPrikaz(p.id)}
              >
                {p.naziv} ({broj(p.id)})
              </TvFokus>
            ))}
          </div>
          <div className="tv-mreza">
            {kanali.map((k) => (
              <KarticaKanala
                key={k.id}
                kanalId={k.id}
                zemlja={d.zemlja}
                pretplacen={d.jePretplacenKanal(k.id, k.paket)}
                fokusId={`kanali-${k.id}`}
                radnja={k.id === KANAL_GLAVNI.id ? 'otvori-kanal-price' : undefined}
                onAktiviraj={() => {
                  const dalje = () => idi(sastavi('T8', { id: k.id }))
                  if (k.id === KANAL_GLAVNI.id) akcija('otvori-kanal-price', dalje)
                  else dalje()
                }}
              />
            ))}
          </div>
          <div className="tv-trake-filtera">
            <TvFokus id="kanali-po-zanru" red="po" indeks={0} etiketa="Po žanru" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T6'))}>
              Po žanru
            </TvFokus>
            <TvFokus id="kanali-po-zemlji" red="po" indeks={1} etiketa="Po zemlji" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T7'))}>
              Po zemlji
            </TvFokus>
          </div>
        </section>
      </div>
    </div>
  )
}
