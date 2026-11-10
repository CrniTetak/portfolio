// LOGOTIPI kanala — evidencija (PLAN B7.1). Samo kanali označeni kao POUZDANI u dizajn/LOGOTIPI-IZVORI.md („Sažetak pouzdanosti“, prva tačka):
// CMC, Viasat Explore, RTL, Prva, Arena Sport (logo mreže, uz naziv „Arena Sport 1“ ispod). Ostalih 13 kanala dobija neutralnu pločicu sa nazivom.
// Zamka: Commons „RTS 1 Logo 2023/2019“ je švajcarski RTS, NE Radio-televizija Srbije — ne koristi se ni za šta.
//
// Ručni deo (ovaj fajl) sadrži SAMO ono što se odlučuje: koja datoteka sa Commons-a i koja licenca se očekuje.
// Mašinski deo (logotipi-evidencija.json) piše skripta skripte/logotipi.mjs: licenca sa stranice, autor, datum provere, otisak (sha256).
// Žig vlasnika kanala ostaje; status sa Commons-a NIJE dozvola vlasnika kanala.
import evidencija from './logotipi-evidencija.json'

export type LogotipStavka = {
  id: string
  /** Naziv kanala (samo za evidenciju i alt tekst; prikaz ide kroz kanali.ts). */
  kanal: string
  pouzdan: true
  /** Naziv datoteke na Wikimedia Commons-u. */
  commons: string
  /** Licenca koju skripta MORA da pročita sa stranice; ako se ne poklapa, fajl se ne preuzima. */
  ocekivanaLicenca: string
  /** Fajl u public/logotipi/ (SVG ostaje SVG, PNG postaje WebP). */
  fajl: string
  /** Logo je logo cele mreže: ispod njega ide naziv kanala (npr. „Arena Sport 1“). */
  nazivIspod?: boolean
  /** Zašto je izabrana ova verzija (kad izvor nudi više verzija). */
  napomena?: string
}

export const LOGOTIPI_SPISAK: readonly LogotipStavka[] = [
  { id: 'cmc', kanal: 'CMC', pouzdan: true, commons: 'CMC_TV_Croatia.svg', ocekivanaLicenca: 'Public domain', fajl: 'cmc.svg' },
  { id: 'viasat-explore', kanal: 'Viasat Explore', pouzdan: true, commons: 'Viasat_Explore_2026.svg', ocekivanaLicenca: 'Public domain', fajl: 'viasat-explore.svg',
    napomena: 'Logo u upotrebi od maja 2026.' },
  { id: 'rtl', kanal: 'RTL', pouzdan: true, commons: 'Rtl-logo.svg', ocekivanaLicenca: 'Public domain', fajl: 'rtl.svg' },
  { id: 'prva', kanal: 'Prva', pouzdan: true, commons: 'Prva-logo_(1).png', ocekivanaLicenca: 'Public domain', fajl: 'prva.webp',
    napomena: 'Od dve verzije na Commons-u izabrana je „Prva-logo (1).png“ (opis „New Logo of PRVA“, otpremila firma 2023): to je slika iz infokutije članka o kanalu na en.wikipedia (provereno 22. 10. 2026). Druga („Прва српска телевизија 2020.png“, 244×215) je sitnija i bez autora.' },
  { id: 'arena-sport', kanal: 'Arena Sport 1', pouzdan: true, commons: 'Arena_Sport_logo_2019.svg', ocekivanaLicenca: 'Public domain', fajl: 'arena-sport.svg', nazivIspod: true,
    napomena: 'Logo cele mreže (bez „1“); naziv „Arena Sport 1“ ide ispod.' },
]

export type EvidencijaLogotipa = {
  /** Adresa stranice sa opisom na Commons-u (samo TEKST; demo nema spoljnih linkova). */
  stranica: string
  licencaSaStranice: string
  ogranicenja: string
  autor: string
  datumProvere: string
  sha256: string
  /** Šta je skripta uradila sa originalom. */
  obrada: string
}

const zapis = evidencija as Record<string, EvidencijaLogotipa>

export type Logotip = LogotipStavka & { evidencija: EvidencijaLogotipa | null }

/** Spisak sa evidencijom; `evidencija` je null dok skripta nije preuzela fajl. */
export const LOGOTIPI: readonly Logotip[] = LOGOTIPI_SPISAK.map((s) => ({ ...s, evidencija: zapis[s.id] ?? null }))

export function logotip(id: string): Logotip | undefined {
  return LOGOTIPI.find((l) => l.id === id)
}
