// MALA STANJA SLOBODNIH TOKOVA (B4): krstarenje, Monte Karlo (pun tok samo za Royal Suite), konsijerž, transport, članstvo i ZAHTEVI iz kataloga.
// Svaki tok je niz faza koje idu samo NAPRED; "Declined" je poseban završetak koji se bira samo iz ponude (odbij()).
// Tokovi ne zavise od koraka priče i priča ih ne menja; Restart ih briše. Svaki zahtev je poseban red (ne prepisuje postojeći).
import { CLANSTVO, KATALOG } from '../scenario/ponude'

export const FAZE = {
  krstarenje: ['none', 'placeno'],
  monteKarlo: ['none', 'zatrazeno', 'ponuda', 'prihvaceno', 'potvrdjeno', 'odbijeno'],
  konsijerz: ['none', 'zatrazeno', 'ponuda', 'prihvaceno', 'placeno', 'odbijeno'],
  transport: ['none', 'zatrazeno', 'ponuda', 'prihvaceno', 'odbijeno'],
  clanstvo: ['none', 'prijavljeno'],
} as const

export type ImeToka = keyof typeof FAZE
type FazaToka<T extends ImeToka> = (typeof FAZE)[T][number]

export type Tokovi = {
  krstarenje: FazaToka<'krstarenje'>
  /** Pun tok Monte Karla (zahtev → ponuda → avans → potvrda) postoji samo za Royal Suite. */
  monteKarlo: FazaToka<'monteKarlo'>
  konsijerz: FazaToka<'konsijerz'>
  transport: FazaToka<'transport'>
  clanstvo: FazaToka<'clanstvo'>
  /** Događaj iz M8 koji popunjava M3 (ključ iz kataloga) ili null za Royal Suite. */
  mkDogadjaj: string | null
  /** Indeks izabranog savetnika konsijerža (0–2). */
  savetnik: number
  /** Usluga transporta izabrana u L2 (0–2): chauffeur, helikopter, jahta. */
  usluga: number
  /** Paket (ključ kataloga) otvoren u S8. */
  s8Kljuc: string | null
  /** Zahtevi za pakete koji nemaju pun tok (S8, događaji iz M8): redom, bez duplikata. */
  zahtevi: string[]
  /** Poslednji poslati zahtev za Monte Karlo/katalog: 'royal' ili ključ kataloga (za M4). */
  poslednji: string | null
  /** Uloga koja je poslala prvi zahtev (V5 pokazuje njeno ime). */
  podnosilac: 'organizer' | 'traveler'
}

export const POCETNI_TOKOVI: Tokovi = {
  krstarenje: 'none',
  monteKarlo: 'none',
  konsijerz: 'none',
  transport: 'none',
  clanstvo: 'none',
  mkDogadjaj: null,
  savetnik: 0,
  usluga: 0,
  s8Kljuc: null,
  zahtevi: [],
  poslednji: null,
  podnosilac: 'traveler',
}

/** Pomera tok NAPRED do date faze; unazad ili u istu fazu se ignoriše (isti objekat se vraća). "Declined" ide samo kroz odbij(). */
export function napreduj<T extends ImeToka>(t: Tokovi, tok: T, faza: FazaToka<T>): Tokovi {
  if (faza === 'odbijeno') return t
  if (t[tok] === 'odbijeno') return t
  const lista = FAZE[tok] as readonly string[]
  const sad = lista.indexOf(t[tok])
  const cilj = lista.indexOf(faza)
  if (cilj < 0 || cilj <= sad) return t
  return { ...t, [tok]: faza }
}

/** Odbijanje ponude (samo dok je ponuda na stolu). */
export function odbij(t: Tokovi, tok: 'monteKarlo' | 'konsijerz' | 'transport'): Tokovi {
  return t[tok] === 'ponuda' ? { ...t, [tok]: 'odbijeno' } : t
}

/** Zahtev za Royal Suite: pokreće pun tok (M3 → M5 → M7). */
export function posaljiRoyal(t: Tokovi): Tokovi {
  const n = napreduj(t, 'monteKarlo', 'zatrazeno')
  return { ...n, poslednji: 'royal', mkDogadjaj: null }
}

/** Zahtev za paket iz kataloga (S8, događaj iz M8): NOV red u listi; postojeći zahtevi i potvrde se ne diraju. */
export function dodajZahtev(t: Tokovi, kljuc: string): Tokovi {
  return { ...t, zahtevi: t.zahtevi.includes(kljuc) ? t.zahtevi : [...t.zahtevi, kljuc], poslednji: kljuc, mkDogadjaj: null }
}

/** Rezervisana putovanja (za B2): plaćeno krstarenje, prihvaćena ponuda Monte Karla/konsijerža, prihvaćen transport. */
export function rezervisanaPutovanja(t: Tokovi): number {
  const prihvaceno = (f: string) => f === 'prihvaceno' || f === 'potvrdjeno' || f === 'placeno'
  return (t.krstarenje === 'placeno' ? 1 : 0) + (prihvaceno(t.monteKarlo) ? 1 : 0) + (prihvaceno(t.konsijerz) ? 1 : 0) + (t.transport === 'prihvaceno' ? 1 : 0)
}

/** Nivo članstva po broju rezervisanih putovanja (praga iz scenario/ponude.ts). */
export function nivoClanstva(n: number): 'Member' | 'Select' | 'Signature' {
  return n >= CLANSTVO.signature ? 'Signature' : n >= CLANSTVO.select ? 'Select' : 'Member'
}

const jeObjekat = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Provera oblika zapisa iz sessionStorage-a; null = neispravno. */
export function proveriTokove(x: unknown): Tokovi | null {
  if (!jeObjekat(x)) return null
  for (const tok of Object.keys(FAZE) as ImeToka[]) if (!(FAZE[tok] as readonly unknown[]).includes(x[tok])) return null
  const kljucevi = new Set(KATALOG.map((p) => p.kljuc))
  const tekstIliNull = (v: unknown) => v === null || typeof v === 'string'
  if (!Array.isArray(x.zahtevi) || !x.zahtevi.every((z) => typeof z === 'string' && kljucevi.has(z))) return null
  if (new Set(x.zahtevi).size !== x.zahtevi.length) return null
  if (!tekstIliNull(x.mkDogadjaj) || !tekstIliNull(x.s8Kljuc) || !tekstIliNull(x.poslednji)) return null
  if (!Number.isInteger(x.savetnik) || (x.savetnik as number) < 0 || (x.savetnik as number) > 2) return null
  if (!Number.isInteger(x.usluga) || (x.usluga as number) < 0 || (x.usluga as number) > 2) return null
  if (x.podnosilac !== undefined && x.podnosilac !== 'organizer' && x.podnosilac !== 'traveler') return null
  return { ...x, podnosilac: x.podnosilac ?? 'traveler' } as unknown as Tokovi
}
