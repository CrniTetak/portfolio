// Tekstovi primera dokumenata i e-mailova (P9, B3, B9, B11). SVE JE IZMIŠLJENO — nije pravni dokument.
// Menjaš li tekst, menjaš ga ovde; ekran samo prikazuje.
import { VERZIJA_DOKUMENATA, ZASTITNI_PERIOD_MESECI } from '../logika/konstante'
import { briefOdeljci, OZNAKA_ADVOKAT, ugovorOdeljci } from '../logika/dokumenti'

export type VrstaDokumenta = 'rezervacija' | 'pravni'

export interface Dokument {
  id: string
  naziv: string
  vrsta: VrstaDokumenta
  /** samo za pravne dokumente: "v0.1" */
  verzija: string | null
  /** strane dokumenta (kratko) */
  strane: string
  /** pasusi: [naslov, tekst] — za ugovor i Brief ovo je opšti primer; popunjenu verziju pravi logika/dokumenti.ts */
  odeljci: [string, string][]
}

const pravni = (id: string, naziv: string, strane: string, odeljci: [string, string][]): Dokument => ({
  id, naziv: `${naziv} (nacrt)`, vrsta: 'pravni', verzija: VERZIJA_DOKUMENATA, strane,
  odeljci: [...odeljci, ['Napomena', `${OZNAKA_ADVOKAT} (${VERZIJA_DOKUMENATA}, izmišljeno).`]],
})

/** Dokumenti iz rezervacije (ugovor o lokaciji, Location Brief, zapisnik) — opšti izmišljeni primeri. */
export const DOKUMENTI_REZERVACIJE: Dokument[] = [
  { id: 'ugovor', naziv: 'Ugovor o lokaciji', vrsta: 'rezervacija', verzija: null, strane: 'Vlasnik i produkcija (Nasetu je posrednik)', odeljci: ugovorOdeljci(null, null) },
  { id: 'brief', naziv: 'Location Brief', vrsta: 'rezervacija', verzija: null, strane: 'Dokument za ekipu', odeljci: briefOdeljci(null, null) },
  {
    id: 'zapisnik', naziv: 'Obrazac zapisnika na ulazu i izlazu', vrsta: 'rezervacija', verzija: null, strane: 'Vlasnik i produkcija',
    odeljci: [
      ['Stanje pri preuzimanju (ulaz)', 'Prostor i inventar su pregledani i uslikani (primer polja za unos).'],
      ['Stanje pri predaji (izlaz)', 'Prostor je vraćen u prvobitno stanje / primedbe (primer polja za unos).'],
      ['Depozit', 'Vraća se posle zapisnika na izlazu, po ugovoru o lokaciji (bez iznosa u ovom primeru).'],
      ['Potpisi', 'Vlasnik ____________    Korisnik ____________'],
    ],
  },
]

/** Pravni dokumenti iz tabele "Ugovorni dokumenti" (blueprint). Kratke ključne stavke, ne pravi tekst. */
export const PRAVNI_DOKUMENTI: Dokument[] = [
  pravni('uslovi', 'Opšti uslovi korišćenja', 'Nasetu i svi korisnici', [
    ['Uloga Nasetua', 'Nasetu je posrednik i nije strana u ugovoru o lokaciji.'],
    ['Naknade', 'Naknada se naplaćuje predračunom pre otkrivanja adrese i nepovratna je, osim kad otkaže vlasnik.'],
    ['Pravila sadržaja', 'Opisi, fotografije i podaci o prostoru moraju biti tačni; zabranjen je lažan ili tuđ sadržaj.'],
    ['Ograničenje odgovornosti', 'Odgovornost Nasetua je ograničena na visinu naknade (primer teksta).'],
    ['Nadležnost', 'Nadležan je sud u Beogradu.'],
  ]),
  pravni('posredovanje-vlasnik', 'Ugovor o posredovanju sa vlasnikom', 'Nasetu i vlasnik', [
    ['Ekskluzivnost', 'Ekskluzivnost ili ne — bira se ugovorom (primer polja).'],
    ['Zaštitni period', `Zaštitni period je ${ZASTITNI_PERIOD_MESECI} meseci: lokacija pronađena preko Nasetua ostaje u zaštiti i kad se posao nastavi mimo platforme.`],
    ['Pravo na izdavanje', 'Vlasnik garantuje pravo na izdavanje: vlasništvo, saglasnost zakupodavca, pravila zgrade.'],
    ['Fotografije i opisi', 'Vlasnik daje dozvolu za korišćenje fotografija i opisa prostora.'],
  ]),
  pravni('posredovanje-produkcija', 'Ugovor o posredovanju sa produkcijom', 'Nasetu i produkcija', [
    ['Naknada', 'Naknada, predračun i rok plaćanja (15%, najmanje 40 €, plaća se u dinarima).'],
    ['Zaštitni period', `Zabrana zaobilaženja za lokacije pronađene preko Nasetua; zaštitni period je ${ZASTITNI_PERIOD_MESECI} meseci.`],
    ['Poverljivost adrese', 'Tačna adresa se otkriva tek posle plaćene naknade i poverljiva je.'],
    ['Posledica kršenja', 'Posledica kršenja zabrane zaobilaženja uređuje se ugovorom (primer polja).'],
  ]),
  pravni('partner', 'Ugovor sa partnerom', 'Nasetu i location menadžer', [
    ['Deo naknade', 'Partner dobija deo naknade Nasetua (test: 20%), samo od plaćenih rezervacija.'],
    ['Isplata', 'Način isplate se uređuje ugovorom; u prvoj verziji se provizije vode ručno.'],
    ['Poverljivost', 'Poverljivost podataka o vlasnicima i produkcijama.'],
    ['Zabrana zaobilaženja', 'Partner ne zaobilazi Nasetu za lokacije i klijente dovedene preko platforme.'],
  ]),
  pravni('privatnost', 'Politika privatnosti i kolačića', 'Nasetu i svi korisnici', [
    ['Zakon', 'Zakon o zaštiti podataka o ličnosti (ZZPL).'],
    ['Svrhe i rokovi čuvanja', 'Svrhe obrade i rokovi čuvanja podataka (primer polja).'],
    ['Dobavljači', 'Dobavljači (baza, hosting, e-mail servis) su obrađivači; opisuje se i prenos podataka.'],
    ['Prava korisnika', 'Pravo na pristup, ispravku i brisanje podataka.'],
    ['Kolačići', 'Ovaj prototip ne koristi kolačiće ni analitiku.'],
  ]),
]

export const DOKUMENTI: Dokument[] = [...DOKUMENTI_REZERVACIJE, ...PRAVNI_DOKUMENTI]

export interface Mejl {
  id: string
  dogadjaj: string
  /** kome stiže (primer) */
  primalac: string
  posiljalac: string
  naslov: string
  vreme: string
  telo: string
  dugme: string
}

/** Zamena za adresu u javnom primeru podsetnika (B9). */
export const ADRESA_U_MEJLU = '[adresa — šalje se samo imenovanoj osobi]'

export const MEJLOVI: Mejl[] = [
  {
    id: 'novi-zahtev', dogadjaj: 'Novi zahtev vlasniku', primalac: 'Vlasnik prostora', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Novi zahtev za rezervaciju: Industrijski loft', vreme: 'pon 09:12',
    telo: 'Produkcija Delta traži vaš prostor 16–17. 11. 2026. Imate 48 sati da odobrite ili odbijete zahtev.', dugme: 'Otvori zahtev',
  },
  {
    id: 'osporena-opcija', dogadjaj: 'Osporena opcija', primalac: 'Produkcija sa prvom opcijom', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Druga produkcija traži isti termin', vreme: 'uto 11:40',
    telo: 'Druga produkcija želi isti termin kao vaša opcija. Imate 24 sata da potvrdite rezervaciju ili odustanete.', dugme: 'Potvrdi ili odustani',
  },
  {
    id: 'odobreno', dogadjaj: 'Odobrenje / odbijanje', primalac: 'Produkcija', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Vlasnik je odobrio vaš zahtev', vreme: 'sre 10:05',
    telo: 'Zahtev za Industrijski loft je odobren. U prilogu je predračun naknade u dinarima. Cenu lokacije plaćate direktno vlasniku.', dugme: 'Otvori predračun',
  },
  {
    id: 'uplata', dogadjaj: 'Potvrđena uplata', primalac: 'Produkcija', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Uplata je potvrđena — adresa je otvorena', vreme: 'čet 09:30',
    telo: 'Potvrdili smo uplatu naknade. Tačna adresa, kontakt i dokumenti sada su vam dostupni u aplikaciji (ne u ovoj poruci).', dugme: 'Otvori rezervaciju',
  },
  {
    id: 'podsetnik', dogadjaj: 'Podsetnik dan pre snimanja', primalac: 'Produkcija', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Sutra snimate: Industrijski loft', vreme: 'pon 16:00',
    telo: 'Podsetnik: sutra je dan snimanja. Ekipa stiže u 08:00, teretni lift je u dvorištu.', dugme: 'Pogledaj detalje',
  },
  {
    id: 'novi-brief', dogadjaj: 'Novi brief', primalac: 'Admin (Nasetu tim)', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Novi brief: Reklama, Beograd', vreme: 'pon 09:00',
    telo: 'Produkcija Delta poslala je novi zahtev (brief): reklama, Beograd, 16–17. 11. 2026, ekipa 11–30 ljudi. Izbor treba da stigne u 24–48 sati.', dugme: 'Otvori brief',
  },
  {
    id: 'odbijen-zahtev', dogadjaj: 'Vlasnik je odbio zahtev', primalac: 'Produkcija', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Vlasnik je odbio zahtev: Industrijski loft', vreme: 'sre 10:20',
    telo: 'Vlasnik je odbio vaš zahtev za Industrijski loft. Razlog: termin nije slobodan. Predlažemo drugu lokaciju iz vašeg izbora.', dugme: 'Pogledaj izbor',
  },
  {
    id: 'podsetnik-izvidjanje', dogadjaj: 'Podsetnik za izviđanje', primalac: 'Imenovana osoba za izviđanje (Ana P., izmišljeno)', posiljalac: 'Nasetu (izmišljeno)',
    naslov: 'Sutra je izviđanje: Industrijski loft', vreme: 'pon 10:00',
    telo: `Podsetnik, dan ranije: izviđanje je sutra u 11:00. Adresa: ${ADRESA_U_MEJLU}. Kontakt na izviđanju je Nasetu.`, dugme: 'Pogledaj izviđanje',
  },
]
