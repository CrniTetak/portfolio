// SVA IZMIŠLJENA IMENA, NAZIVI I REFERENCE (UX 11). Samo ovde; ekrani ih uzimaju odavde (brava B3).
// Sve su izmišljene vrednosti.

export const LJUDI = {
  organizator: { ime: 'Daniel Ferreira', krace: 'Daniel', email: 'daniel.ferreira@example.com', telefon: '+00 000 000 000' },
  noviPutnik: { ime: 'Nikola Ilić', email: 'nikola.ilic@example.com', telefon: '+00 000 000 002' },
  putnik: { ime: 'Marko Petrović', krace: 'Marko', email: 'marko.petrovic@example.com', telefon: '+00 000 000 001' },
  savetnik: { ime: 'Dušica Pavlović', krace: 'Dušica', titula: 'Senior group advisor', inicijali: 'DP', email: 'dusica.pavlovic@example.com', telefon: '+00 000 000 003' },
  putnici: ['Teodora Vasić', 'Ana Kostić', 'Mateo Kovač'],
} as const

export const KLUB = 'Silverline Poker Club'
export const PAKET_MACAU = 'The Macau VIP Express'
export const PAKET_VEGAS = 'The Las Vegas Poker Week'
export const PAKET_GRAND_PRIX = 'The Riviera Racing Weekend'
export const HOTEL_MACAU = 'Jade Lantern Resort & Casino Macau'
/** Let čartera i kategorija hotela (izmišljeno). */
export const LET = { polazak: '08:00', dolazak: '03:00', dolazakSledeciDan: true } as const
export const HOTEL_ZVEZDICE = 5
export const PREVOZNIK = 'Aurelia Charter'
export const ORGANIZATOR_PUTOVANJA = 'AllAddIn1 Ltd, licence no. TL-0000 (demo)'
export const KORISNIK_NALOG = 'AllAddIn1 Ltd (demo)'

export const REF = {
  ponuda: 'AA1-Q-1042',
  upit: 'AA1-I-0071',
  zahtev1: 'AA1-R-0301',
  zahtev2: 'AA1-R-0302',
  zahtev3: 'AA1-R-0303',
  faktura: 'AA1-DEMO-INV-',
  podrska1: 'AA1-S-0001',
  podrska2: 'AA1-S-0002',
} as const

export const DEMO = {
  link: 'aai.example/join/MACAU-VIP-8F3K',
  iban: 'DEMO00 0000 0000 0000',
  kartica: 'Demo card •••• 0000',
  pasos: 'Passport DEMO-000000',
  datotekaCsv: 'silverline_group_roster.csv',
  /** Demo datum rođenja (statičan tekst, nije polje). */
  rodjenje: { d: 1, m: 1, y: 1990 },
  drzavljanstvo: 'Demo country',
  teodoraEmail: 'teodora.vasic@example.com',
  pasosKraj: 'Passport •••• 4821 (demo)',
  adresa: 'Demo Street 1, Demo City',
} as const

/** Hotel, brod, paketi, savetnici i događaji slobodnih tokova (UX 11). Sve izmišljeno. */
export const HOTEL_MONTE_KARLO = 'Hôtel Maison Azur'
export const BROD = 'MS Calypso Crown'
export const MK_PAKET = 'Royal Suite Experience'
export const GALA_NAZIV = 'Luxury Gala Monte Carlo'
export const SAVETNICI_KONSIJERZA = [
  { ime: 'Bastian Right', inicijali: 'BR', specijalnost: 'Luxury travel', jezici: 'English, German' },
  { ime: 'Maria Gaspar', inicijali: 'MG', specijalnost: 'Private events', jezici: 'English, French' },
  { ime: 'Fabio Conte', inicijali: 'FC', specijalnost: 'Executive assistance', jezici: 'English, French, German' },
] as const
export const NAZIVI_KRSTARENJA: Record<string, string> = {
  aegean: 'Aegean Poker Odyssey',
  riviera: 'Riviera Grand Voyage',
  blackjack: 'Dubrovnik Grand Retreat',
  iberian: 'Iberian Peninsula Getaway',
}
export const NAZIVI_MK: Record<string, string> = {
  royal: 'Royal Suite Experience',
  lifestyle: 'Harbour Lifestyle Escape',
  salon: 'Salon Privé Weekend',
  penthouse: 'Skyline Penthouse Retreat',
}
export const DOGADJAJI = [
  { naziv: 'Azure Poker Classic' },
  { naziv: 'Riviera Cup Weekend' },
  { naziv: 'Harbour Gala Night' },
] as const
export const REF_TOKOVI = { krstarenje: 'AA1-DEMO-IB-0001', monteKarlo: 'AA1-R-0301', konsijerz: 'AA1-R-0303', v5a: 'AA1-R-0288', v5b: 'AA1-R-0289', v5c: 'AA1-R-0290' } as const
export const OSTALI_PAKETI = { aegean: 'Aegean Poker Odyssey', vegas: PAKET_VEGAS, grandPrix: PAKET_GRAND_PRIX } as const
