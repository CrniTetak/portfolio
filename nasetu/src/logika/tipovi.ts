// Osnovni oblici podataka koje koriste pravila. Čist TypeScript, bez React-a.
import type { Razred } from './novac'

export type Uloga = 'produkcija' | 'vlasnik' | 'partner' | 'admin'

/** Termin = konkretni kalendarski dani ("2026-11-17"): snimajući dani i dani pripreme/raspremanja. */
export interface Termin {
  snimanje: string[]
  priprema: string[]
}

export type StanjeOpcije = 'aktivna' | 'otpustena' | 'pretvorena'

/** Opcija drži termin 72 h. "Prva/druga" i "istekla" se NE čuvaju — računaju se (opcije.ts). */
export interface Opcija {
  id: string
  lokacijaId: string
  produkcijaId: string
  termin: Termin
  /** simulirani sati u trenutku postavljanja */
  postavljena: number
  vaziDo: number
  /** ako je druga produkcija zatražila potvrdu: ko i do kad prva mora da odgovori */
  osporavanje: { od: string; rok: number } | null
  stanje: StanjeOpcije
}

/** 'otkazao-vlasnik': vlasnik je otkazao PLAĆENU rezervaciju (B5); termin se oslobađa, adresa se zatvara. */
export type StanjeZahtevaZapis = 'ceka' | 'odobren' | 'odbijen' | 'otkazao-vlasnik'

export interface Zahtev {
  id: string
  lokacijaId: string
  produkcijaId: string
  briefId: string | null
  termin: Termin
  razred: Razred
  prekovremeniSati: number
  /** ukupna cena lokacije zapamćena u trenutku slanja (centi) */
  osnovicaCenti: number
  /** opcija "Domaćin na snimanju" (70 € po snimajućem danu; nije deo osnovice za 15%) */
  domacin: boolean
  /** izmišljeni kurs zapisan u trenutku slanja (za iznos vlasniku u dinarima) */
  kurs: number
  /** ID opcije iz koje je zahtev nastao (nasleđuje njeno mesto u redu); null = zahtev bez opcije, staje u red kad je poslat */
  opcijaId: string | null
  poslat: number
  /** do kada vlasnik može da odgovori (poslat + 48 h) */
  rok: number
  stanje: StanjeZahtevaZapis
  razlog: string | null
  /** simulirani sat kad je vlasnik otkazao plaćenu rezervaciju, ili null */
  otkazan: number | null
}

export type VrstaPredracuna = 'naknada' | 'izbor-van-kataloga' | 'fotografisanje'

/**
 * Predračun je OPŠTI: naknada za rezervaciju, izbor van kataloga (produkcija) ili fotografisanje (vlasnik).
 * Iznosi su u evro-centima (računa se u evrima), a iznos za uplatu je u PARAMA (dinar × 100) po kursu zapisanom ovde.
 * Tačno jedan od zahtevId / briefId / prijavaId je popunjen, zavisno od vrste.
 */
export interface Predracun {
  id: string
  vrsta: VrstaPredracuna
  /** ko plaća: Delta, Sigma, Alfa ili Ivan */
  kupacId: string
  zahtevId: string | null
  briefId: string | null
  prijavaId: string | null
  /** cena lokacije (samo za naknadu; za usluge 0) */
  osnovicaCenti: number
  /** naknada Nasetua 15% (samo za naknadu) */
  naknadaCenti: number
  primenjenMinimum: boolean
  /** koliko je skinuto zbog već plaćenog izbora van kataloga (≥ 0, prikazuje se kao minus) */
  umanjenjeCenti: number
  kreditIzPredracunaId: string | null
  /** deo plaćenih 50 € koji se ne vraća jer je naknada bila manja */
  nepokrivenKreditCenti: number
  /** domaćin na snimanju (poseban red) */
  domacinCenti: number
  /** cena usluge (50 € izbor van kataloga ili 75 € fotografisanje); za naknadu 0 */
  uslugaCenti: number
  /** ukupno za uplatu u evro-centima (orijentacioni prikaz) */
  ukupnoCenti: number
  kurs: number
  /** ukupno za uplatu u PARAMA (15795 RSD = 1579500) */
  ukupnoPara: number
  /** izmišljen poziv na broj */
  pozivNaBroj: string
  izdat: number
  /** simulirano vreme potvrde uplate, ili null dok ne bude potvrđena */
  uplataPotvrdjena: number | null
  /** da li je produkcija otvorila predračun (za "Sledeći korak") */
  pregledan: boolean
  /** povraćaj (izmišljen) posle otkazivanja vlasnika: kad i koliko (pare) */
  povracaj: { sati: number; iznosPara: number } | null
}

export type StanjeIzvidjanja = 'ceka' | 'potvrdjeno' | 'odbijeno'

export interface Izvidjanje {
  id: string
  lokacijaId: string
  produkcijaId: string
  /** kada je izviđanje (simulirani sati) */
  kada: number
  /** jedina osoba koja dobija adresu */
  osoba: string
  brojLjudi: number
  stanje: StanjeIzvidjanja
  poslat: number
}

// ---- Lokacije koje šalje vlasnik ili preporučuje partner (B4, B6, B7). NIKAD ne sadrže tačnu adresu. ----

/** Cenovnik iz obrasca za unos lokacije (centi). Dan pripreme je jedna cena za sve veličine ekipe. */
export interface CenovnikPrijave {
  do10: number | null
  do30: number | null
  preko30: number | null
  satiDana: number
  pripremaCenti: number
  prekovremeniCenti: number
  najkrace: string
  troskovi: string
}

export type StanjePrijave = 'ceka' | 'objavljena' | 'odbijena'

export interface PrijavaLokacije {
  id: string
  /** ko je poslao: vlasnik (unos lokacije) ili partner (preporuka uz saglasnost vlasnika) */
  izvor: 'vlasnik' | 'partner'
  podnosilacId: string
  /** vlasnik lokacije (samo kad izvor = vlasnik); za preporuku partnera prazno */
  vlasnikId: string
  /** za preporuku partnera: izmišljen naziv vlasnika */
  vlasnikNaziv: string
  saglasnostVlasnika: boolean
  naziv: string
  tip: string
  opstina: string
  kvadratura: number
  cenovnik: CenovnikPrijave
  /** vrednosti polja tehničkog lista (ključevi iz podaci/lokacije.ts POLJA_TEHNICKOG) */
  tehnicki: Record<string, string>
  /** samo broj probnih slika (simulacija, bez stvarnog otpremanja) */
  brojFotografija: number
  dokaz: string
  /** opcija "Profesionalno fotografisanje" (75 €, plaća vlasnik) */
  fotografisanje: boolean
  stanje: StanjePrijave
  /** simulirano vreme odluke admina, ili null */
  odluka: number | null
  poslat: number
}

// ---- Nalozi na čekanju (B2): samo izmišljeni, nema prave prijave ----

export type VrstaNaloga = 'firma' | 'preduzetnik' | 'fizicko-vlasnik'

export interface Nalog {
  id: string
  vrsta: VrstaNaloga
  naziv: string
  /** izmišljeni PIB/MB (sve nule) ili null za fizičko lice */
  pib: string | null
  mb: string | null
  /** vlasnik fizičko lice: naziv dokaza prava na izdavanje (izmišljeno) */
  dokaz: string | null
  /** šta je prihvaćeno, npr. "Opšti uslovi v0.1" */
  prihvaceno: string[]
  stanje: 'ceka' | 'odobren' | 'odbijen'
  poslat: number
}

/** Beleška o sporu uz rezervaciju (B6); vidi je samo admin. */
export interface Beleska {
  id: string
  zahtevId: string
  tekst: string
  sati: number
}
