// Stavke okvira (UX 2.1): ikonice zaglavlja, desna traka, ikonska traka telefona i meni profila. Svaka vodi na postojeći ekran
// (proverava stavke.test.ts). Ikonice su Lucide (UI 7); ovde su samo nazivi, a crta ih komponenta.
import type { EkranId } from '../prica/tipovi'

export type IkonaNaziv = 'star' | 'package' | 'mail' | 'truck' | 'map' | 'headphones' | 'user' | 'shopping-bag'

export type Stavka = { ikona: IkonaNaziv; naziv: string; ekran: EkranId }

/** Zaglavlje (računar): zvezda → omiljeno, paket → moje razmene i ponude, koverat → poruke. */
export const ZAGLAVLJE_IKONE: Stavka[] = [
  { ikona: 'star', naziv: 'Omiljeno', ekran: 'W6' },
  { ikona: 'package', naziv: 'Moje razmene i ponude', ekran: 'X12' },
  { ikona: 'mail', naziv: 'Poruke', ekran: 'C1' },
]

/** Desna plutajuća traka (računar): kamion → dostava, mapa, slušalice → podrška. */
export const DESNA_TRAKA: Stavka[] = [
  { ikona: 'truck', naziv: 'Dostava', ekran: 'D1' },
  { ikona: 'map', naziv: 'Mapa', ekran: 'P6' },
  { ikona: 'headphones', naziv: 'Podrška', ekran: 'S1' },
]

/** Ikonska traka telefona (Figma): Roba, kamion, slušalice, mapa, zvezda, paket, koverat, profil. */
export const IKONSKA_TRAKA: Stavka[] = [
  { ikona: 'shopping-bag', naziv: 'Roba i kategorije', ekran: 'P3' },
  { ikona: 'truck', naziv: 'Dostava', ekran: 'D1' },
  { ikona: 'headphones', naziv: 'Podrška', ekran: 'S1' },
  { ikona: 'map', naziv: 'Mapa', ekran: 'P6' },
  { ikona: 'star', naziv: 'Omiljeno', ekran: 'W6' },
  { ikona: 'package', naziv: 'Moje razmene i ponude', ekran: 'X12' },
  { ikona: 'mail', naziv: 'Poruke', ekran: 'C1' },
  { ikona: 'user', naziv: 'Moj profil', ekran: 'N2' },
]

/** Meni profila (padajuće na računaru; ista lista je u meniju ≡ na telefonu). */
export const MENI_PROFILA: Stavka[] = [
  { ikona: 'user', naziv: 'Moj profil', ekran: 'N2' },
  { ikona: 'package', naziv: 'Moji oglasi', ekran: 'O6' },
  { ikona: 'star', naziv: 'Moji poeni', ekran: 'W1' },
  { ikona: 'star', naziv: 'Lista želja', ekran: 'W3' },
  { ikona: 'user', naziv: 'Podešavanja', ekran: 'N3' },
  { ikona: 'user', naziv: 'Prikaz i jezik', ekran: 'P2' },
]

/** Ostali linkovi menija ≡ (telefon) i podnožja. */
export const OSTALO_U_MENIJU: Stavka[] = [
  { ikona: 'user', naziv: 'Kako ređamo oglase', ekran: 'P10' },
  { ikona: 'headphones', naziv: 'Pravila zajednice', ekran: 'S2' },
  { ikona: 'headphones', naziv: 'Kako radi SWAPIT', ekran: 'S3' },
  { ikona: 'user', naziv: 'O ovom demou', ekran: 'U3' },
]
