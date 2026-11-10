// „Još nije počelo“ (UX 3.1): ekran koji pripada koraku koji tek dolazi nije prazan ni zaključan, nego kaže šta će tu biti.
import { Clock } from 'lucide-react'
import { NAZIVI_KORAKA } from '../prica/koraci'

export function JosNijePocelo({ naslov, opis, korak }: { naslov: string; opis: string; korak: number }) {
  return (
    <section className="kartica ekran-uzak" data-jos-nije-poceo>
      <h1>{naslov}</h1>
      <div className="prazno-stanje mt-4 prazno-pocetak">
        <Clock size={32} strokeWidth={1.75} aria-hidden />
        <b>Još nije počelo</b>
        <p>{opis}</p>
        <p className="pomocni-tekst">
          Počinje u koraku {korak}: {NAZIVI_KORAKA[korak - 1]}.
        </p>
      </div>
    </section>
  )
}
