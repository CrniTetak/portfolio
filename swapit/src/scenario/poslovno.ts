// PODACI ZA TALAS 2: prodavnica (F3, F4, F6, A1–A6), moderacija (V1–V4, O5, S2) i poeni (W1, W2, W5). Sve je izmišljeno.
// Ovde stoje sve brojke i rečenice koje ekrani prikazuju; zbirovi se slažu sa tabla.ts (UX 7.7) i proveravaju se u testovima.
import { REKLAMA_DANA, ROK_ODGOVORA_DANA, ROK_PRIGOVORA_DANA, VREDNOSTI_POENA } from './cene'
import { poeni as poeniTekst } from './format'

// ---------------------------------------------------------------------------------------------------------------------
// PRODAVNICA: pregled rezultata (F6) — zbirovi po nedeljama i po oglasima moraju dati ZUPCANIK.pregledi30Dana
// ---------------------------------------------------------------------------------------------------------------------
export const PREGLEDI_PO_NEDELJAMA: { naziv: string; pregledi: number }[] = [
  { naziv: 'Nedelja 1', pregledi: 262 },
  { naziv: 'Nedelja 2', pregledi: 298 },
  { naziv: 'Nedelja 3', pregledi: 317 },
  { naziv: 'Nedelja 4', pregledi: 327 },
]
/** Pregledi po oglasima firme, istim redom kao oglasi firme (5 oglasa): zbir je jednak ukupnim pregledima. */
export const PREGLEDI_PO_OGLASIMA: number[] = [410, 305, 221, 158, 110]
/** Najveći stubić u prikazu (SVG, za razmeru). */
export const NAJVECI_STUBIC = Math.max(...PREGLEDI_PO_NEDELJAMA.map((n) => n.pregledi))

/** Period pregleda (F3, F6): poslednjih toliko dana. */
export const PERIOD_DANA = 30


// ---------------------------------------------------------------------------------------------------------------------
// AKCIJA „staro za novo“ (A1–A6)
// ---------------------------------------------------------------------------------------------------------------------
export const AKCIJA_NAZIV = 'Staro za novo'
export const AKCIJA_STARA_STVAR = 'Bicikli'
/** L-7: Anina stara stvar za akciju (nije javni oglas): ćerka je prerasla stari bicikl, zato Ana traži veći od 20 inča. */
export const ANIN_STARI_BICIKL = 'Dečji bicikl 16 inča (stari, ćerkin)'
export const ANIN_STARI_BICIKL_OBJASNJENJE = 'Ćerka je prerasla stari bicikl, zato tražiš veći.'
/** A2: stare stvari koje gledalac može da donese (ne objavljuju se kao oglas); poslednja opcija je uvek „Nova stvar“. */
export const STARE_STVARI: Record<'ana' | 'marko', string[]> = {
  ana: [ANIN_STARI_BICIKL],
  marko: ['Sinov stari bicikl 12 inča'],
}
/** N-2: prvog dana akcije brojke su primer; oznaka stoji na A4, F3 i F6. */
export const AKCIJA_PRIMER_OZNAKA = 'Primer podataka posle nekoliko dana akcije (ilustrativno)'
/** N-3: reklama akcije je uključena u cenu akcije. */
export const AKCIJA_REKLAMA_UKLJUCENA = `Reklama „Sponzorisano“ za akciju (${REKLAMA_DANA} dana na početnoj) je uključena u cenu akcije.`
/** L-9: naknada akcije se plaća po akciji. */
export const AKCIJA_NAKNADA_OPIS = 'plaća se po akciji'
export const AKCIJA_NEOBJAVLJENA = 'Akcija još nije objavljena.'
/** V-3: firma plaća kao poslovni korisnik — nema potrošačkog prava na odustanak ni kvačice „Želim da usluga počne odmah“. */
export const POSLOVNI_USLOVI_TEKST = 'Plaćaš kao poslovni korisnik. Uslovi otkazivanja su u ugovoru o poslovnom nalogu (nacrt — pregleda advokat).'
export const POTROSACKO_ODUSTANAK_TEKST = 'za usluge koje počinju odmah, pravo na odustanak se gubi kad se usluga izvrši.'
export const AKCIJA_USLOVI = ['Bicikl je u voznom stanju.', 'Procenu daje prodavnica.', 'Popust se ne isplaćuje u novcu.']
export const AKCIJA_KAKO_RADI = ['Prijavi stari bicikl i izaberi termin.', 'Donesi bicikl u radnju; prodavnica ga procenjuje.', 'Dobijaš kupon za popust na novi bicikl.']
export const PROCENE_STANJA = ['Odlično', 'Dobro', 'Za popravku']

export type StatusPrijave = 'primljeno' | 'ceka' | 'odbijeno'
export type PrijavaAkcije = { korisnik: string; stvar: string; procena: string; status: StatusPrijave }
const pa = (korisnik: string, stvar: string, procena: string, status: StatusPrijave): PrijavaAkcije => ({ korisnik, stvar, procena, status })

/** 12 prijava = 5 primljeno + 4 čeka procenu + 3 odbijeno (UX 7.7). Prva po redu čeka procenu: nju prodavnica prima u koraku 9. */
export const PRIJAVE_AKCIJE: PrijavaAkcije[] = [
  pa('luka_zem89', 'Muški gradski bicikl', 'Dobro', 'ceka'),
  pa('maja_nbg92', 'Dečji bicikl', 'Odlično', 'primljeno'),
  pa('ognjen_stg81', 'Brdski bicikl', 'Dobro', 'primljeno'),
  pa('tamara_sav90', 'Ženski gradski bicikl', 'Za popravku', 'odbijeno'),
  pa('vuk_vra86', 'Sklopivi bicikl', 'Dobro', 'ceka'),
  pa('nina_zvz94', 'Trkački bicikl', 'Odlično', 'primljeno'),
  pa('petar_voz79', 'Brdski bicikl', 'Dobro', 'primljeno'),
  pa('dusan_pal83', 'Dečji bicikl', 'Za popravku', 'odbijeno'),
  pa('katarina_cuk88', 'Ženski gradski bicikl', 'Dobro', 'ceka'),
  pa('filip_rak90', 'Muški gradski bicikl', 'Odlično', 'primljeno'),
  pa('milica_sur95', 'Sklopivi bicikl', 'Dobro', 'ceka'),
  pa('nikola_zem77', 'Brdski bicikl', 'Za popravku', 'odbijeno'),
]
export const PRVIH_PRIJAVA = 5
export const NAZIV_STATUSA: Record<StatusPrijave, string> = { primljeno: 'Primljeno', ceka: 'Čeka procenu', odbijeno: 'Odbijeno' }

// ---------------------------------------------------------------------------------------------------------------------
// MODERACIJA (V1–V4, O5, S2)
// ---------------------------------------------------------------------------------------------------------------------
export const SLJIVOVICA = {
  id: 'sljivovica',
  vlasnik: 'nenad_pal65',
  razlog: 'Zabranjena stvar: alkohol',
  obrazlozenje: 'Oglas je uklonjen jer SWAPIT ne dozvoljava alkohol ni prerađenu hranu iz domaće radinosti.',
  pravilo: 'Prerađena hrana iz domaće radinosti, meso, mlečni proizvodi i alkohol nisu dozvoljeni.',
} as const

export type PrijavaNaCekanju = { id: string; naslov: string; razlog: string; korisnik: string }
/** Dve prijave koje čekaju od početka priče (UX 7.7: na čekanju 2). */
export const PRIJAVE_NA_CEKANJU: PrijavaNaCekanju[] = [
  { id: 'p-gume', naslov: 'Polovne zimske gume', razlog: 'Lažan opis', korisnik: 'veljko_pal76' },
  { id: 'p-kolica', naslov: 'Dečja kolica (ponovljen oglas)', razlog: 'Dupli oglas', korisnik: 'zorana_vra89' },
]

/**
 * JEDAN IZVOR za spisak zabranjenih stvari (N-4): V1, V3, V4, S2, O5 i uslovi korišćenja (S4) ga čitaju odavde.
 * Kraći prikaz (`sazeto`) prikazuje samo nazive, ali iz iste liste.
 */
export const ZABRANJENE_STVARI: { naziv: string; napomena: string }[] = [
  { naziv: 'Žive životinje', napomena: 'Oprema za kućne ljubimce je dozvoljena.' },
  { naziv: 'Prerađena hrana iz domaće radinosti, meso, mlečni proizvodi i alkohol', napomena: 'Sveže voće i povrće iz sopstvene proizvodnje je dozvoljeno.' },
  { naziv: 'Oružje i municija', napomena: 'Lov i survival oprema je dozvoljena, ali bez oružja.' },
  { naziv: 'Lekovi', napomena: 'Pomagala bez recepta su dozvoljena.' },
  { naziv: 'Duvan i duvanski proizvodi', napomena: 'Uključuje i dodatnu opremu za duvan.' },
  { naziv: 'Falsifikati i ukradena roba', napomena: 'Moderacija može da zatraži dokaz o poreklu.' },
  { naziv: 'Opojne droge i sredstva za njihovo pravljenje', napomena: 'Nezakonito je svakako; spisak nije iscrpan.' },
]
/** Nekretnine i vozila se oglašavaju samo uz obaveštenje o notaru i MUP-u (isto kao u O1, O2 i X2). */
export const OGRANICENJA_NEKRETNINE = 'Nekretnine i vozila se oglašavaju samo uz obaveštenje: SWAPIT ne posreduje, a prenos vlasništva se završava van aplikacije, kod notara odnosno u MUP-u.'

export const RAZLOZI_PRIJAVE = ['Zabranjena stvar', 'Lažan opis', 'Prevara', 'Neprikladan sadržaj', 'Dupli oglas', 'Drugo']
export const POVRATNE_PRIJAVE_PORUKA = 'Hvala. Moderacija proverava prijavu; obavestićemo te o odluci.'

/** S2: pravilo o novcu stoji odvojeno od ostalih (PK2-4). */
export const PRAVILO_NOVAC = 'Novac između korisnika se nikad ne razmenjuje, ni kao doplata. Poeni se ne kupuju, ne isplaćuju i ne prenose.'
export const PRAVILA_ZAJEDNICE = [
  'Objavljuj samo ono što zaista imaš i što smeš da razmeniš.',
  'Opis i fotografije moraju odgovarati stvari.',
  'Budi pristojan/na u poruci i u recenziji.',
  'Predaja stvari ide lično na preporučenom javnom mestu ili kurirom.',
]

export const AUTOMATSKE_PROVERE = {
  oglasPrvi: 'Automatska provera: oglas „PlayStation 2 sa igrama“ prošao pravila.',
  akcijaIReklama: 'Automatska provera: akcija i reklama imaju oznake Firma i Sponzorisano.',
} as const

// ---------------------------------------------------------------------------------------------------------------------
// POENI (W1, W2, W5): model u proveri
// ---------------------------------------------------------------------------------------------------------------------
export const ISTICANJE_POENA_MESECI = 12
/** N9: ista rečenica o isteku poena u W1, S3 i uslovima (jedan izvor). */
export const POENI_ISTICU_TEKST = `Poeni ističu posle ${ISTICANJE_POENA_MESECI} meseci bez aktivnosti.`
export const KAKO_RADI_POENI = [
  'Kad daš stvar „za poene“ ili je pokloniš, SWAPIT ti dodeljuje poene tek kad primalac potvrdi prijem.',
  'Kad uzmeš stvar „za poene“, SWAPIT ti oduzima poene za tu stvar.',
  `Poeni se ne kupuju, ne isplaćuju i ne prenose; nemaju vrednost van SWAPIT-a. ${POENI_ISTICU_TEKST}`,
]
/** Vrednosti stvari u poenima po veličini i stanju (iste brojke kao VREDNOSTI_POENA). */
export const VREDNOSTI_OPIS: Record<(typeof VREDNOSTI_POENA)[number], string> = {
  10: 'knjige, sitne igračke, sitan alat',
  25: 'odeća, kuhinjski aparati, društvene igre',
  50: 'dečji bicikl, konzola, manji nameštaj',
  100: 'računari, veći aparati, nameštaj u dobrom stanju',
}
// N-1 (PRAVNO): poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku, i to tek posle potvrđenog prijema.
// Zato opisi u istoriji ne sadrže korisničko ime kao izvor ni kao primaoca poena (test: istorija poena nema korisnička imena).
export const POENI_POCETNI_OPIS = 'Početni poeni, potvrda telefona'
export const POENI_RANIJE_OPIS = 'Poeni iz ranijih razmena'
/** SWAPIT je dodelio poene za potvrđen poklon (posle potvrde prijema). */
export const poklonDodelaOpis = (iznos: number, naslov: string): string => `SWAPIT ti je dodelio ${poeniTekst(iznos)} za poklon (${naslov}) — primalac je potvrdio prijem.`
/** Poeni su potrošeni na stvar uzetu „za poene“. */
export const potrosnjaOpis = (iznos: number, naslov: string): string => `Potrošeno ${poeniTekst(iznos)}: ${naslov}`
/** SWAPIT je dodelio poene za predatu stvar (potvrđen prijem). */
export const predataStvarDodelaOpis = (iznos: number): string => `SWAPIT ti je dodelio ${poeniTekst(iznos)} za predatu stvar — primalac je potvrdio prijem.`
/** Rečenica o poklonu posle potvrđenog prijema (W5). */
// V7: uz poene NIGDE korisničko ime ni id
export const poklonPotvrdjenTekst = (iznos: number): string => `SWAPIT ti je dodelio ${poeniTekst(iznos)} za poklon — primalac je potvrdio prijem.`
/** X10: ko je potrošio, a ko dobio poene (SWAPIT dodeljuje). */
export const potrosioDodelioTekst = (iznos: number): string => `Primalac stvari je potrošio ${poeniTekst(iznos)} · Davaocu stvari je SWAPIT dodelio ${poeniTekst(iznos)} za predatu stvar — primalac je potvrdio prijem.`


/** O5: unapred popunjen opis prijave (nema kucanja). */
export const OPIS_PRIJAVE_PRIMER = 'Mislim da ovaj oglas krši pravila zajednice.'

/** W5: unapred napisane poruke zahteva za poklon i napomena. */
export const ZAHTEV_ZA_POKLON = 'Zdravo! Rado bih primila PlayStation 2 kao poklon za brata.'
export const PORUKA_POKLONU = 'Zdravo! Zanima me ovaj poklon, mogu da ga preuzmem lično.'
export const POKLON_NAPOMENA = 'Poene dodeljuje SWAPIT darodavcu tek kad primalac potvrdi prijem.'

/** N-5: odluka moderacije (V4): ko je odlučio, na osnovu čega i kako se ulaže prigovor. */
export const ODLUKA_OSNOV = 'Uslovi korišćenja — spisak zabranjenih stvari'
export const prigovorTekst = `Prigovor možeš da uložiš u roku od ${ROK_PRIGOVORA_DANA} dana; odgovor stiže u roku od ${ROK_ODGOVORA_DANA} dana (demo).`

/** Obrazloženje odluke moderacije za prijave iz slobodnog toka (za „šljivovicu“ iz priče važi SLJIVOVICA.obrazlozenje). */
export const obrazlozenjeOdluke = (odluka: 'ukloni' | 'izmena' | 'ostavi', razlog: string): string =>
  odluka === 'ukloni'
    ? `Oglas je uklonjen jer SWAPIT potvrđuje prijavljeni razlog: ${razlog}.`
    : odluka === 'izmena'
      ? `Moderacija traži izmenu oglasa. Prijavljeni razlog: ${razlog}.`
      : `Moderacija je proverila prijavu (${razlog}) i oglas ostaje objavljen.`
export const NASLOV_ODLUKE = { ukloni: 'Tvoj oglas je uklonjen', izmena: 'Moderacija traži izmenu tvog oglasa', ostavi: 'Tvoj oglas ostaje objavljen' } as const
export const NAZIV_ODLUKE = { ukloni: 'Uklonjeno', izmena: 'Traži se izmena', ostavi: 'Oglas ostaje' } as const
/** N-5: pravilo na koje se odluka poziva (isti spisak kao S2 i uslovi korišćenja). */
export const odlukaDonela = (moderator: string, datumTekst: string): string => `Odluku je doneo moderator SWAPIT tima (${moderator}), ${datumTekst}`

// ---------------------------------------------------------------------------------------------------------------------
// POSLOVNA STRANA (F1, F2, F8, F9)
// ---------------------------------------------------------------------------------------------------------------------
export const PLANOVI = [
  { id: 'majstor', naziv: 'Majstor', za: 'za servise i zanatlije', sadrzi: ['Oznaka „Firma“ na svim oglasima', 'Profil firme sa radnim vremenom i adresom radnje', 'Pregled rezultata'] },
  { id: 'radnja', naziv: 'Radnja', za: 'za prodavnice', sadrzi: ['Sve iz plana „Majstor“', 'Akcije „staro za novo“ (po posebnoj ceni)', 'Reklame „Sponzorisano“ (po posebnoj ceni)'] },
] as const
export type PlanId = (typeof PLANOVI)[number]['id']
export const DELATNOSTI = ['Servis', 'Zanatlija', 'Prodavnica'] as const
export const F2_SAGLASNOST = 'Saglasan sam sa uslovima poslovnog naloga (nacrt — pregleda advokat).'
export const F2_PRIMER_NAZIV = 'Moja nova firma (primer)'
export const F9_ODREDISTE_OPIS = 'Reklama vodi na profil firme ili na akciju. Uvek nosi oznaku „Sponzorisano“ i podatak ko oglašava.'

/** Napomena uz izbor kategorije (O2): izvedena iz istog spiska zabranjenih stvari (N-4), ne ponovo napisana. */
export const ZIVOTINJE_NAPOMENA = `${ZABRANJENE_STVARI[0].naziv} nisu dozvoljene.`
