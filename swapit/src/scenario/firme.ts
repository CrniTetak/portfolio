// FIRME (UX 7.2): 8 izmišljenih firmi + kurir. F4 (javni profil) je jedan šablon za svih 8 (PLAN B5.7), pa svaka firma ovde
// ima opis, radno vreme, izmišljenu adresu radnje (UX 12.15) i opštinu. Nazivi su u strane.ts.
// Firme ne drže poene (UX 12.14). Oglasi firmi su u oglasi.ts (vlasnik = id firme).
import { NAZIV_FIRME, type FirmaId } from './strane'
import type { OpstinaId } from './opstine'

export type Firma = {
  id: FirmaId
  naziv: string
  delatnost: string
  opstina: OpstinaId
  /** Izmišljena adresa radnje (firma je javno prikazuje; građani nikad). */
  adresa: string
  radnoVreme: string
  opis: string
  /** Pretplata iz F1/F8: „Majstor“ ili „Radnja“. */
  plan: 'Majstor' | 'Radnja'
}

const f = (id: FirmaId, delatnost: string, opstina: OpstinaId, adresa: string, plan: Firma['plan'], opis: string): Firma => ({
  id,
  naziv: NAZIV_FIRME[id],
  delatnost,
  opstina,
  adresa,
  radnoVreme: 'Pon–pet 9–17, subota 9–14',
  opis,
  plan,
})

export const FIRME: Firma[] = [
  f('zupcanik', 'prodavnica sportske opreme', 'zvz', 'Demo ulica 5, Zvezdara', 'Radnja', 'Sportska oprema i bicikli. Primamo stare bicikle u akciji „staro za novo“.'),
  f('pedala', 'servis bicikala', 'voz', 'Demo ulica 12, Voždovac', 'Majstor', 'Servis bicikala svih veličina, od malog servisa do zamene delova.'),
  f('dule', 'elektro usluge', 'vra', 'Demo ulica 3, Vračar', 'Majstor', 'Električne instalacije, osigurači, utičnice i saveti za rasvetu.'),
  f('hrast', 'restauracija nameštaja', 'zem', 'Demo ulica 8, Zemun', 'Majstor', 'Restauracija i presvlačenje starog nameštaja.'),
  f('cekic', 'alati i mašine', 'rak', 'Demo ulica 21, Rakovica', 'Majstor', 'Popravka i oštrenje alata, pomoć pri montaži.'),
  f('belizid', 'građevinski radovi', 'cuk', 'Demo ulica 17, Čukarica', 'Majstor', 'Krečenje i gletovanje stanova.'),
  f('zavrtanj', 'kućni aparati', 'pal', 'Demo ulica 30, Palilula', 'Majstor', 'Popravka kućnih aparata i saveti pri kupovini.'),
  f('bajt', 'računari i telefoni', 'nbg', 'Demo ulica 44, Novi Beograd', 'Majstor', 'Servis računara i telefona, instalacije i saveti.'),
]

export const FIRMA_PO_ID: Record<string, Firma> = Object.fromEntries(FIRME.map((x) => [x.id, x]))
