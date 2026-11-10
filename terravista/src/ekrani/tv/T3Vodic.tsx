// T3 TV vodič — PROBNI ekran faze 0 (mreža sa poljima različite širine): provera „ostaje isto vreme“ pri kretanju gore-dole.
// Mreža je u koracima od 15 minuta (19:00–23:00); polje emisije se proteže koliko traje, reklamna pauza je označena.
import { useState } from 'react'
import { GornjaTraka } from '../../komponente/tv/GornjaTraka'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { Znacka } from '../../komponente/tv/Znacka'
import { sastavi } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'
import { vreme } from '../../podaci/format'
import { useDemo } from '../../okvir/stanje'
import { LEPLJIVA_KOLONA } from '../../okvir/mere'
import { KANALI, dostupan, KORAK_MREZE as KORAK, KRAJ_MREZE, POCETAK_MREZE, REKLAME, SADA, rasporedKanala, type Kanal } from '../../podaci/svet'

type Filter = 'svi' | 'moji' | 'besplatni'
const FILTERI: { id: Filter; naziv: string }[] = [
  { id: 'svi', naziv: 'Svi kanali' },
  { id: 'moji', naziv: 'Moji kanali' },
  { id: 'besplatni', naziv: 'Besplatni' },
]

/** „Moji kanali“ = besplatni + pretplaćeni (pretplata na kanal ili na njegov paket po poziciji priče); „Besplatni“ = samo besplatni. */
function izaFiltera(f: Filter, pretplacen: (k: Kanal) => boolean): readonly Kanal[] {
  if (f === 'svi') return KANALI
  if (f === 'besplatni') return KANALI.filter((k) => k.deo === 'besplatni')
  return KANALI.filter((k) => k.deo === 'besplatni' || pretplacen(k))
}

const kolona = (minuti: number) => Math.round((minuti - POCETAK_MREZE) / KORAK) + 2

export function T3Vodic() {
  const { idi } = useTvRuta()
  const [filter, setFilter] = useState<Filter>('svi')
  const d = useDemo()
  const kanali = izaFiltera(filter, (k) => d.jePretplacenKanal(k.id, k.paket))
  const sati: number[] = []
  for (let t = POCETAK_MREZE; t < KRAJ_MREZE; t += 2 * KORAK) sati.push(t)

  return (
    <div className="tv-ekran" data-ekran="T3">
      <GornjaTraka trenutni="T3" />
      <div className="tv-sadrzaj" data-tv-skrol="y">
        <section className="tv-grupa" data-tv-grupa>
          <div className="tv-trake-filtera">
            {FILTERI.map((f, i) => (
              <TvFokus
                key={f.id}
                id={`vodic-filter-${f.id}`}
                red="filteri"
                indeks={i}
                etiketa={f.naziv}
                className={`tv-prekidac ${filter === f.id ? 'tv-prekidac--izabran' : ''}`}
                aria-pressed={filter === f.id}
                onAktiviraj={() => setFilter(f.id)}
              >
                {f.naziv}
              </TvFokus>
            ))}
          </div>
          <div className="vodic-okno" data-tv-skrol="x" data-tv-levo={LEPLJIVA_KOLONA}>
            <div className="vodic">
              <span />
              {sati.map((t) => (
                <span key={t} className="vodic-sat" style={{ gridColumn: `${kolona(t)} / span 2` }}>
                  {vreme(t)}
                </span>
              ))}
              {kanali.map((k, r) => (
                <VodicRed key={k.id} kanal={k} red={r + 2} prvi={r === 0} nedostupan={!dostupan(k, d.zemlja)} onEmisija={(id) => idi(sastavi('T4', { id }))} onReklama={() => idi(sastavi('T10', { id: REKLAME[0].id }))} />
              ))}
            </div>
          </div>
          <p className="tv-napomena">
            <Znacka vrsta="reklama">Reklama</Znacka> = svaka reklama je označena
          </p>
        </section>
      </div>
    </div>
  )
}

function VodicRed({ kanal, red, prvi, nedostupan, onEmisija, onReklama }: { kanal: Kanal; red: number; prvi: boolean; nedostupan: boolean; onEmisija: (id: string) => void; onReklama: () => void }) {
  return (
    <>
      <div className={`vodic-kanal ${nedostupan ? 'vodic-kanal--nedostupan' : ''}`} style={{ gridColumn: 1, gridRow: red }}>
        <PlocicaLogotipa kanalId={kanal.id} velicina="vodic" />
        {nedostupan && <span className="vodic-nedostupno-oznaka">Nije dostupno</span>}
      </div>
      {rasporedKanala(kanal.id).map((slot) => {
        if (slot.tip === 'reklama') {
          return (
            <TvFokus
              key={`${kanal.id}-reklama`}
              id={`vodic-${kanal.id}-reklama`}
              etiketa={`${kanal.naziv}: reklama`}
              className="vodic-polje vodic-polje--reklama"
              style={{ gridColumn: `${kolona(slot.pocetak)} / span ${(slot.kraj - slot.pocetak) / KORAK}`, gridRow: red }}
              onAktiviraj={onReklama}
            >
              <Znacka vrsta="reklama">Reklama</Znacka>
            </TvFokus>
          )
        }
        const e = slot.emisija
        const sada = e.pocetak <= SADA && SADA < e.kraj
        return (
          <TvFokus
            key={e.id}
            id={prvi && sada ? 'vodic-sada' : `vodic-${e.id}`}
            etiketa={`${kanal.naziv}: ${e.naziv}`}
            className={`vodic-polje ${sada ? 'vodic-polje--sada' : ''} ${nedostupan ? 'vodic-polje--nedostupno' : ''}`}
            style={{ gridColumn: `${kolona(e.pocetak)} / span ${Math.round((e.kraj - e.pocetak) / KORAK)}`, gridRow: red }}
            onAktiviraj={() => onEmisija(e.id)}
          >
            <span className="vodic-naziv">{e.naziv}</span>
            <span className="vodic-vreme">
              {vreme(e.pocetak)} – {vreme(e.kraj)} · {e.uzrast}
            </span>
            {nedostupan && <span className="vodic-vreme">Nije dostupno (primer)</span>}
          </TvFokus>
        )
      })}
    </>
  )
}
