// Kartica lokacije (UI 4.4). Nikad ne prikazuje ulicu, ni zvezdice ocena.
import { ArrowUpFromLine, Heart, MapPin, Mic, SunDim, Truck, Zap, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { eurKratko } from '../logika/novac'
import { cenaOd, NAZIV_OZNAKE, type Lokacija, type Oznaka } from '../podaci/lokacije'
import { useStanje } from '../stanje/StanjeProvider'
import { NaslovnaSlika } from './Slika'
import { Pilula } from './osnovno'

export const IKONA_OZNAKE: Record<Oznaka, LucideIcon> = {
  trofazna: Zap, zamracivanje: SunDim, kamion: Truck, lift: ArrowUpFromLine, ton: Mic,
}

interface Props {
  lokacija: Lokacija
  uIzboru: boolean
  /** može li uloga da dodaje u izbor (produkcija/partner) */
  mozeDaDodaje: boolean
  zauzet?: boolean
  prva?: boolean
  onPrebaci: () => void
}

export function KarticaLokacije({ lokacija: l, uIzboru, mozeDaDodaje, zauzet = false, prva = false, onPrebaci }: Props) {
  const { vodjeno } = useStanje()
  return (
    <article
      className="group relative"
    >
      {/* fotografija je glavni ukras: zaobljena, bez okvira; hover je podiže i daje meku senku; „U izboru" = akcent ivica */}
      <div className={`relative aspect-[4/3] overflow-hidden rounded-kartica transition group-hover:-translate-y-0.5 group-hover:shadow-hover ${uIzboru ? 'outline outline-2 -outline-offset-2 outline-akcent' : ''}`}>
        <div className={`h-full w-full ${zauzet ? 'opacity-60' : ''}`}><NaslovnaSlika lokacija={l} prva={prva} /></div>
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-[13px] font-semibold">{l.tip}{l.nova ? ' · Nova (izmišljeno)' : ''}</span>
        {zauzet && <span className="absolute bottom-3 left-3 rounded-full bg-mastilo px-2.5 py-0.5 text-[13px] font-semibold text-white">Termin zauzet</span>}
        {mozeDaDodaje && (
          <button
            type="button"
            onClick={() => !vodjeno && onPrebaci()}
            aria-pressed={uIzboru}
            aria-disabled={vodjeno ? true : undefined}
            title={vodjeno ? 'Probajte u slobodnom režimu' : undefined}
            aria-label={uIzboru ? `Ukloni iz izbora: ${l.naziv}` : `Dodaj u izbor: ${l.naziv}`}
            className="group/srce z-10 absolute right-1 top-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full shadow-pilula ${uIzboru ? 'bg-akcent text-white' : 'bg-white text-mastilo group-hover/srce:bg-akcent-s'}`}>
              <Heart size={18} fill={uIzboru ? 'currentColor' : 'none'} aria-hidden />
            </span>
          </button>
        )}
      </div>
      <div className="pt-3">
        <h3 className="text-base font-semibold md:text-[17px]">
          {/* rastegnut link: cela kartica je klikabilna, dugme srca ostaje iznad */}
          <Link to={`/lokacije/${l.id}`} className="after:absolute after:inset-0 hover:underline">{l.naziv}</Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-sek"><MapPin size={14} aria-hidden /> {l.opstina}, {l.zona}</p>
        <div className="my-2.5 flex flex-wrap gap-1.5">
          {l.stilovi.map((s) => <Pilula key={s}>{s}</Pilula>)}
          {l.oznake.slice(0, 3).map((o) => <Pilula key={o} ikona={IKONA_OZNAKE[o]}>{NAZIV_OZNAKE[o].split(' ')[0]}</Pilula>)}
        </div>
        <p className="cifre text-lg font-bold">od {eurKratko(cenaOd(l))} <span className="text-sm font-normal text-prig">/ snimajući dan</span></p>
        <p className="text-[13px] text-prig">fakturiše se u dinarima</p>
      </div>
    </article>
  )
}
