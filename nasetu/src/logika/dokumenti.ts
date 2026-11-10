// A5/A6/B5 — Tekstovi dokumenata koji se popunjavaju iz rezervacije (ugovor o lokaciji, Location Brief).
// Funkcije su čiste: dobijaju podatke i (za adresu) gotov rezultat iz logika/adresa.ts — nikad same ne čitaju adresu.
import type { GrupaTehnickog } from '../podaci/lokacije'
import type { PrikazAdrese } from './adresa'
import {
  OTKAZIVANJE_BEZ_NAKNADE_DANA, OTKAZIVANJE_POLA_DANA, VERZIJA_DOKUMENATA, ZASTITNI_PERIOD_MESECI,
} from './konstante'
import { eur, NAZIV_RAZREDA, rsdPara, uPare, type Razred, type TipVlasnika } from './novac'
import { opisTermina } from './prikaz'
import type { Termin } from './tipovi'
import { formatDan } from './vreme'

export type Odeljci = [string, string][]

/** Oznaka koja stoji na svakom izmišljenom pravnom dokumentu. */
export const OZNAKA_ADVOKAT = 'predlog; konačan tekst piše advokat'

export const TEKST_DEPOZITA =
  'Depozit plaća produkcija direktno vlasniku, po ugovoru o lokaciji; vraća se posle zapisnika na izlazu.'

/** Predlog otkazivanja (blueprint: Pravni okvir) — PREDLOG ZA ADVOKATA. */
export const OTKAZIVANJE_REDOVI: string[] = [
  `Više od ${OTKAZIVANJE_BEZ_NAKNADE_DANA} dana pre snimanja: vlasniku se ne plaća ništa.`,
  `Od ${OTKAZIVANJE_POLA_DANA} do ${OTKAZIVANJE_BEZ_NAKNADE_DANA} dana pre snimanja: plaća se pola cene lokacije.`,
  `Manje od ${OTKAZIVANJE_POLA_DANA} dana pre snimanja: plaća se cela cena lokacije.`,
  'Naknada Nasetua je nepovratna, osim kad otkaže vlasnik.',
]

export const TEKST_ZASTITNI_PERIOD =
  `Lokacija je pronađena preko Nasetua; po ugovoru o posredovanju zaštitni period je ${ZASTITNI_PERIOD_MESECI} meseci.`

export const TEKST_POSLE_UPLATE = 'vidi se posle potvrđene uplate naknade'

/** Podaci jedne PLAĆENE rezervacije; popunjava ih stanje/izvedeno.ts samo uz proveru prava. */
export interface PodaciDokumenta {
  zahtevId: string
  projekat: string
  vlasnikNaziv: string
  vlasnikTip: TipVlasnika
  korisnikNaziv: string
  lokacijaNaziv: string
  opstina: string
  termin: Termin
  razred: Razred
  prekovremeniSati: number
  osnovicaCenti: number
  kurs: number
  tehnicki: GrupaTehnickog[]
}

const vred = (g: GrupaTehnickog[], naziv: string) =>
  g.flatMap((x) => x.stavke).find(([n]) => n === naziv)?.[1] ?? '—'

/** Termin rečima: "pripremni dan 16. 11. 2026. i snimajući dan 17. 11. 2026." */
function terminRecima(t: Termin): string {
  const delovi: string[] = []
  if (t.priprema.length) delovi.push(`${t.priprema.length === 1 ? 'pripremni dan' : 'pripremni dani'} ${t.priprema.map(formatDan).join(', ')}`)
  delovi.push(`${t.snimanje.length === 1 ? 'snimajući dan' : 'snimajući dani'} ${t.snimanje.map(formatDan).join(', ')}`)
  return delovi.join(' i ')
}

/** Izmišljeni opšti primer (kad dokument nije otvoren iz plaćene rezervacije). */
const OPSTI: Pick<PodaciDokumenta, 'vlasnikNaziv' | 'korisnikNaziv' | 'lokacijaNaziv' | 'opstina' | 'termin'> = {
  vlasnikNaziv: 'Alfa Prostori d.o.o. (izmišljeno)',
  korisnikNaziv: 'Produkcija Delta (izmišljeno)',
  lokacijaNaziv: 'Industrijski loft',
  opstina: 'Savski venac',
  termin: { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] },
}

const adresaOtvorena = (a: PrikazAdrese | null) => !!a && a.nivo !== 'zona' && !!a.adresa

/**
 * Ugovor o lokaciji (primer). Strane su samo vlasnik i korisnik; Nasetu je posrednik i nije strana (A5).
 * Sa `podaci` popunjava strane, lokaciju, termin, ekipu i cenu iz rezervacije; bez njih ostaje izmišljen opšti primer.
 * Adresa se upisuje samo ako ju je logika/adresa.ts otvorila (O23).
 */
export function ugovorOdeljci(podaci: PodaciDokumenta | null, adresa: PrikazAdrese | null): Odeljci {
  const d = podaci ?? OPSTI
  const fizicko = podaci?.vlasnikTip === 'fizicko'
  const cena = podaci
    ? `Cena lokacije za izabrani termin: ${rsdPara(uPare(podaci.osnovicaCenti, podaci.kurs))} (≈ ${eur(podaci.osnovicaCenti)}, orijentaciono; izmišljen kurs ${podaci.kurs}). Korisnik cenu plaća direktno vlasniku, u dinarima.${fizicko ? ' Vlasnik je fizičko lice: korisnik zadržava porez po odbitku i uplaćuje ga državi (orijentaciono).' : ' Vlasnik izdaje fakturu na punu cenu.'}`
    : 'Cenu korišćenja prostora korisnik plaća direktno vlasniku, po cenovniku prostora (izmišljeni iznosi).'
  const prekovremeni = podaci && podaci.prekovremeniSati > 0
    ? ` Prekovremeni rad: ${podaci.prekovremeniSati} h.`
    : ' Prekovremeni rad se posebno dogovara i plaća po cenovniku prostora.'
  const redovi: Odeljci = [
    ['Strane', `Vlasnik prostora: ${d.vlasnikNaziv}. Korisnik (produkcija): ${d.korisnikNaziv}.`],
    ['Posrednik, nije strana u ugovoru', 'Nasetu (izmišljeno) posreduje i naplaćuje samo svoju naknadu, posebnim predračunom.'],
    ['Predmet', `Vlasnik ustupa korisniku prostor „${d.lokacijaNaziv}“ (${d.opstina}) za snimanje.`],
  ]
  if (podaci) {
    redovi.push(['Adresa prostora', adresaOtvorena(adresa) ? `${adresa!.adresa} (izmišljeno)` : TEKST_POSLE_UPLATE])
  }
  redovi.push(
    ['Termin, sati i prekovremeni rad', `${terminRecima(d.termin)} (${opisTermina(d.termin)}).${prekovremeni}`],
    ['Broj ljudi', podaci ? `Ekipa: ${NAZIV_RAZREDA[podaci.razred]}.` : 'Ekipa do 30 ljudi.'],
    ['Cena', cena],
    ['Dozvoljene izmene i vraćanje u prvobitno stanje', 'Dozvoljene su samo privremene izmene bez oštećenja; korisnik vraća prostor u prvobitno stanje.'],
    ['Depozit', TEKST_DEPOZITA],
    ['Zapisnik na ulazu i izlazu', 'Stanje prostora i inventara beleži se zapisnikom pri preuzimanju i pri predaji (obrazac je u primerima).'],
    ['Otkazivanje (predlog za advokata)', OTKAZIVANJE_REDOVI.join(' ')],
    ['Viša sila', 'Strana koju je viša sila sprečila obaveštava drugu stranu bez odlaganja; termin se prenosi ili ugovor raskida bez penala.'],
    ['Saglasnost za snimanje i emitovanje', 'Vlasnik daje saglasnost da se prostor snima i da se snimak emituje u dogovorenu svrhu.'],
    ['Polisa produkcije', 'Za veća snimanja korisnik pokazuje polisu osiguranja od odgovornosti.'],
    ['Napomena', `${OZNAKA_ADVOKAT} (${VERZIJA_DOKUMENATA}, izmišljeno).`],
  )
  return redovi
}

/**
 * Location Brief (primer): dokument za ekipu. "Adresa i ulaz" i "Kontakt na dan snimanja" se popunjavaju samo kad je
 * logika/adresa.ts otvorila adresu (plaćena rezervacija); u svakom drugom slučaju piše da se vidi posle potvrđene uplate.
 */
export function briefOdeljci(podaci: PodaciDokumenta | null, adresa: PrikazAdrese | null): Odeljci {
  const d = podaci ?? OPSTI
  const g = podaci?.tehnicki
  const otvoreno = !!podaci && adresaOtvorena(adresa)
  const ekipa = podaci ? `Ekipa: ${NAZIV_RAZREDA[podaci.razred]}.` : 'Maksimalno 30 ljudi.'
  const adresaTekst = otvoreno
    ? `${adresa!.adresa}${adresa!.pristup ? ` — pristup: ${adresa!.pristup}` : ''} (izmišljeno)`
    : TEKST_POSLE_UPLATE
  const kontaktTekst = otvoreno && adresa!.kontaktOsoba
    ? `${adresa!.kontaktOsoba}, ${adresa!.telefon} (izmišljeno)`
    : TEKST_POSLE_UPLATE
  const logistika = g
    ? `${vred(g, 'Put za opremu')}; parking: ${vred(g, 'Parking za automobile')}; kamioni: ${vred(g, 'Parking za kamione')}; ekipa: ${vred(g, 'Prostor za ekipu')}.`
    : 'Teretni lift iz dvorišta, parking za 2 vozila, odvojena prostorija za ekipu.'
  const pravila = g
    ? `Dozvoljeni sati ${vred(g, 'Dozvoljeni sati')}; izmene: ${vred(g, 'Izmene u prostoru')}; pušenje: ${vred(g, 'Pušenje')}; zgrada: ${vred(g, 'Pravila zgrade')}.`
    : 'Bez bušenja zidova, pušenje samo u dvorištu, dozvoljeni sati 07:00–22:00.'
  return [
    ['Projekat', podaci ? `${podaci.projekat}. Producent: Ana P. (izmišljeno).` : 'Reklama za domaći brend (izmišljeno). Producent: Ana P. (izmišljeno).'],
    ['Lokacija', `${d.lokacijaNaziv}, ${d.opstina}. Termin: ${terminRecima(d.termin)}. Dolazak ekipe: 08:00. ${ekipa}`],
    ['Adresa i ulaz', adresaTekst],
    ['Logistika', logistika],
    ['Pravila prostora', pravila],
    ['Kontakt na dan snimanja', kontaktTekst],
  ]
}
