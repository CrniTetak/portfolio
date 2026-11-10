// SNIMAK GRUPE za poziciju (korak, n, ishod): JEDINA funkcija iz koje ekrani grupe čitaju brojke (B3).
// Sve se izvodi iz toga koje su radnje priče odrađene (prica/koraci.ts) i iz racun.ts; ništa nije upisano rukom.
import { odradjene } from '../prica/koraci'
import type { Poz } from '../prica/tipovi'
import { datumiKoraka, GRAND_PRIX_RATA2, VEGAS_RATA2, ROK_AVANSA, ROK_POPUNJENOSTI, ROK_RATE3, type Dat } from './datumi'
import * as R from './racun'

export type StatusKod = 'missing' | 'covered' | 'paid' | 'due' | 'paid_full' | 'released' | 'refund' | 'cancelled'
export type RedStatusa = { ime: string; kod: StatusKod; iznos: number }

export type AkcijaPotrebna =
  | { kod: 'avans_rok'; datum: Dat }
  | { kod: 'neplacena_sedista'; n: number; datum: Dat }
  | { kod: 'rata3_otvorena'; n: number; datum: Dat }
  | { kod: 'neupisani_gp'; n: number }

export type RedTable = {
  id: 'vegas' | 'grandPrix' | 'macau'
  sedista: number
  vrednost: number
  placeno: number
  preostalo: number
  upisano: number
  /** Sledeći rok (null = nema). `vrsta` je oznaka roka za prikaz. */
  rok: { datum: Dat | null; vrsta: 'rata2' | 'avans' | 'popunjenost' | 'rata3' | 'nema'; iznos: number }
}

export type StanjeGrupe = {
  korak: number
  /** 0–5: Quote · Deposit · Enrollment · Payments · Fill deadline · Documents (G7). */
  faza: number
  verzija: 0 | 1 | 2
  /** Upit je poslat (korak 1 završen). */
  upit: boolean
  izmeneTrazene: boolean
  prihvacena: boolean
  transferPoslat: boolean
  avansPrimljen: boolean
  upisano: number
  /** Redova iz CSV koji čekaju e-mail (samo posle uvoza, pre linka). */
  cekaEmail: number
  /** Pozivnice poslate preko linka, a putnici još nisu završili upis (prikaz "57 enrolled · 63 invitations sent"). */
  pozivnicePoslate: number
  nepotpuniPodaci: number
  slobodnoMesta: number
  blokSedista: number
  cenaPoSedistu: number
  vrednostBloka: number
  avansPlacen: number
  rata2Sedista: number
  /** Iznosi rata: plaćeno i STVARNO preostalo (ne konstanta za celu grupu). */
  rata2Placeno: number
  rata3Placeno: number
  rata2Ostalo: number
  rata3Ostalo: number
  rata3Sedista: number
  placeno: number
  preostalo: number
  procentPlaceno: number
  fakture: number
  kreditnaNota: number
  /** Iznos kreditne note od izbora manjeg bloka (ishod B); red u istoriji transakcija. */
  kreditnaNotaIznos: number
  blokPotvrdjen: boolean
  opcijePoslate: boolean
  izbor: 'none' | 'B' | 'C'
  otkazano: boolean
  zatvoreno: boolean
  paketPutovanja: 'none' | 'being' | 'issued'
  povracaj: { ukupno: number; avansDeo: number; putniciDeo: number; zadrzano: number; potvrdjen: boolean } | null
  /** Neplaćena sedišta (rata 2) u koraku 6–7; 0 kad je rešeno. */
  neplacenaSedista: number
  standardSoba: number
  vipApartmana: number
  marko: { upisan: boolean; placeno: number; preostalo: number; povracaj: number; rata2Placena: boolean; rata3Placena: boolean }
}

export function stanjeGrupe(p: Poz): StanjeGrupe {
  const d = odradjene(p)
  const ima = (id: string) => d.has(id)
  const k = p.korak
  const izbor: 'none' | 'B' | 'C' = ima('7.izbor') ? (p.ishod === 'B' ? 'B' : p.ishod === 'C' ? 'C' : 'none') : 'none'
  const otkazano = izbor === 'C'
  const verzija: 0 | 1 | 2 = ima('3.v2') ? 2 : ima('2.v1') ? 1 : 0
  const prihvacena = ima('4.prihvati')
  const avansPrimljen = ima('4.avans')
  // 57 posle uvoza; 120 tek kad putnici završe upis (kraj koraka 5, radnja 5.upis3); link samo šalje pozivnice
  const upisano = otkazano ? 0 : izbor === 'B' ? R.BLOK_B : ima('5.upis3') ? R.SEDISTA : ima('5.uvoz') ? R.UPIS.spremnoZaUvoz : 0
  const blokSedista = otkazano ? 0 : izbor === 'B' ? R.BLOK_B : R.SEDISTA
  const cena = verzija === 1 ? R.CENA_V1 : R.CENA_V2
  const vrednostBloka = otkazano ? 0 : !prihvacena ? (verzija === 0 ? 0 : R.vrednost(cena)) : izbor === 'B' ? R.VREDNOST_B : R.vrednostV2
  const avansPlacen = avansPrimljen ? (izbor === 'B' ? R.AVANS_ZADRZAN_B : R.AVANS_GRUPE) : 0
  const rata2Sedista = ima('7.sim') ? R.SEDISTA : ima('6.podsetnik') ? R.RATA2_PLACENO_DO_ROKA : ima('6.rata2') ? 1 : 0
  const rata3Sedista = ima('8.sim') ? blokSedista : ima('8.rata3') ? 1 : 0
  const placeno = avansPlacen + rata2Sedista * R.RATA2_PO_PUTNIKU + rata3Sedista * R.RATA3_PO_PUTNIKU
  // Posle otkaza (ishod C) grupa više nema rezervaciju: "preostalo" je 0, a plaćeno ostaje vidljivo do povraćaja.
  const preostalo = !prihvacena || otkazano ? 0 : vrednostBloka - placeno
  // kreditna nota za oslobođena sedišta se izdaje JEDNOM, pri izboru manjeg bloka (7.izbor): isti uslov u istoriji G13, brojaču faktura i izvodu G14
  const kreditnaB = izbor === 'B' ? R.KREDITNA_NOTA_B : 0
  const fakture =
    !avansPrimljen ? 0 : p.ishod === 'C' ? 1 + (ima('8.povracaj') ? 1 : 0) : 1 + (kreditnaB ? 1 : 0) + rata3Sedista
  const povracaj = otkazano
    ? { ukupno: R.POVRACAJ_UKUPNO_C, avansDeo: R.POVRACAJ_AVANSA_C, putniciDeo: R.POVRACAJ_PUTNICIMA_C, zadrzano: R.TROSKOVI_OBRADE_C, potvrdjen: ima('8.povracaj') }
    : null
  const markoUpisan = ima('5.upis3')
  const markoPlaceno = !markoUpisan ? 0 : R.MARKO_UPIS_PLACENO + (ima('6.rata2') ? R.RATA2_PO_PUTNIKU : 0) + (ima('8.rata3') ? R.RATA3_PO_PUTNIKU : 0)
  const markoPuno = R.CENA_V2
  const neplacena = k >= 6 && ima('6.podsetnik') && !ima('7.sim') && izbor === 'none' ? R.NEPLACENO_NA_ROKU : 0

  return {
    korak: k,
    faza: k <= 3 ? 0 : k === 4 ? 1 : k === 5 ? 2 : k === 6 ? 3 : k === 7 ? 4 : 5,
    verzija,
    upit: ima('1.zahtev'),
    izmeneTrazene: ima('3.izmene'),
    prihvacena,
    transferPoslat: ima('4.transfer'),
    avansPrimljen,
    upisano,
    cekaEmail: ima('5.uvoz') && !ima('5.link') ? R.UPIS.cekaEmail : 0,
    pozivnicePoslate: ima('5.link') && !ima('5.upis3') ? R.SEDISTA - R.UPIS.spremnoZaUvoz : 0,
    nepotpuniPodaci: ima('5.upis3') && k <= 6 ? R.UPIS.nepotpuniPodaci : 0,
    slobodnoMesta: blokSedista - upisano,
    blokSedista,
    cenaPoSedistu: cena,
    vrednostBloka,
    avansPlacen,
    rata2Sedista,
    rata3Sedista,
    rata2Placeno: rata2Sedista * R.RATA2_PO_PUTNIKU,
    rata3Placeno: rata3Sedista * R.RATA3_PO_PUTNIKU,
    rata2Ostalo: otkazano || !avansPrimljen ? 0 : (blokSedista - rata2Sedista) * R.RATA2_PO_PUTNIKU,
    rata3Ostalo: otkazano || !avansPrimljen ? 0 : (blokSedista - rata3Sedista) * R.RATA3_PO_PUTNIKU,
    placeno,
    preostalo,
    procentPlaceno: vrednostBloka === 0 ? 0 : Math.floor((placeno * 100) / vrednostBloka),
    fakture,
    kreditnaNota: kreditnaB,
    kreditnaNotaIznos: kreditnaB,
    blokPotvrdjen: ima('7.potvrda'),
    opcijePoslate: ima('7.opcije'),
    izbor,
    otkazano,
    zatvoreno: ima('9.zatvori'),
    paketPutovanja: ima('9.paket') ? 'issued' : k >= 9 ? 'being' : 'none',
    povracaj,
    neplacenaSedista: neplacena,
    standardSoba: verzija === 2 || prihvacena ? (izbor === 'B' ? R.STANDARD_SOBA_B : R.STANDARD_SOBA_V2) : R.SEDISTA,
    vipApartmana: verzija === 2 || prihvacena ? R.VIP_APARTMANA : 0,
    marko: {
      upisan: markoUpisan,
      placeno: markoPlaceno,
      preostalo: otkazano || !markoUpisan ? 0 : markoPuno - markoPlaceno,
      povracaj: otkazano && markoUpisan ? R.RATA2_PO_PUTNIKU : 0,
      rata2Placena: ima('6.rata2'),
      rata3Placena: ima('8.rata3'),
    },
  }
}

/** Status četiri putnika sa spiska G8 (UX 8.6). Prazno dok nema upisanih. */
export function statusiPutnika(p: Poz, imena: { marko: string; teodora: string; ana: string; mateo: string }): RedStatusa[] {
  const d = odradjene(p)
  const ima = (id: string) => d.has(id)
  const s = stanjeGrupe(p)
  if (!ima('5.uvoz')) return []
  // dok putnici nisu završili upis (kraj koraka 5), na spisku su samo oni koji su već upisani preko uvoza; ostali stižu preko linka
  if (!ima('5.upis3')) {
    return [
      { ime: imena.ana, kod: 'covered', iznos: 0 },
      { ime: imena.mateo, kod: 'covered', iznos: 0 },
    ]
  }
  const uBloku = (kod: StatusKod, iznos: number) => ({ kod, iznos })
  const ostali = (): { kod: StatusKod; iznos: number } => {
    if (s.otkazano) return uBloku('refund', R.RATA2_PO_PUTNIKU)
    if (ima('8.sim')) return uBloku('paid_full', R.CENA_V2)
    if (ima('6.podsetnik')) return uBloku('paid', R.AVANS_PO_PUTNIKU + R.RATA2_PO_PUTNIKU)
    return uBloku('covered', 0)
  }
  const marko = (): { kod: StatusKod; iznos: number } => {
    if (s.otkazano) return uBloku('refund', R.RATA2_PO_PUTNIKU)
    if (ima('8.rata3')) return uBloku('paid_full', R.CENA_V2)
    if (ima('6.rata2')) return uBloku('paid', R.AVANS_PO_PUTNIKU + R.RATA2_PO_PUTNIKU)
    return uBloku('covered', 0)
  }
  const teodora = (): { kod: StatusKod; iznos: number } => {
    if (s.otkazano) return uBloku('cancelled', 0)
    if (s.izbor === 'B') return uBloku('released', 0)
    if (ima('7.sim')) return ima('8.sim') ? uBloku('paid_full', R.CENA_V2) : uBloku('paid', R.AVANS_PO_PUTNIKU + R.RATA2_PO_PUTNIKU)
    if (ima('6.podsetnik')) return uBloku('due', R.RATA2_PO_PUTNIKU)
    return uBloku('covered', 0)
  }
  return [
    { ime: imena.marko, ...marko() },
    { ime: imena.teodora, ...teodora() },
    { ime: imena.ana, ...ostali() },
    { ime: imena.mateo, ...ostali() },
  ]
}

/** Tabla organizatora (G6): sve iz jednog izvora (UX 8.5). */
export function tabla(p: Poz) {
  const s = stanjeGrupe(p)
  const redovi: RedTable[] = [
    {
      id: 'vegas',
      sedista: R.VEGAS.sedista,
      vrednost: R.VEGAS.vrednost,
      placeno: R.VEGAS.placeno,
      preostalo: R.VEGAS.preostalo,
      upisano: R.VEGAS.upisano,
      rok: { datum: VEGAS_RATA2, vrsta: 'rata2', iznos: R.VEGAS.rata2 },
    },
    {
      id: 'grandPrix',
      sedista: R.GRAND_PRIX.sedista,
      vrednost: R.GRAND_PRIX.vrednost,
      placeno: R.GRAND_PRIX.placeno,
      preostalo: R.GRAND_PRIX.preostalo,
      upisano: R.GRAND_PRIX.upisano,
      rok: { datum: GRAND_PRIX_RATA2, vrsta: 'rata2', iznos: R.GRAND_PRIX.rata2 },
    },
  ]
  if (s.prihvacena && !s.otkazano) {
    const rok: RedTable['rok'] = !s.avansPrimljen
      ? { datum: ROK_AVANSA, vrsta: 'avans', iznos: R.AVANS_GRUPE }
      : s.rata2Ostalo > 0 && p.korak <= 7
        ? { datum: ROK_POPUNJENOSTI, vrsta: 'popunjenost', iznos: s.rata2Ostalo }
        : s.rata3Ostalo > 0
          ? { datum: ROK_RATE3, vrsta: 'rata3', iznos: s.rata3Ostalo }
          : { datum: null, vrsta: 'nema', iznos: 0 }
    redovi.push({ id: 'macau', sedista: s.blokSedista, vrednost: s.vrednostBloka, placeno: s.placeno, preostalo: s.preostalo, upisano: s.upisano, rok })
  }
  const akcije: AkcijaPotrebna[] = [{ kod: 'neupisani_gp', n: R.GRAND_PRIX.neupisano }]
  if (s.prihvacena && !s.avansPrimljen) akcije.push({ kod: 'avans_rok', datum: ROK_AVANSA })
  if (s.neplacenaSedista > 0) akcije.push({ kod: 'neplacena_sedista', n: s.neplacenaSedista, datum: ROK_POPUNJENOSTI })
  if (!s.otkazano && p.korak >= 8 && s.rata3Sedista < s.blokSedista && s.avansPrimljen) {
    akcije.push({ kod: 'rata3_otvorena', n: s.blokSedista - s.rata3Sedista, datum: ROK_RATE3 })
  }
  return {
    redovi,
    aktivne: redovi.length,
    potvrdjeniPutnici: redovi.reduce((z, r) => z + r.upisano, 0),
    ukupnoSedista: redovi.reduce((z, r) => z + r.sedista, 0),
    preostaloZaNaplatu: redovi.reduce((z, r) => z + r.preostalo, 0),
    akcije,
  }
}

export type RedTransakcije = { id: string; datum: Dat; iznos: number; nacin: string; status: 'Paid' | 'Issued' | 'Confirmed' | 'Processing' }

/**
 * Istorija transakcija grupe (G13). Avans je UVEK pun iznos; kreditna nota je poseban red (od izbora manjeg bloka);
 * zbir svih redova osim povraćaja jednak je placeno (proverava transakcije.test.ts).
 */
export function istorijaTransakcija(p: Poz): RedTransakcije[] {
  const s = stanjeGrupe(p)
  const k = (korak: number) => datumiKoraka(korak, p.ishod).at(-1)!
  const redovi: RedTransakcije[] = []
  if (s.avansPrimljen) redovi.push({ id: 'deposit', datum: k(4), iznos: R.AVANS_GRUPE, nacin: R.NACIN_PLACANJA.avans, status: 'Paid' })
  if (s.rata2Sedista > 0) redovi.push({ id: 'rata2', datum: k(6), iznos: s.rata2Placeno, nacin: R.NACIN_PLACANJA.rata2, status: 'Paid' })
  if (s.kreditnaNotaIznos > 0) redovi.push({ id: 'kreditna', datum: datumiKoraka(7, p.ishod).at(-1)!, iznos: -s.kreditnaNotaIznos, nacin: '—', status: 'Issued' })
  if (s.rata3Sedista > 0) redovi.push({ id: 'rata3', datum: k(8), iznos: s.rata3Placeno, nacin: R.NACIN_PLACANJA.rata3, status: 'Paid' })
  return redovi
}

/**
 * Izvod grupe (G14): faktura avansa, kreditna nota i fakture putnika (broj × iznos). Ishod B: kreditna nota za oslobođena sedišta;
 * ishod C: kreditna nota za povraćaj avansa (posle potvrde povraćaja), putnicima se uplate vraćaju u celosti (bez faktura).
 */
export function izvod(p: Poz) {
  const s = stanjeGrupe(p)
  const avansFaktura = s.avansPrimljen ? R.AVANS_GRUPE : 0
  const kreditnaNota = s.kreditnaNota > 0 ? -s.kreditnaNota : p.ishod === 'C' && s.povracaj?.potvrdjen ? -R.POVRACAJ_AVANSA_C : 0
  const brojFaktura = p.ishod === 'C' ? 0 : s.rata3Sedista
  const fakturePutnika = brojFaktura * R.FAKTURA_PUTNIKA
  return { avansFaktura, kreditnaNota, brojFaktura, fakturePutnika, ukupno: avansFaktura + kreditnaNota + fakturePutnika }
}
