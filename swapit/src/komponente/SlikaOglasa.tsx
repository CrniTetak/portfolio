// Slika oglasa: fotografija vezana za id oglasa ako postoji (podaci/slikeOglasa.ts), inače ilustracija (usluge i ideje uvek ilustracija).
import { IKONICA_PO_OGLASU, slikaOglasa } from '../podaci/slikeOglasa'
import type { Oglas } from '../scenario/svet'
import { KATEGORIJA_PO_ID } from '../scenario/svet'
import { Ilustracija } from './Ilustracija'
import { Slika } from './Slika'

export function SlikaOglasa({ oglas, namena = 'kartica', prva = false, velicine, ikonaVelicina }: { oglas: Oglas; ikonaVelicina?: number; namena?: 'kartica' | 'detalj'; prva?: boolean; velicine?: string }) {
  const id = oglas.vrsta === 'roba' ? slikaOglasa(oglas.id) : null
  if (id) return <Slika id={id} namena={namena} prva={prva} velicine={velicine} />
  return <Ilustracija ikonica={IKONICA_PO_OGLASU[oglas.id] ?? KATEGORIJA_PO_ID[oglas.kat]?.ikonica ?? 'puzzle'} velicina={ikonaVelicina ?? (namena === 'detalj' ? 96 : 56)} />
}
