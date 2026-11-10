// 10 izmišljenih lokacija — JAVNI deo. Ovde NIKAD nema ulice ni broja ni kontakta
// (to je u adrese-privatno.ts i čita ga samo logika/adresa.ts).
// Cene su u centima i izmišljene. ID-jevi se poklapaju sa fotografijama (podaci/fotografije.ts).
import type { Razred } from '../logika/novac'
import { ALFA, IVAN } from './akteri'

export type Oznaka = 'trofazna' | 'zamracivanje' | 'kamion' | 'lift' | 'ton'

export const NAZIV_OZNAKE: Record<Oznaka, string> = {
  trofazna: 'Trofazna struja',
  zamracivanje: 'Zamračivanje',
  kamion: 'Parking za kamion',
  lift: 'Lift / pristup opremi',
  ton: 'Snimanje tona',
}

export const TIPOVI = ['Loft', 'Vila', 'Kafić / restoran', 'Hotel', 'Kancelarija', 'Hala', 'Stan', 'Studio'] as const
export const STILOVI = ['moderno', 'brutalizam', 'socrealizam', 'vila', 'industrijsko', 'napušteno'] as const

export interface GrupaTehnickog {
  naziv: string
  stavke: [naziv: string, vrednost: string][]
}

/** Polja tehničkog lista (blueprint: Tehnički list i cenovnik lokacije). Isti spisak koristi unos lokacije, tehnički list i test popunjenosti. */
export interface PoljeTehnickog {
  kljuc: string
  grupa: 'Tehnika' | 'Logistika' | 'Pravila'
  naziv: string
  /** izmišljen primer koji je unapred upisan u obrazac za unos lokacije */
  primer: string
}

export const POLJA_TEHNICKOG: PoljeTehnickog[] = [
  { kljuc: 'struja', grupa: 'Tehnika', naziv: 'Struja (vrsta i jačina)', primer: 'Trofazna, 32 A' },
  { kljuc: 'prikljucci', grupa: 'Tehnika', naziv: 'Broj priključaka', primer: '6 monofaznih i 1 trofazni' },
  { kljuc: 'plafon', grupa: 'Tehnika', naziv: 'Visina plafona', primer: '4 m' },
  { kljuc: 'zamracivanje', grupa: 'Tehnika', naziv: 'Zamračivanje', primer: 'Da, zavese na svim prozorima' },
  { kljuc: 'ton', grupa: 'Tehnika', naziv: 'Buka / ton', primer: 'Umerena buka sa ulice' },
  { kljuc: 'svetlo', grupa: 'Tehnika', naziv: 'Dnevno svetlo', primer: 'Da, velika okna' },
  { kljuc: 'stranaSveta', grupa: 'Tehnika', naziv: 'Strana sveta (prozori)', primer: 'Jug' },
  { kljuc: 'oprema', grupa: 'Logistika', naziv: 'Put za opremu', primer: 'Teretni lift, bez stepenica do ulaza' },
  { kljuc: 'vrata', grupa: 'Logistika', naziv: 'Mere vrata', primer: '140 × 240 cm' },
  { kljuc: 'lift', grupa: 'Logistika', naziv: 'Lift (mere i nosivost)', primer: '150 × 200 × 220 cm, do 800 kg' },
  { kljuc: 'hodnik', grupa: 'Logistika', naziv: 'Hodnici i stepenice (mere)', primer: 'Hodnik 160 cm, bez stepenika' },
  { kljuc: 'parkingAuta', grupa: 'Logistika', naziv: 'Parking za automobile', primer: 'Ulični, 2 mesta u dvorištu' },
  { kljuc: 'parkingKamioni', grupa: 'Logistika', naziv: 'Parking za kamione', primer: 'Utovar u dvorištu (do 3,5 t)' },
  { kljuc: 'prostorEkipa', grupa: 'Logistika', naziv: 'Prostor za ekipu', primer: 'Odvojena prostorija 25 m²' },
  { kljuc: 'prostorSminka', grupa: 'Logistika', naziv: 'Prostor za šminku', primer: 'Kutak sa ogledalima' },
  { kljuc: 'prostorKostim', grupa: 'Logistika', naziv: 'Prostor za kostim', primer: 'Šina za kostime u prostoriji ekipe' },
  { kljuc: 'toaleti', grupa: 'Logistika', naziv: 'Toaleti', primer: 'Dva' },
  { kljuc: 'sati', grupa: 'Pravila', naziv: 'Dozvoljeni sati', primer: '07:00–22:00' },
  { kljuc: 'izmene', grupa: 'Pravila', naziv: 'Izmene u prostoru', primer: 'Dozvoljeno privremeno (bez bušenja)' },
  { kljuc: 'ljubimci', grupa: 'Pravila', naziv: 'Ljubimci', primer: 'Po dogovoru' },
  { kljuc: 'pusenje', grupa: 'Pravila', naziv: 'Pušenje', primer: 'Samo u dvorištu' },
  { kljuc: 'pravilaZgrade', grupa: 'Pravila', naziv: 'Pravila zgrade', primer: 'Tišina posle 22:00' },
]

export interface Lokacija {
  id: string
  naziv: string
  tip: (typeof TIPOVI)[number]
  opstina: string
  zona: string
  stilovi: string[]
  kvadratura: number
  opis: string
  /** najveća ekipa koju prostor prima */
  kapacitet: Razred
  vlasnikId: string
  /**
   * Cena snimajućeg dana po razredu ekipe (centi), UPISANA EKSPLICITNO po lokaciji (blueprint: cena po veličini ekipe).
   * Razred koji prostor ne prima nema cenu.
   */
  cene: Partial<Record<Razred, number>>
  /** Cena jednog dana pripreme/raspremanja (centi): jedna cena po lokaciji, važi za sve veličine ekipe (odluka O19). */
  cenaPripremeCenti: number
  satiSnimajucegDana: number
  prekovremeniSatCenti: number
  najkrace: string
  posebniTroskovi: string
  tehnicki: GrupaTehnickog[]
  oznake: Oznaka[]
  /** unapred zauzeti dani (ISO), izdati van Nasetua (izmišljeno); vlasnik ih ne može odblokirati */
  zauzeti: string[]
  istaknuto: boolean
  /** true: lokacija koju je admin objavio u prototipu (nema fotografije ni rezervaciju, odluka O14) */
  nova?: boolean
}

const REDOSLED_RAZREDA: Razred[] = ['do10', 'do30', 'preko30']

/** Tehnički list po grupama iz vrednosti polja (nedostajuće polje se prikazuje kao "—"). */
export function grupisiTehnicki(
  l: { tip: string; kvadratura: number; opstina: string; zona: string; stilovi: string[] },
  vrednosti: Record<string, string>,
): GrupaTehnickog[] {
  const grupa = (g: PoljeTehnickog['grupa']): [string, string][] =>
    POLJA_TEHNICKOG.filter((p) => p.grupa === g).map((p) => [p.naziv, vrednosti[p.kljuc]?.trim() || '—'])
  return [
    { naziv: 'Osnovno', stavke: [['Tip prostora', l.tip], ['Kvadratura', `${l.kvadratura} m²`], ['Opština / zona', `${l.opstina} / ${l.zona}`]] },
    { naziv: 'Tehnika', stavke: grupa('Tehnika') },
    { naziv: 'Logistika', stavke: grupa('Logistika') },
    { naziv: 'Pravila', stavke: grupa('Pravila') },
    { naziv: 'Stil', stavke: [['Stil', l.stilovi.join(', ') || '—']] },
  ]
}

type Osnovno = Omit<Lokacija, 'tehnicki' | 'satiSnimajucegDana' | 'prekovremeniSatCenti' | 'najkrace' | 'posebniTroskovi'>

function napravi(
  o: Osnovno & { sati?: number; prekovremeni: number; najkrace?: string; troskovi?: string; podaci: Record<string, string> },
): Lokacija {
  const { sati, prekovremeni, najkrace, troskovi, podaci, ...ostalo } = o
  return {
    ...ostalo,
    satiSnimajucegDana: sati ?? 10,
    prekovremeniSatCenti: prekovremeni,
    najkrace: najkrace ?? '1 snimajući dan',
    posebniTroskovi: troskovi ?? 'Čišćenje nakon snimanja, ako je potrebno (po dogovoru)',
    tehnicki: grupisiTehnicki(ostalo, podaci),
  }
}

// Cene su upisane EKSPLICITNO po lokaciji (cene po veličini ekipe i dan pripreme) — iznosi su isti kao pre doterivanja
// (zaključani zlatnim testom u logika/cenovnik.test.ts), osim dana pripreme za ekipu do 10 i preko 30 (odluka O19).
export const LOKACIJE: Lokacija[] = [
  napravi({
    id: 'industrijski-loft', naziv: 'Industrijski loft', tip: 'Loft', opstina: 'Savski venac', zona: 'Centar',
    stilovi: ['industrijsko'], kvadratura: 180, kapacitet: 'do30', vlasnikId: ALFA, istaknuto: true,
    cene: { do10: 54000, do30: 60000 }, cenaPripremeCenti: 30000, prekovremeni: 7000,
    opis: 'Svetao loft u bivšoj skladišnoj zgradi: visoki prozori, ogoljena cigla i betonski pod. Pogodan za reklame, modne i foto-serije.',
    zauzeti: ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-20', '2026-11-21', '2026-12-01'],
    oznake: ['trofazna', 'zamracivanje', 'lift'],
    podaci: { struja: 'Trofazna, 32 A', prikljucci: '6 monofaznih (16 A) i 2 trofazna', plafon: '4,2 m', zamracivanje: 'Da, zavese na svim prozorima', ton: 'Umerena buka sa ulice', svetlo: 'Da, velika okna', stranaSveta: 'Jug',
      oprema: 'Teretni lift do 800 kg', vrata: 'Glavna vrata 140 × 240 cm', lift: 'Teretni: 150 × 200 × 220 cm, do 800 kg', hodnik: 'Hodnik 160 cm, bez stepenika do lifta',
      parkingAuta: 'Ulični parking, 2 mesta u dvorištu', parkingKamioni: 'Utovar u dvorištu (do 3,5 t)', prostorEkipa: 'Odvojena prostorija 25 m²', prostorSminka: 'Kutak sa ogledalima u prostoriji ekipe', prostorKostim: 'Šina za kostime u prostoriji ekipe', toaleti: 'Dva',
      sati: '07:00–22:00', izmene: 'Dozvoljeno privremeno (bez bušenja)', ljubimci: 'Po dogovoru', pusenje: 'Samo u dvorištu', pravilaZgrade: 'Tišina posle 22:00; zajedničko stepenište se ne zauzima' },
  }),
  napravi({
    id: 'vila-sa-bastom', naziv: 'Vila sa baštom', tip: 'Vila', opstina: 'Savski venac (Dedinje)', zona: 'Centar-jug',
    stilovi: ['vila'], kvadratura: 420, kapacitet: 'preko30', vlasnikId: ALFA, istaknuto: false,
    cene: { do10: 81000, do30: 90000, preko30: 112500 }, cenaPripremeCenti: 45000, prekovremeni: 11000,
    opis: 'Međuratna vila sa uređenom baštom, drvenim stepeništem i salonom sa kaminom. Dobra za serije, spotove i reklame sa porodičnim ambijentom.',
    zauzeti: ['2026-11-09', '2026-11-18', '2026-11-19', '2026-12-05'],
    oznake: ['kamion', 'ton'],
    podaci: { struja: 'Monofazna, mogućnost agregata u bašti', prikljucci: '10 monofaznih priključaka, agregat u bašti', plafon: '3,2 m', zamracivanje: 'Delimično (kapci)', ton: 'Tiha ulica', svetlo: 'Da, prirodno svetlo u svim prostorijama', stranaSveta: 'Jug i zapad',
      oprema: 'Širok ulaz, stepenice u zgradi', vrata: 'Ulazna vrata 120 × 230 cm', lift: 'Nema lifta', hodnik: 'Drveno stepenište 110 cm, hodnici 130 cm',
      parkingAuta: '6 mesta u dvorištu', parkingKamioni: 'Kamion u dvorištu (do 7,5 t)', prostorEkipa: 'Garaža i letnjikovac', prostorSminka: 'Letnjikovac, sa strujom', prostorKostim: 'Garaža, sa sklopivim šinama', toaleti: 'Tri',
      sati: '08:00–20:00', izmene: 'Ne, samo premeštanje nameštaja', ljubimci: 'Ne', pusenje: 'Samo u bašti', pravilaZgrade: 'Porodična kuća: zaštita parketa i stepeništa obavezna' },
  }),
  napravi({
    id: 'brutalisticka-hala', naziv: 'Brutalistička hala', tip: 'Hala', opstina: 'Novi Beograd', zona: 'Novi Beograd',
    stilovi: ['brutalizam'], kvadratura: 900, kapacitet: 'preko30', vlasnikId: ALFA, istaknuto: true,
    cene: { do10: 68000, do30: 75000, preko30: 93750 }, cenaPripremeCenti: 37500, prekovremeni: 9000,
    opis: 'Velika hala od sirovog betona sa visokim plafonom i dugačkim redom stubova. Prazan prostor koji se lako pretvara u set.',
    zauzeti: ['2026-11-05', '2026-11-06', '2026-11-24', '2026-12-02'],
    oznake: ['trofazna', 'kamion', 'ton'],
    podaci: { struja: 'Trofazna, 63 A', prikljucci: '4 trofazna i 8 monofaznih', plafon: '9 m', zamracivanje: 'Da, nema prozora na istoku', ton: 'Dobar, mirna okolina', svetlo: 'Ograničeno, svetlarnici', stranaSveta: 'Svetlarnici na severu',
      oprema: 'Rampa za kamion, bez stepenica', vrata: 'Rolo vrata 400 × 450 cm', lift: 'Nema lifta (prizemlje)', hodnik: 'Slobodan prostor, bez pragova',
      parkingAuta: '20 mesta na platou', parkingKamioni: 'Plato za kamione, rampa (do 20 t)', prostorEkipa: 'Kancelarije na galeriji', prostorSminka: 'Kancelarija na galeriji, sa ogledalima', prostorKostim: 'Magacinski deo uz rampu', toaleti: 'Četiri',
      sati: '06:00–23:00', izmene: 'Dozvoljeno uz dogovor', ljubimci: 'Da', pusenje: 'Samo napolju', pravilaZgrade: 'Obavezna zaštitna obuća u hali; vatrogasni prolazi slobodni' },
  }),
  napravi({
    id: 'kafic-retro', naziv: 'Kafić „Retro“', tip: 'Kafić / restoran', opstina: 'Stari grad', zona: 'Centar',
    stilovi: ['socrealizam'], kvadratura: 95, kapacitet: 'do30', vlasnikId: IVAN, istaknuto: false,
    cene: { do10: 32000, do30: 35000 }, cenaPripremeCenti: 17500, prekovremeni: 4000,
    najkrace: '4 sata (kratak termin)', troskovi: 'Noćno snimanje po dogovoru (doplata)',
    opis: 'Mali kafić sa ormarićima od furnira, šankom i svetlećim natpisima iz sedamdesetih. Radi do podne, pa je slobodan za snimanje popodne.',
    zauzeti: ['2026-11-13', '2026-11-14', '2026-11-27'],
    oznake: ['ton'],
    podaci: { struja: 'Monofazna, ograničeno', prikljucci: '4 monofazna priključka (16 A)', plafon: '3 m', zamracivanje: 'Ne', ton: 'Mirno posle 14:00', svetlo: 'Delimično, izlog', stranaSveta: 'Istok (izlog)',
      oprema: 'Ulaz sa ulice, dva stepenika', vrata: 'Ulaz 100 × 210 cm', lift: 'Nema lifta', hodnik: 'Prolaz uz šank 90 cm',
      parkingAuta: 'Ulični, plaćen', parkingKamioni: 'Nema; kratko zaustavljanje za utovar 7:00–9:00', prostorEkipa: 'Nema (koristi se salon)', prostorSminka: 'Nema; sto u salonu', prostorKostim: 'Nema; vešalice u salonu', toaleti: 'Jedan',
      sati: '14:00–23:00', izmene: 'Ne', ljubimci: 'Ne', pusenje: 'Ne', pravilaZgrade: 'Lokal u stambenoj zgradi: buka posle 22:00 ograničena' },
  }),
  napravi({
    id: 'napusteni-magacin', naziv: 'Napušteni magacin', tip: 'Hala', opstina: 'Palilula', zona: 'Istok',
    stilovi: ['napušteno'], kvadratura: 650, kapacitet: 'preko30', vlasnikId: IVAN, istaknuto: false,
    cene: { do10: 36000, do30: 40000, preko30: 50000 }, cenaPripremeCenti: 20000, prekovremeni: 5000,
    opis: 'Veliki, napušten magacin sa oljuštenim zidovima i razbijenim staklima. Nema grejanja, pa je idealan za dramske i postapokaliptične scene.',
    zauzeti: ['2026-11-23', '2026-11-30'],
    oznake: ['kamion'],
    podaci: { struja: 'Samo agregat (donosi produkcija)', prikljucci: 'Nema stalnih priključaka', plafon: '7 m', zamracivanje: 'Delimično', ton: 'Eho, buka sa pruge', svetlo: 'Da, razbijena okna', stranaSveta: 'Jug i istok',
      oprema: 'Veliki kolski ulaz', vrata: 'Kolski ulaz 350 × 400 cm', lift: 'Nema lifta', hodnik: 'Slobodan prostor, neravan pod',
      parkingAuta: '15 vozila na platou', parkingKamioni: 'Plato ispred (do 20 t)', prostorEkipa: 'Šator ispred (donosi produkcija)', prostorSminka: 'Šator ispred (donosi produkcija)', prostorKostim: 'Šator ispred (donosi produkcija)', toaleti: 'Nema (mobilni toaleti)',
      sati: '07:00–21:00', izmene: 'Dozvoljeno', ljubimci: 'Da', pusenje: 'Napolju', pravilaZgrade: 'Objekat je u lošem stanju: kaciga obavezna, zabranjen ulaz na krov' },
  }),
  napravi({
    id: 'moderna-kancelarija', naziv: 'Moderna kancelarija', tip: 'Kancelarija', opstina: 'Novi Beograd', zona: 'Novi Beograd',
    stilovi: ['moderno'], kvadratura: 320, kapacitet: 'preko30', vlasnikId: ALFA, istaknuto: false,
    cene: { do10: 41000, do30: 45000, preko30: 56250 }, cenaPripremeCenti: 22500, prekovremeni: 5000,
    opis: 'Staklena open-space kancelarija na visokom spratu, sa konferencijskom salom i pogledom na grad. Prirodno svetlo ceo dan.',
    zauzeti: ['2026-11-12', '2026-11-26', '2026-11-27'],
    oznake: ['lift', 'kamion'],
    podaci: { struja: 'Monofazna, dovoljno priključaka', prikljucci: '24 monofazna priključka u podu', plafon: '2,9 m', zamracivanje: 'Roletne', ton: 'Klimatizovano, tiho', svetlo: 'Da, staklene fasade', stranaSveta: 'Jug i zapad',
      oprema: 'Putnički i teretni lift', vrata: 'Staklena vrata 120 × 220 cm', lift: 'Teretni: 120 × 180 × 210 cm, do 1000 kg', hodnik: 'Hodnik 200 cm, bez pragova',
      parkingAuta: 'Podzemna garaža, 10 mesta', parkingKamioni: 'Nema; utovar u garaži (visina 2,2 m)', prostorEkipa: 'Sala za sastanke', prostorSminka: 'Sala za sastanke, sa ogledalima', prostorKostim: 'Garderoba uz sale', toaleti: 'Četiri',
      sati: 'Vikendom 08:00–20:00', izmene: 'Ne', ljubimci: 'Ne', pusenje: 'Ne', pravilaZgrade: 'Recepcija vodi listu gostiju; lift se rezerviše unapred' },
  }),
  napravi({
    id: 'foto-studio', naziv: 'Foto-studio sa ciklorama', tip: 'Studio', opstina: 'Vračar', zona: 'Centar',
    stilovi: ['moderno'], kvadratura: 140, kapacitet: 'do30', vlasnikId: ALFA, istaknuto: true,
    cene: { do10: 27000, do30: 30000 }, cenaPripremeCenti: 15000, prekovremeni: 4000,
    opis: 'Studio sa belom i crnom ciklorama, zamračenjem i spremnom rasvetom. Za reklame, kataloge i intervjue.',
    zauzeti: ['2026-11-10', '2026-11-25', '2026-12-03'],
    oznake: ['trofazna', 'zamracivanje', 'ton'],
    podaci: { struja: 'Trofazna, 32 A', prikljucci: '3 trofazna i 6 monofaznih', plafon: '4 m', zamracivanje: 'Da, potpuno', ton: 'Izolovano, dobro za zvuk', svetlo: 'Ne (veštačko)', stranaSveta: 'Nema prozora',
      oprema: 'Prizemlje, direktan ulaz', vrata: 'Dvokrilna vrata 160 × 230 cm', lift: 'Nema lifta (prizemlje)', hodnik: 'Hodnik 140 cm, bez stepenika',
      parkingAuta: 'Ulični, 2 mesta u dvorištu', parkingKamioni: 'Nema; utovar sa ulice (kratko)', prostorEkipa: 'Dnevni boravak', prostorSminka: 'Šminkernica sa ogledalima i svetlom', prostorKostim: 'Garderoba sa šinama', toaleti: 'Dva',
      sati: '08:00–22:00', izmene: 'Samo cikloramom', ljubimci: 'Ne', pusenje: 'Ne', pravilaZgrade: 'Studio u stambenoj zgradi: tišina posle 22:00' },
  }),
  napravi({
    id: 'stan-sedamdesete', naziv: 'Stan u stilu sedamdesetih', tip: 'Stan', opstina: 'Zvezdara', zona: 'Istok',
    stilovi: ['socrealizam'], kvadratura: 62, kapacitet: 'do10', vlasnikId: IVAN, istaknuto: false,
    cene: { do10: 25000 }, cenaPripremeCenti: 12500, prekovremeni: 3000,
    opis: 'Očuvan dvosoban stan sa originalnim nameštajem, tapetama i keramikom iz sedamdesetih. Mali prostor, ekipa do deset ljudi.',
    zauzeti: ['2026-11-19', '2026-11-20'],
    oznake: [],
    podaci: { struja: 'Monofazna', prikljucci: '5 monofaznih priključaka (10 A)', plafon: '2,6 m', zamracivanje: 'Roletne', ton: 'Stambena zgrada, tiše posle 10', svetlo: 'Da, dva balkona', stranaSveta: 'Zapad',
      oprema: 'Lift mali (do 4 osobe), 3. sprat', vrata: 'Ulazna vrata 90 × 200 cm', lift: 'Mali: 80 × 100 × 200 cm, do 300 kg', hodnik: 'Hodnik 100 cm; stepenište 110 cm',
      parkingAuta: 'Ulični', parkingKamioni: 'Nema', prostorEkipa: 'Nema', prostorSminka: 'Nema; kupatilo uz ogledalo', prostorKostim: 'Nema; ormar u spavaćoj sobi', toaleti: 'Jedan',
      sati: '09:00–20:00', izmene: 'Ne', ljubimci: 'Ne', pusenje: 'Ne', pravilaZgrade: 'Stambena zgrada: obaveštenje komšijama dan ranije; stepenište se ne zauzima' },
  }),
  napravi({
    id: 'hotelski-lobi', naziv: 'Hotelski lobi', tip: 'Hotel', opstina: 'Zemun', zona: 'Zemun-Novi Beograd',
    stilovi: ['moderno'], kvadratura: 380, kapacitet: 'do30', vlasnikId: ALFA, istaknuto: false,
    cene: { do10: 108000, do30: 120000 }, cenaPripremeCenti: 60000, prekovremeni: 14000,
    najkrace: '1 snimajući dan (noćni termin)', troskovi: 'Obezbeđenje hotela (po satu), pokrivanje gostiju',
    opis: 'Elegantan lobi hotela sa mermernim podom i recepcijom. Snima se uglavnom noću, kad je gostiju najmanje.',
    zauzeti: ['2026-11-14', '2026-11-15', '2026-11-28', '2026-12-04'],
    oznake: ['lift'],
    podaci: { struja: 'Monofazna, dovoljno', prikljucci: '12 monofaznih priključaka', plafon: '5 m', zamracivanje: 'Ne', ton: 'Gosti u pozadini', svetlo: 'Da, staklena fasada', stranaSveta: 'Zapad (reka)',
      oprema: 'Teretni lift iz dvorišta', vrata: 'Servisna vrata 130 × 220 cm', lift: 'Teretni: 140 × 200 × 220 cm, do 1200 kg', hodnik: 'Servisni hodnik 180 cm',
      parkingAuta: 'Garaža hotela po dogovoru', parkingKamioni: 'Utovar u dvorištu noću (do 3,5 t)', prostorEkipa: 'Sala za sastanke', prostorSminka: 'Sala za sastanke, sa ogledalima', prostorKostim: 'Soba za garderobu uz lobi', toaleti: 'Javni',
      sati: '23:00–06:00 (noću)', izmene: 'Ne', ljubimci: 'Ne', pusenje: 'Ne', pravilaZgrade: 'Gosti imaju prednost; blokada prolaza ka liftovima nije dozvoljena' },
  }),
  napravi({
    id: 'stara-fabrika', naziv: 'Stara fabrika', tip: 'Hala', opstina: 'Čukarica', zona: 'Zapad',
    stilovi: ['industrijsko'], kvadratura: 1100, kapacitet: 'preko30', vlasnikId: ALFA, istaknuto: false,
    cene: { do10: 45000, do30: 50000, preko30: 62500 }, cenaPripremeCenti: 25000, prekovremeni: 6000,
    opis: 'Bivša fabrika sa mašinskom halom, dimnjakom i kontrolnom sobom. Ton je loš zbog okoline, ali slika je snažna.',
    zauzeti: ['2026-11-17', '2026-11-18', '2026-12-07'],
    oznake: ['trofazna', 'kamion'],
    podaci: { struja: 'Trofazna, 63 A', prikljucci: '3 trofazna i 6 monofaznih', plafon: '8 m', zamracivanje: 'Delimično', ton: 'Loš (saobraćaj i pruga)', svetlo: 'Da, krovna okna', stranaSveta: 'Krovna okna, sever',
      oprema: 'Rampa, bez stepenica', vrata: 'Kolski ulaz 400 × 450 cm', lift: 'Nema lifta', hodnik: 'Široki prolazi (do 300 cm)',
      parkingAuta: '30 mesta na platou', parkingKamioni: 'Plato za kamione (do 20 t)', prostorEkipa: 'Bivša menza', prostorSminka: 'Bivša menza, uz prozor', prostorKostim: 'Kontrolna soba na spratu', toaleti: 'Dva (rudimentarno)',
      sati: '07:00–21:00', izmene: 'Dozvoljeno uz dogovor', ljubimci: 'Da', pusenje: 'Napolju', pravilaZgrade: 'Kaciga obavezna; ulaz kod portirnice' },
  }),
]
export function nadjiLokaciju(id: string): Lokacija | undefined {
  return LOKACIJE.find((l) => l.id === id)
}

/** Cena snimajućeg dana za razred, ili null ako prostor ne prima toliku ekipu. */
export function cenaDana(l: Lokacija, razred: Razred): number | null {
  return l.cene[razred] ?? null
}

/** "Od X €" na karticama = NAJNIŽA cena snimajućeg dana (obično za ekipu do 10). */
export function cenaOd(l: Lokacija): number {
  return Math.min(...(Object.values(l.cene) as number[]))
}

/** Razred za prikaz primera: željeni ako je moguć, inače najbliži dostupan. */
export function razredZaPrimer(l: Lokacija, zeljeni: Razred): Razred {
  if (l.cene[zeljeni] != null) return zeljeni
  return REDOSLED_RAZREDA.find((r) => l.cene[r] != null) ?? 'do10'
}

export function dostupniRazredi(l: Lokacija): Razred[] {
  return REDOSLED_RAZREDA.filter((r) => l.cene[r] != null)
}

/** Opisna ploča kad nema fotografije (neutralna siva sa nazivom tipa prostora). */
export function nazivTipa(l: Lokacija): string {
  return l.tip
}
