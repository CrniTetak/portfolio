// PRIVATNO: tačne adrese i kontakti (SVE IZMIŠLJENO).
//
// BRAVA: ovaj fajl sme da uveze SAMO src/logika/adresa.ts. Test (adresa.test.ts) čita sve
// fajlove u src/ i pada ako ga uveze bilo ko drugi. Ekrani adresu dobijaju isključivo kroz
// funkciju prikazAdrese(), koja proverava ko sme da je vidi.
//
// Iskreno: u statičkom prototipu ovi podaci su deo preuzetog koda, pa je ovo zaštita od
// GREŠKE U PRIKAZU, a ne od radoznalog posetioca. U pravoj aplikaciji adresu čuva server.

export interface PrivatniPodaci {
  adresa: string
  kontaktOsoba: string
  telefon: string
  pristup: string
}

export const PRIVATNO: Record<string, PrivatniPodaci> = {
  'industrijski-loft': { adresa: 'Ulica Primera 12, 3. sprat, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0001', pristup: 'Zvono „Loft“; teretni lift iz dvorišta.' },
  'vila-sa-bastom': { adresa: 'Ulica Izmišljena 7, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0002', pristup: 'Kapija sa interfonom, zaštitar na ulazu.' },
  'brutalisticka-hala': { adresa: 'Blok Primer 45, hala B, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0003', pristup: 'Glavna rampa, javiti se čuvaru.' },
  'kafic-retro': { adresa: 'Ulica Probna 3, Beograd', kontaktOsoba: 'Ivan T.', telefon: '+381 60 000 0004', pristup: 'Ključ kod vlasnika, preuzima se na dan snimanja.' },
  'napusteni-magacin': { adresa: 'Industrijska Primerna 20, Beograd', kontaktOsoba: 'Ivan T.', telefon: '+381 60 000 0005', pristup: 'Lanac na kapiji, šifra se šalje na dan snimanja.' },
  'moderna-kancelarija': { adresa: 'Bulevar Izmišljeni 100, 8. sprat, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0006', pristup: 'Recepcija u prizemlju, lista gostiju.' },
  'foto-studio': { adresa: 'Ulica Ogledna 9, prizemlje, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0007', pristup: 'Direktan ulaz iz dvorišta.' },
  'stan-sedamdesete': { adresa: 'Ulica Retro 18, 3. sprat, stan 9, Beograd', kontaktOsoba: 'Ivan T.', telefon: '+381 60 000 0008', pristup: 'Interfon 9; lift do 4 osobe.' },
  'hotelski-lobi': { adresa: 'Obala Primerna 1, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0009', pristup: 'Ulaz iz dvorišta, recepcija noću.' },
  'stara-fabrika': { adresa: 'Fabrička Probna 55, Beograd', kontaktOsoba: 'Nenad J.', telefon: '+381 60 000 0010', pristup: 'Ulaz kod portirnice, kaciga obavezna.' },
}

/** Fiksni broj Nasetua koji služi kao kontakt na izviđanju (izmišljen). */
export const KONTAKT_NASETU = '+381 11 000 0000 (Nasetu, izmišljeno)'
