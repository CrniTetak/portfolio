// ČISTA LOGIKA STANJA DEMOA (PK12): izvođenje radnje, skok/Dalje/Nazad, ulaz u demo i provera da li postoji napredak.
// DemoProvider samo poziva ove funkcije; zato se mogu probati testom bez pregledača (demo/logika.test.ts).
import { KUCA } from '../pravila/rute'
import { ekranZaPoziciju } from '../pravila/matrica'
import { odigraj } from '../prica/navigacija'
import { brojRadnji } from '../prica/koraci'
import { POCETNA_POZICIJA, izvedi } from '../prica/reducer'
import { saglasnostiPosle, saglasnostiZa } from '../prica/saglasnosti'
import type { EkranId, Poz, Rezim, Ugao } from '../prica/tipovi'
import { POCETNI_TOKOVI, imaTokova } from '../tokovi/tokovi'
import { posleRestarta, type Sacuvano } from './cuvanje'

/**
 * Radnja sa ekrana (dugme na ekranu priče). Vraća novo stanje ili null kad radnja nije na redu / nije za taj ugao.
 * Automatske radnje koje se pri tom odigraju štikliraju svoje kvačice (PK1): Marko 7.c2 → Ana D2 ima štikliranu kvačicu.
 */
export function poIzvedi(x: Sacuvano, id: string, ugao: Ugao): Sacuvano | null {
  const nova = izvedi(x.poz, id, ugao)
  if (nova === x.poz) return null
  return { ...x, poz: nova, saglasnosti: { ...x.saglasnosti, ...Object.fromEntries(saglasnostiZa(nova).map((k) => [k, true])) } }
}

/** Dalje / Nazad / skok / Glavni tok: pozicija se odigra iznova, a kvačice priče se računaju iznova iz nje (PK2). */
export function poPostavi(x: Sacuvano, cilj: Poz): Sacuvano {
  const poz = odigraj(cilj)
  return { ...x, poz, saglasnosti: saglasnostiPosle(x.saglasnosti, poz) }
}

/** Da li postoji napredak koji bi ulazak u demo ili Restart obrisao (PK11). */
export const imaNapredak = (x: Sacuvano): boolean =>
  x.poz.korak !== POCETNA_POZICIJA.korak ||
  x.poz.n !== POCETNA_POZICIJA.n ||
  x.poz.grana !== POCETNA_POZICIJA.grana ||
  Object.keys(x.saglasnosti).length > 0 ||
  imaTokova(x.tokovi)

/**
 * U2 „Uđi u demo“: isto čišćenje kao Restart (priča, kvačice, tokovi), pa režim. Vođena kreće od 1/početno, a slobodno od
 * 1/završno (Ana Verifikovan, 20 poena) sa kvačicama koje taj položaj podrazumeva.
 */
export function poUlazu(x: Sacuvano, ugao: Ugao, rezim: Rezim): { stanje: Sacuvano; ekran: EkranId } {
  const poz: Poz = rezim === 'slobodno' ? { korak: 1, n: brojRadnji(1, 'lanac'), grana: 'lanac' } : POCETNA_POZICIJA
  const cisto = posleRestarta({ ...x, rezim })
  return {
    stanje: { ...cisto, poz, tokovi: POCETNI_TOKOVI, saglasnosti: Object.fromEntries(saglasnostiZa(poz).map((k) => [k, true])) },
    ekran: rezim === 'slobodno' ? KUCA[ugao] : ekranZaPoziciju(poz, ugao),
  }
}
