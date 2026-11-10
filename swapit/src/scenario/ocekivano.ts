// KONTROLNA TABELA: brojke prepisane RUKOM iz UX.md 7.1–7.8 (ne računaju se iz podataka — zato su dokaz da se podaci slažu sa dizajnom).
// Test (ocekivano.test.ts) poredi svet() sa ovim brojevima i kaže koja tvrdnja iz UX-a više ne važi.
// Ako se dizajn promeni, menja se ovde i u oglasi.ts / korisnici.ts; ako se ne slažu, test pada.

/** UX 7.3: kategorija → [ukupno, roba, usluge, ideje] na početku priče (korak 1). */
export const KATEGORIJE_OCEKIVANO: Record<string, [number, number, number, number]> = {
  'bebe-i-deca': [14, 13, 0, 1],
  knjige: [16, 16, 0, 0],
  'igre-i-konzole': [13, 13, 0, 0],
  'sport-i-rekreacija': [14, 12, 0, 2],
  'bicikli-i-trotineti': [12, 8, 4, 0],
  namestaj: [14, 12, 2, 0],
  odeca: [12, 12, 0, 0],
  'sveze-voce-i-povrce': [8, 8, 0, 0],
  'it-oprema': [8, 6, 0, 2],
  'mobilni-telefoni': [8, 6, 2, 0],
  'racunari-i-laptopovi': [8, 5, 3, 0],
  'audio-i-video': [8, 8, 0, 0],
  'alati-i-masine': [8, 5, 3, 0],
  'igracke-i-hobiji': [8, 8, 0, 0],
  'kucni-aparati': [6, 3, 3, 0],
  'kuhinjski-aparati': [6, 6, 0, 0],
  'kucni-dekor': [6, 3, 0, 3],
  'muzika-i-instrumenti': [6, 5, 0, 1],
  'basta-i-biljke': [6, 3, 2, 1],
  kamping: [6, 5, 0, 1],
  'zdravlje-i-lepota': [3, 3, 0, 0],
  'kancelarijska-oprema': [3, 3, 0, 0],
  kolekcionarstvo: [4, 4, 0, 0],
  'ljubimci-oprema': [3, 3, 0, 0],
  'foto-i-video': [4, 4, 0, 0],
  'gradjevinski-materijal': [4, 1, 2, 1],
  'rasveta-i-elektrika': [5, 2, 3, 0],
  'nakit-i-satovi': [3, 3, 0, 0],
  'poljoprivredne-masine': [3, 3, 0, 0],
  vozila: [3, 3, 0, 0],
  nekretnine: [3, 3, 0, 0],
}

/** UX 7.3: zbir po gustini (gusto 7 kategorija, srednje 13, malo 11). */
export const GUSTINA_OCEKIVANO = { gusto: { kategorija: 7, oglasa: 95 }, srednje: { kategorija: 13, oglasa: 92 }, malo: { kategorija: 11, oglasa: 38 } }

/** UX 7.3: ukupno na početku (korak 1) i posle koraka 2 (Anin PlayStation 2). */
export const UKUPNO_POCETAK = { ukupno: 225, roba: 189, usluge: 24, ideje: 12 }
export const UKUPNO_POSLE_KORAKA_2 = { ukupno: 226, roba: 190, usluge: 24, ideje: 12 }

/** UX 7.3: način (za razmenu / za poene / poklanjam). */
export const NACIN_POCETAK = { razmena: 162, poeni: 38, poklon: 25 }
export const NACIN_POSLE_KORAKA_2 = { razmena: 163, poeni: 38, poklon: 25 }
/** UX 7.3: oglasi „za poene“ po vrednosti. */
export const POENI_PO_VREDNOSTI = { 10: 14, 25: 12, 50: 8, 100: 4 }

/** UX 7.3: tip razmene (nudim → tražim) za 162 oglasa „za razmenu“ (u zagradi UX daje vrednost posle koraka 2: roba za robu 86). */
export const TIPOVI_POCETAK = { rr: 85, ru: 27, ri: 14, ur: 14, uu: 6, ui: 4, ir: 7, iu: 3, ii: 2 }

/** UX 7.3: Građanin / Firma i istaknuto / aukcije. */
export const GRADJANIN_FIRMA_POCETAK = { gradjanin: 198, firma: 27 }
export const GRADJANIN_FIRMA_POSLE_KORAKA_2 = { gradjanin: 199, firma: 27 }
export const ISTAKNUTO = { red: 5, top: 1, premium: 2, ukupno: 8 }
export const AUKCIJE = 6

/** UX 7.2: oglasi po firmama (27 = 5 + 4 + 3 + 2 + 3 + 2 + 3 + 5). */
export const OGLASA_PO_FIRMI: Record<string, number> = { zupcanik: 5, pedala: 4, dule: 3, hrast: 2, cekic: 3, belizid: 2, zavrtanj: 3, bajt: 5 }

/** UX 7.1: korisnik → [razmene, recenzije, prosek (prikaz), poeni na početku priče]. */
export const KORISNICI_OCEKIVANO: Record<string, [number, number, string, number]> = {
  marko_voz77: [18, 11, '4,7', 35],
  jovana_vra91: [46, 29, '4,8', 60],
  nenad_pal65: [4, 2, '4,5', 10],
  mila_cuk88: [22, 14, '4,6', 40],
  stefan_nbg93: [9, 5, '4,4', 15],
  irena_zem80: [31, 20, '4,9', 110],
  // UX 7.1 kaže 7 recenzija i 4,5; to sa celim zvezdicama nije moguće (PLAN B14): uzeto 4,6.
  bojan_rak72: [12, 7, '4,6', 25],
  sanja_sur85: [5, 3, '4,7', 10],
}

/** UX 7.4 (glavni tok): stanje na kraju koraka 1, 2 i 8. */
export const STANJE_LANAC = {
  korak1: { poeni: { ana: 20, marko: 35, jovana: 60 }, razmeneRecenzije: { ana: [0, 0], marko: [18, 11], jovana: [46, 29] }, oglasa: 225, razmenjeno: 1284 },
  korak2: { poeni: { ana: 20, marko: 35, jovana: 60 }, razmeneRecenzije: { ana: [0, 0], marko: [18, 11], jovana: [46, 29] }, oglasa: 226, razmenjeno: 1284 },
  korak8: { poeni: { ana: 20, marko: 35, jovana: 60 }, razmeneRecenzije: { ana: [1, 1], marko: [19, 12], jovana: [47, 30] }, oglasa: 223, razmenjeno: 1287, igre: 13, bicikli: 11, knjige: 15 },
}

/** UX 7.5 (račva „za poene“): 6R početak, 7R i 8R kraj. */
export const STANJE_POENI = {
  korak6: { poeni: { ana: 20, marko: 35, jovana: 60 }, razmene: { ana: 0, marko: 18, jovana: 46 }, oglasa: 226, razmenjeno: 1284 },
  korak7: { poeni: { ana: 70, marko: 35, jovana: 60 }, razmene: { ana: 1, marko: 18, jovana: 47 }, oglasa: 225, razmenjeno: 1285 },
  korak8: { poeni: { ana: 20, marko: 85, jovana: 60 }, razmene: { ana: 2, marko: 19, jovana: 47 }, oglasa: 224, razmenjeno: 1286, recenzije: { ana: 0, marko: 12 } },
}

/** PLAN B5.10: značka paketa kod Marka. */
export const ZNACKA_MARKO = { korak3: 2, korak4Pocetno: 2, korak4Zavrsno: 3, korak5Pocetno: 3, korak5Zavrsno: 2, korak6: 2 }

/** PK7: Anina značka na paketu. Paket čeka Anu dok ne prihvati lanac (6.ana) ili, u grani „poeni“, dok ne uzme bicikl za poene (6R.uzmi). */
export const ZNACKA_ANA = { korak3Pocetno: 1, korak4: 0, korak5Zavrsno: 1, korak6LanacPosleAna: 0, korak6PoeniPre: 1, korak6PoeniPosleUzmi: 0 }

/** UX 7.6: cene u dinarima. */
export const CENE_OCEKIVANO = {
  postavljanje: 0,
  isticanje: { 3: 119, 7: 229, 14: 349 },
  paketiAukcija: { 1: 229, 3: 579, 5: 879, 7: 1149 },
  majstor: 990,
  radnja: 2490,
  akcija: 4900,
  reklama: 2900,
  popust: 3000,
  dostavaMala: 390,
  dostavaVelika: 590,
}

/** UX 7.7: Zupčanik, akcija i moderacija. */
export const TABLA_OCEKIVANO = {
  zupcanik: { oglasa: 5, pregledi: 1204, sacuvano: 63, ponude: 17, razmene: 6, prikazi: 9650, klikovi: 214, ctr: 22 },
  // T2-2 (izmena UX 7.7): A4 prati radnju — pre „Primi“ 5 primljeno / 4 čeka / 15.000 din; posle „Primi“ (9.primi) 6 / 3 / 18.000 din.
  akcija: { prijave: 12, primljeno: 5, cekaProcenu: 4, odbijeno: 3, popusti: 15000, naknada: 4900, pregledi: 486 },
  akcijaPosle: { primljeno: 6, cekaProcenu: 3, popusti: 18000 },
  // PK13: na čekanju je 3 od koraka 4 (stiže „šljivovica“) dok moderacija ne pošalje odluku (5.v3), tada 2.
  moderacija: { korak1: 2, korak4: 3, korak5Pocetno: 3, korak5Zavrsno: 2, obradjenoPre: 41, uklonjenoPre: 9, obradjenoPosle: 42, uklonjenoPosle: 10 },
}

/** UX 7.8: Jovanine recenzije (5 poslednjih). */
export const JOVANINE_RECENZIJE: { autor: string; ocena: number; tekst: string }[] = [
  { autor: 'irena_zem80', ocena: 5, tekst: 'Sve kako je opisano, brz dogovor.' },
  { autor: 'mila_cuk88', ocena: 5, tekst: 'Odlična razmena, preporuka.' },
  { autor: 'bojan_rak72', ocena: 4, tekst: 'Stvar je malo više korišćena nego što piše, ali sve u redu.' },
  { autor: 'stefan_nbg93', ocena: 4, tekst: 'Dobar dogovor, malo se čekalo na mestu preuzimanja.' },
  { autor: 'sanja_sur85', ocena: 5, tekst: 'Tačna i ljubazna.' },
]

/** UX 7.3: broj oglasa u regionu (22 oglasa u 11 gradova, po 2). */
export const REGION = { oglasa: 22, gradova: 11, poGradu: 2 }

/** UX 7.1: 40 građana u Beogradu, 11 iz regiona. */
export const BROJ_KORISNIKA = { beograd: 40, region: 11 }
