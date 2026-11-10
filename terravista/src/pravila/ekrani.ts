// REGISTAR 53 EKRANA (PLAN B4.2, UX 4): id, uređaj, šablon rute, roditelj (gde vodi „Nazad“ kad je stek prazan),
// početni fokus (id elementa koji ekran MORA da registruje) i naslov dokumenta. Jedino mesto gde se rute definišu.
// Rute: uvod i table su obične putanje (#/ulaz); televizor je #/tv/…; telefon ide u upitu istog linka (#/tv/pocetna?tel=/pocetna).

export type Uredjaj = 'uvod' | 'tv' | 'tel' | 'tabla'

export type Ekran = {
  id: string
  uredjaj: Uredjaj
  /** Šablon rute sa mestima za parametre (:id); za telefon je to vrednost upita `tel`. */
  ruta: string
  /** Id ekrana na koji vodi „Nazad“ kad je stek prazan; null = nema (početni ekran). */
  roditelj: string | null
  /** Id elementa koji ekran mora da registruje kao početni izbor (televizor); za ostale uređaje može biti null. */
  pocetniFokus: string | null
  naslov: string
}

const e = (id: string, uredjaj: Uredjaj, ruta: string, roditelj: string | null, naslov: string, pocetniFokus: string | null = null): Ekran => ({
  id,
  uredjaj,
  ruta,
  roditelj,
  naslov,
  pocetniFokus,
})

export const EKRANI: readonly Ekran[] = [
  // ---- Uvodni ekrani (3)
  e('U1', 'uvod', '/', null, 'Šta je ovo'),
  e('U2', 'uvod', '/ulaz', 'U1', 'Uđi u demo'),
  e('U3', 'uvod', '/o-demou', 'U1', 'O ovom demou'),
  // ---- Televizor (31)
  e('T1', 'tv', '/tv/pokretanje', null, 'Pokretanje', 'pocni'),
  e('T2', 'tv', '/tv/pocetna', null, 'Početni ekran', 'tapeta-gledaj'),
  e('T3', 'tv', '/tv/vodic', 'T2', 'TV vodič', 'vodic-sada'),
  e('T4', 'tv', '/tv/emisija/:id', 'T3', 'Emisija — detalj', 'emisija-glavno'),
  e('T5', 'tv', '/tv/kanali', 'T2', 'Kanali — pregled', 'kanali-prekidac-besplatni'),
  e('T6', 'tv', '/tv/kanali/zanr', 'T5', 'Kanali po žanru', 'zanr-0'),
  e('T7', 'tv', '/tv/kanali/zemlja', 'T5', 'Kanali po zemlji', 'poreklo-0'),
  e('T8', 'tv', '/tv/kanal/:id', 'T5', 'Stranica kanala', 'kanal-glavno'),
  e('T9', 'tv', '/tv/gledaj/:id', 'T8', 'Gledanje kanala', 'plejer-od-pocetka'),
  e('T10', 'tv', '/tv/reklama/:id', 'T9', 'Reklamna pauza', 'reklama-nastavi'),
  e('T11', 'tv', '/tv/unazad/:id', 'T9', 'Gledanje unazad', 'unazad-dan-1'),
  e('T12', 'tv', '/tv/nedostupno/:id', 'T8', 'Nije dostupno u ovoj zemlji', 'nedostupno-nazad'),
  e('T13', 'tv', '/tv/qr/:proizvod', 'T8', 'Prijava i pretplata preko QR koda', 'qr-skeniraj'),
  e('T14', 'tv', '/tv/otkljucano/:id', 'T8', 'Kanal je otključan', 'otkljucano-gledaj'),
  e('T15', 'tv', '/tv/paketi', 'T2', 'Paketi — pregled', 'paket-srbija'),
  e('T16', 'tv', '/tv/paket/:id', 'T15', 'Stranica paketa', 'paket-glavno'),
  e('T17', 'tv', '/tv/pretraga', 'T2', 'Pretraga', 'upit-0'),
  e('T18', 'tv', '/tv/pretraga/:upit', 'T17', 'Rezultati pretrage', 'rezultat-nazad'),
  e('T19', 'tv', '/tv/pretplate', 'T2', 'Moje pretplate', 'pretplate-prvi'),
  e('T20', 'tv', '/tv/otkazano/:id', 'T19', 'Otkaz izvršen', 'otkazano-u-redu'),
  e('T21', 'tv', '/tv/podesavanja', 'T2', 'Podešavanja', 'podesavanja-jezik'),
  e('T22', 'tv', '/tv/podesavanja/jezik', 'T21', 'Jezik', 'jezik-srpski'),
  e('T23', 'tv', '/tv/podesavanja/titlovi', 'T21', 'Titlovi', 'titlovi-prekidac'),
  e('T24', 'tv', '/tv/podesavanja/roditeljska', 'T21', 'Roditeljska zaštita', 'roditeljska-prekidac'),
  e('T25', 'tv', '/tv/podesavanja/zemlja', 'T21', 'Zemlja (demo izbor)', 'zemlja-grcka'),
  e('T26', 'tv', '/tv/grcka', 'T25', 'Dobrodošao u Grčku', 'grcka-pocetni'),
  e('T27', 'tv', '/tv/srbija', 'T25', 'Dobrodošao u Srbiju', 'srbija-doma'),
  e('T28', 'tv', '/tv/podesavanja/nalog', 'T21', 'Uređaji i nalog', 'nalog-prijava'),
  e('T29', 'tv', '/tv/pomoc', 'T21', 'Pomoć', 'pomoc-0'),
  e('T30', 'tv', '/tv/pomoc/:pitanje', 'T29', 'Pomoć — odgovor', 'pomoc-nazad'),
  e('T31', 'tv', '/tv/reklama-zasto', 'T10', 'Zašto vidim ovu reklamu', 'reklame-prekidac'),
  // ---- Telefon (17)
  e('P1', 'tel', '/pocetna', null, 'Početna telefona'),
  e('P2', 'tel', '/prijava/:proizvod', 'P1', 'Prijava preko QR koda'),
  e('P3', 'tel', '/narudzba/:proizvod', 'P6', 'Pregled narudžbe'),
  e('P4', 'tel', '/placanje/:proizvod', 'P3', 'Plaćanje (demo)'),
  e('P5', 'tel', '/aktivno/:proizvod', 'P1', 'Pretplata aktivna'),
  e('P6', 'tel', '/paketi', 'P1', 'Paketi'),
  e('P7', 'tel', '/paket/:id', 'P6', 'Stranica paketa'),
  e('P8', 'tel', '/pretplate', 'P1', 'Moje pretplate'),
  e('P9', 'tel', '/otkaz', 'P8', 'Potvrda otkaza'),
  e('P10', 'tel', '/otkazano/:id', 'P8', 'Otkazano'),
  e('P11', 'tel', '/uredjaji', 'P14', 'Uređaji'),
  e('P12', 'tel', '/racuni', 'P14', 'Računi'),
  e('P13', 'tel', '/racun/:id', 'P12', 'Račun — detalj'),
  e('P14', 'tel', '/nalog', 'P1', 'Moj nalog i podešavanja'),
  e('P15', 'tel', '/jezik', 'P14', 'Jezik'),
  e('P16', 'tel', '/pomoc', 'P14', 'Pomoć'),
  e('P17', 'tel', '/uslovi/:proizvod', 'P3', 'Uslovi pretplate i odustanak'),
  // ---- Table (2)
  e('V1', 'tabla', '/tabla/vesna', null, 'Tabla vlasnice kanala'),
  e('M1', 'tabla', '/tabla/platforma', null, 'Tabla platforme'),
]

export const BROJ_EKRANA = 53

export function ekran(id: string): Ekran {
  const x = EKRANI.find((s) => s.id === id)
  if (!x) throw new Error(`Nepoznat ekran: ${id}`)
  return x
}

export type Parametri = Record<string, string>
export type Razresen = { ekran: Ekran; parametri: Parametri }

function odseci(putanja: string): string[] {
  return putanja.split('/').filter((s) => s.length > 0)
}

/** Poklapa putanju sa šablonom; vraća parametre ili null. */
export function poklopi(sablon: string, putanja: string): Parametri | null {
  const a = odseci(sablon)
  const b = odseci(putanja)
  if (a.length !== b.length) return null
  const p: Parametri = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) {
      let v = b[i]
      try {
        v = decodeURIComponent(v)
      } catch {
        return null
      }
      p[a[i].slice(1)] = v
    } else if (a[i] !== b[i]) return null
  }
  return p
}

/** Nalazi ekran za putanju uređaja ('tv' i 'tel' koriste šablone tog uređaja; uvod i table zajedno). Nepoznato → null. */
export function razresi(uredjaj: 'tv' | 'tel' | 'strana', putanja: string): Razresen | null {
  const kandidati = EKRANI.filter((s) => (uredjaj === 'strana' ? s.uredjaj === 'uvod' || s.uredjaj === 'tabla' : s.uredjaj === uredjaj))
  for (const s of kandidati) {
    const p = poklopi(s.ruta, putanja)
    if (p) return { ekran: s, parametri: p }
  }
  return null
}

/**
 * Putanja roditelja za „Nazad“ kad je stek prazan (npr. posle osvežavanja). Roditelj koji traži drugačije parametre od tekućeg ekrana
 * se rešava ovde (T13 → stranica kanala ili paketa, T10 → kanal koji se gleda, T20 → pretplate…); inače bezbedno na T2.
 */
export function roditeljPutanja(ekranId: string, parametri: Parametri, kontekst: { jePaket: (id: string) => boolean; kanalReklame: string }): string {
  const s = ekran(ekranId)
  if (!s.roditelj) return sastavi('T2')
  switch (ekranId) {
    case 'T13':
      return kontekst.jePaket(parametri.proizvod) ? sastavi('T16', { id: parametri.proizvod }) : sastavi('T8', { id: parametri.proizvod })
    case 'T10':
      return sastavi('T9', { id: kontekst.kanalReklame })
    case 'T20':
      return sastavi('T19')
    case 'T14':
    case 'T12':
    case 'T9':
      return ekranId === 'T9' || parametri.id ? sastavi('T8', { id: parametri.id }) : sastavi('T2')
  }
  try {
    return sastavi(s.roditelj, parametri)
  } catch {
    return sastavi('T2')
  }
}

/** Sklapa putanju iz šablona i parametara (ruta za link na ekran). */
export function sastavi(id: string, parametri: Parametri = {}): string {
  const s = ekran(id)
  return s.ruta.replace(/:(\w+)/g, (_, ime: string) => {
    const v = parametri[ime]
    if (v === undefined) throw new Error(`Ruta ${s.ruta} traži parametar ${ime}`)
    return encodeURIComponent(v)
  })
}
