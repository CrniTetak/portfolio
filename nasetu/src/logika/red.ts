// A2 — Red za termin: ko je ranije stao u red za isti termin na istoj lokaciji ima prednost.
//
// "Učesnik reda" je produkcija koja za preklopljeni termin na toj lokaciji ima:
//   - ŽIVU opciju (aktivna ili osporena, neistekla), ili
//   - zahtev za rezervaciju koji čeka vlasnika (neistekao).
// Mesto u redu = vreme kad je produkcija postavila opciju. Zahtev koji je nastao iz opcije NASLEĐUJE vreme opcije
// (inače bi druga produkcija postala "prva" čim prva potvrdi i opcija se pretvori u zahtev); zahtev bez opcije ima vreme slanja.
// Jedna produkcija = jedan učesnik (najranije mesto). Kod istog vremena odlučuje redosled unosa.
import { efektivniRok, jeZiva } from './opcije'
import { kratakNaziv } from '../podaci/akteri'
import { preklapaju } from './termini'
import type { Opcija, Termin, Zahtev } from './tipovi'
import { istekao, preostaloSati } from './vreme'

export interface UcesnikReda {
  produkcijaId: string
  /** vreme postavljanja opcije (ili slanja zahteva bez opcije) */
  mesto: number
  /** redosled unosa za izjednačavanje */
  redosled: number
  izvor: 'opcija' | 'zahtev'
  /** do kada ovaj učesnik drži red (rok opcije ili rok vlasnika za zahtev) */
  rok: number
}

/** Zahtev koji još čeka vlasnika (nije ni odobren, ni odbijen, ni istekao). */
function cekaVlasnika(z: Zahtev, sada: number): boolean {
  return z.stanje === 'ceka' && !istekao(z.rok, sada)
}

/** Red za (lokacija, termin), prvi je na početku. */
export function redZaTermin(
  opcije: Opcija[], zahtevi: Zahtev[], lokacijaId: string, termin: Termin, sada: number,
): UcesnikReda[] {
  const svi: UcesnikReda[] = []
  opcije.forEach((o, i) => {
    if (o.lokacijaId === lokacijaId && jeZiva(o, sada) && preklapaju(o.termin, termin)) {
      svi.push({ produkcijaId: o.produkcijaId, mesto: o.postavljena, redosled: i, izvor: 'opcija', rok: efektivniRok(o) })
    }
  })
  zahtevi.forEach((z, i) => {
    if (z.lokacijaId !== lokacijaId || !cekaVlasnika(z, sada) || !preklapaju(z.termin, termin)) return
    // mesto u redu nasleđuje SAMO opcija iz koje je zahtev nastao (veza po ID-u); zahtev bez opcije ima vreme slanja
    const idxOpcije = z.opcijaId ? opcije.findIndex((o) => o.id === z.opcijaId) : -1
    const iz = idxOpcije >= 0 ? opcije[idxOpcije] : null
    svi.push({
      produkcijaId: z.produkcijaId, mesto: iz ? iz.postavljena : z.poslat,
      redosled: iz ? idxOpcije : 1_000_000 + i, izvor: 'zahtev', rok: z.rok,
    })
  })
  svi.sort((a, b) => a.mesto - b.mesto || a.redosled - b.redosled)
  // jedna produkcija = jedan učesnik: zadržava se njeno najranije mesto
  const videni = new Set<string>()
  return svi.filter((u) => (videni.has(u.produkcijaId) ? false : (videni.add(u.produkcijaId), true)))
}

export interface Prednost { moze: boolean; razlog: string | null }

/** Zahtev sme da se odobri samo ako je njegova produkcija prva u redu za taj termin. */
export function prednostZahteva(z: Zahtev, opcije: Opcija[], zahtevi: Zahtev[], sada: number): Prednost {
  const red = redZaTermin(opcije, zahtevi, z.lokacijaId, z.termin, sada)
  const prvi = red[0]
  if (!prvi || prvi.produkcijaId === z.produkcijaId) return { moze: true, razlog: null }
  const ime = kratakNaziv(prvi.produkcijaId)
  const sati = preostaloSati(prvi.rok, sada)
  return prvi.izvor === 'opcija'
    ? { moze: false, razlog: `Čeka se odluka prve opcije (${ime}), još ${sati} h` }
    : { moze: false, razlog: `Prednost ima zahtev ${ime} (prva opcija) — prvo odlučite o njemu (rok još ${sati} h)` }
}

/**
 * Zahtev (ili opcija) produkcije koja NIJE prva pokreće osporavanje prve opcije: ona dobija 24 h da potvrdi ili odustane.
 * Ništa se ne menja ako je prva ta ista produkcija, ako prvi učesnik nema živu opciju (već je poslao zahtev),
 * ili ako je osporavanje već pokrenuto (rok se ne pomera).
 */
export function pokreniOsporavanje(
  opcije: Opcija[], zahtevi: Zahtev[], lokacijaId: string, termin: Termin, izazivacId: string, sada: number, satiOsporavanja: number,
): Opcija[] {
  const prvi = redZaTermin(opcije, zahtevi, lokacijaId, termin, sada)[0]
  if (!prvi || prvi.produkcijaId === izazivacId || prvi.izvor !== 'opcija') return opcije
  const njena = opcije.find(
    (o) => o.lokacijaId === lokacijaId && o.produkcijaId === prvi.produkcijaId && jeZiva(o, sada) && preklapaju(o.termin, termin))
  if (!njena || njena.osporavanje) return opcije
  return opcije.map((o) =>
    o.id === njena.id ? { ...o, osporavanje: { od: izazivacId, rok: sada + satiOsporavanja } } : o)
}

/** Zahtevi koji se automatski odbijaju kad vlasnik odobri `odobren`: svi ostali na čekanju za preklopljeni termin na toj lokaciji. */
export function zahteviZaAutoOdbijanje(odobren: Zahtev, zahtevi: Zahtev[], sada: number): Zahtev[] {
  return zahtevi.filter(
    (x) => x.id !== odobren.id && x.lokacijaId === odobren.lokacijaId && cekaVlasnika(x, sada) && preklapaju(x.termin, odobren.termin))
}

export const RAZLOG_AUTO_ODBIJANJA = 'Termin je potvrđen produkciji sa prvom opcijom'
