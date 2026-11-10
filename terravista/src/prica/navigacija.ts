// NAVIGACIJA PRIČE (PLAN B4.3, UX 3.3): čiste funkcije nad pozicijom (korak, p). Dalje, Nazad, skok, „Pokaži mi“ i radnje
// samo računaju ciljnu poziciju; ekrani se čitaju iz matrice. Test dokazuje da Dalje/Nazad/skok daju isto što i ručno klikanje radnji.
import { KANAL_GLAVNI, PAKET_PRICE, type Grana } from '../podaci/svet'
import { BROJ_KORAKA_PRICE, definicija, duzina, type RadnjaId } from './matrica'

export type Pozicija = { korak: number; p: number }
export const POCETAK: Pozicija = { korak: 1, p: 0 }

/** Dalje: početno → završno tog koraka; završno → početno sledećeg. Na koraku 9 nema dalje (null). */
export function dalje(poz: Pozicija, grana: Grana): Pozicija | null {
  const kraj = duzina(poz.korak, grana)
  if (poz.p < kraj) return { korak: poz.korak, p: kraj }
  if (poz.korak >= BROJ_KORAKA_PRICE) return null
  return { korak: poz.korak + 1, p: 0 }
}

/** Nazad: ako je korak odmakao od početnog → početno stanje tog koraka; ako je početno → početno prethodnog. Na (1, 0) nema nazad. */
export function nazad(poz: Pozicija): Pozicija | null {
  if (poz.p > 0) return { korak: poz.korak, p: 0 }
  if (poz.korak <= 1) return null
  return { korak: poz.korak - 1, p: 0 }
}

/** Skok na korak i „Pokaži mi“ vode na POČETNO stanje koraka. */
export function skok(korak: number): Pozicija {
  return { korak: Math.max(1, Math.min(BROJ_KORAKA_PRICE, korak)), p: 0 }
}

/** Sledeća radnja koju priča očekuje na poziciji (ili undefined ako je korak završen). */
export function sledecaRadnja(poz: Pozicija, grana: Grana): RadnjaId | undefined {
  return definicija(poz.korak, grana).radnje[poz.p]
}

export type Ishod =
  /** Radnja je ona koju priča očekuje (ili prva radnja sledećeg koraka kad je trenutni završen): pozicija se pomera. */
  | { tip: 'primenjena'; poz: Pozicija }
  /** Radnja pripada budućem koraku: „U priči ovo dolazi u koraku N.“ */
  | { tip: 'ceka'; korak: number }
  /** Radnja nije deo priče na ovoj poziciji (već je prošla ili je običan izbor): dugme radi kao u slobodnom klikanju. */
  | { tip: 'nije' }

/** Reducer za dugmad koja su radnje priče (PLAN B4.6.6). */
export function primeniRadnju(poz: Pozicija, radnja: RadnjaId, grana: Grana): Ishod {
  const d = definicija(poz.korak, grana)
  if (d.radnje[poz.p] === radnja) return { tip: 'primenjena', poz: { korak: poz.korak, p: poz.p + 1 } }
  // već odrađena u ovom koraku (npr. ponovno štikliranje „Razumem“): običan izbor, bez poruke o budućem koraku
  const mesto = d.radnje.indexOf(radnja)
  if (mesto >= 0 && mesto < poz.p) return { tip: 'nije' }
  // korak 7 radi u bilo kom redosledu: otkaz ugovora i potvrda otkaza se prihvataju i pre „U redu“ (taj pod-korak se preskače)
  if (poz.korak === 7 && poz.p === 1 && radnja === 'otkazi-ugovore') return { tip: 'primenjena', poz: { korak: 7, p: 3 } }
  if (poz.korak === 7 && (poz.p === 1 || poz.p === 2) && radnja === 'jetzt-kundigen') return { tip: 'primenjena', poz: { korak: 7, p: 4 } }
  // prva radnja sledećeg koraka, a trenutni je završen
  if (poz.p === d.radnje.length && poz.korak < BROJ_KORAKA_PRICE) {
    const sledeci = definicija(poz.korak + 1, grana)
    if (sledeci.radnje[0] === radnja) return { tip: 'primenjena', poz: { korak: poz.korak + 1, p: 1 } }
  }
  // radnja iz budućnosti: u istom koraku ili u kasnijem
  if (d.radnje.slice(poz.p + 1).includes(radnja)) return { tip: 'ceka', korak: poz.korak }
  for (let k = poz.korak + 1; k <= BROJ_KORAKA_PRICE; k++) if (definicija(k, grana).radnje.includes(radnja)) return { tip: 'ceka', korak: k }
  return { tip: 'nije' }
}

/**
 * Radnje koje se vezuju za PROIZVOD priče: u koraku 4 to je kanal po izboru, u koraku 5 paket, u koraku 7 kanal (otkaz kanala) ili paket (otkaz ugovora).
 * Za bilo koji drugi proizvod ide slobodni put (prava pretplata/otkaz u slobodnom sloju), a priča se ne pomera.
 */
const VEZANE_ZA_PROIZVOD: readonly RadnjaId[] = ['pretplati', 'skeniraj', 'nastavi-kao-ana', 'razumem', 'na-placanje', 'plati', 'vrati-na-tv']
export function vaziZaProizvod(korak: number, radnja: RadnjaId, proizvod: string): boolean {
  if (VEZANE_ZA_PROIZVOD.includes(radnja)) return proizvod === (korak === 5 ? PAKET_PRICE.id : KANAL_GLAVNI.id)
  if (radnja === 'otkazi-kanal') return proizvod === KANAL_GLAVNI.id
  if (radnja === 'pretplati-paket' || radnja === 'otvori-paket-price' || radnja === 'jetzt-kundigen' || radnja === 'otkazi-ugovore') return proizvod === PAKET_PRICE.id
  return true
}

/** Poređenje pozicija (da li je a pre b). */
export const pre = (a: Pozicija, b: Pozicija): boolean => a.korak < b.korak || (a.korak === b.korak && a.p < b.p)

/** Da li je radnja `id` u koraku `korak` već odrađena na poziciji. */
export function odradjena(poz: Pozicija, korak: number, id: RadnjaId, grana: Grana): boolean {
  const i = definicija(korak, grana).radnje.indexOf(id)
  if (i < 0) return false
  return poz.korak > korak || (poz.korak === korak && poz.p > i)
}

/** Pretplate koje priča postavlja za poziciju: Doma TV od „plati“ u koraku 4 do otkaza u koraku 7; „Paket Srbija“ od „plati“ u koraku 5 do „jetzt kündigen“. */
export function pretplatePozicije(poz: Pozicija, grana: Grana): { kanal: boolean; paket: boolean } {
  const kanalOd = odradjena(poz, 4, 'plati', grana)
  const kanalDo = odradjena(poz, 7, 'otkazi-kanal', grana)
  const paketOd = odradjena(poz, 5, 'plati', grana)
  const paketDo = odradjena(poz, 7, 'jetzt-kundigen', grana)
  return { kanal: kanalOd && !kanalDo, paket: paketOd && !paketDo }
}

/** Kvačica „Razumem“ na P3: štikliraju je „Dalje“ i skok (pouka SWAPIT B5.11 — nije unapred štiklirana na POČETKU). */
export function razumemStiklirano(poz: Pozicija, grana: Grana): boolean {
  if (poz.korak !== 4 && poz.korak !== 5) return false
  return odradjena(poz, poz.korak, 'razumem', grana)
}

/** Zemlja po poziciji: 1–5 Nemačka, 6 (posle izbora) Grčka ili Srbija, 7–9 Nemačka. */
export function zemljaPozicije(poz: Pozicija, grana: Grana): 'DE' | 'GR' | 'RS' {
  // 6/0: porodica tek bira zemlju, pa je još u Nemačkoj; posle izbora važi grana
  if (poz.korak !== 6 || poz.p === 0) return 'DE'
  return grana === 'grcka' ? 'GR' : 'RS'
}
