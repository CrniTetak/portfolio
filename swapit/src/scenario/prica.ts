// PODACI ZA EKRANE PRIČE (talas 1): ponude, lanac, razgovor, rastojanja, recenzije priče, priče zajednice, reklame.
// Sve je izmišljeno. Brojke i imena koja ekrani prikazuju stoje ovde (ekrani ih ne kucaju); iznosi i poeni se računaju u svet.ts / cene.ts.
import { ANA_ID, JOVANA_ID, MARKO_ID } from './korisnici'
import { NAZIV_FIRME, type FirmaId } from './strane'

/** R3: „Imam {N} ili više godina“. */
export const GODINE_PUNOLETSTVA = 18
/** R2 i R4: popunjeno za demo (adresa u rezervisanom domenu .example, kod je statičan tekst). */
export const KONTAKT_ANA = 'ana@demo-posta.example'
/** R2 (S1): maskiran demo broj telefona uz e-poštu; pravi broj se ne prikazuje nigde. */
export const TELEFON_ANA_MASKIRAN = '06x xxx xx00 (demo)'
export const KOD_POTVRDE = '4 8 2 9 1 7'
/** W3 i P6: podrazumevan radijus (UX 12, stavka 5); samo prikaz. */
export const RADIJUS_KM = 30
/** W4: približno rastojanje do oglasa iz priče (UX 3.3, korak 3). */
export const RASTOJANJE_KM: Record<string, number> = { 'markov-bicikl': 2, 'jovanini-udzbenici': 4 }
/** D1: najveća težina male pošiljke. */
export const MALA_POSILJKA_KG = 5

/** „Traži zauzvrat“ za predmete priče (lista želja vlasnika). Za ostale oglase ekran navodi samo vrstu (roba / usluga / ideja). */
export const TRAZI_TEKST: Record<string, string> = {
  'markov-bicikl': 'Udžbenici za 3. razred',
  'ana-ps2': 'Dečji bicikl 20 inča',
  'jovanini-udzbenici': 'Konzola za brata',
  'markova-jakna': 'Dečija zimska obuća',
}

/** Duži opisi predmeta priče (O1). */
export const OPIS_PRICE: Record<string, string> = {
  'markov-bicikl': 'Dečji bicikl 20 inča, sin ga je prerastao. Dobro očuvan, sa novim lancem i zvoncem. Može da se preuzme lično ili da ga pošalje kurir.',
  'ana-ps2': 'PlayStation 2 sa dva džojstika i nekoliko igara. Radi bez greške, korišćen. Preuzimanje samo lično, na preporučenom javnom mestu.',
  'jovanini-udzbenici': 'Komplet od pet udžbenika za 3. razred, bez ispisanih strana. Preuzimanje samo lično, na preporučenom javnom mestu.',
}

/** Datum pridruživanja (N1). Ana se pridružuje u koraku 1 (demo datum). */
export const CLAN_OD: Record<string, string> = {
  marko_voz77: 'mart 2024.',
  jovana_vra91: 'januar 2023.',
  nenad_pal65: 'jun 2025.',
  mila_cuk88: 'septembar 2023.',
  stefan_nbg93: 'februar 2025.',
  irena_zem80: 'maj 2022.',
  bojan_rak72: 'novembar 2024.',
  sanja_sur85: 'april 2025.',
}
export const CLAN_OD_PODRAZUMEVANO = 'januar 2025.'

/** Stvar koju neko nudi u ponudi (X4/X5). `oglas` = id oglasa iz oglasi.ts; ostalo su stvari koje nisu oglasi u demou. */
export type Stvar = { naslov: string; vrsta: 'roba' | 'usluga' | 'ideja'; oglas?: string; ikonica?: string }
export type PrimljenaPonuda = { id: string; od: string; stvari: Stvar[]; poruka: string }

/** X4: primljene ponude za Markov bicikl. Anina stiže u koraku 4, Irenina i Stefanova su tu od početka. */
export const PONUDE_MARKO: PrimljenaPonuda[] = [
  { id: 'ana-ps2', od: ANA_ID, stvari: [{ naslov: 'PlayStation 2 sa igrama', vrsta: 'roba', oglas: 'ana-ps2', ikonica: 'gamepad-2' }], poruka: 'Zdravo! Nudim PlayStation 2 sa igrama za tvoj bicikl.' },
  { id: 'irena-roleri', od: 'irena_zem80', stvari: [{ naslov: 'Dečji roleri sa kacigom', vrsta: 'roba', ikonica: 'footprints' }], poruka: 'Zdravo! Roleri su malo korišćeni, kaciga ide uz njih.' },
  { id: 'stefan-trening', od: 'stefan_nbg93', stvari: [{ naslov: 'Plan treninga za decu', vrsta: 'ideja', ikonica: 'lightbulb' }], poruka: 'Zdravo! Nudim plan treninga prilagođen deci.' },
]

/** X6: razlozi odbijanja. */
export const RAZLOZI_ODBIJANJA = ['Ne treba mi', 'Nije ono što tražim', 'Imam bolju ponudu', 'Drugo']

/** X13/X8/X9: veze lanca razmene. `ka` prima stvar. */
export type VezaLanca = { od: string; ka: string; oglas: string }
export const LANAC: VezaLanca[] = [
  { od: ANA_ID, ka: JOVANA_ID, oglas: 'ana-ps2' },
  { od: JOVANA_ID, ka: MARKO_ID, oglas: 'jovanini-udzbenici' },
  { od: MARKO_ID, ka: ANA_ID, oglas: 'markov-bicikl' },
]
/** Način predaje po vezi lanca (X8): lično na javnom mestu, a bicikl ide kurirom. */
export const PREDAJA_LANCA: ('licno' | 'kurir')[] = ['licno', 'licno', 'kurir']

/** C2: poruke razgovora trojice (unapred napisane); treća poruka je odgovor gledaoca (čip „Dogovoreno“). */
export const PORUKE_LANCA: { od: string; tekst: string }[] = [
  { od: MARKO_ID, tekst: 'Super što se lanac složio. Bicikl bih poslao kurirom, može?' },
  { od: JOVANA_ID, tekst: 'Meni odgovara lično, u subotu u 11, ispred biblioteke.' },
]
export const ODGOVOR_DOGOVORENO: Record<string, string> = {
  ana_zvz84: 'Dogovoreno. Dostavu bicikla plaćam ja.',
  marko_voz77: 'Dogovoreno. Bicikl predajem kuriru, Ana plaća dostavu.',
}
export const CIPOVI_ODGOVORA = ['Dogovoreno', 'U subotu u 11?', 'Može kurir?']
/** Predlozi u razgovoru van lanca (nema čipa „Dogovoreno“, to je radnja priče). */
export const PREDLOZI_RAZGOVORA = ['Zdravo!', 'Da li je još dostupno?', 'Kada može preuzimanje?']
/** Pozdrav u razgovoru sa jednim korisnikom (C2 van priče). */
export const POZDRAV_RAZGOVORA = 'Zdravo! Oglas je još dostupan.'
/** Pozdrav kad razgovor otvara primalac ponude (X5 „Pitaj“): on pita, pa on i piše prvi. */
export const POZDRAV_PITANJE_O_PONUDI = 'Zdravo! Hvala na ponudi. Imam jedno pitanje.'

/** X11: recenzije koje se objavljuju u koraku 8 (autor → o kome → ocena → tekst). */
export const RECENZIJE_PRICE: { autor: string; o: string; ocena: 3 | 4 | 5; tekst: string }[] = [
  { autor: ANA_ID, o: MARKO_ID, ocena: 5, tekst: 'Bicikl je tačno kao u oglasu, dogovor brz i ljubazan.' },
  { autor: MARKO_ID, o: JOVANA_ID, ocena: 5, tekst: 'Udžbenici su kao novi, sve u redu.' },
  { autor: JOVANA_ID, o: ANA_ID, ocena: 5, tekst: 'Konzola radi bez greške, hvala.' },
]

/** X11 (S3): tekst komentara prati izabranu ocenu (u priči je ocena zaključana na 5, pa važi tekst iz RECENZIJE_PRICE). */
export const KOMENTAR_PO_OCENI: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Stvar nije bila kao u opisu i dogovor nije išao dobro.',
  2: 'Stvar ima više mana nego što piše u oglasu.',
  3: 'Stvar je u redu, ali opis nije bio sasvim tačan.',
  4: 'Dobar dogovor, malo se čekalo na mestu preuzimanja.',
  5: 'Sve je tačno kao u oglasu, dogovor brz i ljubazan.',
}

/** P1: priče zajednice (obaveštenja, ne prodaja). */
export const STORIJE = [
  { id: 'jabuke', naslov: 'Jabuke iz bašte', ikonica: 'apple', tekst: 'Delimo višak jabuka iz bašte u Surčinu, javite se u poruci.' },
  { id: 'knjige', naslov: 'Knjige za škole', ikonica: 'book-open', tekst: 'Skupljamo udžbenike za prvake iz komšiluka.' },
  { id: 'biciklisti', naslov: 'Vožnja nedeljom', ikonica: 'bike', tekst: 'Porodična vožnja uz Savu, dolaze svi sa biciklima.' },
  { id: 'popravke', naslov: 'Popravka za sve', ikonica: 'wrench', tekst: 'Mali kutak za popravke igračaka, subotom pre podne.' },
  { id: 'razmena', naslov: 'Sajam razmene', ikonica: 'repeat', tekst: 'Komšijski sajam razmene stvari u parku.' },
  { id: 'baste', naslov: 'Sadnice za bašte', ikonica: 'flower-2', tekst: 'Delimo višak sadnica, javite se u poruci.' },
]

/** P1: reklame „Sponzorisano“ (kratki tekstovi; naziv firme se uzima iz strane.ts). */
export type Reklama = { firma: FirmaId; naslov: string; opis: string; ikonica: 'bike' | 'wrench' }
export const REKLAMA_PEDALA: Reklama = { firma: 'pedala', naslov: 'Servis bicikala pred sezonu', opis: 'Mali servis, podešavanje menjača i kočnica.', ikonica: 'wrench' }
export const REKLAMA_ZUPCANIK: Reklama = { firma: 'zupcanik', naslov: 'Sportska oprema i bicikli', opis: 'Pogledaj ponudu radnje na Zvezdari.', ikonica: 'bike' }
export const REKLAMA_ZUPCANIK_AKCIJA: Reklama = { firma: 'zupcanik', naslov: 'Staro za novo', opis: 'Donesi stari bicikl i dobij popust na novi.', ikonica: 'bike' }
export const nazivFirme = (id: FirmaId): string => NAZIV_FIRME[id]

/** O2: tip razmene (nudim → tražim) za O3 i filtere. */
export const TIPOVI_RAZMENE: { kod: string; naziv: string }[] = [
  { kod: 'rr', naziv: 'Roba za robu' },
  { kod: 'ru', naziv: 'Roba za uslugu' },
  { kod: 'ri', naziv: 'Roba za ideju' },
  { kod: 'ur', naziv: 'Usluga za robu' },
  { kod: 'uu', naziv: 'Usluga za uslugu' },
  { kod: 'ui', naziv: 'Usluga za ideju' },
  { kod: 'ir', naziv: 'Ideja za robu' },
  { kod: 'iu', naziv: 'Ideja za uslugu' },
  { kod: 'ii', naziv: 'Ideja za ideju' },
]

/** Stanje robe (O3). */
export const STANJA_ROBE = ['Novo', 'Kao novo', 'Korišćeno', 'Za opravku']
