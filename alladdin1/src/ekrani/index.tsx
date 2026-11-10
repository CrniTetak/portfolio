// Registar komponenti ekrana po ID-u (UX 5). Svih 65 ekrana je izgrađeno (test u pravila.test.ts proverava da svaka ruta ima komponentu).
import type { ComponentType } from 'react'
import { G1Upit, G2Paket, G3Poslato } from './grupa/G1_G3_Upit'
import { G4Ponuda, G5Rezervacija } from './grupa/G4_G5_Ponuda'
import { G13Finansije, G15Rok, G16Paket } from './grupa/G13_G16_Finansije'
import { G6Tabla, G7Grupa } from './grupa/G6_G7_Tabla'
import { G8Putnici, G9Uvoz, G11Link } from './grupa/G8_G11_Putnici'
import { T1Podaci, T2Saglasnosti, T3Placanje, T4Upisan } from './putnik/T1_T4_Upis'
import { G10Dodaj, G12Karton, G14Izvod, G17Podrska } from './grupa/G10_G17_Dodatni'
import { T8Poruke } from './putnik/T8_Poruke'
import { T5Putovanja, T6Mesto, T9Dokumenta } from './putnik/T5_T9_Putovanja'
import { V1Pult, V2Ponuda, V3Pracenje, V4Potvrda } from './savetnik/V1_V4_Savetnik'
import { S1Ulaz } from './zajednicki/S1_Ulaz'
import { S2Pocetna } from './zajednicki/S2_Pocetna'
import { S6Pravno } from './zajednicki/S6_Pravno'
import { S7ODemou } from './zajednicki/S7_ODemou'
import { K1Krstarenje, K2Pretraga, K3Rezultati, K4Paket, K5Porudzbina, K6Potvrda } from './krstarenje/K1_K6_Krstarenje'
import { M1Rezultati, M2Detalj, M3Zahtev, M4Primljen, M5Ponuda, M6Avans, M7Potvrda, M8Dogadjaji } from './montekarlo/M1_M8_MonteKarlo'
import { Q1Savetnici, Q2Profil, Q3Zahtev, Q4Ponuda, Q5Placanje, Q6Potvrda } from './konsijerz/Q1_Q6_Konsijerz'
import { L1Landing, L2Istrazi, L3Zahtev, L4Poslato } from './transport/L1_L4_Transport'
import { B1Clanstvo, B2Status } from './clanstvo/B1_B2_Clanstvo'
import { S3Prijava, S4Registracija, S5Paketi, S8Pregled } from './zajednicki/S3_S8_Javni'
import { T7Rezervacija } from './putnik/T7_Rezervacija'
import { V5Zahtevi } from './savetnik/V5_Zahtevi'

export const EKRANI: Record<string, ComponentType> = {
  S1: S1Ulaz,
  S2: S2Pocetna,
  S3: S3Prijava,
  S4: S4Registracija,
  S5: S5Paketi,
  S6: S6Pravno,
  S8: S8Pregled,
  K1: K1Krstarenje,
  K2: K2Pretraga,
  K3: K3Rezultati,
  K4: K4Paket,
  K5: K5Porudzbina,
  K6: K6Potvrda,
  M1: M1Rezultati,
  M2: M2Detalj,
  M3: M3Zahtev,
  M4: M4Primljen,
  M5: M5Ponuda,
  M6: M6Avans,
  M7: M7Potvrda,
  M8: M8Dogadjaji,
  Q1: Q1Savetnici,
  Q2: Q2Profil,
  Q3: Q3Zahtev,
  Q4: Q4Ponuda,
  Q5: Q5Placanje,
  Q6: Q6Potvrda,
  L1: L1Landing,
  L2: L2Istrazi,
  L3: L3Zahtev,
  L4: L4Poslato,
  B1: B1Clanstvo,
  B2: B2Status,
  T7: T7Rezervacija,
  V5: V5Zahtevi,
  S7: S7ODemou,
  G1: G1Upit,
  G2: G2Paket,
  G3: G3Poslato,
  G4: G4Ponuda,
  G5: G5Rezervacija,
  G6: G6Tabla,
  G7: G7Grupa,
  G8: G8Putnici,
  G9: G9Uvoz,
  G10: G10Dodaj,
  G11: G11Link,
  G12: G12Karton,
  G14: G14Izvod,
  G17: G17Podrska,
  G13: G13Finansije,
  G15: G15Rok,
  G16: G16Paket,
  T1: T1Podaci,
  T2: T2Saglasnosti,
  T3: T3Placanje,
  T4: T4Upisan,
  T5: T5Putovanja,
  T6: T6Mesto,
  T8: T8Poruke,
  T9: T9Dokumenta,
  V1: V1Pult,
  V2: V2Ponuda,
  V3: V3Pracenje,
  V4: V4Potvrda,
}
export const ekranZa = (id: string): ComponentType => EKRANI[id] ?? EKRANI.S2
