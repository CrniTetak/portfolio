// KARTICE PRIČE (UX 3.3, 3.5): opšti opis koraka + JEDNA rečenica po uglu. Brojke se UBACUJU iz scenario/, ne kucaju se.
// Tekst kartice staje u fiksnu visinu trake (2 reda od 1280 px); kartice.test.ts proverava dužinu za sve kombinacije.
import { POCETNI_POENI } from '../scenario/cene'
import { poeni } from '../scenario/format'
import type { Grana, Poz, Ugao } from '../prica/tipovi'

const KARTICE_PRICE: string[] = [
  `Ana pravi nalog bez pola, ulice i datuma rođenja. Potvrda telefona daje oznaku „Verifikovan“ i ${poeni(POCETNI_POENI)}.`,
  'Ana objavljuje PlayStation 2 sa igrama „za razmenu“ i upisuje u listu želja dečji bicikl. Objava je besplatna.',
  'Aplikacija javlja poklapanje: Marko nudi dečji bicikl, nedaleko od Ane. Lokacija je samo približna.',
  'Ana bira šta nudi i šalje ponudu. Pre slanja stoji obaveštenje da prava potrošača ne važe kad je druga strana građanin.',
  'Marko odbija Aninu ponudu i upisuje šta traži: udžbenike. Moderacija odlučuje o prijavljenom oglasu.',
  'Aplikacija povezuje liste želja troje ljudi: Ana, Jovana i Marko. Sve troje prihvataju lanac razmene.',
  'Troje se dogovara u aplikaciji. PlayStation 2 se predaje lično, a bicikl ide kurirom (lažan prikaz plaćanja).',
  'Svako potvrđuje „Primio/la sam“. Kad potvrdi sve troje, razmena je obavljena i otključava se recenzija.',
  'Prodavnica vodi akciju „staro za novo“. Oglasi prodavnice nose oznaku „Firma“, a akcija „Sponzorisano“.',
]

/** Račva „za poene“ menja opis koraka 6–8 (korak 9 je isti). */
const KARTICE_POENI: Record<number, string> = {
  6: 'Ana nema dovoljno poena za bicikl. Aplikacija predlaže da pokloni PlayStation 2 i skupi poene.',
  7: 'Ana poklanja PlayStation 2 Jovani i dobija poene. Marko vidi da Ana uzima bicikl za poene.',
  8: 'Ana uzima bicikl za poene, potvrđuje primopredaju sa Markom i ocenjuje razmenu.',
}

/** Opšti opis koraka; prati i granu (lanac / poeni) za korake 6–8. */
export function tekstKartice(p: Poz): string {
  if (p.grana === 'poeni' && KARTICE_POENI[p.korak]) return KARTICE_POENI[p.korak]
  return KARTICE_PRICE[p.korak - 1]
}

type Cetiri = Record<Ugao, string>
const PO_UGLU: Cetiri[] = [
  { ana: 'Praviš nalog u tri koraka.', marko: 'Stari si član i ovde nemaš radnju.', prodavnica: 'Nalog je aktivan, plan „Radnja“, bez akcije.', moderacija: 'Na čekanju su prijave oglasa.' },
  { ana: 'Objavljuješ oglas i upisuješ šta tražiš.', marko: 'U tvojoj listi želja su udžbenici.', prodavnica: 'Javni profil firme nosi oznaku „Firma“.', moderacija: 'Automatska provera: Anin oglas je prošao pravila.' },
  { ana: 'Dobijaš poklapanje sa Markovim biciklom.', marko: 'Vidiš poklapanje sa Jovaninim udžbenicima.', prodavnica: 'Gledaš rezultate poslednjih trideset dana.', moderacija: 'Tabla ostaje ista.' },
  { ana: 'Biraš šta nudiš i šalješ ponudu.', marko: 'Stiže ti Anina ponuda za dečji bicikl.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Stiže nova prijava: oglas sa zabranjenim sadržajem.' },
  { ana: 'Marko je odbio tvoju ponudu.', marko: 'Odbijaš Aninu ponudu i upisuješ šta tražiš.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Odlučuješ: oglas se uklanja uz obrazloženje.' },
]
const PO_UGLU_6: Record<Grana, Cetiri> = {
  lanac: { ana: 'Prihvataš predlog lanca razmene.', marko: 'Prihvataš lanac: dobijaš udžbenike, daješ bicikl Ani.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Vidiš kako korisnik vidi tvoju odluku.' },
  poeni: { ana: 'Vidiš da ti za bicikl fali poena.', marko: 'Vidiš da Ana razmišlja o biciklu za poene.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Vidiš kako korisnik vidi tvoju odluku.' },
}
const PO_UGLU_7: Record<Grana, Cetiri> = {
  lanac: { ana: 'Dogovaraš primopredaju i plaćaš dostavu bicikla.', marko: 'Dogovaraš se sa Anom i Jovanom.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Tabla ostaje ista.' },
  poeni: { ana: 'Poklanjaš PlayStation 2 Jovani i dobijaš poene.', marko: 'Dobijaš obaveštenje da Ana uzima bicikl za poene.', prodavnica: 'Tabla ostaje ista.', moderacija: 'Tabla ostaje ista.' },
}
const PO_UGLU_8: Record<Grana, Cetiri> = {
  lanac: { ana: 'Potvrđuješ primopredaju i ocenjuješ Marka.', marko: 'Potvrđuješ primopredaju i ocenjuješ Jovanu.', prodavnica: 'Pripremaš akciju „staro za novo“ (nacrt).', moderacija: 'Tabla ostaje ista.' },
  poeni: { ana: 'Uzimaš bicikl za poene i ocenjuješ Marka.', marko: 'Potvrđuješ primopredaju i dobijaš poene.', prodavnica: 'Pripremaš akciju „staro za novo“ (nacrt).', moderacija: 'Tabla ostaje ista.' },
}
const PO_UGLU_9: Cetiri = { ana: 'Vidiš reklamu prodavnice i akciju „staro za novo“.', marko: 'Vidiš reklamu prodavnice.', prodavnica: 'Objavljuješ akciju, plaćaš (demo) i primaš prijave.', moderacija: 'Automatska provera: akcija i reklama imaju oznake.' }

/** Jedna rečenica: šta TAJ ugao vidi ili radi u ovom koraku. */
export function poUgluZa(p: Poz, ugao: Ugao): string {
  const red = p.korak <= 5 ? PO_UGLU[p.korak - 1] : p.korak === 6 ? PO_UGLU_6[p.grana] : p.korak === 7 ? PO_UGLU_7[p.grana] : p.korak === 8 ? PO_UGLU_8[p.grana] : PO_UGLU_9
  return red[ugao]
}

/** Ceo opis u traci (računar) i panelu (telefon): opšti opis koraka + jedna rečenica za ugao. */
export const opisKartice = (p: Poz, ugao: Ugao): string => [tekstKartice(p), poUgluZa(p, ugao)].join(' ')

