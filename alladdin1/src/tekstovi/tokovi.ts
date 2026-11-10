// Engleski tekstovi slobodnih tokova koji nisu brojke ni imena (brojke iz scenario/ponude.ts, imena iz scenario/strane.ts).
// Itinerer krstarenja Barcelona → Gibraltar → Lisabon (5 dana / 4 noći): kazino radi SAMO na plovidbi, ne u luci.

export const ITINERER_KRSTARENJA = [
  'Day 1 · Barcelona — embarkation and departure in the evening. The casino opens once the ship is at sea.',
  'Day 2 · At sea — casino open, show in the evening.',
  'Day 3 · Gibraltar — a day in port to explore the city. The casino is closed in port and reopens when the ship sails.',
  'Day 4 · At sea from Gibraltar to Lisbon — casino open; the poker tournament is held in the evening.',
  'Day 5 · Lisbon — arrival in the morning and disembarkation.',
]

export const KRSTARENJE_PONUDA_KAZINA = ["Offered by the ship's casino operator under its own licence. 18+. The casino is open only while the ship is at sea."]
export const KRSTARENJE_PONUDA_STAVKE = ['Welcome reception in the casino lounge', 'Show tickets', 'Entry offer to the onboard poker tournament (the entry fee is paid to the casino)']

export const KRSTARENJE_FUNKCIJE = [
  { naslov: 'Exclusive Casino Areas', stavke: ['Private salons on board', "Tables and machines of the ship's casino operator"] },
  { naslov: 'Premium Experience', stavke: ['Spacious cabins with a sea view', 'Fine dining and lounges'] },
  { naslov: 'Group Entertainment', stavke: ['Shows and live music', 'Special group evenings'] },
]

export const MK_UKLJUCENO = ['The Royal Suite for the whole stay', 'Private chauffeur transfers', 'Dining reservations', 'Concierge coordination']

export const KONSIJERZ_USLUGE = ['Personalised itineraries', 'Luxury accommodation', 'Private aviation & yachts', 'Exclusive events', 'High-end shopping', 'Advisor support']

export const CLANSTVO_POGODNOSTI = {
  Member: ['Priority advisor reply', 'Partner offers (18+)'],
  Select: ['Priority advisor reply', 'Early access to group departures', 'Partner offers (18+)'],
  Signature: ['Priority advisor reply', 'Early access to group departures', 'Partner offers (18+)', 'A dedicated advisor for every trip'],
} as const
export const GRADOVI_DOGADJAJA = ['Monte Carlo', 'Nice', 'Cannes']

/** Ocene i komentari uz profil savetnika: UVEK uz oznaku "Sample ratings — demo", bez imena autora i bez datuma. */
export const OCENE_UZORAK = ['"Calm, quick and always one step ahead."', '"Everything arranged, nothing to worry about."']

/** Poruke koje demo prikazuje umesto stvarnih fajlova i obećanja. */
export const BEZ_FAJLA = 'Demo — no file is generated'
export const FILTERI_ILUSTRACIJA = 'Filters are for illustration'
export const ZAHTEV_PRIMLJEN_TEKST = 'Quote requested — your advisor prepares a tailored quote'

/** Tri unapred pripremljena tuđa zahteva u V5 (opisi). */
export const V5_PRIPREMLJENI = { mk: 'Penthouse stay, a long weekend', konsijerz: 'Dinner for six, private room', transport: 'Chauffeur, airport to hotel' } as const
