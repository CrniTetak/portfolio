// PODACI ZA SLOBODNE TOKOVE (talas 3). Sve je izmišljeno. Ovde stoje primeri oglasa, ponude koje stižu, rokovi aukcija i drugi
// unapred napisani sadržaji; ekrani ih čitaju preko svet.ts (ne uvoze ovaj fajl direktno koliko god je moguće), a brojke i imena se ne kucaju u ekranima.
import { ANA_ID, JOVANA_ID, MARKO_ID } from './korisnici'
import { OGLASI_BEOGRAD, type Vrsta } from './oglasi'
import { ROKOVI_AUKCIJA, type Datum } from './datumi'
import type { PrimljenaPonuda, Stvar } from './prica'
import { PONUDE_NA_MTB } from './tabla'

/** Rezervisani predmeti priče koji SMEJU da prime slobodnu ponudu: Markova dečja jakna je namenski primer primalac-toka (PLAN B4.2). */
/** Primer korisnika čiji zahtev za poklon stiže vlasniku slobodnog poklona kad još niko nije zatražio. */
export const NEPOZNATI_PRIMALAC_POKLONA = 'luka_zem89'
export const PORUKA_PONUDE_SLOBODNA = 'Zdravo! Zanima me tvoj oglas, pogledaj šta nudim.'
export const SLOBODNE_PONUDE_NA: string[] = ['markova-jakna']
/** Markova jakna je mesto gde u slobodnom toku stoje ponude Irene i Stefana (dorada 1, S2). */
export const JAKNA_ID = 'markova-jakna'

/** Ponude koje u slobodnom toku stoje uz Markovu dečju jaknu (iste osobe kao uz bicikl u priči, ali ovde su pravi tok prihvatanja). */
export const PONUDE_JAKNA: PrimljenaPonuda[] = [
  { id: 'jakna-irena', od: 'irena_zem80', stvari: [{ naslov: 'Dečji roleri sa kacigom', vrsta: 'roba', ikonica: 'footprints' }], poruka: 'Zdravo! Roleri su malo korišćeni, kaciga ide uz njih.' },
  { id: 'jakna-stefan', od: 'stefan_nbg93', stvari: [{ naslov: 'Plan treninga za decu', vrsta: 'ideja', ikonica: 'lightbulb' }], poruka: 'Zdravo! Nudim plan treninga prilagođen deci.' },
]

// ---------------------------------------------------------------------------------------------------------------------
// NOVI OGLAS (O2, O3): umesto kucanja, bira se primer; tip i kategorija se menjaju izborom
// ---------------------------------------------------------------------------------------------------------------------
export type PrimerOglasa = { id: string; naslov: string; kat: string; vrsta: Vrsta; opis: string }
export const PRIMERI_OGLASA: PrimerOglasa[] = [
  { id: 'primer-solje', naslov: 'Set šolja i tanjira (šest komada)', kat: 'kucni-dekor', vrsta: 'roba', opis: 'Set šolja i tanjira, malo korišćen. Preuzimanje lično, na preporučenom javnom mestu.' },
  { id: 'primer-cizme', naslov: 'Dečje zimske čizme, broj 28', kat: 'odeca', vrsta: 'roba', opis: 'Dečje zimske čizme, nošene jednu sezonu. Preuzimanje lično, na preporučenom javnom mestu.' },
  { id: 'primer-ranac', naslov: 'Ranac za planinarenje', kat: 'kamping', vrsta: 'roba', opis: 'Ranac za planinarenje sa dva džepa. Preuzimanje lično, na preporučenom javnom mestu.' },
  { id: 'primer-basta', naslov: 'Pomoć oko uređenja bašte', kat: 'basta-i-biljke', vrsta: 'usluga', opis: 'Pomoć oko uređenja bašte, jedno popodne. Termin se dogovara posle prihvaćene ponude.' },
  { id: 'primer-gitara', naslov: 'Časovi gitare za početnike', kat: 'muzika-i-instrumenti', vrsta: 'usluga', opis: 'Časovi gitare za početnike. Termin se dogovara posle prihvaćene ponude.' },
  { id: 'primer-polica', naslov: 'Ideja: plan police za knjige od paleta', kat: 'kucni-dekor', vrsta: 'ideja', opis: 'Plan police za knjige od paleta, sa nacrtom. Ideja se predaje uz licencu.' },
]
/** Primeri za oglase firme (jednostavan obrazac oglasa firme): roba ili usluga, uvek „za razmenu“. */
export const PRIMERI_OGLASA_FIRME: PrimerOglasa[] = [
  { id: 'primer-kaciga', naslov: 'Dečja kaciga za bicikl, novo', kat: 'bicikli-i-trotineti', vrsta: 'roba', opis: 'Dečja kaciga za bicikl, nova. Preuzimanje u radnji.' },
  { id: 'primer-lanac', naslov: 'Zamena lanca i pedala', kat: 'bicikli-i-trotineti', vrsta: 'usluga', opis: 'Zamena lanca i pedala u radnji. Termin se dogovara posle prihvaćene ponude.' },
  { id: 'primer-reket', naslov: 'Reket za badminton, novo', kat: 'sport-i-rekreacija', vrsta: 'roba', opis: 'Reket za badminton, nov. Preuzimanje u radnji.' },
]
export const PRIMER_PO_ID: Record<string, PrimerOglasa> = Object.fromEntries([...PRIMERI_OGLASA, ...PRIMERI_OGLASA_FIRME].map((p) => [p.id, p]))

// ---------------------------------------------------------------------------------------------------------------------
// LISTA ŽELJA (W3), PRATIM (N1), PRIČE (P8, P9)
// ---------------------------------------------------------------------------------------------------------------------
export type ZeljaPrimer = { id: string; naziv: string; kategorija: string; vrsta: string; trazi: string }
export const ZELJE_PRIMERI: ZeljaPrimer[] = [
  { id: 'z-bicikl', naziv: 'Mali bicikl za početnike', kategorija: 'Bicikli i trotineti', vrsta: 'Roba', trazi: 'bicikl' },
  { id: 'z-stolica', naziv: 'Dečja stolica za hranjenje', kategorija: 'Bebe i deca', vrsta: 'Roba', trazi: 'stolica' },
  { id: 'z-knjige', naziv: 'Knjige o vrtu i cveću', kategorija: 'Knjige', vrsta: 'Roba', trazi: 'knjige' },
  { id: 'z-igre', naziv: 'Set društvenih igara', kategorija: 'Igre i konzole', vrsta: 'Roba', trazi: 'igara' },
]
export const ZELJA_PO_ID: Record<string, ZeljaPrimer> = Object.fromEntries(ZELJE_PRIMERI.map((z) => [z.id, z]))

/** Autori priča zajednice (P8): izmišljeni korisnici. */
export const AUTORI_PRICA: Record<string, string> = {
  jabuke: 'sanja_sur85',
  knjige: 'lazar_vra91',
  biciklisti: 'petar_voz79',
  popravke: 'radovan_pal74',
  razmena: 'mila_cuk88',
  baste: 'lena_zvz96',
}
export const PRICA_SATI = 24
/** P9: unapred napisana priča (UX 6.3). */
export const PRICA_NOVA_TEKST = 'Sutra delim jabuke iz bašte na Zvezdari, dođite ko voli.'
export const PRICA_NAPOMENA = 'Priče su obaveštenja zajednice, ne prodaja za novac.'
export const NAJVISE_NOVIH_PRICA = 3

// ---------------------------------------------------------------------------------------------------------------------
// JAVNA AUKCIJA (J1–J4)
// ---------------------------------------------------------------------------------------------------------------------
export const AUKCIJE_OGLASI: string[] = OGLASI_BEOGRAD.filter((o) => o.aukcija).map((o) => o.id)
export const MTB_ID = 'mtb-bicikl-storm'
/** Broj ponuda po aukciji (prva je „MTB bicikl STORM“, UX 7.7); aukcije koje pokrene gledalac počinju sa nekoliko unapred pripremljenih ponuda. */
const BROJ_PONUDA = [PONUDE_NA_MTB, 4, 5, 3, 6, 4]
export const BROJ_PONUDA_NOVE_AUKCIJE = 3
const PONUDJACI = ['luka_zem89', 'maja_nbg92', 'ognjen_stg81', 'vuk_vra86', 'nina_zvz94', 'petar_voz79', 'katarina_cuk88', 'filip_rak90', 'milica_sur95', 'nikola_zem77']
const STVARI_ZA_AUKCIJU: Stvar[] = [
  { naslov: 'Električna bušilica', vrsta: 'roba', ikonica: 'wrench' },
  { naslov: 'Set alata u koferu', vrsta: 'roba', ikonica: 'hammer' },
  { naslov: 'Društvena igra Monopol', vrsta: 'roba', ikonica: 'puzzle' },
  { naslov: 'Pomoć pri selidbi (pola dana)', vrsta: 'usluga', ikonica: 'wrench' },
  { naslov: 'Dečji bicikl 16 inča', vrsta: 'roba', ikonica: 'bike' },
  { naslov: 'Plan treninga za početnike', vrsta: 'ideja', ikonica: 'lightbulb' },
  { naslov: 'Stona lampa', vrsta: 'roba', ikonica: 'lamp' },
  { naslov: 'Knjige o fotografiji', vrsta: 'roba', ikonica: 'book-open' },
]
/** Unapred pripremljene ponude za aukciju (deterministički, bez slučajnosti). `broj` zadaje pozivalac (aukcija iz priče ili nova). */
export function ponudeAukcije(oglasId: string, broj: number): PrimljenaPonuda[] {
  const pomak = Math.max(0, AUKCIJE_OGLASI.indexOf(oglasId))
  return Array.from({ length: broj }, (_, i) => ({
    id: `auk-${oglasId}-${i + 1}`,
    od: PONUDJACI[(pomak + i) % PONUDJACI.length],
    stvari: [STVARI_ZA_AUKCIJU[(pomak * 2 + i * 3) % STVARI_ZA_AUKCIJU.length]],
    poruka: 'Zdravo! Ovo nudim za tvoj oglas.',
  }))
}
export const brojPonudaAukcije = (oglasId: string): number => BROJ_PONUDA[AUKCIJE_OGLASI.indexOf(oglasId)] ?? BROJ_PONUDA_NOVE_AUKCIJE
export const rokAukcije = (oglasId: string): Datum | undefined => ROKOVI_AUKCIJA[AUKCIJE_OGLASI.indexOf(oglasId)]

// ---------------------------------------------------------------------------------------------------------------------
// DOSTAVA (D1) u slobodnom toku
// ---------------------------------------------------------------------------------------------------------------------
/** D1 „iz kamiona“: kad nema nijedne razmene, dostava se proba na primeru. */
export const DOSTAVA_PRIMER = { id: 'primer', naslov: 'Kutija sa knjigama (primer)', vrsta: 'roba' as Vrsta, ikonica: 'book-open' }
export const TERMINI_DOSTAVE = ['Prepodne', 'Popodne'] as const

// ---------------------------------------------------------------------------------------------------------------------
// PORUKE (C1) po uglu
// ---------------------------------------------------------------------------------------------------------------------
export type RazgovorStavka = { id: string; poslednja: string; neprocitano: boolean }
export const RAZGOVORI_PO_UGLU: Record<'ana' | 'marko' | 'prodavnica', RazgovorStavka[]> = {
  ana: [
    { id: MARKO_ID, poslednja: 'Zdravo! Bicikl je još dostupan.', neprocitano: false },
    { id: JOVANA_ID, poslednja: 'Hvala na odgovoru, javim se uskoro.', neprocitano: false },
    { id: 'podrska', poslednja: 'Dobrodošla u SWAPIT! Javi se ako zatreba pomoć.', neprocitano: true },
  ],
  marko: [
    { id: ANA_ID, poslednja: 'Zdravo! Zanima me tvoj dečji bicikl.', neprocitano: true },
    { id: JOVANA_ID, poslednja: 'Udžbenici su još kod mene, mogu da ih sačuvam.', neprocitano: false },
    { id: 'podrska', poslednja: 'Tvoj oglas je pregledan i objavljen.', neprocitano: false },
  ],
  prodavnica: [
    { id: 'luka_zem89', poslednja: 'Da li primate i dečje bicikle u akciji?', neprocitano: true },
    { id: 'maja_nbg92', poslednja: 'Hvala, dolazim u radnju u subotu.', neprocitano: false },
    { id: 'podrska', poslednja: 'Vaš poslovni nalog je aktivan.', neprocitano: false },
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// POSLOVNA STRANA (F5, F9)
// ---------------------------------------------------------------------------------------------------------------------
export const RADNA_VREMENA = ['Pon–pet 9–17, subota 9–14', 'Pon–pet 8–16, subota 9–13', 'Pon–sub 10–18'] as const
export const ODREDISTA_REKLAME = [
  { v: 'profil', naziv: 'Profil firme' },
  { v: 'akcija', naziv: 'Akcija „staro za novo“' },
] as const
export const ODLUKE_MODERACIJE = [
  { v: 'ukloni', naziv: 'Ukloni oglas' },
  { v: 'izmena', naziv: 'Traži izmenu' },
  { v: 'ostavi', naziv: 'Ostavi oglas' },
] as const
export const RAZLOZI_PROBLEMA = ['Razmena nije obavljena', 'Stvar nije kao u opisu', 'Prevara', 'Tehnički problem', 'Drugo']
