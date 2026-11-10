// Tekstovi okvira aplikacije (UX 0, 3, 8, 9; UI 5.14). Brojke se ne kucaju ovde.
export const DEMO_OZNAKA = 'Demo — izmišljeni podaci'
export const PODNOZJE_PRAVNI = [
  { tekst: 'uslovi', naziv: 'Uslovi korišćenja' },
  { tekst: 'privatnost', naziv: 'Politika privatnosti' },
  { tekst: 'kolacici', naziv: 'Politika kolačića' },
] as const

export const PORUKE = {
  simulacija: 'Simulirana radnja — ništa nije poslato ni naplaćeno',
  slobodno: 'Sada razgledaš slobodno. Traka priče ostaje dole — koristi je kad god želiš.',
  granaVracena: 'Račva poništena — priča je opet na glavnom toku.',
  nazadNaGlavni: 'Nazad na glavni tok — korak 6, lanac razmene',
  krajPrice: 'Kraj priče — pokreni ponovo ili razgledaj',
  restartovano: 'Demo je vraćen na korak 1',
  jezik: 'Demo je na srpskom; ostali jezici dolaze u pravom proizvodu.',
  uzoraPretrage: 'Pretraga radi samo u ovom demou; ništa se ne šalje.',
} as const

/** K1: poruka na svakom mestu gde radnja nije dozvoljena jer je predmet deo priče (jedan tekst). */
export const PREDMET_PRICE = 'Ovaj predmet je deo priče'

/** D6: radnja nije uspela (stanje se nije promenilo): poruka sa razlogom umesto lažnog uspeha. Bez brojki. */
export const NEUSPEH = {
  razmena: 'Razmena nije pokrenuta: za ovu stvar već postoji razmena ili ponuda više ne čeka odgovor. Ništa nije promenjeno.',
  poeni: 'Razmena nije pokrenuta: nemaš dovoljno poena ili za ovu stvar već postoji razmena. Ništa nije promenjeno.',
  uklanjanje: 'Oglas nije uklonjen. Ništa nije promenjeno.',
} as const

export const JEZICI = ['Srpski', 'Engleski', 'Hrvatski', 'Bosanski', 'Makedonski', 'Albanski'] as const
export const MAPA_OZNAKA = 'Ilustrativna mapa · Prikazujemo samo približnu lokaciju.'

/** Trajanje običnog toasta; pauzira se dok su miš ili fokus iznad njega. */
export const TRAJANJE_TOASTA_MS = 7000
