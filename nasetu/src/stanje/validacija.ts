// Provera sačuvanog stanja pre upotrebe: ne samo verzija, nego i obavezna polja.
// Pokvaren ili ručno izmenjen zapis tako ne može da sruši aplikaciju (učitava se početni scenario).
import { jeVazecaPozicija } from '../prica/pozicija'
import { VERZIJA_STANJA } from './tipovi'

const NIZOVI = ['briefovi', 'izbori', 'glasovi', 'opcije', 'zahtevi', 'predracuni', 'izvidjanja', 'prijaveLokacija', 'nalozi', 'beleske', 'dnevnik']
const ULOGE = ['produkcija', 'vlasnik', 'partner', 'admin']
const VRSTE_PREDRACUNA = ['naknada', 'izbor-van-kataloga', 'fotografisanje']

/** Osnovni oblik termina: nizovi tekstova. */
const ispravanTermin = (t: unknown): boolean =>
  jeObjekat(t) && Array.isArray(t.snimanje) && Array.isArray(t.priprema) &&
  [...(t.snimanje as unknown[]), ...(t.priprema as unknown[])].every((d) => typeof d === 'string')

const jeObjekat = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** blokiraniDani: objekat čije su vrednosti nizovi ISO datuma ("2026-11-17"). */
function ispravniBlokirani(v: unknown): boolean {
  return jeObjekat(v) && Object.values(v).every(
    (niz) => Array.isArray(niz) && niz.every((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))
}

/**
 * Stanje priče (dorada 3): ispravna pozicija (račva „otkaz" samo na koraku 9, odrađeno ne više od broja radnji koraka),
 * a u vođenom režimu nema Admina ni odstupanja (tamo je svet uvek izgrađen iz pozicije).
 */
function ispravnaPrica(p: unknown, uloga: unknown): boolean {
  if (!jeObjekat(p)) return false
  if (p.rezim !== 'vodjeno' && p.rezim !== 'slobodno') return false
  if (typeof p.odstupljeno !== 'boolean' || typeof p.vidjenUvodSlobodno !== 'boolean') return false
  if (!jeVazecaPozicija(p)) return false
  if (p.rezim === 'vodjeno' && (uloga === 'admin' || p.odstupljeno)) return false
  return true
}

export function jeIspravnoStanje(s: unknown): boolean {
  if (!jeObjekat(s)) return false
  const o = s
  return (
    o.verzija === VERZIJA_STANJA &&
    typeof o.sati === 'number' && Number.isFinite(o.sati) &&
    typeof o.brojac === 'number' && Number.isFinite(o.brojac) &&
    typeof o.demoSakriven === 'boolean' &&
    ispravnaPrica(o.prica, o.uloga) &&
    ULOGE.includes(o.uloga as string) &&
    (o.prikazVlasnika === 'pravno' || o.prikazVlasnika === 'fizicko') &&
    NIZOVI.every((k) => Array.isArray(o[k])) &&
    ispravniBlokirani(o.blokiraniDani) &&
    (o.predracuni as unknown[]).every(
      (p) => jeObjekat(p) && VRSTE_PREDRACUNA.includes(p.vrsta as string) && typeof p.ukupnoPara === 'number' && Number.isFinite(p.ukupnoPara)) &&
    (o.zahtevi as unknown[]).every((z) => jeObjekat(z) && typeof z.kurs === 'number' && (z.opcijaId === null || typeof z.opcijaId === 'string') && ispravanTermin(z.termin)) &&
    (o.opcije as unknown[]).every((x) => jeObjekat(x) && typeof x.id === 'string' && typeof x.postavljena === 'number' && ispravanTermin(x.termin))
  )
}
