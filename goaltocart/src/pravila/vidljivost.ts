// KO ŠTA VIDI (UX.md 4.1). Jedina datoteka kroz koju ekrani dobijaju podatke iz scenarija.
// Svaki "pogled" sadrži SAMO polja koja ta uloga sme da vidi: kod igrača, na primer, ne postoje polja sa ratama klubova, bonusima, sell-on-om i provizijom (vidi samo svoj udeo).
// Ekrani ne smeju da uvoze scenario/uslovi.ts i scenario/racun.ts (proverava se testom, PLAN B5).
//
// Iskrena granica: demo POKAZUJE pravila vidljivosti, ali ih ne DOKAZUJE: sve je u kodu koji pregledač preuzme.
// U pravom proizvodu ova pravila mora da sprovodi server.
import * as R from '../scenario/racun'
import * as U from '../scenario/uslovi'
import * as S from '../scenario/strane'
import { DATUM } from '../scenario/datumi'
import { datumIso } from '../scenario/format'
import type { Uloga } from '../prica/tipovi'

// ------------------------------------------------------------------ zajednički delovi
export interface VerzijaJavna {
  broj: 1 | 2 | 3
  od: 'buyer' | 'seller'
  datum: string
  rate: number[]
  fiksni: number
  bonusi: number
  sellOnPct: number
  naslovna: number
}
export interface RazlikaJavna {
  iz: number
  u: number
  fiksni: number
  bonusi: number
  sellOn: number
}

const verzije: VerzijaJavna[] = U.VERZIJE.map((v, i) => ({
  broj: v.broj,
  od: v.od,
  datum: v.datum,
  rate: [...v.rate],
  fiksni: R.fiksniVerzije(i),
  bonusi: v.bonusiUkupno,
  sellOnPct: v.sellOnPct,
  naslovna: R.naslovnaVerzije(i),
}))

const razlike: RazlikaJavna[] = [
  { iz: 1, u: 2, ...R.razlikaVerzija(0, 1) },
  { iz: 2, u: 3, ...R.razlikaVerzija(1, 2) },
]

const dogovoreno = {
  rate: [...U.RATE],
  datumiRata: [...U.DATUMI_RATA],
  fiksni: R.fiksniUkupno,
  bonusi: U.BONUSI.map((b, i) => ({ id: b.id, iznos: b.iznos, opis: b.opis, izvor: b.izvor, udeoIgraca: R.udeoPoBonusu[i] })),
  bonusiUkupno: R.bonusiUkupno,
  sellOnPct: U.SELL_ON_PCT,
  naslovna: R.naslovnaVrednost,
}

const igracJavno = {
  ime: S.IGRAC.ime, kratko: S.IGRAC.kratko, godina: S.IGRAC.godina, rodjen: S.IGRAC.rodjen,
  pozicija: S.IGRAC.pozicija, id: S.IGRAC.id,
}

const escrowJavno = {
  partner: S.ESCROW.naziv, napomena: S.ESCROW.napomena, racunMaskiran: S.ESCROW.racunMaskiran, referencaBanke: S.ESCROW.referencaBanke,
}

// ------------------------------------------------------------------ pogledi po ulozi
export interface PogledProdavca {
  klub: typeof S.PRODAVAC
  protivStrana: { naziv: string; zemlja: string }
  igrac: typeof igracJavno
  verzije: VerzijaJavna[]
  razlike: RazlikaJavna[]
  dogovoreno: typeof dogovoreno
  /** Obaveza prodavca: igračev udeo (5%) plaća se u njegovo ime. */
  udeoIgraca: { pct: number; poRati: number[]; ukupno: number }
  naknada: { pola: number; ukupno: number; pct: string }
  escrow: typeof escrowJavno & { iznos: number }
  slap: { ulaz: number; udeoIgraca: number; naknadaPola: number; neto: number }
  finansiranje: {
    finansijer: string
    ostaliFinansijeri: readonly string[]
    potrazivanje: number
    poRati: number[]
    datumiRata: string[]
    avans: number
    popust: number
    popustPct: number
    minimalniAvans: number
    datumPonude: string
    vaziDo: string
    netoUkupno: number
  }
  bonusNapredak: typeof U.B1_NASTUPI
  sporedni: S.SporedniTransfer[]
  skolovanjeProcena: number
}

export interface PogledKupca {
  klub: typeof S.KUPAC
  protivStrana: { naziv: string; zemlja: string }
  igrac: typeof igracJavno
  verzije: VerzijaJavna[]
  razlike: RazlikaJavna[]
  dogovoreno: typeof dogovoreno
  licniUslovi: { godina: number; godisnjaBruto: number; ugovorUkupno: number; klinika: string; termin: string }
  agent: { ime: string; licenca: string; licencaVaziDo: string; provizija: number }
  udeoIgraca: { pct: number; poRati: number[]; ukupno: number }
  naknada: { pola: number; ukupno: number; pct: string }
  uplata: { rata1: number; provizija: number; naknadaPola: number; ukupno: number }
  escrow: typeof escrowJavno
  /** Slap uplate kupca iz escrow-a (bez neto iznosa prodavca, to je njegova stvar). */
  isplata: { igrac: number; naknada: number; agent: number; ukupno: number }
  povracaj: number
  bonusNapredak: typeof U.B1_NASTUPI
  /** Za koliko meseci dospeva rata 2 u trenutku ponude finansijera (izvedeno iz datuma). */
  rata2UMesecima: number
  sporedni: S.SporedniTransfer[]
  skolovanjeProcena: number
}

export interface PogledIgraca {
  igrac: typeof igracJavno & { ime1: string; racunKraj: string }
  stariKlub: string
  noviKlub: string
  ugovor: { godina: number; godisnjaBruto: number }
  agent: { ime: string }
  udeo: { pct: number; poRati: { iznos: number; datum: string }[]; ukupno: number; poBonusu: { id: string; iznos: number }[] }
  klinika: { naziv: string; termin: string }
  /** Potvrda banke za igračevu isplatu (referenca je izmišljena). */
  potvrdaBanke: { referenca: string }
}

export interface PogledAgenta {
  agent: { ime: string; licenca: string; licencaVaziDo: string }
  klijent: typeof igracJavno & { ime1: string }
  noviKlub: string
  ugovor: { godina: number; godisnjaBruto: number }
  provizija: { iznos: number; pct: number; platiocKupac: string }
  klinika: { naziv: string; termin: string }
}

export interface PogledFinansijera {
  finansijer: { naziv: string; odeljenje: string }
  prodavac: string
  duznik: string
  potrazivanje: {
    nominal: number
    rate: { iznos: number; datum: string }[]
    avans: number
    popust: number
    popustPct: number
    prinosGodisnje: number
    prosecnoDospeceMeseci: number
    /** Za koliko meseci dospeva svaka rata u trenutku ponude (izvedeno iz datuma). */
    dospeceMeseci: number[]
    vaziDo: string
    datumPonude: string
  }
  sporedna: S.SporednoPotrazivanje[]
  /** Kroz koga ide plaćanje rata (ilustrativno). */
  putPlacanja: { posrednik: string }
}

export interface Pogledi {
  selling: PogledProdavca
  buying: PogledKupca
  player: PogledIgraca
  agent: PogledAgenta
  financier: PogledFinansijera
}

const udeo = { pct: U.UDEO_IGRACA_PCT, poRati: [...R.udeoPoRati], ukupno: R.udeoUkupno }
// 0.5% je izvedeno iz ulazne vrednosti (promili), ne ukucano
const naknada = { pola: R.naknadaPola, ukupno: R.naknadaUkupno, pct: `${U.NAKNADA_PLATFORME_PROMILE / 10}%` }

const POGLEDI_IZVOR: Pogledi = {
  selling: {
    klub: S.PRODAVAC,
    protivStrana: { naziv: S.KUPAC.naziv, zemlja: S.KUPAC.zemlja },
    igrac: igracJavno,
    verzije,
    razlike,
    dogovoreno,
    udeoIgraca: udeo,
    naknada,
    escrow: { ...escrowJavno, iznos: U.RATE[0] },
    slap: { ulaz: U.RATE[0], udeoIgraca: R.isplata.igrac, naknadaPola: R.naknadaPola, neto: R.isplata.prodavacNeto },
    finansiranje: {
      finansijer: S.FINANSIJER.naziv,
      ostaliFinansijeri: S.FINANSIJER.ostali,
      potrazivanje: R.potrazivanje,
      poRati: [...R.potrazivanjePoRati],
      datumiRata: [U.DATUMI_RATA[1], U.DATUMI_RATA[2]],
      avans: R.avans,
      popust: R.popust,
      popustPct: R.popustPct,
      minimalniAvans: U.MINIMALNI_AVANS,
      datumPonude: datumIso(U.PONUDA_FINANSIJERA.datumIso),
      vaziDo: datumIso(U.PONUDA_FINANSIJERA.vaziDoIso),
      netoUkupno: R.netoProdavca,
    },
    bonusNapredak: U.B1_NASTUPI,
    sporedni: S.SPOREDNI_PRODAVAC,
    skolovanjeProcena: U.SKOLOVANJE_PROCENA,
  },
  buying: {
    klub: S.KUPAC,
    protivStrana: { naziv: S.PRODAVAC.naziv, zemlja: S.PRODAVAC.zemlja },
    igrac: igracJavno,
    verzije,
    razlike,
    dogovoreno,
    licniUslovi: {
      godina: U.UGOVOR_IGRACA.godina,
      godisnjaBruto: U.UGOVOR_IGRACA.godisnjaBruto,
      ugovorUkupno: R.ugovorUkupno,
      klinika: S.KLINIKA.naziv,
      termin: DATUM.medicinski,
    },
    agent: { ime: S.AGENT.ime, licenca: S.AGENT.licenca, licencaVaziDo: S.AGENT.licencaVaziDo, provizija: R.provizijaAgenta },
    udeoIgraca: udeo,
    naknada,
    uplata: { rata1: U.RATE[0], provizija: R.provizijaAgenta, naknadaPola: R.naknadaPola, ukupno: R.uplataKupca },
    escrow: escrowJavno,
    isplata: { igrac: R.isplata.igrac, naknada: R.isplata.naknada, agent: R.isplata.agent, ukupno: R.isplataUkupno },
    povracaj: R.povracaj,
    bonusNapredak: U.B1_NASTUPI,
    rata2UMesecima: R.dospecaMeseci[0],
    sporedni: S.SPOREDNI_KUPAC,
    skolovanjeProcena: U.SKOLOVANJE_PROCENA,
  },
  player: {
    igrac: { ...igracJavno, ime1: S.IGRAC.ime1, racunKraj: S.IGRAC.racunKraj },
    stariKlub: S.PRODAVAC.naziv,
    noviKlub: S.KUPAC.naziv,
    ugovor: { godina: U.UGOVOR_IGRACA.godina, godisnjaBruto: U.UGOVOR_IGRACA.godisnjaBruto },
    agent: { ime: S.AGENT.ime },
    udeo: {
      pct: U.UDEO_IGRACA_PCT,
      poRati: R.udeoPoRati.map((iznos, i) => ({ iznos, datum: U.DATUMI_RATA[i] })),
      ukupno: R.udeoUkupno,
      poBonusu: U.BONUSI.map((b, i) => ({ id: b.id, iznos: R.udeoPoBonusu[i] })),
    },
    klinika: { naziv: S.KLINIKA.naziv, termin: DATUM.medicinski },
    potvrdaBanke: { referenca: U.POTVRDA_BANKE_REFERENCA },
  },
  agent: {
    agent: { ime: S.AGENT.ime, licenca: S.AGENT.licenca, licencaVaziDo: S.AGENT.licencaVaziDo },
    klijent: { ...igracJavno, ime1: S.IGRAC.ime1 },
    noviKlub: S.KUPAC.naziv,
    ugovor: { godina: U.UGOVOR_IGRACA.godina, godisnjaBruto: U.UGOVOR_IGRACA.godisnjaBruto },
    provizija: { iznos: R.provizijaAgenta, pct: U.PROVIZIJA_AGENTA_PCT, platiocKupac: S.KUPAC.naziv },
    klinika: { naziv: S.KLINIKA.naziv, termin: DATUM.medicinski },
  },
  financier: {
    finansijer: { naziv: S.FINANSIJER.naziv, odeljenje: S.FINANSIJER.odeljenje },
    prodavac: S.PRODAVAC.naziv,
    duznik: S.KUPAC.naziv,
    potrazivanje: {
      nominal: R.potrazivanje,
      rate: R.potrazivanjePoRati.map((iznos, i) => ({ iznos, datum: U.DATUMI_RATA[i + 1] })),
      avans: R.avans,
      popust: R.popust,
      popustPct: R.popustPct,
      prinosGodisnje: R.prinosGodisnje,
      prosecnoDospeceMeseci: R.prosecnoDospeceMeseci,
      dospeceMeseci: [...R.dospecaMeseci],
      vaziDo: datumIso(U.PONUDA_FINANSIJERA.vaziDoIso),
      datumPonude: datumIso(U.PONUDA_FINANSIJERA.datumIso),
    },
    sporedna: S.SPOREDNA_POTRAZIVANJA,
    putPlacanja: { posrednik: S.ESCROW.naziv },
  },
}

/** Pogledi su zamrznuti: ekran ne može da ih izmeni (ni slučajno ni namerno). */
function zamrzni<T>(x: T): T {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x)
    for (const v of Object.values(x)) zamrzni(v)
  }
  return x
}
const POGLEDI: Pogledi = zamrzni(POGLEDI_IZVOR)

/** Jedini ulaz za podatke ekrana: vraća pogled koji ta uloga sme da vidi. */
export function pogled<U extends Uloga>(uloga: U): Pogledi[U] {
  return POGLEDI[uloga]
}

// ------------------------------------------------------------------ tabela "ko šta vidi" (polja koja pogled sme da ima)
// Tipizovano: kompajler odbija ime polja koje ne postoji u pogledu te uloge (potpunost proverava test).
export const DOZVOLJENA_POLJA: { [K in Uloga]: (keyof Pogledi[K])[] } = {
  selling: ['klub', 'protivStrana', 'igrac', 'verzije', 'razlike', 'dogovoreno', 'udeoIgraca', 'naknada', 'escrow', 'slap', 'finansiranje', 'bonusNapredak', 'sporedni', 'skolovanjeProcena'],
  buying: ['klub', 'protivStrana', 'igrac', 'verzije', 'razlike', 'dogovoreno', 'licniUslovi', 'agent', 'udeoIgraca', 'naknada', 'uplata', 'escrow', 'isplata', 'povracaj', 'bonusNapredak', 'rata2UMesecima', 'sporedni', 'skolovanjeProcena'],
  player: ['igrac', 'stariKlub', 'noviKlub', 'ugovor', 'agent', 'udeo', 'klinika', 'potvrdaBanke'],
  agent: ['agent', 'klijent', 'noviKlub', 'ugovor', 'provizija', 'klinika'],
  financier: ['finansijer', 'prodavac', 'duznik', 'potrazivanje', 'sporedna', 'putPlacanja'],
}

/** Imena polja koja određena uloga NIKAD ne sme da ima (za test; proširenje tabele UX 4.1). */
export const ZABRANJENA_POLJA: Record<Uloga, string[]> = {
  selling: ['licniUslovi', 'agent', 'uplata', 'povracaj'],
  buying: ['finansiranje', 'slap'],
  player: ['verzije', 'razlike', 'dogovoreno', 'provizija', 'finansiranje', 'uplata', 'isplata', 'escrow', 'naknada', 'sporedni'],
  agent: ['verzije', 'razlike', 'dogovoreno', 'finansiranje', 'uplata', 'isplata', 'escrow', 'udeo', 'udeoIgraca', 'naknada', 'sporedni'],
  financier: ['igrac', 'klijent', 'agent', 'licniUslovi', 'verzije', 'razlike', 'dogovoreno', 'provizija', 'udeo', 'udeoIgraca', 'bonusi', 'uplata', 'isplata'],
}

/**
 * Skup iznosa (celi evri) koje uloga NIKAD ne sme da vidi na ekranu. Gradi se iz scenarija, ne kuca se ručno.
 * Koristi se u testu nad podacima i u e2e probi nad prikazanim tekstom.
 */
export function zabranjeniIznosi(uloga: Uloga): number[] {
  // Iznos koji uloga LEGITIMNO vidi se nikad ne računa kao zabranjen (npr. bonus B3 i godišnja zarada igrača su oba 150,000).
  const dozvoljeni = new Set(brojeviUPogledu(POGLEDI[uloga]))
  return kandidatiZaZabranu(uloga).filter((x) => !dozvoljeni.has(x))
}

/** Svi celi brojevi u jednom pogledu (rekurzivno). */
export function brojeviUPogledu(x: unknown, izlaz: number[] = []): number[] {
  if (typeof x === 'number') izlaz.push(x)
  else if (Array.isArray(x)) x.forEach((e) => brojeviUPogledu(e, izlaz))
  else if (x && typeof x === 'object') Object.values(x).forEach((e) => brojeviUPogledu(e, izlaz))
  return izlaz
}

function kandidatiZaZabranu(uloga: Uloga): number[] {
  const svi = {
    cena: [R.fiksniUkupno, R.naslovnaVerzije(2), R.fiksniVerzije(0), R.fiksniVerzije(1)],
    rate: [...U.RATE],
    provizija: [R.provizijaAgenta],
    licniUslovi: [U.UGOVOR_IGRACA.godisnjaBruto],
    uplataKupca: [R.uplataKupca],
    financiranje: [R.potrazivanje, R.avans, R.popust],
    bonusi: U.BONUSI.map((b) => b.iznos),
    slap: [R.isplata.prodavacNeto],
    udeoIgraca: [...R.udeoPoRati, R.udeoUkupno, ...R.udeoPoBonusu], // 80,000 / 70,000 / 70,000 / 220,000 / 10,000 / 12,500 / 7,500
    naknade: [R.naknadaPola, R.naknadaUkupno], // 11,000 / 22,000
    skolovanje: [U.SKOLOVANJE_PROCENA], // 195,000
  }
  const izuzmi = (...a: number[][]) => new Set(a.flat())
  switch (uloga) {
    case 'selling':
      return [...izuzmi(svi.provizija, svi.licniUslovi, svi.uplataKupca)]
    case 'buying':
      return [...izuzmi(svi.financiranje, svi.slap)]
    case 'player':
      return [...izuzmi(svi.cena, svi.rate, svi.provizija, svi.uplataKupca, svi.financiranje, svi.bonusi, svi.slap, svi.naknade, svi.skolovanje)]
    case 'agent':
      return [...izuzmi(svi.cena, svi.rate, svi.uplataKupca, svi.financiranje, svi.bonusi, svi.slap, svi.udeoIgraca, svi.naknade, svi.skolovanje)]
    case 'financier':
      return [...izuzmi(svi.cena, svi.rate, svi.provizija, svi.licniUslovi, svi.uplataKupca, svi.bonusi, svi.slap, svi.udeoIgraca, svi.naknade, svi.skolovanje)]
  }
}

/** Imena i nizovi koje uloga NIKAD ne sme da vidi (iz scenarija). */
export function zabranjeniNizovi(uloga: Uloga): string[] {
  switch (uloga) {
    case 'financier':
      // poređenje ne razlikuje velika i mala slova; reči "player"/"agent" same nisu zabranjene (dugmad za izbor uloge)
      return [S.IGRAC.ime, S.IGRAC.ime1, S.IGRAC.kratko, S.AGENT.ime, S.AGENT.licenca, 'agent commission', '5% share', "player's share", 'platform fee', 'bonus', 'sell-on', 'the agent', "agent's"]
    case 'agent':
      return ['Sell-on', 'Bonus B1', 'Bonuses', '5% share', "player's share"]
    case 'player':
      return ['Sell-on', 'Offer v1', 'Offer v2', 'Offer v3', 'agent commission', 'Agent commission']
    case 'selling':
      return [S.AGENT.ime, 'Agent commission', 'agent commission', 'Medical report']
    case 'buying':
      // kupac ne vidi finansiranje potraživanja prodavca
      return ['Meridian', 'Aldermoor', 'Brightwater', 'receivable', 'Receivable', 'Financing']
  }
}
