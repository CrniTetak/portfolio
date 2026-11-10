// RECENZIJE (UX 7.8, PLAN B5.6): mali skup tekstova (ocena 3–5, tekst se slaže sa ocenom) i deterministička raspodela.
// Prikazana ocena se NE čuva nigde: računa se iz raspodele ocena u korisnici.ts, pa se uvek slaže sa stvarnim recenzijama.
// Recenzije imaju oznaku „proverena razmena“ (tekst oznake je u tekstovima; ovde je samo podatak).
import { ANA_ID, JOVANA_ID, KORISNICI, type Ocene } from './korisnici'

export type Recenzija = { autor: string; ocena: 3 | 4 | 5; tekst: string }

/** Tekstovi po oceni. Tekst uvek odgovara oceni (ispravka greške iz Figme). */
export const TEKSTOVI: Record<3 | 4 | 5, string[]> = {
  5: ['Sve kako je opisano, brz dogovor.', 'Odlična razmena, preporuka.', 'Tačna i ljubazna.', 'Preporuka, sve u najboljem redu.', 'Stvar je tačno kao u oglasu.', 'Brz odgovor i tačan dolazak na dogovoreno mesto.'],
  4: ['Stvar je malo više korišćena nego što piše, ali sve u redu.', 'Dobar dogovor, malo se čekalo na mestu preuzimanja.', 'Sve u redu, samo je dogovor trajao malo duže.', 'Dobra razmena, preporučujem.', 'Uglavnom kako je opisano, uz sitnu napomenu oko stanja.'],
  3: ['Stvar je u redu, ali opis nije bio sasvim tačan.', 'Dogovor je išao sporo, ali se sve završilo.', 'Prihvatljivo, očekivao sam malo bolje stanje.', 'Sve je prošlo, samo je stvar bila malo lošija nego na slici.', 'Razmena je obavljena, ali bez mnogo komunikacije.'],
}

/** Jovanin vrh liste: tačno kako piše u UX 7.8 (5 poslednjih). */
const JOVANA_POSLEDNJIH_5: Recenzija[] = [
  { autor: 'irena_zem80', ocena: 5, tekst: TEKSTOVI[5][0] },
  { autor: 'mila_cuk88', ocena: 5, tekst: TEKSTOVI[5][1] },
  { autor: 'bojan_rak72', ocena: 4, tekst: TEKSTOVI[4][0] },
  { autor: 'stefan_nbg93', ocena: 4, tekst: TEKSTOVI[4][1] },
  { autor: 'sanja_sur85', ocena: 5, tekst: TEKSTOVI[5][2] },
]

/** Raspodela ocena u redosled (najnovija prva): prvo se uzima ocena kojoj najviše „duguje“ (ravnomerno, bez slučajnosti). */
export function redosledOcena(o: Ocene): (3 | 4 | 5)[] {
  const ostalo = { 5: o[5], 4: o[4], 3: o[3] }
  const ukupno = o[5] + o[4] + o[3]
  const izlaz: (3 | 4 | 5)[] = []
  const dato = { 5: 0, 4: 0, 3: 0 }
  for (let i = 1; i <= ukupno; i++) {
    let najbolja: 3 | 4 | 5 = 5
    let najveci = -Infinity
    for (const g of [5, 4, 3] as const) {
      if (ostalo[g] === 0) continue
      const dug = (o[g] * i) / ukupno - dato[g]
      if (dug > najveci) {
        najveci = dug
        najbolja = g
      }
    }
    izlaz.push(najbolja)
    dato[najbolja]++
    ostalo[najbolja]--
  }
  return izlaz
}

/** Autori recenzija: korisnici osim vlasnika profila, redom, počevši od mesta koje zavisi od profila. */
function autori(vlasnik: string): string[] {
  const svi = KORISNICI.filter((k) => k.id !== vlasnik && k.id !== ANA_ID && k.uloga !== 'prijavljeni').map((k) => k.id)
  let pomak = 0
  for (const c of vlasnik) pomak = (pomak + c.charCodeAt(0)) % svi.length
  return [...svi.slice(pomak), ...svi.slice(0, pomak)]
}

/** Poslednjih `k` recenzija korisnika (najnovija prva). `ocene` je trenutna raspodela (može biti uvećana kroz priču). */
export function poslednjeRecenzije(korisnikId: string, ocene: Ocene, k = 5): Recenzija[] {
  if (korisnikId === JOVANA_ID && ocene[5] + ocene[4] + ocene[3] >= 29) {
    if (k <= 5) return JOVANA_POSLEDNJIH_5.slice(0, k)
    // N4 „Sve recenzije“: pet iz UX 7.8 pa ostale iz preostale raspodele ocena (broj i prosek ostaju usklađeni)
    const ostatak: Ocene = { ...ocene }
    for (const r of JOVANA_POSLEDNJIH_5) ostatak[r.ocena] -= 1
    return [...JOVANA_POSLEDNJIH_5, ...generisi(korisnikId, ostatak, k - 5)]
  }
  return generisi(korisnikId, ocene, k)
}

/** Recenzije iz raspodele ocena: ocena po ocena, autor iz kruga ostalih korisnika, tekst koji odgovara oceni. */
function generisi(korisnikId: string, ocene: Ocene, k: number): Recenzija[] {
  const redosled = redosledOcena(ocene)
  const aut = autori(korisnikId)
  // N2: u prikazanih k recenzija nijedan tekst se ne ponavlja (uzima se sledeći NEISKORIŠĆEN tekst za tu ocenu, počev od mesta koje zavisi od redosleda)
  const iskorisceno = new Set<string>()
  return redosled.slice(0, k).map((ocena, i) => {
    const tekstovi = TEKSTOVI[ocena]
    let tekst = tekstovi[i % tekstovi.length]
    for (let p = 0; p < tekstovi.length && iskorisceno.has(tekst); p++) tekst = tekstovi[(i + p + 1) % tekstovi.length]
    iskorisceno.add(tekst)
    return { autor: aut[i % aut.length], ocena, tekst }
  })
}
