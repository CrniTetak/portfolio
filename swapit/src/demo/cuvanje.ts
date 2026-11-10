// Čuvanje stanja demoa: SAMO sessionStorage (nestaje kad se prozor zatvori), jedan ključ sa verzijom i proverom oblika (PLAN B4.3).
// Neispravan ili star zapis se odbacuje i kreće se od početka, umesto da se aplikacija sruši.
// Ugao i kontekst ekrana (id oglasa, upit pretrage) NISU ovde: oni su u linku. Nema localStorage-a ni kolačića.
import { brojRadnji } from '../prica/koraci'
import { POCETNA_POZICIJA } from '../prica/reducer'
import type { Grana, Poz, Rezim, Tema } from '../prica/tipovi'
import { POCETNI_TOKOVI, proveriTokove, type Tokovi } from '../tokovi/tokovi'

export const KLJUC = 'swapit.demo.v1'
const VERZIJA = 1
const NAJVISE_SAGLASNOSTI = 60

export type Sacuvano = {
  v: typeof VERZIJA
  poz: Poz
  rezim: Rezim
  tema: Tema
  /** Jednokratne poruke koje su već viđene (npr. prvi slobodni režim). */
  poruke: { slobodno: boolean }
  /** Kvačice saglasnosti po ekranu (ključ → štiklirano). Obavezne nisu unapred štiklirane (PLAN B5.11). */
  saglasnosti: Record<string, boolean>
  /** Stanja slobodnih tokova. */
  tokovi: Tokovi
}

export const POCETNO: Sacuvano = { v: VERZIJA, poz: POCETNA_POZICIJA, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: false }, saglasnosti: {}, tokovi: POCETNI_TOKOVI }

const jeObjekat = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Vraća ispravan zapis ili null (stara verzija, nedozvoljene vrednosti, grana „poeni“ pre koraka 6, n van opsega). */
export function proveri(x: unknown): Sacuvano | null {
  if (!jeObjekat(x) || x.v !== VERZIJA) return null
  const poz = x.poz
  if (!jeObjekat(poz)) return null
  const { korak, n, grana } = poz as { korak: unknown; n: unknown; grana: unknown }
  if (!Number.isInteger(korak) || (korak as number) < 1 || (korak as number) > 9) return null
  if (grana !== 'lanac' && grana !== 'poeni') return null
  if (grana === 'poeni' && (korak as number) < 6) return null
  if (!Number.isInteger(n) || (n as number) < 0 || (n as number) > brojRadnji(korak as number, grana as Grana)) return null
  if (x.rezim !== 'vodjena' && x.rezim !== 'slobodno') return null
  if (x.tema !== 'svetla' && x.tema !== 'tamna') return null
  if (!jeObjekat(x.poruke) || typeof x.poruke.slobodno !== 'boolean') return null
  if (!jeObjekat(x.saglasnosti)) return null
  const kljucevi = Object.keys(x.saglasnosti)
  if (kljucevi.length > NAJVISE_SAGLASNOSTI || kljucevi.some((k) => k.length > 40 || typeof (x.saglasnosti as Record<string, unknown>)[k] !== 'boolean')) return null
  const tokovi = proveriTokove(x.tokovi)
  if (!tokovi) return null
  return {
    v: VERZIJA,
    poz: { korak: korak as number, n: n as number, grana: grana as Grana },
    rezim: x.rezim,
    tema: x.tema,
    poruke: { slobodno: x.poruke.slobodno },
    saglasnosti: { ...(x.saglasnosti as Record<string, boolean>) },
    tokovi,
  }
}

/**
 * „Restart demo“: korak 1, grana lanac, brišu se svi tokovi i saglasnosti.
 * Ostaju: režim, tema i viđene jednokratne poruke (ugao je u linku, pa ostaje sam). PLAN B4.4 i B5.10.
 */
export function posleRestarta(x: Sacuvano): Sacuvano {
  return { ...x, poz: POCETNA_POZICIJA, saglasnosti: {}, tokovi: POCETNI_TOKOVI }
}

type Skladiste = Pick<Storage, 'getItem' | 'setItem'>

export function ucitaj(skladiste: Skladiste | null = nadjiSkladiste()): Sacuvano {
  try {
    const sirovo = skladiste?.getItem(KLJUC)
    if (!sirovo) return POCETNO
    return proveri(JSON.parse(sirovo)) ?? POCETNO
  } catch {
    return POCETNO
  }
}

export function upisi(s: Sacuvano, skladiste: Skladiste | null = nadjiSkladiste()): void {
  try {
    skladiste?.setItem(KLJUC, JSON.stringify(s))
  } catch {
    /* privatni režim ili pun prostor: demo radi i bez čuvanja */
  }
}

function nadjiSkladiste(): Skladiste | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}
