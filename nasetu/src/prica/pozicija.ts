// Računanje nad pozicijom u priči (čisto, bez Reacta). Plan dorade 3, odeljci 2 i 5.
import { radnjeKoraka, type RadnjaPrice } from './koraci'
import { BROJ_KORAKA, KORAK_RACVE, type Grana, type Pozicija } from './tipovi'

/** Broj radnji u tekućem koraku (u tekućoj grani). */
export const brojRadnji = (p: Pozicija): number => radnjeKoraka(p.korak, p.grana).length

/** Koliko je radnji odrađeno u celoj priči (do ove pozicije). */
export function redniBroj(p: Pozicija): number {
  let n = 0
  for (let k = 1; k < p.korak; k++) n += radnjeKoraka(k, p.grana).length
  return n + p.odradjeno
}

export const jeZavrsenKorak = (p: Pozicija): boolean => p.odradjeno >= brojRadnji(p)

/** Sledeća radnja U TEKUĆEM KORAKU, ili undefined ako je korak završen. */
export const sledecaRadnja = (p: Pozicija): RadnjaPrice | undefined => radnjeKoraka(p.korak, p.grana)[p.odradjeno]

/** Račva postoji samo na koraku 9; pre toga je uvek glavna grana. */
export function normalizuj(p: Pozicija): Pozicija {
  const korak = Math.min(BROJ_KORAKA, Math.max(1, Math.floor(p.korak)))
  const grana: Grana = korak < KORAK_RACVE ? 'vazi' : p.grana
  const odradjeno = Math.min(Math.max(0, Math.floor(p.odradjeno)), radnjeKoraka(korak, grana).length)
  return { korak, odradjeno, grana }
}

export function jeVazecaPozicija(p: unknown): p is Pozicija {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  if (typeof o.korak !== 'number' || typeof o.odradjeno !== 'number') return false
  if (o.grana !== 'vazi' && o.grana !== 'otkaz') return false
  if (!Number.isInteger(o.korak) || !Number.isInteger(o.odradjeno)) return false
  if (o.korak < 1 || o.korak > BROJ_KORAKA || o.odradjeno < 0) return false
  if (o.grana === 'otkaz' && o.korak !== KORAK_RACVE) return false
  return o.odradjeno <= radnjeKoraka(o.korak, o.grana).length
}

export const jednakaPozicija = (a: Pozicija, b: Pozicija): boolean =>
  a.korak === b.korak && a.odradjeno === b.odradjeno && a.grana === b.grana

/**
 * Pozicija neposredno POSLE što je odrađeno ukupno n radnji grane.
 * Ako se n poklapa sa krajem koraka, pozicija je ZAVRŠNO stanje tog koraka (ne početak sledećeg): npr. posle 3 radnje
 * (brief, izbor, glas) pozicija je korak 4 završno, a posle 1 radnje (brief) korak 2 završno. n = 0 je korak 1 početno.
 */
export function pozicijaPosleBroja(grana: Grana, n: number): Pozicija {
  let ostalo = n
  for (let k = 1; k <= BROJ_KORAKA; k++) {
    const br = radnjeKoraka(k, grana).length
    if (ostalo <= br) return { korak: k, odradjeno: ostalo, grana: k < KORAK_RACVE ? 'vazi' : grana }
    ostalo -= br
  }
  return { korak: BROJ_KORAKA, odradjeno: radnjeKoraka(BROJ_KORAKA, grana).length, grana }
}
