// KANALI — jedan izvor (PLAN B3, dizajn/KANALI.md). Svaki kanal je JEDNA stavka sa svim što demo zna o njemu.
// ZAMENA KANALA = izmena jedne stavke ovde (+ po potrebi fajl logotipa i red u logotipi.ts). Ništa drugo.
// Nazivi su pravi; sve ostalo (opisi, emisije) je izmišljeno i opšte po žanru.
// Zemlja i žanr služe samo da ponuda bude raznovrsna; to NIJE tvrdnja o stvarnom statusu, vlasništvu ni pravima kanala.
import type { KodZemlje } from './zemlje'

export type Zanr = 'Film' | 'Serije' | 'Zabava' | 'Muzika' | 'Sport' | 'Dokumentarci' | 'Deca' | 'Opšti program'
export const ZANROVI: readonly Zanr[] = ['Film', 'Serije', 'Zabava', 'Muzika', 'Sport', 'Dokumentarci', 'Deca', 'Opšti program']

export type ZemljaPorekla = 'Srbija' | 'Hrvatska' | 'Bosna i Hercegovina' | 'Regionalni'
export type Deo = 'besplatni' | 'po-izboru' | 'paket'
export type PaketId = 'srbija' | 'hrvatska' | 'bih' | 'film' | 'deca'
/** Uloga kanala u vođenoj priči (korak 2: besplatni film; koraci 3, 4, 6, 7: glavni kanal po izboru). */
export type UlogaKanala = 'besplatni-film' | 'glavni-po-izboru'

export type Kanal = {
  id: string
  naziv: string
  zemljaPorekla: ZemljaPorekla
  zanr: Zanr
  deo: Deo
  /** Samo za deo „paket“: u kom je paketu. */
  paket?: PaketId
  /** Id logotipa iz logotipi.ts, ili null (tada neutralna pločica sa nazivom). */
  logotip: string | null
  ulogaUPrici?: UlogaKanala
  /** Zemlje u kojima kanal NIJE dostupan (izmišljeno, dramaturški izbor — korak 6). */
  nedostupanU: readonly KodZemlje[]
  /** Gledanje unazad (izmišljeno po kanalu; „gde prava dozvoljavaju“). */
  gledanjeUnazad: boolean
  /** Opšti, izmišljen opis po žanru (bez tvrdnji o stvarnom kanalu). */
  opis: string
  /** Tri izmišljene emisije (naziv, uzrast); vremena i trajanje izvodi emisije.ts. */
  emisije: readonly (readonly [naziv: string, uzrast: string])[]
}

const OPIS: Record<Zanr, string> = {
  Film: 'Filmovi i filmski ciklusi za večernje gledanje (izmišljen opis).',
  Serije: 'Serije i domaći serijski program (izmišljen opis).',
  Zabava: 'Zabavni program i domaće serije (izmišljen opis).',
  Muzika: 'Muzički spotovi i koncerti (izmišljen opis).',
  Sport: 'Prenosi, studio i sportske emisije (izmišljen opis).',
  Dokumentarci: 'Dokumentarni filmovi o prirodi, putovanjima i istoriji (izmišljen opis).',
  Deca: 'Crtani filmovi i emisije za decu (izmišljen opis).',
  'Opšti program': 'Mešoviti program: filmovi, serije, zabava i emisije (izmišljen opis).',
}

type Ulaz = Omit<Kanal, 'opis' | 'nedostupanU' | 'gledanjeUnazad' | 'logotip'> & Partial<Pick<Kanal, 'nedostupanU' | 'gledanjeUnazad' | 'logotip'>>
const k = (u: Ulaz): Kanal => ({ nedostupanU: [], gledanjeUnazad: false, logotip: null, ...u, opis: OPIS[u.zanr] })

export const KANALI: readonly Kanal[] = [
  // ---- Deo 1 — besplatni kanali sa reklamama (5)
  k({ id: 'klasik-tv', naziv: 'Klasik', zemljaPorekla: 'Hrvatska', zanr: 'Film', deo: 'besplatni', ulogaUPrici: 'besplatni-film', gledanjeUnazad: true,
    emisije: [['Večernji film', '12+'], ['Humoreska', '12+'], ['Noćni program', '16+']] }),
  k({ id: 'prva-plus', naziv: 'Prva Plus', zemljaPorekla: 'Srbija', zanr: 'Serije', deo: 'besplatni', gledanjeUnazad: true,
    emisije: [['Porodične priče', '6+'], ['Kuvar vikenda', '6+'], ['Komšijski izazov', '12+']] }),
  k({ id: 'cmc', naziv: 'CMC', zemljaPorekla: 'Hrvatska', zanr: 'Muzika', deo: 'besplatni', logotip: 'cmc', nedostupanU: ['RS'],
    emisije: [['Muzički sat', '6+'], ['Top lista večeri', '6+'], ['Koncert iz dvorane', '12+']] }),
  k({ id: 'hayat-tv', naziv: 'Hayat TV', zemljaPorekla: 'Bosna i Hercegovina', zanr: 'Opšti program', deo: 'besplatni', nedostupanU: ['RS'],
    emisije: [['Večernji magazin', '6+'], ['Kafa u deset', '12+'], ['Domaći film', '12+']] }),
  k({ id: 'viasat-explore', naziv: 'Viasat Explore', zemljaPorekla: 'Regionalni', zanr: 'Dokumentarci', deo: 'besplatni', logotip: 'viasat-explore', gledanjeUnazad: true,
    emisije: [['Putopis', '6+'], ['Tajne planine', '12+'], ['Životinje noću', '6+']] }),
  // ---- Deo 2 — kanali po izboru (3)
  k({ id: 'doma-tv', naziv: 'Doma TV', zemljaPorekla: 'Hrvatska', zanr: 'Serije', deo: 'po-izboru', ulogaUPrici: 'glavni-po-izboru', nedostupanU: ['RS'], gledanjeUnazad: true,
    emisije: [['Kuća na obali', '12+'], ['Susedi', '12+'], ['Povratak u selo', '12+']] }),
  k({ id: 'arena-sport-1', naziv: 'Arena Sport 1', zemljaPorekla: 'Srbija', zanr: 'Sport', deo: 'po-izboru', logotip: 'arena-sport',
    emisije: [['Studio uživo', '6+'], ['Utakmica večeri', '6+'], ['Sportski pregled', '6+']] }),
  k({ id: 'superstar-tv', naziv: 'Superstar TV', zemljaPorekla: 'Srbija', zanr: 'Zabava', deo: 'po-izboru',
    emisije: [['Domaća večera', '6+'], ['Veliki kviz', '6+'], ['Nedeljni gosti', '12+']] }),
  // ---- Deo 3 — paketi (10, po dva kanala u paketu)
  k({ id: 'rts-1', naziv: 'RTS 1', zemljaPorekla: 'Srbija', zanr: 'Opšti program', deo: 'paket', paket: 'srbija', gledanjeUnazad: true,
    emisije: [['Dnevni program', '6+'], ['Večernja serija', '12+'], ['Nedeljni film', '12+']] }),
  k({ id: 'prva', naziv: 'Prva', zemljaPorekla: 'Srbija', zanr: 'Opšti program', deo: 'paket', paket: 'srbija', logotip: 'prva', gledanjeUnazad: true,
    emisije: [['Jutro za sve', '6+'], ['Domaći film večeri', '12+'], ['Zabavna noć', '12+']] }),
  k({ id: 'hrt-1', naziv: 'HRT 1', zemljaPorekla: 'Hrvatska', zanr: 'Opšti program', deo: 'paket', paket: 'hrvatska', gledanjeUnazad: true,
    emisije: [['Dnevni magazin', '6+'], ['Obiteljska serija', '12+'], ['Subotnji film', '12+']] }),
  k({ id: 'rtl', naziv: 'RTL', zemljaPorekla: 'Hrvatska', zanr: 'Opšti program', deo: 'paket', paket: 'hrvatska', logotip: 'rtl', gledanjeUnazad: true,
    emisije: [['Zabavni magazin', '6+'], ['Domaća sapunica', '12+'], ['Večernji kviz', '6+']] }),
  k({ id: 'bht-1', naziv: 'BHT 1', zemljaPorekla: 'Bosna i Hercegovina', zanr: 'Opšti program', deo: 'paket', paket: 'bih',
    emisije: [['Program za porodicu', '6+'], ['Kulturni pregled', '12+'], ['Večernji film', '12+']] }),
  k({ id: 'ftv', naziv: 'FTV', zemljaPorekla: 'Bosna i Hercegovina', zanr: 'Opšti program', deo: 'paket', paket: 'bih', gledanjeUnazad: true,
    emisije: [['Večernja zabava', '6+'], ['Domaća serija', '12+'], ['Nedeljni koncert', '6+']] }),
  k({ id: 'prva-max', naziv: 'Prva Max', zemljaPorekla: 'Srbija', zanr: 'Film', deo: 'paket', paket: 'film',
    emisije: [['Premijera nedelje', '12+'], ['Klasik u povodu', '12+'], ['Kasni film', '16+']] }),
  k({ id: 'cinestar-tv-premiere-1', naziv: 'CineStar Premiere 1', zemljaPorekla: 'Hrvatska', zanr: 'Film', deo: 'paket', paket: 'film',
    emisije: [['Film večeri', '12+'], ['Avantura u gradu', '12+'], ['Noćna premijera', '16+']] }),
  k({ id: 'rtl-kockica', naziv: 'RTL Kockica', zemljaPorekla: 'Hrvatska', zanr: 'Deca', deo: 'paket', paket: 'deca',
    emisije: [['Crtani sat', '3+'], ['Priče za laku noć', '3+'], ['Mali istraživači', '6+']] }),
  k({ id: 'pink-kids', naziv: 'Pink Kids', zemljaPorekla: 'Srbija', zanr: 'Deca', deo: 'paket', paket: 'deca',
    emisije: [['Veseli crtići', '3+'], ['Igraonica', '3+'], ['Muzika za mališane', '3+']] }),
]

/** Izmišljen kanal vlasnice Vesne (V1, korak 8). VAN ponude gledaoca: nije u KANALI. */
export const FILMSKA_RIZNICA = { id: 'filmska-riznica', naziv: 'Filmska riznica' } as const

export function kanal(id: string): Kanal {
  const x = KANALI.find((c) => c.id === id)
  if (!x) throw new Error(`Nepoznat kanal: ${id}`)
  return x
}
export const imaKanal = (id: string): boolean => KANALI.some((c) => c.id === id)
