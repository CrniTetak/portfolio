// KORISNICI (UX 7.1): 40 građana u Beogradu + 11 iz regiona + moderatorka. Sve izmišljeno, lokalna neutralna imena.
// Ulazni podaci „na početku priče“. Poeni, razmene i recenzije koje se menjaju kroz priču izvode se u svet.ts.
//
// Recenzije se čuvaju kao RASPODELA ocena (koliko petica, četvorki i trojki). Prosek se uvek računa iz nje,
// pa prikazana ocena ne može da odstupi od stvarnih recenzija (pravilo: ocena = zaokružen prosek).
import type { OpstinaId } from './opstine'

export type Ocene = { 5: number; 4: number; 3: number }

export type Korisnik = {
  /** Korisničko ime (npr. ana_zvz84). */
  id: string
  /** Kratak ključ za unos oglasa ('ana', 'marko', 'luka'…). */
  kljuc: string
  ime: string
  opstina: OpstinaId
  /** Verifikovan od početka (Ana postaje verifikovana u koraku 1). */
  verifikovan: boolean
  razmene: number
  ocene: Ocene
  poeni: number
  uloga: 'ugao' | 'sporedni' | 'prijavljeni' | 'recenzent' | 'pomocni'
}

const u = (id: string, kljuc: string, ime: string, opstina: OpstinaId, verifikovan: boolean, razmene: number, ocene: [number, number, number], poeni: number, uloga: Korisnik['uloga']): Korisnik => ({
  id,
  kljuc,
  ime,
  opstina,
  verifikovan,
  razmene,
  ocene: { 5: ocene[0], 4: ocene[1], 3: ocene[2] },
  poeni,
  uloga,
})

/** Korisnička imena likova priče: JEDINO mesto gde su napisana (ekrani ih uzimaju odavde, PK5). */
export const ANA_ID = 'ana_zvz84'
export const MARKO_ID = 'marko_voz77'
export const JOVANA_ID = 'jovana_vra91'

/** Imenovani korisnici iz UX 7.1. */
// Bojan: UX kaže 7 recenzija i prosek 4,5, što sa celim zvezdicama nije moguće (7 ocena daju 4,4 ili 4,6). Uzeto 4,6 (4 × 5 + 3 × 4); vidi PLAN.md B14.
const IMENOVANI: Korisnik[] = [
  u(ANA_ID, 'ana', 'Ana', 'zvz', false, 0, [0, 0, 0], 0, 'ugao'),
  u(MARKO_ID, 'marko', 'Marko', 'voz', true, 18, [8, 3, 0], 35, 'ugao'),
  u(JOVANA_ID, 'jovana', 'Jovana', 'vra', true, 46, [24, 5, 0], 60, 'sporedni'),
  u('nenad_pal65', 'nenad', 'Nenad', 'pal', true, 4, [1, 1, 0], 10, 'prijavljeni'),
  u('mila_cuk88', 'mila', 'Mila', 'cuk', true, 22, [9, 5, 0], 40, 'recenzent'),
  u('stefan_nbg93', 'stefan', 'Stefan', 'nbg', true, 9, [2, 3, 0], 15, 'recenzent'),
  u('irena_zem80', 'irena', 'Irena', 'zem', true, 31, [18, 2, 0], 110, 'recenzent'),
  u('bojan_rak72', 'bojan', 'Bojan', 'rak', true, 12, [4, 3, 0], 25, 'recenzent'),
  u('sanja_sur85', 'sanja', 'Sanja', 'sur', true, 5, [2, 1, 0], 10, 'recenzent'),
]

/** 31 pomoćni korisnik: razmene 1–20, recenzije ≤ razmene, prikazana ocena 4,3–4,9 (ili bez recenzija). */
const POMOCNI: Korisnik[] = [
  u('luka_zem89', 'luka', 'Luka', 'zem', true, 12, [8, 3, 0], 25, 'pomocni'),
  u('maja_nbg92', 'maja', 'Maja', 'nbg', true, 7, [4, 2, 0], 20, 'pomocni'),
  u('ognjen_stg81', 'ognjen', 'Ognjen', 'stg', true, 15, [10, 4, 0], 45, 'pomocni'),
  u('tamara_sav90', 'tamara', 'Tamara', 'sav', true, 3, [1, 1, 0], 10, 'pomocni'),
  u('vuk_vra86', 'vuk', 'Vuk', 'vra', true, 19, [13, 5, 1], 65, 'pomocni'),
  u('nina_zvz94', 'nina', 'Nina', 'zvz', true, 8, [5, 2, 0], 30, 'pomocni'),
  u('petar_voz79', 'petar', 'Petar', 'voz', true, 20, [14, 5, 0], 80, 'pomocni'),
  u('dusan_pal83', 'dusan', 'Dušan', 'pal', true, 6, [3, 2, 0], 20, 'pomocni'),
  u('katarina_cuk88', 'katarina', 'Katarina', 'cuk', true, 11, [6, 4, 0], 35, 'pomocni'),
  u('filip_rak90', 'filip', 'Filip', 'rak', true, 2, [1, 1, 0], 15, 'pomocni'),
  u('milica_sur95', 'milica', 'Milica', 'sur', true, 4, [2, 1, 0], 10, 'pomocni'),
  u('nikola_zem77', 'nikola', 'Nikola', 'zem', true, 17, [9, 6, 2], 55, 'pomocni'),
  u('sofija_nbg99', 'sofija', 'Sofija', 'nbg', true, 9, [5, 3, 0], 25, 'pomocni'),
  u('uros_stg85', 'uros', 'Uroš', 'stg', true, 14, [9, 4, 0], 40, 'pomocni'),
  u('teodora_sav87', 'teodora', 'Teodora', 'sav', true, 5, [3, 1, 0], 15, 'pomocni'),
  u('lazar_vra91', 'lazar', 'Lazar', 'vra', true, 10, [6, 3, 0], 30, 'pomocni'),
  u('lena_zvz96', 'lena', 'Lena', 'zvz', true, 13, [7, 5, 0], 35, 'pomocni'),
  u('stevan_voz82', 'stevan', 'Stevan', 'voz', true, 16, [10, 5, 1], 50, 'pomocni'),
  u('radovan_pal74', 'radovan', 'Radovan', 'pal', true, 18, [12, 4, 0], 70, 'pomocni'),
  u('visnja_cuk80', 'visnja', 'Višnja', 'cuk', true, 7, [4, 2, 0], 20, 'pomocni'),
  u('djordje_rak88', 'djordje', 'Đorđe', 'rak', true, 1, [0, 0, 0], 20, 'pomocni'),
  u('aleksa_sur93', 'aleksa', 'Aleksa', 'sur', true, 9, [6, 2, 0], 30, 'pomocni'),
  u('danica_zem91', 'danica', 'Danica', 'zem', true, 12, [7, 4, 0], 35, 'pomocni'),
  u('mihailo_nbg84', 'mihailo', 'Mihailo', 'nbg', true, 20, [14, 5, 1], 90, 'pomocni'),
  u('ivana_stg87', 'ivana', 'Ivana', 'stg', true, 6, [4, 1, 0], 20, 'pomocni'),
  u('relja_sav99', 'relja', 'Relja', 'sav', true, 3, [1, 1, 0], 10, 'pomocni'),
  u('zorana_vra89', 'zorana', 'Zorana', 'vra', true, 15, [9, 5, 1], 45, 'pomocni'),
  u('bogdan_zvz82', 'bogdan', 'Bogdan', 'zvz', true, 8, [5, 2, 0], 25, 'pomocni'),
  u('mina_voz01', 'mina', 'Mina', 'voz', true, 4, [2, 2, 0], 15, 'pomocni'),
  u('veljko_pal76', 'veljko', 'Veljko', 'pal', true, 19, [12, 6, 1], 75, 'pomocni'),
  u('anja_cuk97', 'anja', 'Anja', 'cuk', true, 10, [6, 3, 0], 30, 'pomocni'),
]

/** Svih 40 građana u Beogradu. */
export const KORISNICI: Korisnik[] = [...IMENOVANI, ...POMOCNI]

export const KORISNIK_PO_ID: Record<string, Korisnik> = Object.fromEntries(KORISNICI.map((k) => [k.id, k]))
export const KORISNIK_PO_KLJUCU: Record<string, Korisnik> = Object.fromEntries(KORISNICI.map((k) => [k.kljuc, k]))

/** Region (11 korisnika, po jedan iz svakog grada; samo ime i grad). */
export type RegionKorisnik = { id: string; kljuc: string; ime: string; grad: string; drzava: string }
export const REGION_KORISNICI: RegionKorisnik[] = [
  { id: 'goran_nis78', kljuc: 'nis', ime: 'Goran', grad: 'Niš', drzava: 'Srbija' },
  { id: 'jelena_ns88', kljuc: 'ns', ime: 'Jelena', grad: 'Novi Sad', drzava: 'Srbija' },
  { id: 'milan_som71', kljuc: 'som', ime: 'Milan', grad: 'Sombor', drzava: 'Srbija' },
  { id: 'emina_sar90', kljuc: 'sar', ime: 'Emina', grad: 'Sarajevo', drzava: 'Bosna i Hercegovina' },
  { id: 'adnan_zen83', kljuc: 'zen', ime: 'Adnan', grad: 'Zenica', drzava: 'Bosna i Hercegovina' },
  { id: 'marija_zag86', kljuc: 'zag', ime: 'Marija', grad: 'Zagreb', drzava: 'Hrvatska' },
  { id: 'tomislav_zad79', kljuc: 'zad', ime: 'Tomislav', grad: 'Zadar', drzava: 'Hrvatska' },
  { id: 'mato_dub84', kljuc: 'dub', ime: 'Mato', grad: 'Dubrovnik', drzava: 'Hrvatska' },
  { id: 'darko_sko81', kljuc: 'sko', ime: 'Darko', grad: 'Skoplje', drzava: 'Severna Makedonija' },
  { id: 'violeta_kum77', kljuc: 'kum', ime: 'Violeta', grad: 'Kumanovo', drzava: 'Severna Makedonija' },
  { id: 'arben_tir85', kljuc: 'tir', ime: 'Arben', grad: 'Tirana', drzava: 'Albanija' },
]
export const REGION_PO_KLJUCU: Record<string, RegionKorisnik> = Object.fromEntries(REGION_KORISNICI.map((k) => [k.kljuc, k]))

/** Ukupan broj recenzija i zbir ocena iz raspodele. */
export const brojRecenzija = (o: Ocene): number => o[5] + o[4] + o[3]
export const zbirOcena = (o: Ocene): number => o[5] * 5 + o[4] * 4 + o[3] * 3
