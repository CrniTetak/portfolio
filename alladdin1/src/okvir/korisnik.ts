// Podaci "ulogovanog" korisnika po ulozi (unapred popunjena polja prate ulogu: organizator → Daniel Ferreira, putnik/gost → Marko Petrović, savetnik → Dušica Pavlović).
import { LJUDI } from '../scenario/strane'
import type { Uloga } from '../prica/tipovi'

export type Korisnik = { ime: string; email: string; telefon: string }

export function podaciUloge(u: Uloga): Korisnik {
  if (u === 'organizer') return LJUDI.organizator
  if (u === 'advisor') return LJUDI.savetnik
  return LJUDI.putnik
}
