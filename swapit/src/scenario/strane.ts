// SVA IZMIŠLJENA IMENA, NAZIVI I REFERENCE na jednom mestu (UX 10).
// Ekrani i tekstovi NE pišu ova imena rukom (brava u pravila/brave.test.ts): uzimaju ih odavde, preko svet().
// Promena imena = jedan red ovde.

export const BREND = 'SWAPIT'
export const PRUZALAC_USLUGE = 'SWAPIT d.o.o. (demo)'

/** Referentni brojevi i lažni podaci koji su očigledno demo. */
export const REF_POSILJKA = 'SW-DEMO-0001'
export const REF_AKCIJA_PRIJAVA = 'SW-AKC-0001'
export const TELEFON_DEMO = '060 000 0000 (demo)'
export const KARTICA_DEMO = 'Demo kartica •••• 0000'
export const PIB_DEMO = '000000000'

/** Kurirska služba (izmišljena; partner u prikazu, ne korisnik). */
export const KURIR = 'Dunavski kurir'
/** Moderatorka (SWAPIT tim), nije član-građanin. */
export const MODERATORKA = 'Sara'

/** Preporučena javna mesta za primopredaju (izmišljena, bez adresa). */
export const JAVNA_MESTA = ['Ispred biblioteke', 'Ulaz u park', 'Ispred pošte'] as const

/** Nazivi firmi (UX 7.2). */
export const NAZIV_FIRME = {
  zupcanik: 'Sportski kutak Zupčanik',
  pedala: 'Servis Lančanik',
  dule: 'Majstor Dule — elektroinstalacije',
  hrast: 'Restauracija Hrast',
  cekic: 'Radionica Čekić',
  belizid: 'Krečenje Beli Zid',
  zavrtanj: 'Servis Zavrtanj',
  bajt: 'Servis Bajt',
} as const
export type FirmaId = keyof typeof NAZIV_FIRME

/** Referenca plaćanja (Z3, Z4): odvojena od šifre prijave na akciju (SW-AKC-0001) i od oznake pošiljke (SW-DEMO-0001). */
export const REF_PLACANJE = 'SW-PLT-0001'
/** Druga pošiljka (slobodni tok dostave, D1 → D3): očigledno demo oznaka. */
export const REF_POSILJKA_SLOBODNA = 'SW-DEMO-0002'
/** Podrška kao sagovornik u porukama (C1, C2). */
export const PODRSKA_NAZIV = 'SWAPIT podrška'
