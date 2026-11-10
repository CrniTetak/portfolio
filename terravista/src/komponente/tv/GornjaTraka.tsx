// GORNJA TRAKA televizora (UX 5.0): znak, navigacija (Početna · TV vodič · Kanali · Paketi · Pretraga · Moje · Podešavanja), zemlja i profil.
// Navigacija je jedan red (red="nav"): levo-desno ide po indeksu, a pomera se vodoravno kad ne stane (usko platno).
import { User } from '../../okvir/Ikone'
import { useDemo } from '../../okvir/stanje'
import { sastavi } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'
import { PREZIME_PORODICE, zemlja } from '../../podaci/svet'
import { ZnakTerraVista } from './ZnakTerraVista'

const STAVKE = [
  { ekran: 'T2', naziv: 'Početna' },
  { ekran: 'T3', naziv: 'TV vodič' },
  { ekran: 'T5', naziv: 'Kanali' },
  { ekran: 'T15', naziv: 'Paketi' },
  { ekran: 'T17', naziv: 'Pretraga' },
  { ekran: 'T19', naziv: 'Moje' },
  { ekran: 'T21', naziv: 'Podešavanja' },
] as const

export function GornjaTraka({ trenutni }: { trenutni: string }) {
  const { idi } = useTvRuta()
  const d = useDemo()
  const zemljaNaziv = zemlja(d.zemlja).naziv
  return (
    <header className="tv-gornja">
      <ZnakTerraVista />
      <nav className="tv-nav-okno" data-tv-skrol="x" aria-label="Glavna navigacija">
        <div className="tv-nav">
          {STAVKE.map((s, i) => (
            <TvFokus
              key={s.ekran}
              id={`nav-${s.ekran}`}
              red="nav"
              indeks={i}
              etiketa={s.naziv}
              aria-current={s.ekran === trenutni ? 'page' : undefined}
              className={`tv-nav-stavka ${s.ekran === trenutni ? 'tv-nav-stavka--trenutna' : ''}`}
              onAktiviraj={() => idi(sastavi(s.ekran), { koren: true })}
            >
              {s.naziv}
            </TvFokus>
          ))}
        </div>
      </nav>
      <div className="tv-profil">
        <span>
          {PREZIME_PORODICE} · {zemljaNaziv}
        </span>
        <span className="tv-avatar">
          <User className="ic" aria-hidden="true" />
        </span>
      </div>
    </header>
  )
}
