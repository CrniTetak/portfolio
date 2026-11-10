// Pomoćne funkcije koje iz stanja izvlače ono što ekrani prikazuju. Bez menjanja stanja.
import { prikazAdrese, type KontekstAdrese, type PrikazAdrese } from '../logika/adresa'
import type { PodaciDokumenta } from '../logika/dokumenti'
import { zauzetiDani as zauzetiDaniLokacije } from '../logika/kalendar'
import { lokacijeIzKataloga } from '../logika/objava'
import { fazaRezervacije, stanjeZahteva } from '../logika/rezervacije'
import { preklapaju, proveriTermin, type ProveraTermina } from '../logika/termini'
import type { Opcija, Predracun, Termin, Zahtev } from '../logika/tipovi'
import { akterUloge, DELTA, nazivAktera, TIP_VLASNIKA } from '../podaci/akteri'
import { nadjiLokaciju, type Lokacija } from '../podaci/lokacije'
import type { Brief, Izbor, Stanje } from './tipovi'

export const akterTrenutni = (s: Stanje) => akterUloge(s.uloga, s.prikazVlasnika)

export const briefDelte = (s: Stanje): Brief | undefined =>
  [...s.briefovi].reverse().find((b) => b.produkcijaId === DELTA)

/** Izbor koji je admin poslao Delti (ne nacrt). */
export const izborDelte = (s: Stanje): Izbor | undefined =>
  [...s.izbori].reverse().find((i) => i.akterId === DELTA && i.poslatProdukciji !== null)

/** Izbor koji uređuje aktivna uloga (nacrt ili poslati). */
export const izborTrenutni = (s: Stanje): Izbor | undefined =>
  [...s.izbori].reverse().find((i) => i.akterId === akterTrenutni(s))

export const predracunZa = (s: Stanje, zahtevId: string): Predracun | undefined =>
  s.predracuni.find((p) => p.zahtevId === zahtevId)

export const opcijeDelte = (s: Stanje): Opcija[] => s.opcije.filter((o) => o.produkcijaId === DELTA)
export const zahteviDelte = (s: Stanje): Zahtev[] => s.zahtevi.filter((z) => z.produkcijaId === DELTA)

/** Zahtevi koji stižu vlasniku (po vlasniku lokacije). */
export const zahteviVlasnika = (s: Stanje, vlasnikId: string): Zahtev[] =>
  s.zahtevi.filter((z) => nadjiLokaciju(z.lokacijaId)?.vlasnikId === vlasnikId)

/** Najnoviji zahtev je prvi (da vlasnik odmah vidi ono što je upravo stiglo). */
export const zahteviKojiCekaju = (s: Stanje, vlasnikId: string): Zahtev[] =>
  zahteviVlasnika(s, vlasnikId)
    .filter((z) => stanjeZahteva(z, s.sati) === 'ceka')
    .reverse() // kod istog vremena novije uneti ide prvi
    .sort((a, b) => b.poslat - a.poslat)

export function kontekstAdrese(s: Stanje): KontekstAdrese {
  return { zahtevi: s.zahtevi, predracuni: s.predracuni, izvidjanja: s.izvidjanja, sada: s.sati }
}

/** Adresa kako je vidi aktivna uloga. Jedini put do adrese za ekrane (preko logika/adresa.ts). */
export function adresaZaUlogu(s: Stanje, lokacijaId: string): PrikazAdrese {
  return prikazAdrese(lokacijaId, { uloga: s.uloga, akterId: akterTrenutni(s) }, kontekstAdrese(s))
}

/** Adresa kako je vidi imenovana osoba za izviđanje (kartica "Poruka za: …"). */
export function adresaZaImenovanu(s: Stanje, lokacijaId: string, osoba: string): PrikazAdrese {
  return prikazAdrese(lokacijaId, { uloga: 'produkcija', akterId: DELTA, imenovanaOsoba: osoba }, kontekstAdrese(s))
}

/** Adresa kako je vidi primalac linka izbora (uvek samo zona). */
export function adresaZaPrimaoca(s: Stanje, lokacijaId: string): PrikazAdrese {
  return prikazAdrese(lokacijaId, { uloga: 'primalac', akterId: 'primalac' }, kontekstAdrese(s))
}

/**
 * Provera termina iz ugla Produkcije Delta: termin koji je Delta sama dobila (odobren njen zahtev)
 * se ne prikazuje kao "zauzet za drugu rezervaciju" nego kao "već imate rezervaciju".
 */
export function proveriTerminZaDeltu(s: Stanje, lokacijaId: string, termin: Termin, zauzetiDani: string[]): ProveraTermina {
  const svoja = s.zahtevi.some(
    (z) => z.produkcijaId === DELTA && z.lokacijaId === lokacijaId && z.stanje === 'odobren' && preklapaju(z.termin, termin))
  if (svoja) return { slobodan: false, razlog: 'Već imate rezervaciju za ovaj termin.' }
  return proveriTermin(lokacijaId, termin, s.zahtevi, zauzetiDani)
}

// ---- Lokacije i kalendar (B6, B7) ----

/** Sve lokacije u katalogu: 10 izmišljenih + one koje je admin objavio u prototipu. */
export const sveLokacije = (s: Stanje): Lokacija[] => lokacijeIzKataloga(s.prijaveLokacija)

/** Lokacija po ID-u, uključujući objavljene (nove) lokacije. */
export const nadjiUStanju = (s: Stanje, id: string): Lokacija | undefined => sveLokacije(s).find((l) => l.id === id)

/** Zatvoreni dani lokacije: unapred zauzeti + blokirani od vlasnika. SVE provere termina uzimaju dane odavde. */
export const zauzetiDani = (s: Stanje, l: Lokacija): string[] => zauzetiDaniLokacije(l, s.blokiraniDani)

// ---- Dokumenti iz rezervacije (A5, A6) ----

/**
 * Podaci za ugovor / Location Brief iz PLAĆENE rezervacije, ili null (tada se prikazuje opšti izmišljeni primer).
 * Prvi zaštitni sloj: pravo posmatrača (produkcija te rezervacije, vlasnik te lokacije, admin). Drugi sloj je
 * logika/adresa.ts, koja adresu otvara tek kad su ispunjeni isti uslovi.
 */
export function podaciZaDokument(s: Stanje, zahtevId: string | null): PodaciDokumenta | null {
  if (!zahtevId) return null
  const z = s.zahtevi.find((x) => x.id === zahtevId)
  const l = z ? nadjiLokaciju(z.lokacijaId) : undefined
  if (!z || !l) return null
  if (fazaRezervacije(z, predracunZa(s, z.id), s.sati) !== 'placeno') return null
  const ja = akterTrenutni(s)
  const smeProdukcija = s.uloga === 'produkcija' && ja === z.produkcijaId
  const smeVlasnik = s.uloga === 'vlasnik' && ja === l.vlasnikId
  if (!smeProdukcija && !smeVlasnik && s.uloga !== 'admin') return null
  const brief = s.briefovi.find((b) => b.id === z.briefId)
  return {
    zahtevId: z.id, projekat: brief ? `${brief.vrsta}, ${brief.grad}` : 'Projekat produkcije',
    vlasnikNaziv: nazivAktera(l.vlasnikId), vlasnikTip: TIP_VLASNIKA[l.vlasnikId] ?? 'pravno',
    korisnikNaziv: nazivAktera(z.produkcijaId), lokacijaNaziv: l.naziv, opstina: l.opstina, termin: z.termin,
    razred: z.razred, prekovremeniSati: z.prekovremeniSati, osnovicaCenti: z.osnovicaCenti, kurs: z.kurs, tehnicki: l.tehnicki,
  }
}
