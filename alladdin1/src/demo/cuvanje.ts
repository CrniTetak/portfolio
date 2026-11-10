// Čuvanje stanja demoa: SAMO sessionStorage (nestaje kad se prozor zatvori), jedan ključ sa verzijom i proverom oblika.
// Neispravan ili star zapis se odbacuje i kreće se od početka, umesto da se aplikacija sruši (B4).
import { brojRadnji } from '../prica/koraci'
import { POCETNA_POZICIJA } from '../prica/reducer'
import { POCETNI_TOKOVI, proveriTokove, type Tokovi } from '../tokovi/tokovi'
import type { Ishod, Poz, Rezim } from '../prica/tipovi'

export const KLJUC = 'alladdin1.demo.v1'
const VERZIJA = 1

export type Sacuvano = {
  v: typeof VERZIJA
  poz: Poz
  rezim: Rezim
  potvrda18: boolean
  /** Jednokratne poruke koje su već viđene (npr. prvi slobodni režim). */
  poruke: { slobodno: boolean }
  /** Stanja slobodnih tokova (krstarenje, Monte Karlo, konsijerž, transport, članstvo, zahtevi iz S8). */
  tokovi: Tokovi
}

export const POCETNO: Sacuvano = { v: VERZIJA, poz: POCETNA_POZICIJA, rezim: 'guided', potvrda18: false, poruke: { slobodno: false }, tokovi: POCETNI_TOKOVI }

const jeObjekat = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Vraća ispravan zapis ili null (stara verzija, nedozvoljene vrednosti, ishod B/C pre koraka 7, n van opsega). */
export function proveri(x: unknown): Sacuvano | null {
  if (!jeObjekat(x) || x.v !== VERZIJA) return null
  const poz = x.poz
  if (!jeObjekat(poz)) return null
  const { korak, n, ishod } = poz as { korak: unknown; n: unknown; ishod: unknown }
  if (!Number.isInteger(korak) || (korak as number) < 1 || (korak as number) > 9) return null
  if (ishod !== 'A' && ishod !== 'B' && ishod !== 'C') return null
  if ((ishod === 'B' || ishod === 'C') && (korak as number) < 7) return null
  if (!Number.isInteger(n) || (n as number) < 0 || (n as number) > brojRadnji(korak as number, ishod as Ishod)) return null
  if (x.rezim !== 'guided' && x.rezim !== 'free') return null
  if (typeof x.potvrda18 !== 'boolean') return null
  if (!jeObjekat(x.poruke) || typeof x.poruke.slobodno !== 'boolean') return null
  // zapis bez tokova (stariji) dobija početne tokove; neispravan oblik tokova odbacuje ceo zapis
  const tokovi = x.tokovi === undefined ? POCETNI_TOKOVI : proveriTokove(x.tokovi)
  if (!tokovi) return null
  return {
    v: VERZIJA,
    poz: { korak: korak as number, n: n as number, ishod: ishod as Ishod },
    rezim: x.rezim,
    potvrda18: x.potvrda18,
    poruke: { slobodno: x.poruke.slobodno },
    tokovi,
  }
}

/**
 * "Restart demo": vraća priču na korak 1 (ishod A). Ostaje: režim, potvrda 18+ (jednom po sesiji) i viđene jednokratne poruke.
 * Brišu se i svi slobodni tokovi i zahtevi (UX 9). Uloga je u linku, pa ostaje sama.
 */
export function posleRestarta(x: Sacuvano): Sacuvano {
  return { ...x, poz: POCETNA_POZICIJA, tokovi: POCETNI_TOKOVI }
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
