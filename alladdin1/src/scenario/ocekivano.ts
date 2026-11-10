// KONTROLNA TABELA: ključne vrednosti PREPISANE iz dizajn/UX.md odeljak 8 (cena EUR 2,500 po putniku), napisane JEDNOM, kao očekivanje.
// ocekivano.test.ts poredi izračunato (racun.ts / stanjeGrupe.ts) sa ovim. Ako se kod i dizajn razidu, test pada i kaže koja tvrdnja iz UX.md više ne važi.
// Pri promeni cene menjaju se uslovi.ts i OVA tabela (i UX.md radi pregleda), ništa drugo.
import { brojRadnji } from '../prica/koraci'
import type { Ishod, Poz } from '../prica/tipovi'

export const POC = (korak: number, ishod: Ishod = 'A'): Poz => ({ korak, n: 0, ishod })
export const KRAJ = (korak: number, ishod: Ishod = 'A'): Poz => ({ korak, n: brojRadnji(korak, ishod), ishod })

/** UX 8.1 — paket Macau. */
export const OCEKIVANO_PAKET = {
  sedista: 120,
  cenaV1: 2350,
  cenaV2: 2500,
  vrednostV2: 300000,
  vrednostV1: 282000,
  razlikaUkupno: 18000,
  avansGrupe: 60000,
  avansGrupeV1: 56400,
  avansPoPutniku: 500,
  rata2PoPutniku: 1000,
  rata3PoPutniku: 1000,
  rata2Grupe: 120000,
  rata3Grupe: 120000,
  standardSobaV2: 110,
  vipApartmana: 10,
} as const

/** UX 8.3 i 8.4 — ishodi B i C. */
export const OCEKIVANO_ISHODI = {
  kreditnaNotaB: 12000,
  blokB: 96,
  vrednostB: 240000,
  avansZadrzanB: 48000,
  standardSobaB: 86,
  troskoviObradeC: 6000,
  povracajC: 150000,
  povracajAvansaC: 54000,
  povracajPutnicimaC: 96000,
  placenoDoRokaC: 156000,
} as const

type RedStanja = { poz: Poz; upisano: number; rata2: number; placeno: number; preostalo: number; fakture: number; naziv: string }
/** UX 8.4 — stanje grupe po koracima i ishodu. */
export const OCEKIVANO_STANJE: RedStanja[] = [
  // međupozicije koraka 4: ponuda prihvaćena (rezervacija postoji), avans još nije stigao
  { naziv: '4.prihvati', poz: { korak: 4, n: 1, ishod: 'A' }, upisano: 0, rata2: 0, placeno: 0, preostalo: 300000, fakture: 0 },
  { naziv: '4.transfer', poz: { korak: 4, n: 2, ishod: 'A' }, upisano: 0, rata2: 0, placeno: 0, preostalo: 300000, fakture: 0 },
  { naziv: 'korak 4 završno', poz: KRAJ(4), upisano: 0, rata2: 0, placeno: 60000, preostalo: 240000, fakture: 1 },
  // posle uvoza 57 upisanih; posle linka isto (63 pozivnice poslato), 120 tek na kraju koraka 5
  { naziv: 'korak 5 posle uvoza', poz: { korak: 5, n: 1, ishod: 'A' }, upisano: 57, rata2: 0, placeno: 60000, preostalo: 240000, fakture: 1 },
  { naziv: 'korak 5 posle linka', poz: { korak: 5, n: 2, ishod: 'A' }, upisano: 57, rata2: 0, placeno: 60000, preostalo: 240000, fakture: 1 },
  { naziv: 'korak 5 završno', poz: KRAJ(5), upisano: 120, rata2: 0, placeno: 60000, preostalo: 240000, fakture: 1 },
  { naziv: 'korak 6 početno', poz: POC(6), upisano: 120, rata2: 0, placeno: 60000, preostalo: 240000, fakture: 1 },
  { naziv: 'korak 6 završno', poz: KRAJ(6), upisano: 120, rata2: 96, placeno: 156000, preostalo: 144000, fakture: 1 },
  { naziv: 'korak 7 početno', poz: POC(7), upisano: 120, rata2: 96, placeno: 156000, preostalo: 144000, fakture: 1 },
  { naziv: '7 završno A', poz: KRAJ(7), upisano: 120, rata2: 120, placeno: 180000, preostalo: 120000, fakture: 1 },
  // kreditna nota se izdaje pri izboru manjeg bloka (7.izbor), pa je već na kraju koraka 7 u ishodu B 2 dokumenta (UX 8.4 navodi 1; PLAN B14)
  { naziv: '7 završno B', poz: KRAJ(7, 'B'), upisano: 96, rata2: 96, placeno: 144000, preostalo: 96000, fakture: 2 },
  { naziv: '8 završno A', poz: KRAJ(8), upisano: 120, rata2: 120, placeno: 300000, preostalo: 0, fakture: 121 },
  { naziv: '8 završno B', poz: KRAJ(8, 'B'), upisano: 96, rata2: 96, placeno: 240000, preostalo: 0, fakture: 98 },
  // ishod C: posle otkaza nema upisanih ni preostalog; plaćeno do povraćaja ostaje vidljivo (UX 8.4)
  { naziv: '7 završno C', poz: KRAJ(7, 'C'), upisano: 0, rata2: 96, placeno: 156000, preostalo: 0, fakture: 1 },
  { naziv: '8 završno C', poz: KRAJ(8, 'C'), upisano: 0, rata2: 96, placeno: 156000, preostalo: 0, fakture: 2 },
]

/** UX 8.4 — procenti plaćenog. */
export const OCEKIVANO_PROCENTI = [
  { poz: KRAJ(6), procenat: 52 },
  { poz: KRAJ(7), procenat: 60 },
  { poz: KRAJ(7, 'B'), procenat: 60 },
  { poz: KRAJ(8), procenat: 100 },
  // ishod C: grupa nema rezervaciju, pa nema ni procenta (ekran umesto njega piše plaćeno / vraćeno / zadržano)
  { poz: KRAJ(7, 'C'), procenat: 0 },
  { poz: KRAJ(8, 'C'), procenat: 0 },
]

type RedTable = { naziv: string; poz: Poz; aktivne: number; potvrdjeni: number; sedista: number; preostalo: number }
/** UX 8.5 — pločice table organizatora (Macau je uključen kad je rezervacija otvorena). */
export const OCEKIVANO_TABLA: RedTable[] = [
  { naziv: 'pre koraka 4', poz: KRAJ(3), aktivne: 2, potvrdjeni: 111, sedista: 130, preostalo: 156800 },
  // UX 8.5 navodi 396,800 za korak 4–5 (posle avansa); dok avans nije stigao, Macau ima celih 300,000 preostalo (PLAN B14)
  { naziv: '4.prihvati', poz: { korak: 4, n: 1, ishod: 'A' }, aktivne: 3, potvrdjeni: 111, sedista: 250, preostalo: 456800 },
  { naziv: '4.transfer', poz: { korak: 4, n: 2, ishod: 'A' }, aktivne: 3, potvrdjeni: 111, sedista: 250, preostalo: 456800 },
  { naziv: 'korak 4 završno', poz: KRAJ(4), aktivne: 3, potvrdjeni: 111, sedista: 250, preostalo: 396800 },
  { naziv: 'korak 5 posle linka', poz: { korak: 5, n: 2, ishod: 'A' }, aktivne: 3, potvrdjeni: 168, sedista: 250, preostalo: 396800 },
  { naziv: 'korak 5 posle uvoza', poz: { korak: 5, n: 1, ishod: 'A' }, aktivne: 3, potvrdjeni: 168, sedista: 250, preostalo: 396800 },
  { naziv: 'korak 5 završno', poz: KRAJ(5), aktivne: 3, potvrdjeni: 231, sedista: 250, preostalo: 396800 },
  { naziv: 'korak 6 završno', poz: KRAJ(6), aktivne: 3, potvrdjeni: 231, sedista: 250, preostalo: 300800 },
  { naziv: '7 završno A', poz: KRAJ(7), aktivne: 3, potvrdjeni: 231, sedista: 250, preostalo: 276800 },
  { naziv: '8 završno A', poz: KRAJ(8), aktivne: 3, potvrdjeni: 231, sedista: 250, preostalo: 156800 },
  { naziv: '7 završno B', poz: KRAJ(7, 'B'), aktivne: 3, potvrdjeni: 207, sedista: 226, preostalo: 252800 },
  { naziv: '8 završno B', poz: KRAJ(8, 'B'), aktivne: 3, potvrdjeni: 207, sedista: 226, preostalo: 156800 },
  { naziv: 'posle otkaza (C)', poz: KRAJ(7, 'C'), aktivne: 2, potvrdjeni: 111, sedista: 130, preostalo: 156800 },
  { naziv: '8 završno C', poz: KRAJ(8, 'C'), aktivne: 2, potvrdjeni: 111, sedista: 130, preostalo: 156800 },
]

/** UX 8.5 — dve fiksne grupe. */
export const OCEKIVANO_SPOREDNE = {
  vegas: { vrednost: 96000, placeno: 19200, preostalo: 76800, rata2: 38400 },
  grandPrix: { vrednost: 100000, placeno: 20000, preostalo: 80000, rata2: 40000 },
} as const

/** UX 8.2 — putnik Marko Petrović. */
export const OCEKIVANO_MARKO = [
  { naziv: 'korak 5 završno', poz: KRAJ(5), placeno: 500, preostalo: 2000 },
  { naziv: 'korak 6 završno', poz: KRAJ(6), placeno: 1500, preostalo: 1000 },
  { naziv: 'korak 8 završno A', poz: KRAJ(8), placeno: 2500, preostalo: 0 },
]

/** UX 8.7 — ostali tokovi. */
export const OCEKIVANO_TOKOVI = {
  krstarenje: { osnova: 7495, dodaci: 995, takse: 700, ukupno: 9190 },
  monteKarlo: { ukupno: 50000, avans: 10000, saldo: 40000 },
  konsijerz: { ukupno: 7260 },
  transport: { helikopter: 1850 },
} as const

/**
 * Tekstovi koje ekrani G6, G13, G14, T6 i V3 moraju da pokažu u ključnim stanjima, napisani NEZAVISNO od stanjeGrupe
 * (e2e-tokovi/e2e-zabrane ih porede sa stvarnim ekranom). `iznosi` su brojevi iz UX 8; format "EUR 150,000" pravi ekran.
 */
export const OCEKIVANO_EKRANI = {
  g13C: { poz: KRAJ(8, 'C'), tekst: ['EUR 156,000', 'EUR 150,000', 'EUR 6,000'], nema: ['0% paid'] },
  g14A: { poz: KRAJ(8), tekst: ['EUR 300,000'] },
  g14B: { poz: KRAJ(8, 'B'), tekst: ['EUR 240,000', 'EUR −12,000'] },
  g14C: { poz: KRAJ(8, 'C'), tekst: ['Retained handling fee', 'EUR 6,000'] },
  t6C: { poz: KRAJ(8, 'C'), tekst: ['Cancelled — not charged', 'Covered by group deposit'] },
  v3B: { poz: KRAJ(7, 'B'), tekst: ['EUR 60,000', 'EUR −12,000'] },
  g6: { poz: KRAJ(8), tekst: ['EUR 156,800'] },
} as const
