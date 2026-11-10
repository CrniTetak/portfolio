// Registar ekrana: ID iz UX.md 5 → komponenta. Svih 84 ekrana je izgrađeno (talas 3); nijedan ekran nije kostur, pa nema ni komponente „u izradi“.
// Nov ekran: komponenta u ekrani/, upis ovde (u odgovarajući modul), ruta u pravila/rute.ts.
//
// TALAS 4: ekrani se učitavaju LENJO (deljenje JS paketa): glavni paket nosi samo okvir, priču i podatke, a svaki modul ekrana je poseban fajl koji se
// učita kad ekran zatreba (App.tsx drži <Suspense>). Posle prvog prikaza ostali moduli se tiho dovlače u pozadini (predUcitajEkrane), da prelazi
// u priči ne čekaju mrežu.
import { lazy, type ComponentType } from 'react'
import { NemaStranice } from './NemaStranice'

type Modul = Record<string, unknown>
type Ucitaj = () => Promise<Modul>

/** Modul (fajl) → koji ID ekrana je koji izvoz u njemu. */
const MODULI: [Ucitaj, Record<string, string>][] = [
  [() => import('./P6_Mapa'), { P6: 'P6' }],
  [() => import('./U1_U2_Uvod'), { U1: 'U1', U2: 'U2' }],
  [() => import('./U3_ODemou'), { U3: 'U3' }],
  [() => import('./aukcija/Aukcije'), { J1: 'J1', J2: 'J2', J3: 'J3', J4: 'J4' }],
  [() => import('./razmena/Razgovor'), { C2: 'C2' }],
  [() => import('./razmena/Poruke'), { C1: 'C1' }],
  [() => import('./dostava/Dostava'), { D1: 'D1', D2: 'D2', D3: 'D3' }],
  [() => import('./profil/Profil'), { N1: 'N1' }],
  [() => import('./profil/MojProfil'), { N2: 'N2', N3: 'N3', N4: 'N4' }],
  [() => import('./oglas/Oglas'), { O1: 'O1' }],
  [() => import('./oglas/NoviOglas'), { O2: 'O2', O3: 'O3', O4: 'O4' }],
  [() => import('./nalog/Prijava'), { R1: 'R1', R5: 'R5' }],
  [() => import('./placanje/Usluge'), { Z1: 'Z1', Z2: 'Z2' }],
  [() => import('./placanje/Placanje'), { Z3: 'Z3', Z4: 'Z4' }],
  [() => import('./nalog/Registracija'), { R2: 'R2', R3: 'R3', R4: 'R4' }],
  [() => import('./pocetna/Pocetna'), { P1: 'Pocetna' }],
  [() => import('./pocetna/Kategorije'), { P2: 'P2', P3: 'P3', P7: 'P7' }],
  [() => import('./pocetna/Pretraga'), { P4: 'P4', P5: 'P5' }],
  [() => import('./pocetna/Price'), { P8: 'P8', P9: 'P9' }],
  [() => import('./razmena/Ponuda'), { X1: 'X1', X2: 'X2', X3: 'X3' }],
  [() => import('./razmena/Primljene'), { X4: 'X4', X5: 'X5', X6: 'X6', X7: 'X7' }],
  [() => import('./razmena/Dogovor'), { X8: 'X8', X9: 'X9', X10: 'X10', X11: 'X11' }],
  [() => import('./razmena/MojeRazmene'), { X12: 'X12' }],
  [() => import('./razmena/Lanac'), { X13: 'X13' }],
  [() => import('./zelje/Zelje'), { W3: 'W3', W4: 'W4' }],
  [() => import('./zelje/Omiljeno'), { W6: 'W6' }],
  [() => import('./akcija/Akcija'), { A1: 'A1', A2: 'A2', A3: 'A3', A4: 'A4', A5: 'A5', A6: 'A6' }],
  [() => import('./firma/Firma'), { F3: 'F3', F4: 'F4', F6: 'F6' }],
  [() => import('./firma/Poslovni'), { F1: 'F1', F2: 'F2', F5: 'F5', F7: 'F7', F8: 'F8', F9: 'F9' }],
  [() => import('./moderacija/Moderacija'), { O5: 'O5', S2: 'S2', V1: 'V1', V2: 'V2', V3: 'V3', V4: 'V4' }],
  [() => import('./oglas/MojiOglasi'), { O6: 'O6' }],
  [() => import('./podrska/Podrska'), { P10: 'P10', S1: 'S1', S3: 'S3', S4: 'S4', S5: 'S5' }],
  [() => import('./poeni/Poeni'), { W1: 'W1', W2: 'W2', W5: 'W5' }],
]

const EKRANI: Record<string, ComponentType> = {}
for (const [ucitaj, izvozi] of MODULI)
  for (const [id, ime] of Object.entries(izvozi)) EKRANI[id] = lazy(() => ucitaj().then((m) => ({ default: m[ime] as ComponentType })))

/** Komponenta ekrana; nepoznat ID nikad ne daje prazan ekran nego „Nema te stranice“. */
export const ekranZa = (id: string): ComponentType => (Object.hasOwn(EKRANI, id) ? EKRANI[id] : NemaStranice)
export const BROJ_IZGRADJENIH = Object.keys(EKRANI).length

/** Tiho dovlači sve module ekrana (jedan po jedan, kad je pregledač miran), da prelazi ne čekaju mrežu. */
export function predUcitajEkrane(): void {
  const redom = MODULI.map(([ucitaj]) => ucitaj)
  const sledeci = () => {
    const f = redom.shift()
    if (!f) return
    f().catch(() => {}).finally(() => (typeof requestIdleCallback === 'function' ? requestIdleCallback(sledeci, { timeout: 3000 }) : setTimeout(sledeci, 300)))
  }
  setTimeout(sledeci, 1200)
}
