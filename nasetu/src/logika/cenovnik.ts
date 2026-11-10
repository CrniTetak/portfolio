// Spoj cenovnika lokacije i pravila o novcu: ukupna cena lokacije (osnovica) za jedan termin.
import { cenaDana, type Lokacija } from '../podaci/lokacije'
import { izracunajOsnovicu, type Razred } from './novac'
import type { Termin } from './tipovi'

/**
 * Osnovica za termin na lokaciji, ili null ako lokacija ne prima toliku ekipu
 * ili termin nema nijedan snimajući dan.
 */
export function osnovicaZaTermin(l: Lokacija, termin: Termin, razred: Razred, prekovremeniSati = 0): number | null {
  const cena = cenaDana(l, razred)
  if (cena === null || termin.snimanje.length < 1) return null
  return izracunajOsnovicu({
    cenaDanaCenti: cena,
    snimajuciDani: termin.snimanje.length,
    daniPripreme: termin.priprema.length,
    cenaPripremeCenti: l.cenaPripremeCenti,
    prekovremeniSati,
    cenaPrekovremenogSataCenti: l.prekovremeniSatCenti,
  })
}
