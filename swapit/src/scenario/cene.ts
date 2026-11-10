// CENE (UX 7.6): dinari, sa PDV-om. Sve su izmišljene; pretplata, akcija, reklama i dostava nose oznaku „ilustrativno, nije cenovnik“.
// Ovo su ULAZNE vrednosti; ekrani ih čitaju kroz svet() i prikazuju kroz format.ts.

export const CENE = {
  postavljanjeOglasa: 0,
  isticanje: { 3: 119, 7: 229, 14: 349 } as Record<3 | 7 | 14, number>,
  paketiAukcija: { 1: 229, 3: 579, 5: 879, 7: 1149 } as Record<1 | 3 | 5 | 7, number>,
  pretplataMajstor: 990,
  pretplataRadnja: 2490,
  akcijaStaroZaNovo: 4900,
  reklama7Dana: 2900,
  popustPoStaromBiciklu: 3000,
  dostavaMala: 390,
  dostavaVelika: 590,
} as const

/** Podrazumevani izbor na ekranu plaćanja (Z3): trajanje isticanja u danima i paket aukcija (ključevi iz CENE). */
export const PODRAZUMEVANO_ISTICANJE_DANA = 7 as const
export const PODRAZUMEVANI_PAKET_AUKCIJA = 3 as const

/** Vrednosti poena na oglasima „za poene“ i broj početnih poena. */
export const VREDNOSTI_POENA = [10, 25, 50, 100] as const
export type VrednostPoena = (typeof VREDNOSTI_POENA)[number]
export const POCETNI_POENI = 20

/** Ilustrativno, izmišljeno: uvodni brojač „Razmenjeno stvari“ (činjenična brojka, bez ekoloških tvrdnji). */
export const RAZMENJENO_STVARI_POCETAK = 1284

/** Trajanje reklame „Sponzorisano“ u danima (cena u CENE.reklama7Dana); reklama akcije je uključena u cenu akcije (N-3). */
export const REKLAMA_DANA = 7
/** Izbori u slobodnim tokovima: dani isticanja, paketi aukcija i trajanje aukcije u danima (ključevi su iz CENE). */
export const DANI_ISTICANJA = [3, 7, 14] as const
export const PAKETI_AUKCIJA = [1, 3, 5, 7] as const
export const ROKOVI_AUKCIJE_DANA = [3, 7, 14] as const
export type DaniIsticanja = (typeof DANI_ISTICANJA)[number]
export type PaketAukcija = (typeof PAKETI_AUKCIJA)[number]
/** Vrednost u poenima koju SWAPIT dodeljuje za potvrđen poklon u slobodnom toku (za priču važi vrednost stvari, UX 7.5). */
export const VREDNOST_POKLONA_SLOBODNO = 10
/** Rokovi iz pravila uklanjanja oglasa (N-5): prigovor u roku od 14 dana, odgovor u roku od 7 dana (demo). */
export const ROK_PRIGOVORA_DANA = 14
export const ROK_ODGOVORA_DANA = 7
