// SVA brojke poslovnih pravila na jednom mestu.
// Ekrani nikad ne računaju sami — samo pozivaju funkcije iz ovog foldera.

/** Naknada Nasetua: 15% ukupne cene lokacije (snimajući dani + dani pripreme + prekovremeni). */
export const NAKNADA_PROCENAT = 15

/** Najmanja naknada: 40,00 € (u centima, da nema grešaka sa decimalama). */
export const NAKNADA_MINIMUM_CENTI = 4000

/**
 * IZMIŠLJEN i FIKSAN kurs prototipa: 1 € = 117 RSD (nije pravi kurs).
 * Naknada Nasetua se RAČUNA u evrima (15%, najmanje 40 €), a predračun se izdaje i plaća u DINARIMA:
 * evro iznos se preračunava po kursu koji je ZAPISAN na predračunu (kasnije promene kursa ga ne diraju).
 * Dinarski iznos je iznos za uplatu; evro se pored njega prikazuje samo orijentaciono (blueprint: "Naplata u dinarima, evro samo orijentaciono").
 */
export const KURS_RSD = 117

/** Podrazumevana cena dana pripreme/raspremanja pri unosu lokacije: pola cene snimajućeg dana (vlasnik je može promeniti; cene postojećih lokacija su upisane eksplicitno u podaci/lokacije.ts). */
export const UDEO_DANA_PRIPREME = 0.5

/** Samo za pomoćnu funkciju cenaZaVelikuEkipu (test); cene po veličini ekipe su upisane po lokaciji u podaci/lokacije.ts. */
export const DOPLATA_VELIKA_EKIPA_PROCENAT = 25

// ---- Rokovi (u satima simuliranog vremena) ----
/** Opcija važi 72 h. */
export const SATI_OPCIJA = 72
/** Kad druga produkcija zatraži isti termin, prva ima 24 h da potvrdi ili odustane. */
export const SATI_OSPORAVANJE = 24
/** Vlasnik ima 48 h da odgovori na zahtev za rezervaciju. */
export const SATI_ZAHTEV_VLASNIKA = 48
/** Adresa se imenovanoj osobi otvara 24 h pre potvrđenog izviđanja... */
export const SATI_ADRESA_PRE_IZVIDJANJA = 24
/** ...i zatvara 24 h posle izviđanja (odluka programera; blueprint ne kaže drugačije). */
export const SATI_ADRESA_POSLE_IZVIDJANJA = 24

// ---- Neto za vlasnika (ORIJENTACIONO, nije poreski savet) ----
// PROVERITI sa knjigovođom; poreska pravila se menjaju.
/** Porez po odbitku za fizičko lice: 20% na prihod umanjen za 25% normiranih troškova... */
export const POREZ_FIZICKO_STOPA = 20
export const NORMIRANI_TROSKOVI_FIZICKO = 25
// ...što je 20% × 75% = 15% bruto iznosa.

/** Efektivni porez po odbitku za fizičko lice u procentima bruto iznosa: 20% × 75% = 15% (samo za prikaz teksta). */
export const POREZ_FIZICKO_EFEKTIVNO_PROCENAT = (POREZ_FIZICKO_STOPA * (100 - NORMIRANI_TROSKOVI_FIZICKO)) / 100

/** Najviše prekovremenih sati u zahtevu (zaštita od besmislenih unosa). */
export const MAX_PREKOVREMENIH_SATI = 12
/** Najduži unos teksta (naziv, opština, tip) koji reducer prima. */
export const MAX_TEKST_UNOSA = 100

/** Izmišljeni podaci za uplatu naknade (nema pravog računa). */
export const PRIMALAC_UPLATE = 'Nasetu d.o.o. (izmišljeno)'
export const RACUN_UPLATE = '000-0000000000000-00'

// ---- Usluge Nasetua (izmišljene početne cene; blueprint: Poslovni model › Izvori prihoda i početne cene) ----
/** Izbor lokacija van kataloga: 50 € po zahtevu; uračunava se u naknadu ako produkcija rezerviše. */
export const CENA_IZBORA_VAN_KATALOGA_CENTI = 5000
/** Domaćin lokacije na snimanju: 70 € po snimajućem danu (blueprint daje raspon 60–80 €). */
export const DOMACIN_PO_DANU_CENTI = 7000
/** Profesionalno fotografisanje prostora: 75 € (blueprint raspon 50–100 €); plaća ga vlasnik. */
export const FOTOGRAFISANJE_CENTI = 7500
/** Partner dobija 20% naknade Nasetua, samo od plaćenih rezervacija (blueprint: Partnerski program; procenat je test vrednost). */
export const PARTNER_PROCENAT = 20
/** Zaštitni period iz ugovora o posredovanju: 12 meseci (blueprint: Zadržavanje posla na platformi). */
export const ZASTITNI_PERIOD_MESECI = 12
/** Najmanje fotografija pre objave prave lokacije (blueprint). */
export const MIN_FOTOGRAFIJA_ZA_OBJAVU = 10

// ---- Predlog otkazivanja (blueprint: Pravni okvir; PREDLOG ZA ADVOKATA) ----
/** Više od 14 dana pre snimanja: vlasniku se ne plaća ništa. */
export const OTKAZIVANJE_BEZ_NAKNADE_DANA = 14
/** Od 7 do 14 dana: pola cene lokacije; manje od 7 dana: cela cena. */
export const OTKAZIVANJE_POLA_DANA = 7

/** Verzija svih izmišljenih pravnih dokumenata. */
export const VERZIJA_DOKUMENATA = 'v0.1'
/** Najduža beleška o sporu (znakova). */
export const MAX_BELESKA = 500
