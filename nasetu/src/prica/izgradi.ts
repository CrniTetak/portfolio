// Gradnja „sveta" iz pozicije u priči (plan dorade 3, odeljak 5.2).
// Svet = početno stanje + prvih N radnji grane kroz POSTOJEĆI domenski reducer (isti mehanizam kao dugmad).
// Zato „Dalje", „Nazad" i skokovi uvek daju isto što i ručno klikanje i ne mogu da zaobiđu pravila.
import type { TipVlasnika } from '../logika/novac'
import { RADNJE_SCENARIJA as R, pocetnoStanje } from '../stanje/scenario'
import { reducer } from '../stanje/reducer'
import type { Akcija } from '../stanje/akcije'
import type { Stanje, Uloga } from '../stanje/tipovi'
import { putanja } from './koraci'
import { redniBroj } from './pozicija'
import type { Pozicija, Rezim } from './tipovi'

/** Postavke prikaza: ne utiču na priču i preživljavaju sve skokove. */
export interface Postavke {
  uloga: Uloga
  prikazVlasnika: TipVlasnika
  demoSakriven: boolean
  rezim: Rezim
  vidjenUvodSlobodno: boolean
}

export const postavkeIz = (s: Stanje): Postavke => ({
  uloga: s.uloga, prikazVlasnika: s.prikazVlasnika, demoSakriven: s.demoSakriven,
  rezim: s.prica.rezim, vidjenUvodSlobodno: s.prica.vidjenUvodSlobodno,
})

/** Primeni listu radnji redom; radnja koju pravila odbiju znači grešku u priči (test to hvata). */
function odigraj(radnje: ((s: Stanje) => Akcija)[]): Stanje {
  let s = pocetnoStanje()
  for (const napravi of radnje) {
    const novo = reducer(s, napravi(s))
    if (novo === s) throw new Error('Radnja priče je odbijena pravilima — priča i pravila nisu usklađeni.')
    s = novo
  }
  return s
}

function sPostavkama(s: Stanje, poz: Pozicija, p: Postavke, odstupljeno: boolean): Stanje {
  return {
    ...s,
    uloga: p.uloga, prikazVlasnika: p.prikazVlasnika, demoSakriven: p.demoSakriven,
    prica: { korak: poz.korak, odradjeno: poz.odradjeno, grana: poz.grana, rezim: p.rezim, odstupljeno, vidjenUvodSlobodno: p.vidjenUvodSlobodno },
  }
}

/** Svet za datu poziciju (bez odstupanja). */
export function izgradiSvet(poz: Pozicija, p: Postavke): Stanje {
  const radnje = putanja(poz.grana).slice(0, redniBroj(poz)).map((r) => r.napravi)
  return sPostavkama(odigraj(radnje), poz, p, false)
}

/**
 * Alat „Predračun sa uslugama" (samo slobodni režim, van priče): izbor van kataloga (50 EUR, plaćen) pa rezervacija
 * sa domaćinom: 135 − 50 + 70 = 155 EUR = 18.135,00 RSD. Svet se razlikuje od priče, pa je odstupanje uključeno.
 */
export function izgradiUsluge(p: Postavke): Stanje {
  const s = odigraj([R.briefUsluge, R.uplataIzbora, R.izbor, R.opcijaLoft, R.opcijaHala, R.osporavanje, R.zahtevDomacin, R.odobri])
  return sPostavkama(s, { korak: 7, odradjeno: 1, grana: 'vazi' }, p, true)
}
