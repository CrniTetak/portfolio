// Mala kartica stvari u ponudi (X1–X5, X8–X9): sličica (fotografija ili ilustracija), naziv i vrsta. Stvar iz oglasa koristi sliku oglasa.
import { Ilustracija } from './Ilustracija'
import { SlikaOglasa } from './SlikaOglasa'
import { oglasPoId } from '../scenario/svet'
import type { Stvar } from '../scenario/prica'

const VRSTA = { roba: 'roba', usluga: 'usluga', ideja: 'ideja' } as const

export function MalaStvar({ stvar }: { stvar: Stvar }) {
  const oglas = stvar.oglas ? oglasPoId(stvar.oglas) : undefined
  return (
    <span className="mala-stvar" data-stvar={stvar.oglas ?? stvar.naslov}>
      <span className="mala-slika">{oglas ? <SlikaOglasa oglas={oglas} ikonaVelicina={22} /> : <Ilustracija ikonica={stvar.ikonica ?? 'puzzle'} velicina={22} />}</span>
      <span>
        {stvar.naslov}
        <span className="sr-only"> ({VRSTA[stvar.vrsta]})</span>
      </span>
    </span>
  )
}
