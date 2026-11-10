// KARTICE televizora (UI 6): kanal, emisija, paket. Svaka je pravi izborni element (TvFokus); imena, cene i brojke dolaze iz podaci/.
import { Check } from '../../okvir/Ikone'
import { TvFokus } from '../../tv-navigacija/fokus'
import { SADA, cenaKanala, cenaPaketa, dostupan, gradijentZa, kanal, logotipSlika, paket, type Emisija, type KodZemlje } from '../../podaci/svet'
import { cenaMesecno, vreme } from '../../podaci/format'
import { PlocicaLogotipa } from './PlocicaLogotipa'
import { Znacka } from './Znacka'

type Mesto = { fokusId: string; red?: string; indeks?: number; onAktiviraj?: () => void; /** Radnja priče koju ova kartica izvršava (za proveru u e2e). */ radnja?: string }

/** Kartica kanala: pločica, „zemlja · žanr“ i značka (Besplatno, cena, Pretplaćen, Nije dostupno). */
export function KarticaKanala({
  kanalId,
  pretplacen = false,
  zemlja,
  fokusId,
  red,
  indeks,
  onAktiviraj,
  radnja,
}: Mesto & { kanalId: string; pretplacen?: boolean; zemlja?: KodZemlje }) {
  const k = kanal(kanalId)
  const slika = logotipSlika(k)
  const cena = cenaKanala(k)
  const nijeDostupan = zemlja !== undefined && !dostupan(k, zemlja)
  return (
    <TvFokus id={fokusId} red={red} indeks={indeks} etiketa={k.naziv} onAktiviraj={onAktiviraj} data-radnja={radnja} className="kartica-kanala">
      <PlocicaLogotipa kanalId={kanalId} velicina="kartica" />
      <span className="kartica-kanala-info">
        {slika && !slika.nazivIspod && <span className="kartica-naziv">{k.naziv}</span>}
        <span className="meta">
          {k.zemljaPorekla} · {k.zanr}
        </span>
        {nijeDostupan ? (
          <Znacka vrsta="nije">Nije dostupno</Znacka>
        ) : pretplacen ? (
          <Znacka vrsta="pretplacen">
            <Check className="ic" aria-hidden="true" />
            Pretplaćen
          </Znacka>
        ) : k.deo === 'besplatni' ? (
          <Znacka vrsta="besplatno">Besplatno</Znacka>
        ) : cena !== null ? (
          <Znacka vrsta="cena">{cenaMesecno(cena)}</Znacka>
        ) : (
          <Znacka vrsta="cena">{paket(k.paket!).naziv}</Znacka>
        )}
      </span>
    </TvFokus>
  )
}

/** Kartica emisije: slika (gradijent, bez licence i rizika), „U toku“, traka napretka i naziv. */
export function KarticaEmisije({ emisija, napredak, nedostupno, napomena, fokusId, red, indeks, onAktiviraj, radnja }: Mesto & { emisija: Emisija; napredak?: number; nedostupno?: boolean; napomena?: string }) {
  const k = kanal(emisija.kanalId)
  return (
    <TvFokus id={fokusId} red={red} indeks={indeks} etiketa={emisija.naziv} onAktiviraj={onAktiviraj} data-radnja={radnja} className="kartica-emisije">
      <span className={`kartica-emisije-slika gradijent-${gradijentZa(emisija.id)}`}>
        {emisija.pocetak <= SADA && SADA < emisija.kraj && <Znacka vrsta="u-toku">U toku</Znacka>}
        {napredak !== undefined && (
          <span className="kartica-emisije-trake">
            <i style={{ width: `${napredak}%` }} />
          </span>
        )}
      </span>
      <span className="kartica-emisije-info">
        <span className="kartica-emisije-naziv">
          {emisija.naziv}
        </span>
        <span className="meta">
          {vreme(emisija.pocetak)} – {vreme(emisija.kraj)} · {k.naziv}
        </span>
        {nedostupno && <span className="meta">{napomena ?? 'Nije dostupno (primer)'}</span>}
      </span>
    </TvFokus>
  )
}

/** Kartica paketa: naziv, dve male pločice kanala i cena. */
export function KarticaPaketa({ paketId, pretplacen = false, fokusId, red, indeks, onAktiviraj, radnja }: Mesto & { paketId: string; pretplacen?: boolean }) {
  const p = paket(paketId)
  return (
    <TvFokus id={fokusId} red={red} indeks={indeks} etiketa={p.naziv} onAktiviraj={onAktiviraj} data-radnja={radnja} className="kartica-paketa">
      <span className="kartica-paketa-naziv">{p.naziv}</span>
      <span className="kartica-paketa-plocice">
        {p.kanali.map((k) => (
          <PlocicaLogotipa key={k.id} kanalId={k.id} velicina="mala" />
        ))}
      </span>
      <span className="kartica-paketa-cena">
        {cenaMesecno(cenaPaketa(p))}
        {pretplacen && (
          <>
            {' '}
            <Znacka vrsta="pretplacen">
              <Check className="ic" aria-hidden="true" />
              Pretplaćen
            </Znacka>
          </>
        )}
      </span>
    </TvFokus>
  )
}
