// Početno stanje (unapred napunjen scenario) i RADNJE scenarija.
//
// Radnje (RADNJE_SCENARIJA) su jedini izvor šta radi koji korak: vođena priča (src/prica/) ih primenjuje
// kroz isti reducer kao dugmad, pa priča ne može da zaobiđe pravila (dorada 3). Stari Skoči-na je
// sačuvan samo kao referenca za testove (skokovi-za-testove.ts).
import type { Termin } from '../logika/tipovi'
import { stanjeZahteva } from '../logika/rezervacije'
import { IZMISLJEN_MB, IZMISLJEN_PIB, SIGMA } from '../podaci/akteri'
import { KURS_RSD } from '../logika/konstante'
import type { Nalog } from '../logika/tipovi'
import type { Akcija, NacrtBriefa } from './akcije'
import { briefDelte, izborDelte, predracunZa, zahteviDelte } from './izvedeno'
import { pocetnaPrica } from '../prica/tipovi'
import { VERZIJA_STANJA, type Stanje } from './tipovi'

/** Termin iz scenarija: dan pripreme (pon 16. 11.) + snimajući dan (uto 17. 11.). */
export const SCENARIO_TERMIN: Termin = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }

/** Brief koji je u obrascu unapred popunjen (UX, korak 2). */
export const BRIEF_SCENARIO: NacrtBriefa = {
  vrsta: 'Reklama',
  grad: 'Beograd',
  zone: ['Centar', 'Novi Beograd'],
  termin: SCENARIO_TERMIN,
  razred: 'do30',
  tipovi: ['Loft', 'Hala', 'Studio'],
  stilovi: ['industrijsko', 'brutalizam'],
  uslovi: ['trofazna', 'zamracivanje'],
  budzetOd: 40000,
  budzetDo: 80000,
  napomena: 'Reklama za domaći brend (izmišljeno). Potrebna veća otvorena površina i kontrolisano svetlo.',
  vanKataloga: false,
  pomocDozvole: false,
}

/** Komentar uz glas iz koraka 4 (izmišljen). */
export const GLAS_KOMENTAR = 'Svetlo je odlično za kadar.'

/** Brief za alat „Predračun sa uslugama" (odluka O22): izbor van kataloga (50 €) + pomoć oko dozvola; glavna priča ostaje bez usluga. */
export const BRIEF_USLUGE: NacrtBriefa = { ...BRIEF_SCENARIO, vanKataloga: true, pomocDozvole: true }

/** Šta nalog prihvata pri prijavi (B2): verzije izmišljenih dokumenata. */
const PRIHVACENO = ['Opšti uslovi v0.1', 'Ugovor o posredovanju v0.1']

const NALOZI_NA_CEKANJU: Nalog[] = [
  { id: 'n-firma', vrsta: 'firma', naziv: 'Produkcija Epsilon d.o.o. (izmišljeno)', pib: IZMISLJEN_PIB, mb: IZMISLJEN_MB, dokaz: null, prihvaceno: PRIHVACENO, stanje: 'ceka', poslat: -12 },
  { id: 'n-preduzetnik', vrsta: 'preduzetnik', naziv: 'Foto atelje Zeta, preduzetnik (izmišljeno)', pib: IZMISLJEN_PIB, mb: IZMISLJEN_MB, dokaz: null, prihvaceno: PRIHVACENO, stanje: 'ceka', poslat: -8 },
  { id: 'n-vlasnik', vrsta: 'fizicko-vlasnik', naziv: 'Petar M., vlasnik stana (izmišljeno)', pib: null, mb: null, dokaz: 'Izvod iz lista nepokretnosti — primer (izmišljeno)', prihvaceno: PRIHVACENO, stanje: 'ceka', poslat: -5 },
]

/** Kopija termina (da se nizovi iz konstanti ne dele između stanja). */
const kopijaTermina = (t: Termin): Termin => ({ priprema: [...t.priprema], snimanje: [...t.snimanje] })

export function pocetnoStanje(): Stanje {
  return {
    verzija: VERZIJA_STANJA,
    uloga: 'produkcija',
    prikazVlasnika: 'pravno',
    sati: 0,
    demoSakriven: false,
    prica: pocetnaPrica(),
    briefovi: [
      {
        id: 'b-sigma-1', produkcijaId: SIGMA, vrsta: 'Serija', grad: 'Beograd', zone: ['Novi Beograd'],
        termin: { priprema: [], snimanje: ['2026-12-08', '2026-12-09'] }, razred: 'preko30',
        tipovi: ['Hala'], stilovi: ['brutalizam'], uslovi: ['trofazna'], budzetOd: 50000, budzetDo: 90000,
        napomena: 'Izmišljen zahtev druge produkcije.', vanKataloga: false, pomocDozvole: false, izvor: 'Preporuka partnera',
        poslat: -30, izborId: 'izb-sigma',
      },
      {
        id: 'b-sigma-2', produkcijaId: SIGMA, vrsta: 'Foto', grad: 'Beograd', zone: ['Centar'],
        termin: { priprema: [], snimanje: ['2026-12-14'] }, razred: 'do10',
        tipovi: ['Studio'], stilovi: ['moderno'], uslovi: ['zamracivanje'], budzetOd: 20000, budzetDo: 40000,
        napomena: 'Izmišljen zahtev druge produkcije.', vanKataloga: true, pomocDozvole: false, izvor: 'Društvene mreže',
        poslat: -3, izborId: null,
      },
    ],
    izbori: [
      {
        id: 'izb-sigma', akterId: SIGMA, uloga: 'produkcija', naziv: 'Izbor za: Serija, Beograd', zaKoga: 'Producent serije',
        briefId: 'b-sigma-1', lokacijaIds: ['brutalisticka-hala', 'stara-fabrika'],
        zasto: { 'brutalisticka-hala': 'Velika hala za scenografiju.', 'stara-fabrika': 'Industrijska atmosfera.' },
        trajanje: 48, linkOd: -20, poslatProdukciji: -20,
      },
    ],
    glasovi: [],
    // Sigma već drži PRVU opciju na hali za isti termin, pa Delta tamo dobija DRUGU poziciju.
    // Postavljena je pre početka (−6 h) i ističe posle 72 h od tada (premotavanje +72 h je oslobađa).
    opcije: [
      {
        id: 'o-sigma-hala', lokacijaId: 'brutalisticka-hala', produkcijaId: SIGMA, termin: kopijaTermina(SCENARIO_TERMIN),
        postavljena: -6, vaziDo: 66, osporavanje: null, stanje: 'aktivna',
      },
    ],
    // Dva tuđa zahteva koja čekaju vlasnike: jedan za "Odbij" (studio), jedan za fizičko lice (stan).
    zahtevi: [
      {
        id: 'z-sigma-studio', lokacijaId: 'foto-studio', produkcijaId: SIGMA, briefId: 'b-sigma-2',
        termin: { priprema: [], snimanje: ['2026-11-24'] }, razred: 'do30', prekovremeniSati: 0,
        osnovicaCenti: 30000, domacin: false, kurs: KURS_RSD, opcijaId: null, poslat: -1, rok: 47, stanje: 'ceka', razlog: null, otkazan: null,
      },
      {
        id: 'z-sigma-stan', lokacijaId: 'stan-sedamdesete', produkcijaId: SIGMA, briefId: null,
        termin: { priprema: [], snimanje: ['2026-11-25'] }, razred: 'do10', prekovremeniSati: 0,
        osnovicaCenti: 25000, domacin: false, kurs: KURS_RSD, opcijaId: null, poslat: -1, rok: 47, stanje: 'ceka', razlog: null, otkazan: null,
      },
    ],
    predracuni: [],
    izvidjanja: [],
    prijaveLokacija: [],
    // Tri izmišljena naloga na čekanju (B2). PIB/MB su sve nule: ne mogu pripadati pravoj firmi.
    nalozi: NALOZI_NA_CEKANJU,
    beleske: [],
    blokiraniDani: {},
    dnevnik: [],
    brojac: 1,
  }
}

// ---------------------------------------------------------------- koraci skoka

type Radnja = (s: Stanje) => Akcija

/** Kopija nacrta briefa (nizovi se ne dele sa konstantom). */
const kopijaBriefa = (b: NacrtBriefa): NacrtBriefa => ({
  ...b, zone: [...b.zone], tipovi: [...b.tipovi], stilovi: [...b.stilovi], uslovi: [...b.uslovi], termin: kopijaTermina(b.termin),
})

const termin = (s: Stanje) => briefDelte(s)?.termin ?? SCENARIO_TERMIN

const radnje = {
  brief: (): Akcija => ({ tip: 'POSALJI_BRIEF', brief: kopijaBriefa(BRIEF_SCENARIO) }),
  izbor: (s: Stanje): Akcija => ({ tip: 'ADMIN_POSALJI_IZBOR', briefId: briefDelte(s)?.id ?? '' }),
  // Marko (agencija ili klijent, izmišljeno) glasa Sviđa mi se na loftu iz pogleda primaoca linka (korak 4 priče)
  glas: (s: Stanje): Akcija => ({
    tip: 'GLASAJ', izborId: izborDelte(s)?.id ?? '', lokacijaId: 'industrijski-loft', ime: 'Marko', sud: 'da', komentar: GLAS_KOMENTAR,
  }),
  opcijaLoft: (s: Stanje): Akcija => ({ tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: termin(s) }),
  opcijaHala: (s: Stanje): Akcija => ({ tip: 'TRAZI_OPCIJU', lokacijaId: 'brutalisticka-hala', termin: termin(s) }),
  osporavanje: (): Akcija => ({ tip: 'SIMULIRAJ_DRUGU_PRODUKCIJU', lokacijaId: 'industrijski-loft' }),
  zahtev: (s: Stanje): Akcija => ({
    tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: termin(s),
    razred: briefDelte(s)?.razred ?? 'do30', prekovremeniSati: 0,
  }),
  odobri: (s: Stanje): Akcija => ({ tip: 'ODOBRI_ZAHTEV', zahtevId: zahtevLofta(s)?.id ?? '' }),
  uplata: (s: Stanje): Akcija => ({
    tip: 'POTVRDI_UPLATU', predracunId: predracunZa(s, zahtevLofta(s)?.id ?? '')?.id ?? '',
  }),
  // ---- grana "Predračun sa uslugama" (O22) ----
  briefUsluge: (): Akcija => ({ tip: 'POSALJI_BRIEF', brief: kopijaBriefa(BRIEF_USLUGE) }),
  uplataIzbora: (s: Stanje): Akcija => ({
    tip: 'POTVRDI_UPLATU', predracunId: s.predracuni.find((p) => p.vrsta === 'izbor-van-kataloga' && p.uplataPotvrdjena === null)?.id ?? '',
  }),
  zahtevDomacin: (s: Stanje): Akcija => ({
    tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: termin(s),
    razred: briefDelte(s)?.razred ?? 'do30', prekovremeniSati: 0, domacin: true,
  }),
  // ---- grana "Vlasnik otkazao" (B5) ----
  otkazi: (s: Stanje): Akcija => ({ tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: zahtevLofta(s)?.id ?? '' }),
} satisfies Record<string, Radnja>

/** Poslednji Deltin zahtev za loft koji je i dalje živ (čeka ili je odobren); istekli i odbijeni se preskaču. */
const zahtevLofta = (s: Stanje) =>
  [...zahteviDelte(s)].reverse().find(
    (z) => z.lokacijaId === 'industrijski-loft' && ['ceka', 'odobren'].includes(stanjeZahteva(z, s.sati)))

/** Zahtev za loft koji je vlasnik otkazao posle uplate. */
export const otkazanZahtevLofta = (s: Stanje) =>
  [...zahteviDelte(s)].reverse().find((z) => z.lokacijaId === 'industrijski-loft' && z.stanje === 'otkazao-vlasnik')

/** Poslednji Deltin zahtev za loft, u bilo kom stanju (za rute ekrana priče). */
export const deltinZahtevLofta = (s: Stanje) =>
  [...zahteviDelte(s)].reverse().find((z) => z.lokacijaId === 'industrijski-loft')

// Za priču i testove
export { radnje as RADNJE_SCENARIJA, zahtevLofta }
