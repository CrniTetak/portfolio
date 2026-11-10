// SLOBODNI SLOJ (PLAN B4.4, UX 3.1): ono što gledalac radi VAN priče — pretplate i otkazi koje sam napravi, podešavanja
// (titlovi, roditeljska zaštita, obaveštenja) i ručno izabrana zemlja. Čiste funkcije; stanje drži DemoProvider.
//  - Važeće pretplate = pretplate iz priče za trenutnu poziciju + operacije slobodnog sloja.
//  - Operacije nad stavkama PRIČE (kanal i paket iz priče) i ručna zemlja brišu se pri svakoj navigaciji priče (Dalje, Nazad, skok,
//    „Pokaži mi“, „Nazad na priču“), da priča uvek izgleda kako kartica kaže. Ostale operacije i podešavanja ostaju do Restarta.
import type { KodZemlje } from '../podaci/zemlje'

export type TipOperacije = 'pretplati' | 'otkazi'
export type Operacija = { tip: TipOperacije; proizvod: string }
export type VelicinaTitlova = 'mali' | 'srednji' | 'veliki'
export type Uzrast = '6+' | '12+' | '16+' | '18+'

export type SlobodniSloj = {
  operacije: readonly Operacija[]
  titlovi: boolean
  velicinaTitlova: VelicinaTitlova
  roditeljska: boolean
  uzrast: Uzrast
  obavestenja: boolean
  personalizovane: boolean
  /** Ručno izabrana zemlja (T25 u slobodnom razgledanju); null = zemlja iz priče. */
  zemlja: KodZemlje | null
}

export const POCETNI_SLOJ: SlobodniSloj = {
  operacije: [],
  titlovi: true,
  velicinaTitlova: 'srednji',
  roditeljska: false,
  uzrast: '12+',
  obavestenja: true,
  personalizovane: false,
  zemlja: null,
}

export type Pretplate = { kanali: readonly string[]; paketi: readonly string[] }

/** Dodaje operaciju; ponovljena operacija nad istim proizvodom zamenjuje prethodnu (nema duplikata). */
export function dodajOperaciju(sloj: SlobodniSloj, op: Operacija): SlobodniSloj {
  return { ...sloj, operacije: [...sloj.operacije.filter((o) => !(o.proizvod === op.proizvod && o.tip === op.tip)), op] }
}

/**
 * Važeće pretplate: osnova iz priče (id kanala i id paketa), pa operacije redom. `jePaket` odlučuje u koji se spisak upisuje id.
 */
export function vazecePretplate(osnova: Pretplate, sloj: SlobodniSloj, jePaket: (id: string) => boolean): Pretplate {
  const kanali = new Set(osnova.kanali)
  const paketi = new Set(osnova.paketi)
  for (const op of sloj.operacije) {
    const skup = jePaket(op.proizvod) ? paketi : kanali
    if (op.tip === 'pretplati') skup.add(op.proizvod)
    else skup.delete(op.proizvod)
  }
  return { kanali: [...kanali], paketi: [...paketi] }
}

/** Pri navigaciji priče: brišu se operacije nad stavkama PRIČE i ručna zemlja; ostalo ostaje. */
export function ocistiStavkePrice(sloj: SlobodniSloj, stavkePrice: readonly string[]): SlobodniSloj {
  return { ...sloj, operacije: sloj.operacije.filter((o) => !stavkePrice.includes(o.proizvod)), zemlja: null }
}
