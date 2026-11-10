// T2 Početni ekran — PROBNI ekran faze 0 (red, tapeta, gornja traka): na njemu se proverava da se navigacija „oseća“ kao televizor.
// Pravila (PLAN B4.6.1): OK na kartici BESPLATNOG kanala odmah pušta kanal (T9); ostalo vodi na stranicu kanala (T8).
// Pun ekran sa „Nastavi gledanje“ po koracima priče dolazi u talasu 1.
import { Play } from '../../okvir/Ikone'
import { GornjaTraka } from '../../komponente/tv/GornjaTraka'
import { KarticaEmisije, KarticaKanala, KarticaPaketa } from '../../komponente/tv/Kartice'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { Red } from '../../komponente/tv/Red'
import { Znacka } from '../../komponente/tv/Znacka'
import { sastavi } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'
import { useAkcija } from '../../okvir/akcija'
import { useDemo } from '../../okvir/stanje'
import { CENA_ZAVISI_OD_ZEMLJE, SA_PDV } from '../../podaci/stalni-tekstovi'
import { KANALI, KANAL_BESPLATNI_FILM, PAKETI, emisijaSada, kanal } from '../../podaci/svet'

export function T2Pocetna() {
  const { idi } = useTvRuta()
  const akcija = useAkcija()
  const d = useDemo()
  const { korak } = d
  const film = emisijaSada(KANAL_BESPLATNI_FILM.id)
  const besplatni = KANALI.filter((k) => k.deo === 'besplatni')
  const poIzboru = KANALI.filter((k) => k.deo === 'po-izboru')
  const nastavi = besplatni.slice(0, 2).map((k) => emisijaSada(k.id))
  const otvori = (id: string, deo: string) => {
    // kanal koji u izabranoj zemlji nije dostupan vodi na stranicu kanala (T8), a ne na gledanje
    const dostupan = !kanal(id).nedostupanU.includes(d.zemlja)
    const dalje = () => idi(sastavi(deo === 'besplatni' && dostupan ? 'T9' : 'T8', { id }))
    if (id === KANAL_BESPLATNI_FILM.id) akcija('gledaj-besplatni-film', dalje)
    else dalje()
  }

  return (
    <div className="tv-ekran" data-ekran="T2">
      <GornjaTraka trenutni="T2" />
      <div className="tv-sadrzaj" data-tv-skrol="y">
        <section className="tv-grupa" data-tv-grupa>
          <div className="tapeta">
            <div className="tapeta-tekst">
              <Znacka vrsta="u-toku">U toku</Znacka>
              <h2>{film.naziv}</h2>
              <p>Besplatno uz reklame · Slika programa: primer</p>
              <TvFokus id="tapeta-gledaj" etiketa="Gledaj" className="tv-dugme tv-dugme--glavno" data-radnja="gledaj-besplatni-film" onAktiviraj={() => otvori(KANAL_BESPLATNI_FILM.id, 'besplatni')}>
                <Play className="ic" aria-hidden="true" />
                Gledaj
              </TvFokus>
            </div>
            <PlocicaLogotipa kanalId={KANAL_BESPLATNI_FILM.id} velicina="kartica" />
          </div>
        </section>

        {korak >= 2 && (
        <Red naslov="Nastavi gledanje">
          {nastavi.map((e, i) => (
            <KarticaEmisije
              key={e.id}
              emisija={e}
              napredak={30 + i * 25}
              fokusId={`nastavi-${e.id}`}
              red="nastavi"
              indeks={i}
              onAktiviraj={() => idi(sastavi('T4', { id: e.id }))}
            />
          ))}
        </Red>
        )}

        <Red naslov="Besplatni kanali" napomena="uz reklame">
          {besplatni.map((k, i) => (
            <KarticaKanala key={k.id} kanalId={k.id} fokusId={`besplatni-${k.id}`} zemlja={d.zemlja} pretplacen={d.jePretplacenKanal(k.id, k.paket)} red="besplatni" indeks={i} radnja={k.id === KANAL_BESPLATNI_FILM.id ? 'gledaj-besplatni-film' : undefined} onAktiviraj={() => otvori(k.id, k.deo)} />
          ))}
        </Red>

        <Red naslov="Kanali po izboru" napomena="otkaz bilo kad">
          {poIzboru.map((k, i) => (
            <KarticaKanala key={k.id} kanalId={k.id} fokusId={`poizboru-${k.id}`} zemlja={d.zemlja} pretplacen={d.jePretplacenKanal(k.id, k.paket)} red="poizboru" indeks={i} onAktiviraj={() => otvori(k.id, k.deo)} />
          ))}
          <p className="tv-napomena tv-napomena--u-redu">
            {CENA_ZAVISI_OD_ZEMLJE} {SA_PDV}
          </p>
        </Red>

        <Red naslov="Paketi" napomena="za dijasporu">
          {PAKETI.map((p, i) => (
            <KarticaPaketa key={p.id} paketId={p.id} pretplacen={d.pretplate.paketi.includes(p.id)} fokusId={`paket-${p.id}`} red="paketi" indeks={i} onAktiviraj={() => idi(sastavi('T16', { id: p.id }))} />
          ))}
        </Red>
      </div>
    </div>
  )
}
