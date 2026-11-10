// MALA STANJA SLOBODNIH TOKOVA (PLAN B4.2): sve što gledalac napravi dok razgleda slobodno — novi oglasi, ponude, razmene, poeni, isticanje,
// aukcije, dostava, poslovni nalog, akcija, prijave oglasa… Tokovi idu samo napred; „Restart demo“ ih briše.
// Čuvaju se u sessionStorage (demo/cuvanje.ts) uz STROGU proveru oblika (PK3): zapis koji nije tačno ovakav se odbacuje, a ne popravlja.
// Ovde su samo tipovi, početno stanje i provera; same promene stanja su čiste funkcije u tokovi/operacije.ts.
import { DANI_ISTICANJA, ROKOVI_AUKCIJE_DANA, VREDNOSTI_POENA, type DaniIsticanja } from '../scenario/cene'
import { FIRMA_PO_ID } from '../scenario/firme'
import { KATEGORIJA_PO_ID } from '../scenario/kategorije'
import { imaKljuc } from '../scenario/kljuc'
import { KORISNIK_PO_ID, REGION_KORISNICI } from '../scenario/korisnici'
import { ANIN_PS2, OGLASI_BEOGRAD, OGLASI_REGION, PRIJAVLJENI_OGLAS, jeRezervisan, type Oglas } from '../scenario/oglasi'
import { PRIJAVE_NA_CEKANJU } from '../scenario/poslovno'
import { OPSTINA_PO_ID } from '../scenario/opstine'
import { NAJVISE_NOVIH_PRICA, ODREDISTA_REKLAME, RADNA_VREMENA, ZELJA_PO_ID } from '../scenario/slobodno'

export type Vrsta = 'roba' | 'usluga' | 'ideja'
export type Nacin = 'razmena' | 'poeni' | 'poklon'

/** Stvar u ponudi: naslov, vrsta, id oglasa (ako je stvar oglas) i ikonica. */
export type StvarZapis = { naslov: string; vrsta: Vrsta; oglas?: string; ikonica?: string }

/** Ponuda koju je poslao gledalac (ili koja je stigla njemu od drugog ugla). Seme ponude (Irena, Stefan…) nemaju zapis dok se na njih ne odgovori. */
export type PonudaTok = { id: string; cilj: string; od: string; stvari: StvarZapis[]; status: 'ceka' | 'odbijena' | 'prihvacena'; razlog?: string }
export type Odgovor = { status: 'odbijena' | 'prihvacena'; razlog?: string }

/** Razmena nastala iz prihvaćene ponude, iz „Uzmi za poene“ ili iz poklona. Faza: 1 dogovor, 2 primopredaja, 3 obavljena. */
export type RazmenaTok = {
  id: string
  tip: Nacin
  cilj: string
  naslov: string
  vlasnik: string
  od: string
  stvari: StvarZapis[]
  faza: 1 | 2 | 3
  predaja: 'licno' | 'kurir'
  potvrdili: string[]
  ocene: { autor: string; o: string; ocena: 3 | 4 | 5 }[]
  poeni?: number
}

/** Promena poena. N-1 (PRAVNO): poene dodeljuje i oduzima SWAPIT; `potroseno` = oduzeto za uzetu stvar, `poklon` i `predaja` = dodeljeno tek posle potvrđenog prijema. */
export type PoeniDogadjaj = { k: string; vrsta: 'potroseno' | 'poklon' | 'predaja'; naslov: string; iznos: number }

export type IzmenaOglasa = { nacin: Nacin; poeni?: number }
export type DostavaTok = { razmena: string; velicina: 'mala' | 'velika'; termin: 0 | 1; faza: 0 | 1 | 2 | 3 }
export type PoslovnoTok = {
  /** Plan koji je izabran u F1/F2 (null = nije menjan, važi plan firme iz podataka). */
  plan: 'Majstor' | 'Radnja' | null
  /** Građanin je otvorio poslovni nalog (F2 → Z3 → Z4). */
  nalog: boolean
  otkazana: boolean
  radnoVreme: number
  reklama: 'profil' | 'akcija' | null
  /** Akcija objavljena i plaćena u slobodnom toku (u priči to znači radnja 9.z4). */
  akcija: boolean
}
export type PrijavaAkcije = { k: string; stvar: string; procena: string; termin: string }
export type PrijavaOglasa = { id: string; oglas: string; razlog: string; od: string }

export type Tokovi = {
  /** Oglasi koje je gledalac napravio u slobodnom režimu (vide se u brojačima i listama svih uglova). */
  noviOglasi: Oglas[]
  /** Id-jevi oglasa sa zvezdicom (omiljeno). */
  omiljeno: string[]
  /** Oglasi koje je vlasnik uklonio (O6 „Ukloni“). */
  uklonjeni: string[]
  /** Izmene oglasa (O2 „Uredi“): način i vrednost poena. */
  izmene: Record<string, IzmenaOglasa>
  istaknuti: { oglas: string; dana: DaniIsticanja }[]
  ponude: PonudaTok[]
  odgovori: Record<string, Odgovor>
  razmene: RazmenaTok[]
  poeni: PoeniDogadjaj[]
  zahtevi: { oglas: string; od: string }[]
  zelje: { k: string; id: string }[]
  pratim: { k: string; id: string }[]
  pretrage: { k: string; q: string }[]
  price: { k: string; tekst: string }[]
  /** `korak` = korak priče u trenutku pokretanja: rok aukcije se računa od tog dana i ne pomera se kad priča ide dalje. */
  aukcije: { oglas: string; dana: 3 | 7 | 14; korak: number }[]
  paketAukcija: number
  dostava: DostavaTok | null
  poslovno: PoslovnoTok
  prijaveAkcije: PrijavaAkcije[]
  statusiPrijava: Record<string, 'primljeno' | 'odbijeno'>
  prijave: PrijavaOglasa[]
  odluke: Record<string, 'ukloni' | 'izmena' | 'ostavi'>
  /** Korak priče u trenutku odluke moderacije (datum odluke u V4 je fiksan pri nastanku). */
  korakOdluke: Record<string, number>
}

const POCETNO_POSLOVNO: PoslovnoTok = { plan: null, nalog: false, otkazana: false, radnoVreme: 0, reklama: null, akcija: false }

export const POCETNI_TOKOVI: Tokovi = {
  noviOglasi: [],
  omiljeno: [],
  uklonjeni: [],
  izmene: {},
  istaknuti: [],
  ponude: [],
  odgovori: {},
  razmene: [],
  poeni: [],
  zahtevi: [],
  zelje: [],
  pratim: [],
  pretrage: [],
  price: [],
  aukcije: [],
  paketAukcija: 0,
  dostava: null,
  poslovno: POCETNO_POSLOVNO,
  prijaveAkcije: [],
  statusiPrijava: {},
  prijave: [],
  odluke: {},
  korakOdluke: {},
}

export const NAJVISE_OMILJENIH = 60
/** Najviše oglasa iz tokova (zaštita od neispravnog zapisa). */
export const NAJVISE_NOVIH_OGLASA = 20
export const NAJVISE_PO_VRSTI = 40

/** Zvezdica na kartici: dodaje ili uklanja oglas iz omiljenih. */
export const prebaciOmiljeno = (t: Tokovi, id: string): Tokovi =>
  t.omiljeno.includes(id) ? { ...t, omiljeno: t.omiljeno.filter((x) => x !== id) } : t.omiljeno.length >= NAJVISE_OMILJENIH ? t : { ...t, omiljeno: [...t.omiljeno, id] }

/** O2/O3 „Objavi“ u slobodnom toku dodaje oglas ovuda. */
export const dodajNoviOglas = (t: Tokovi, o: Oglas): Tokovi => (t.noviOglasi.length >= NAJVISE_NOVIH_OGLASA ? t : { ...t, noviOglasi: [...t.noviOglasi, o] })

// ---------------------------------------------------------------------------------------------------------------------
// PROVERA OBLIKA
// ---------------------------------------------------------------------------------------------------------------------
const jeObjekat = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const ima = imaKljuc // V4: jedna zajednička provera ključa (scenario/kljuc.ts)
const kratakTekst = (x: unknown, najvise: number): x is string => typeof x === 'string' && x.length > 0 && x.length <= najvise
const VRSTE = ['roba', 'usluga', 'ideja']
const NACINI = ['razmena', 'poeni', 'poklon']

/** Id-jevi svih oglasa koje demo poznaje (za proveru zvezdica i veza iz zapisa). */
const POZNATI_IDOVI = new Set([...OGLASI_BEOGRAD, ...OGLASI_REGION, ANIN_PS2, PRIJAVLJENI_OGLAS].map((o) => o.id))
const REGION_IDOVI = new Set(REGION_KORISNICI.map((k) => k.id))
const jeKorisnikIliFirma = (x: unknown): x is string => typeof x === 'string' && (ima(KORISNIK_PO_ID, x) || ima(FIRMA_PO_ID, x) || REGION_IDOVI.has(x))

/**
 * Strog oblik oglasa iz zapisa (PK3): poznata kategorija, poznat vlasnik (korisnik ili firma), poeni samo iz dozvoljenih vrednosti,
 * poznat „trazi“, ograničene dužine; polja koja pripadaju samo podacima (istaknuto, aukcija, rezervisan) se ne primaju.
 */
export function jeOglas(x: unknown): x is Oglas {
  if (!jeObjekat(x)) return false
  if (!kratakTekst(x.id, 60) || !kratakTekst(x.naslov, 120) || !kratakTekst(x.opis, 600)) return false
  if (typeof x.kat !== 'string' || !ima(KATEGORIJA_PO_ID, x.kat)) return false
  if (typeof x.vlasnik !== 'string' || typeof x.firma !== 'boolean') return false
  if (!ima(x.firma ? FIRMA_PO_ID : KORISNIK_PO_ID, x.vlasnik)) return false
  if (x.grad !== 'Beograd') return false
  if (typeof x.vrsta !== 'string' || !VRSTE.includes(x.vrsta)) return false
  if (typeof x.nacin !== 'string' || !NACINI.includes(x.nacin)) return false
  if (x.poeni !== undefined && !(VREDNOSTI_POENA as readonly unknown[]).includes(x.poeni)) return false
  if (x.nacin === 'poeni' && x.poeni === undefined) return false
  if (x.trazi !== undefined && (typeof x.trazi !== 'string' || !VRSTE.includes(x.trazi))) return false
  if (x.stanje !== undefined && !kratakTekst(x.stanje, 30)) return false
  if (x.opstina !== undefined && (typeof x.opstina !== 'string' || !ima(OPSTINA_PO_ID, x.opstina))) return false
  if (x.preuzimanje !== undefined && x.preuzimanje !== 'licno' && x.preuzimanje !== 'licno-kurir') return false
  if (x.istaknuto !== undefined || x.aukcija !== undefined || x.rezervisan !== undefined) return false
  return true
}

type Provera<T> = (v: unknown) => v is T
function niz<T>(x: unknown, jeT: Provera<T>, najvise: number): T[] | null {
  return Array.isArray(x) && x.length <= najvise && x.every(jeT) ? (x as T[]) : null
}
const jeId = (v: unknown): v is string => kratakTekst(v, 80)
const jeStvar = (v: unknown): v is StvarZapis =>
  jeObjekat(v) && kratakTekst(v.naslov, 80) && typeof v.vrsta === 'string' && VRSTE.includes(v.vrsta) && (v.oglas === undefined || jeId(v.oglas)) && (v.ikonica === undefined || kratakTekst(v.ikonica, 30))
const jeStatusPonude = (s: unknown): s is PonudaTok['status'] => s === 'ceka' || s === 'odbijena' || s === 'prihvacena'
const jePonuda = (v: unknown): v is PonudaTok =>
  jeObjekat(v) &&
  jeId(v.id) &&
  jeId(v.cilj) &&
  jeKorisnikIliFirma(v.od) &&
  Array.isArray(v.stvari) &&
  v.stvari.length >= 1 &&
  v.stvari.length <= 6 &&
  v.stvari.every(jeStvar) &&
  jeStatusPonude(v.status) &&
  (v.razlog === undefined || kratakTekst(v.razlog, 40))
const jeKorak = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 9
const jeOcena = (v: unknown): v is 3 | 4 | 5 => v === 3 || v === 4 || v === 5
const jeRazmena = (v: unknown): v is RazmenaTok =>
  jeObjekat(v) &&
  jeId(v.id) &&
  typeof v.tip === 'string' &&
  NACINI.includes(v.tip) &&
  jeId(v.cilj) &&
  kratakTekst(v.naslov, 120) &&
  jeKorisnikIliFirma(v.vlasnik) &&
  jeKorisnikIliFirma(v.od) &&
  Array.isArray(v.stvari) &&
  v.stvari.length <= 6 &&
  v.stvari.every(jeStvar) &&
  (v.faza === 1 || v.faza === 2 || v.faza === 3) &&
  (v.predaja === 'licno' || v.predaja === 'kurir') &&
  Array.isArray(v.potvrdili) &&
  v.potvrdili.length <= 4 &&
  v.potvrdili.every(jeKorisnikIliFirma) &&
  Array.isArray(v.ocene) &&
  v.ocene.length <= 4 &&
  v.ocene.every((o) => jeObjekat(o) && jeKorisnikIliFirma(o.autor) && jeKorisnikIliFirma(o.o) && jeOcena(o.ocena)) &&
  (v.poeni === undefined || (VREDNOSTI_POENA as readonly unknown[]).includes(v.poeni))
const jePoeniDogadjaj = (v: unknown): v is PoeniDogadjaj =>
  jeObjekat(v) && jeKorisnikIliFirma(v.k) && (v.vrsta === 'potroseno' || v.vrsta === 'poklon' || v.vrsta === 'predaja') && kratakTekst(v.naslov, 120) && (VREDNOSTI_POENA as readonly unknown[]).includes(v.iznos)
const jeKljucUnos = (v: unknown): v is { k: string; id: string } => jeObjekat(v) && jeKorisnikIliFirma(v.k) && jeId(v.id)

function recnik<T>(x: unknown, jeT: Provera<T>, najvise: number): Record<string, T> | null {
  if (!jeObjekat(x)) return null
  const kljucevi = Object.keys(x)
  if (kljucevi.length > najvise || kljucevi.some((k) => !jeId(k) || !jeT(x[k]))) return null
  return x as Record<string, T>
}

function proveriPoslovno(x: unknown): PoslovnoTok | null {
  if (x === undefined) return POCETNO_POSLOVNO
  if (!jeObjekat(x)) return null
  const { plan, nalog, otkazana, radnoVreme, reklama, akcija } = x
  if (plan !== null && plan !== 'Majstor' && plan !== 'Radnja') return null
  if (typeof nalog !== 'boolean' || typeof otkazana !== 'boolean' || typeof akcija !== 'boolean') return null
  if (!Number.isInteger(radnoVreme) || (radnoVreme as number) < 0 || (radnoVreme as number) >= RADNA_VREMENA.length) return null
  if (reklama !== null && !ODREDISTA_REKLAME.some((o) => o.v === reklama)) return null
  return { plan, nalog, otkazana, radnoVreme: radnoVreme as number, reklama: reklama as PoslovnoTok['reklama'], akcija }
}

/** Vraća ispravne tokove ili null (nepoznat oblik se odbacuje, a ne popravlja). Polja koja nedostaju (stari zapis) dobijaju početnu vrednost. */
export function proveriTokove(x: unknown): Tokovi | null {
  if (!jeObjekat(x) || !Array.isArray(x.noviOglasi)) return null
  if (x.noviOglasi.length > NAJVISE_NOVIH_OGLASA || !x.noviOglasi.every(jeOglas)) return null
  const novi = x.noviOglasi as Oglas[]
  const poznat = (i: unknown): i is string => jeId(i) && (POZNATI_IDOVI.has(i) || novi.some((o) => o.id === i))
  // K1: zapis ne sme da dira predmet priče (prijava, isticanje, aukcija, izmena, uklanjanje)
  const slobodan = (i: unknown): i is string => poznat(i) && !jeRezervisan(i)
  const omiljeno = x.omiljeno === undefined ? [] : x.omiljeno
  if (!Array.isArray(omiljeno) || omiljeno.length > NAJVISE_OMILJENIH) return null
  if (!omiljeno.every((i) => typeof i === 'string' && i.length < 80 && poznat(i))) return null
  if (new Set(omiljeno).size !== omiljeno.length) return null

  const uklonjeni = niz(x.uklonjeni ?? [], slobodan, NAJVISE_PO_VRSTI)
  const izmeneSirovo = x.izmene ?? {}
  const izmene = recnik<IzmenaOglasa>(izmeneSirovo, (v): v is IzmenaOglasa => jeObjekat(v) && typeof v.nacin === 'string' && NACINI.includes(v.nacin) && (v.poeni === undefined || (VREDNOSTI_POENA as readonly unknown[]).includes(v.poeni)) && (v.nacin !== 'poeni' || v.poeni !== undefined), NAJVISE_PO_VRSTI)
  const istaknuti = niz(x.istaknuti ?? [], (v): v is Tokovi['istaknuti'][number] => jeObjekat(v) && slobodan(v.oglas) && (DANI_ISTICANJA as readonly unknown[]).includes(v.dana), NAJVISE_PO_VRSTI)
  const ponude = niz(x.ponude ?? [], jePonuda, NAJVISE_PO_VRSTI)
  const odgovori = recnik<Odgovor>(x.odgovori ?? {}, (v): v is Odgovor => jeObjekat(v) && (v.status === 'odbijena' || v.status === 'prihvacena') && (v.razlog === undefined || kratakTekst(v.razlog, 40)), NAJVISE_PO_VRSTI)
  const razmene = niz(x.razmene ?? [], jeRazmena, NAJVISE_PO_VRSTI)
  const poeni = niz(x.poeni ?? [], jePoeniDogadjaj, NAJVISE_PO_VRSTI)
  const zahtevi = niz(x.zahtevi ?? [], (v): v is Tokovi['zahtevi'][number] => jeObjekat(v) && poznat(v.oglas) && jeKorisnikIliFirma(v.od), NAJVISE_PO_VRSTI)
  const zelje = niz(x.zelje ?? [], (v): v is Tokovi['zelje'][number] => jeKljucUnos(v) && ima(ZELJA_PO_ID, v.id), 8)
  const pratim = niz(x.pratim ?? [], (v): v is Tokovi['pratim'][number] => jeKljucUnos(v) && ima(KORISNIK_PO_ID, v.id), NAJVISE_PO_VRSTI)
  const pretrage = niz(x.pretrage ?? [], (v): v is Tokovi['pretrage'][number] => jeObjekat(v) && jeKorisnikIliFirma(v.k) && typeof v.q === 'string' && v.q.length <= 200, 10)
  const price = niz(x.price ?? [], (v): v is Tokovi['price'][number] => jeObjekat(v) && jeKorisnikIliFirma(v.k) && kratakTekst(v.tekst, 160), NAJVISE_NOVIH_PRICA)
  const aukcije = niz(x.aukcije ?? [], (v): v is Tokovi['aukcije'][number] => jeObjekat(v) && slobodan(v.oglas) && (ROKOVI_AUKCIJE_DANA as readonly unknown[]).includes(v.dana) && (v.korak === undefined || jeKorak(v.korak)), 10)?.map((a) => ({ ...a, korak: a.korak ?? 1 })) ?? null
  const paket = x.paketAukcija ?? 0
  const dostava = x.dostava ?? null
  if (!uklonjeni || !izmene || !istaknuti || !ponude || !odgovori || !razmene || !poeni || !zahtevi || !zelje || !pratim || !pretrage || !price || !aukcije) return null
  if (!Number.isInteger(paket) || (paket as number) < 0 || (paket as number) > 30) return null
  if (dostava !== null && !(jeObjekat(dostava) && jeId(dostava.razmena) && (dostava.velicina === 'mala' || dostava.velicina === 'velika') && (dostava.termin === 0 || dostava.termin === 1) && [0, 1, 2, 3].includes(dostava.faza as number))) return null
  const poslovno = proveriPoslovno(x.poslovno)
  const prijaveAkcije = niz(x.prijaveAkcije ?? [], (v): v is PrijavaAkcije => jeObjekat(v) && jeKorisnikIliFirma(v.k) && kratakTekst(v.stvar, 80) && kratakTekst(v.procena, 30) && kratakTekst(v.termin, 40), 10)
  const statusiPrijava = recnik<'primljeno' | 'odbijeno'>(x.statusiPrijava ?? {}, (v): v is 'primljeno' | 'odbijeno' => v === 'primljeno' || v === 'odbijeno', 20)
  const prijave = niz(x.prijave ?? [], (v): v is PrijavaOglasa => jeObjekat(v) && jeId(v.id) && slobodan(v.oglas) && kratakTekst(v.razlog, 40) && jeKorisnikIliFirma(v.od), 10)
  const odluke = recnik<'ukloni' | 'izmena' | 'ostavi'>(x.odluke ?? {}, (v): v is 'ukloni' | 'izmena' | 'ostavi' => v === 'ukloni' || v === 'izmena' || v === 'ostavi', 20)
  const korakOdluke = recnik<number>(x.korakOdluke ?? {}, jeKorak, 20)
  if (!korakOdluke) return null
  if (!poslovno || !prijaveAkcije || !statusiPrijava || !prijave || !odluke) return null
  // unakrsna provera zapisa: izmene samo na poznatim oglasima koji nisu predmeti priče, odluke samo na prijavama koje postoje, ponude i razmene na oglasu koji postoji
  if (!Object.keys(izmene).every(slobodan)) return null
  const prijavaIds = new Set([...PRIJAVE_NA_CEKANJU.map((p) => p.id), ...prijave.map((p) => p.id)])
  if (!Object.keys(odluke).every((k) => prijavaIds.has(k))) return null
  if (!Object.keys(statusiPrijava).every(jeKorisnikIliFirma)) return null
  if (!ponude.every((p) => poznat(p.cilj)) || !razmene.every((r) => poznat(r.cilj))) return null
  if (!aukcije.every((a, i) => aukcije.findIndex((b) => b.oglas === a.oglas) === i)) return null
  return {
    noviOglasi: novi,
    omiljeno: omiljeno as string[],
    uklonjeni,
    izmene,
    istaknuti,
    ponude,
    odgovori,
    razmene,
    poeni,
    zahtevi,
    zelje,
    pratim,
    pretrage,
    price,
    aukcije,
    paketAukcija: paket as number,
    dostava: dostava as DostavaTok | null,
    poslovno,
    prijaveAkcije,
    statusiPrijava,
    prijave,
    odluke,
    korakOdluke,
  }
}

/** Da li je gledalac nešto probao slobodno (za potvrdu pri Restartu i ulasku u demo). */
export const imaTokova = (t: Tokovi): boolean => JSON.stringify(t) !== JSON.stringify(POCETNI_TOKOVI)

