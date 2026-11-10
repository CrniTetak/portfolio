// Pravila o novcu. Svi iznosi su CELI CENTI (13500 = 135,00 €); dinari se čuvaju kao PARE (1579500 = 15.795,00 RSD).
import {
  DOMACIN_PO_DANU_CENTI, DOPLATA_VELIKA_EKIPA_PROCENAT, KURS_RSD, NAKNADA_MINIMUM_CENTI, NAKNADA_PROCENAT,
  NORMIRANI_TROSKOVI_FIZICKO, PARTNER_PROCENAT, POREZ_FIZICKO_STOPA, UDEO_DANA_PRIPREME,
} from './konstante'

export type Razred = 'do10' | 'do30' | 'preko30'

export const NAZIV_RAZREDA: Record<Razred, string> = {
  do10: 'do 10 ljudi',
  do30: '11–30 ljudi',
  preko30: 'preko 30 ljudi',
}

export interface UlazOsnovice {
  /** cena snimajućeg dana za izabrani razred ekipe, u centima */
  cenaDanaCenti: number
  snimajuciDani: number
  daniPripreme: number
  /** cena jednog dana pripreme/raspremanja (jedna cena po lokaciji, za sve veličine ekipe); ako nije data, pola cene dana */
  cenaPripremeCenti?: number
  prekovremeniSati?: number
  cenaPrekovremenogSataCenti?: number
}

function proveriBroj(ime: string, v: number) {
  if (!Number.isFinite(v) || v < 0) throw new Error(`Neispravan ulaz: ${ime} (${v})`)
}

/** Osnovica = ukupna cena lokacije: dani × cena + priprema × cena pripreme + prekovremeni. */
export function izracunajOsnovicu(u: UlazOsnovice): number {
  proveriBroj('cena dana', u.cenaDanaCenti)
  proveriBroj('snimajući dani', u.snimajuciDani)
  proveriBroj('dani pripreme', u.daniPripreme)
  const sati = u.prekovremeniSati ?? 0
  const cenaSata = u.cenaPrekovremenogSataCenti ?? 0
  const priprema = u.cenaPripremeCenti ?? Math.round(u.cenaDanaCenti * UDEO_DANA_PRIPREME)
  proveriBroj('prekovremeni sati', sati)
  proveriBroj('cena sata', cenaSata)
  proveriBroj('cena pripreme', priprema)
  if (u.snimajuciDani < 1) throw new Error('Potreban je bar jedan snimajući dan')
  return Math.round(u.snimajuciDani * u.cenaDanaCenti + u.daniPripreme * priprema + sati * cenaSata)
}

/** Cena snimajućeg dana za razred "preko 30" (izmišljeno uvećanje). */
export function cenaZaVelikuEkipu(cenaDo30Centi: number): number {
  return Math.round((cenaDo30Centi * (100 + DOPLATA_VELIKA_EKIPA_PROCENAT)) / 100)
}

export interface Naknada {
  osnovicaCenti: number
  naknadaCenti: number
  /** true kad je 15% bilo manje od 40 € pa je primenjen najmanji iznos */
  primenjenMinimum: boolean
}

/** Naknada = 15% osnovice (zaokruženo na cent), ali najmanje 40,00 €. Računa se u EVRIMA. */
export function izracunajNaknadu(osnovicaCenti: number): Naknada {
  proveriBroj('osnovica', osnovicaCenti)
  if (osnovicaCenti <= 0) throw new Error('Osnovica mora biti veća od nule')
  const procenat = Math.round((osnovicaCenti * NAKNADA_PROCENAT) / 100)
  const primenjenMinimum = procenat < NAKNADA_MINIMUM_CENTI
  const naknadaCenti = primenjenMinimum ? NAKNADA_MINIMUM_CENTI : procenat
  return { osnovicaCenti, naknadaCenti, primenjenMinimum }
}

// ---- Dinari ----

/**
 * Evro-centi → PARE (dinar × 100) po datom kursu. 1 cent × kurs 117 = 117 para = 1,17 RSD, pa je pri celom kursu
 * rezultat uvek tačan ceo broj; Math.round je zaštita ako se kurs ikad upiše sa decimalama.
 * Zaokružuje se JEDNOM, na ukupnom iznosu (ne red po red), da zbir redova nikad ne odstupa od ukupnog.
 */
export function uPare(centi: number, kurs: number = KURS_RSD): number {
  return Math.round(centi * kurs)
}

/** Pare → evro-centi (samo za orijentacioni prikaz uz dinarski iznos). */
export function centiIzPara(pare: number, kurs: number = KURS_RSD): number {
  return Math.round(pare / kurs)
}

// ---- Prikaz (jedino mesto za formatiranje iznosa) ----

function grupisi(ceo: number): string {
  return String(ceo).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** 13500 → "135,00 €"; 3750 → "37,50 €" (nikad ne zaokružuje na ceo evro). */
export function eur(centi: number): string {
  const znak = centi < 0 ? '−' : ''
  const a = Math.abs(centi)
  return `${znak}${grupisi(Math.floor(a / 100))},${String(a % 100).padStart(2, '0')} €`
}

/** Za cenu "od X € / dan" na karticama (bez centi ako ih nema). */
export function eurKratko(centi: number): string {
  return centi % 100 === 0 ? `${grupisi(centi / 100)} €` : eur(centi)
}

/** 1579500 → "15.795,00 RSD"; 526500 → "5.265,00 RSD" (srpski format: tačka za hiljade, zarez za decimale). */
export function rsdPara(pare: number): string {
  const znak = pare < 0 ? '−' : ''
  const a = Math.abs(pare)
  return `${znak}${grupisi(Math.floor(a / 100))},${String(a % 100).padStart(2, '0')} RSD`
}

/** 117 → "1 € = 117,00 RSD" (kurs iz zapisa predračuna, ne upisan u ekran). */
export function kursTekst(kurs: number): string {
  return `1 € = ${rsdPara(Math.round(kurs * 100))}`
}

/** 4500 → "≈ 45,00 € (orijentaciono)" */
export function eurOrijentaciono(centi: number): string {
  return `≈ ${eur(centi)} (orijentaciono)`
}

// ---- Predračun naknade (A1 + usluge) ----

export interface UlazPredracuna {
  /** cena lokacije (osnovica za 15%), BEZ domaćina */
  osnovicaCenti: number
  /** plaćeni predračun za izbor van kataloga koji se uračunava (0 ako ga nema) */
  kreditCenti: number
  snimajuciDani: number
  domacin: boolean
}

export interface ObracunPredracuna {
  naknadaCenti: number
  primenjenMinimum: boolean
  /** koliko je od naknade skinuto (kredit, ali najviše do cele naknade) */
  umanjenjeCenti: number
  /** deo uplaćenog kredita koji se ne vraća jer je naknada manja */
  nepokrivenKreditCenti: number
  domacinCenti: number
  ukupnoCenti: number
}

/**
 * Formula: N = max(15% × osnovica, 40 €); U = min(kredit, N); D = 70 € × snimajući dani (ako je domaćin);
 * ukupno = (N − U) + D. Domaćin NIJE deo osnovice 15% i ne umanjuje se kreditom. Iznos za uplatu nikad ne ide ispod 0.
 */
export function obracunPredracuna(u: UlazPredracuna): ObracunPredracuna {
  proveriBroj('kredit', u.kreditCenti)
  proveriBroj('snimajući dani', u.snimajuciDani)
  const n = izracunajNaknadu(u.osnovicaCenti)
  const umanjenje = Math.min(u.kreditCenti, n.naknadaCenti)
  const domacinCenti = u.domacin ? DOMACIN_PO_DANU_CENTI * u.snimajuciDani : 0
  return {
    naknadaCenti: n.naknadaCenti,
    primenjenMinimum: n.primenjenMinimum,
    umanjenjeCenti: umanjenje,
    nepokrivenKreditCenti: u.kreditCenti - umanjenje,
    domacinCenti,
    ukupnoCenti: n.naknadaCenti - umanjenje + domacinCenti,
  }
}

// ---- Partner (B4) ----

/** Deo partnera = 20% naknade Nasetua (npr. naknada 90 € → 18 €). Računa se samo od plaćenih rezervacija. */
export function deoPartnera(naknadaCenti: number): number {
  proveriBroj('naknada', naknadaCenti)
  return Math.round((naknadaCenti * PARTNER_PROCENAT) / 100)
}

// ---- Bruto / neto za vlasnika (ORIJENTACIONO) ----

export type TipVlasnika = 'pravno' | 'fizicko'

export interface BrutoNeto {
  brutoCenti: number
  porezCenti: number
  netoCenti: number
}

/**
 * Pravno lice: neto = bruto (PDV i porez na dobit se ne prikazuju).
 * Fizičko lice: porez po odbitku 20% × (100% − 25%) = 15% bruto, pa neto = 85%.
 * Naknadu Nasetua plaća produkcija, pa se NE odbija vlasniku.
 */
export function brutoNeto(osnovicaCenti: number, tip: TipVlasnika): BrutoNeto {
  proveriBroj('osnovica', osnovicaCenti)
  if (tip === 'pravno') return { brutoCenti: osnovicaCenti, porezCenti: 0, netoCenti: osnovicaCenti }
  const porez = Math.round(
    (osnovicaCenti * POREZ_FIZICKO_STOPA * (100 - NORMIRANI_TROSKOVI_FIZICKO)) / 10000,
  )
  return { brutoCenti: osnovicaCenti, porezCenti: porez, netoCenti: osnovicaCenti - porez }
}

export interface ObracunZaProdukciju extends BrutoNeto {
  /** true: vlasnik je firma i izdaje fakturu na punu cenu (nema odbitka) */
  vlasnikIzdajeFakturu: boolean
}

/**
 * Šta vidi PRODUKCIJA: za vlasnika fizičko lice produkcija zadržava porez po odbitku (15% bruto) i uplaćuje ga državi
 * (300 € → 45 € → vlasniku 255 €); za firmu vlasnik izdaje fakturu na punu cenu. Orijentaciono, nije poreski savet.
 */
export function obracunZaProdukciju(osnovicaCenti: number, tip: TipVlasnika): ObracunZaProdukciju {
  return { ...brutoNeto(osnovicaCenti, tip), vlasnikIzdajeFakturu: tip === 'pravno' }
}
