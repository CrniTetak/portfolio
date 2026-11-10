// SVI tekstovi vođene priče na jednom mestu (plan dorade 3, odluka D16). Ton gleda vlasnik; menja se samo ovde.
// Kako se dodaje ili menja korak: vidi docs/KAKO-JE-NAPRAVLJENO.md (odeljak Vođena priča).
import type { Grana, UlogaPrice } from '../prica/tipovi'

export const OZNAKA_PROTOTIP = 'PROTOTIP — izmišljeni podaci'

// ---------------------------------------------------------------- nazivi koraka

const NAZIVI: Record<number, string> = {
  1: 'Početna',
  2: 'Zahtev (brief)',
  3: 'Izbor lokacija',
  4: 'Deljenje i glasanje',
  5: 'Opcije i osporavanje',
  6: 'Zahtev za rezervaciju',
  7: 'Vlasnik odobrava',
  8: 'Predračun i uplata',
  9: 'Dokumenti',
}
const NAZIV_9_OTKAZ = 'Vlasnik otkazuje'

export const nazivKoraka = (korak: number, grana: Grana): string =>
  korak === 9 && grana === 'otkaz' ? NAZIV_9_OTKAZ : NAZIVI[korak] ?? ''

// ---------------------------------------------------------------- tekstovi koji zavise od stanja u koraku
// Tekst može biti jedna rečenica (važi za ceo korak) ili niz: element i važi kad je u koraku odrađeno i radnji
// (0 = početno stanje koraka, poslednji element = završno). Tako kartica nikad ne tvrdi nešto što se još nije desilo.
type Varijante = string | string[]
type VarijanteNull = string | null | (string | null)[]
const izaberi = <T,>(v: T | T[], odradjeno: number): T => (Array.isArray(v) ? v[Math.min(odradjeno, v.length - 1)] : v)
export interface MestoUPrici { korak: number; grana: Grana; odradjeno: number }

// ---------------------------------------------------------------- šta se sada dešava (isto za sve uloge)

const OPIS: Record<number, Varijante> = {
  1: 'Produkcija traži prostor. Nasetu naplaćuje samo svoju naknadu, a lokaciju produkcija plaća direktno vlasniku.',
  2: ['Produkcija opisuje šta joj treba: reklama, Beograd, dva dana, ekipa do 30 ljudi.', 'Zahtev je poslat. Nasetu tim priprema izbor lokacija (24–48 h).'],
  3: ['Nasetu tim priprema izbor od tri lokacije, sa obrazloženjem za svaku.', 'Izbor je stigao: tri lokacije, sa obrazloženjem za svaku.'],
  4: ['Produkcija deli izbor linkom sa rokom; agencija ili klijent glasa bez naloga i bez adresa.', 'Marko je glasao „sviđa mi se“ za Industrijski loft.'],
  5: [
    'Produkcija traži opcije: loft kao prvu, halu kao drugu (iza Sigme).',
    'Loft je prva opcija; sledi opcija na hali (druga, iza Sigme).',
    'Obe opcije su postavljene; sledi simulacija: druga produkcija traži isti termin.',
    'Druga produkcija traži isti termin na loftu: prva opcija ima 24 h da potvrdi.',
  ],
  6: ['Produkcija potvrđuje opciju zahtevom za rezervaciju; vlasnik će imati 48 h da odgovori.', 'Zahtev je kod vlasnika; ima 48 h da odgovori.'],
  7: ['Vlasnik odlučuje o Deltinom zahtevu (rok 48 h); Sigmin zahtev za isti termin čeka.', 'Vlasnik je odobrio Deltu, Sigmin zahtev je automatski odbijen, a predračun naknade je izdat.'],
  8: ['Predračun je izdat: produkcija plaća samo naknadu Nasetua, u dinarima. Adresa je skrivena do uplate.', 'Uplata je potvrđena (simulacija): adresa i kontakt su otvoreni produkciji.'],
  9: 'Ugovor i Location Brief se popunjavaju iz plaćene rezervacije.',
}
const OPIS_9_OTKAZ: Varijante = [
  'Vlasnik će otkazati rezervaciju (simulacija).',
  'Vlasnik je otkazao: naknada se vraća (izmišljeno).',
]

export const opisKoraka = (m: MestoUPrici): string =>
  izaberi(m.korak === 9 && m.grana === 'otkaz' ? OPIS_9_OTKAZ : OPIS[m.korak] ?? '', m.odradjeno)

// ---------------------------------------------------------------- šta vidi ova uloga (kratko; ne ponavlja opis)

const PO_ULOZI: Record<number, Record<UlogaPrice, Varijante>> = {
  1: { produkcija: 'Vidite početnu stranu sa katalogom.', vlasnik: 'Vidite tablu: zahtevi, opcije, kalendar, iznos.', partner: 'Dovodite produkcije i lokacije.' },
  2: {
    produkcija: ['Zahtev je popunjen; šaljete ga dugmetom.', 'Zahtev je poslat.'],
    vlasnik: 'Zahtev ne stiže vama, nego Nasetu timu.',
    partner: 'Zahtev koji ste doneli nosio bi izvor „Preporuka partnera“.',
  },
  3: {
    produkcija: ['Tabla kaže da se izbor priprema.', 'Otvorite izbor: lokacije sa obrazloženjem.'],
    vlasnik: 'Izbore ne vidite.',
    partner: 'Svoje izbore pravite sami; „Novi izbor“ nije aktivno u vođenoj priči.',
  },
  4: {
    produkcija: ['Delite link i gledate kao primalac.', 'Glas se vidi na ekranu deljenja.'],
    vlasnik: 'Ko glasa, ne vidite.',
    partner: 'Svoje izbore delite na isti način.',
  },
  5: {
    produkcija: ['Postavljate opciju na loftu.', 'Postavljate opciju na hali.', 'Sledi simulacija druge produkcije.', 'Prva opcija je osporena; imate 24 h.'],
    vlasnik: ['Opcije ne vidite dok ne postanu zahtev.', 'Opcije ne vidite dok ne postanu zahtev.', 'Opcije ne vidite dok ne postanu zahtev.', 'Sigmin zahtev za loft je kod vas; Odobri je zaključano.'],
    partner: 'Opcije i redosled ne vidite.',
  },
  6: {
    produkcija: ['Šaljete zahtev za rezervaciju.', 'Zahtev čeka vlasnika.'],
    vlasnik: ['Zahtev stiže tek kad ga produkcija pošalje.', 'Stigla su dva zahteva za isti termin: Deltin i Sigmin.'],
    partner: 'Ne učestvujete u rezervaciji.',
  },
  7: {
    produkcija: ['Čekate odluku vlasnika (najviše 48 h).', 'Zahtev je odobren; sledi uplata naknade.'],
    vlasnik: ['Odlučujete: Odobri je aktivno samo za Deltin zahtev.', 'Odobreno; Sigmin zahtev se sam odbio.'],
    partner: 'Ne učestvujete u odluci vlasnika.',
  },
  8: {
    produkcija: ['Predračun je u dinarima.', 'Rezervacija i dokumenti su dostupni.'],
    vlasnik: 'Vi dobijate iznos iz tabele; naknadu plaća produkcija.',
    partner: 'Adresu ne vidite ni posle uplate.',
  },
  9: { produkcija: 'Adresa je otvorena.', vlasnik: 'Isti ugovor, vaša lokacija.', partner: 'Vidi se samo opšti primer.' },
}
const PO_ULOZI_9_OTKAZ: Record<UlogaPrice, Varijante> = {
  produkcija: ['Rezervacija je još plaćena.', 'Vidite povraćaj i zamensku lokaciju.'],
  vlasnik: ['Možete otkazati plaćenu rezervaciju (simulacija).', 'Rezervacija je otkazana.'],
  partner: 'Ne učestvujete u otkazivanju.',
}

export const poUloziZa = (m: MestoUPrici, uloga: UlogaPrice): string =>
  izaberi((m.korak === 9 && m.grana === 'otkaz' ? PO_ULOZI_9_OTKAZ : PO_ULOZI[m.korak])?.[uloga] ?? '', m.odradjeno)

// ---------------------------------------------------------------- „u ovom koraku…" (plava rečenica na ekranu uloge)
// Mora da kaže šta se dešava i zašto dugme te uloge nije aktivno; ne poziva na radnju koja je ugašena.

const U_OVOM_KORAKU: Record<number, Partial<Record<UlogaPrice, VarijanteNull>>> = {
  1: {
    vlasnik: 'Vlasnik u ovom koraku ništa ne radi. Ovde vidi zahteve, opcije, kalendar i koliko dobija.',
    partner: 'Partner dovodi produkcije i lokacije. Od plaćenih rezervacija koje preporuči dobija 20% naknade Nasetua (vodi se ručno).',
  },
  2: {
    vlasnik: 'Zahtev ide Nasetu timu, ne vlasnicima. Vlasnik ne zna ko traži prostor dok ne stigne opcija ili zahtev.',
    partner: 'Da je produkciju doveo partner, zahtev bi nosio izvor „Preporuka partnera“.',
  },
  3: {
    vlasnik: 'Vlasnik ne vidi izbore ni ko ih gleda.',
    partner: 'Partner bi ovde pravio izbor za svog klijenta. U vođenoj priči je „Novi izbor“ ugašeno; probajte u slobodnom režimu.',
  },
  4: {
    vlasnik: 'Ko gleda i glasa, vlasnik ne vidi. Link ne otkriva adresu.',
    partner: 'Partner svoje izbore deli na isti način, bez adresa.',
  },
  5: {
    vlasnik: [
      'Vlasnik ne vidi opcije dok ne postanu zahtev.',
      'Vlasnik ne vidi opcije dok ne postanu zahtev.',
      'Vlasnik ne vidi opcije dok ne postanu zahtev.',
      'Odobri je zaključano: prva opcija (Produkcija Delta) ima još 24 h da potvrdi.',
    ],
    partner: 'Partner ne vidi opcije ni ko drži termin.',
  },
  6: {
    vlasnik: ['Zahtev Produkcije Delta još nije stigao; stiže kad ga pošalje.', null],
    partner: 'Partner ne učestvuje u rezervaciji.',
  },
  7: {
    produkcija: ['U ovom koraku odlučuje vlasnik; produkcija čeka (najviše 48 h).', 'Vlasnik je odobrio; sledi predračun naknade.'],
    partner: 'Partner ne učestvuje u odluci vlasnika.',
  },
  8: {
    vlasnik: 'Naknadu Nasetuu plaća produkcija; vlasnik dobija iznos iz tabele.',
    partner: 'Adresu vidi samo produkcija, i to posle uplate. Partner je ne vidi.',
  },
  9: {
    partner: 'Partner nema pravo na dokumente rezervacije (ni pre ni posle uplate), pa vidi samo opšti primer.',
  },
}
const U_OVOM_KORAKU_9_OTKAZ: Partial<Record<UlogaPrice, VarijanteNull>> = {
  partner: 'Partner ne učestvuje u otkazivanju.',
}

export const uOvomKoraku = (m: MestoUPrici, uloga: UlogaPrice): string | null =>
  izaberi((m.korak === 9 && m.grana === 'otkaz' ? U_OVOM_KORAKU_9_OTKAZ : U_OVOM_KORAKU[m.korak])?.[uloga] ?? null, m.odradjeno) ?? null

// ---------------------------------------------------------------- razlozi ugašenih dugmadi

export const RAZLOG_GOTOVO = 'Gotovo'
export const RAZLOG_KASNIJE = (korak: number) => `Dostupno u koraku ${korak}`
export const RAZLOG_PRETHODNA = 'Prvo prethodna radnja u ovom koraku'
export const RAZLOG_NASETU = 'Radi Nasetu tim (simulirano)'
export const RAZLOG_VAN_PRICE = 'Probajte u slobodnom režimu'
export const RAZLOG_OTKAZ_GRANA = 'Dostupno u grani „Vlasnik otkaže“'
export const CEKA_ULOGU: Record<UlogaPrice, string> = {
  produkcija: 'Čeka se: Produkcija',
  vlasnik: 'Čeka se: Vlasnik',
  partner: 'Čeka se: Partner',
}

// ---------------------------------------------------------------- poruke (toast)

export const PORUKA_SIMULIRANO = 'Simulirana radnja — ništa nije poslato'
export const PORUKA_NIJE_SLEDECI = 'U vođenoj priči ovo nije sledeći korak — probajte u slobodnom režimu'
export const PORUKA_RESTART = 'Demo je ponovo na koraku 1'
export const PORUKA_UVOD_SLOBODNO =
  'Sada slobodno istražujete. Traka priče ostaje pri dnu. Radnje van priče menjaju samo ovu probu; „Vrati na korak N“ ih briše.'

// ---------------------------------------------------------------- ulazni ekran

export const ULAZ = {
  naslov: 'Dobro došli u Nasetu prototip',
  uvod: 'Pratite jednu rezervaciju od zahteva do otvorene adrese — ili slobodno istražujte.',
  izaberiUlogu: 'Izaberite ko želite da budete',
  uloge: {
    produkcija: 'Tražite prostor za snimanje, držite opciju, šaljete zahtev i plaćate samo naknadu Nasetua.',
    vlasnik: 'Vaš prostor je na platformi: odobravate zahteve i vidite koliko dobijate.',
    partner: 'Dovodite produkcije i lokacije; od plaćenih preporuka dobijate deo naknade.',
  } satisfies Record<UlogaPrice, string>,
  rezim: 'Način rada:',
  vodjeno: 'Vođena priča (preporučeno)',
  slobodno: 'Slobodno istraživanje',
  udji: 'Uđi u demo',
  napomena: 'Bez lozinke. Svi podaci su izmišljeni. Ništa se ne šalje i ne pamti van ove kartice pregledača.',
  prototip: 'Nasetu je prototip sa izmišljenim podacima: ništa se ne plaća, ne šalje i ne pamti van ove kartice pregledača.',
}
