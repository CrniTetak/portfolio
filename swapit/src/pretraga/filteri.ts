// Filteri pretrage (P4, P5, P7) kao ČISTE funkcije nad listom oglasa iz svet(): ne menjaju stanje i ne zovu mrežu. Izbor filtera putuje kroz link
// (?q=…&tip=rr,ru&nacin=poeni…), pa osvežavanje i „Nazad“ čuvaju rezultat. Radijus je u demou samo prikaz (UX 12, stavka 5): filtrira se grad i zemlja.
import { slikaOglasa } from '../podaci/slikeOglasa'
import type { Nacin, Oglas } from '../scenario/oglasi'
import { OPSTINA_PO_ID, type OpstinaId } from '../scenario/opstine'
import { tipRazmene } from '../scenario/svet'
import { odgovara, odgovaraTekstu } from './pretrazi'

export const GRAD_PODRAZUMEVAN = 'Beograd'
export const ZEMLJA_PODRAZUMEVANA = 'Srbija'
export const SVI_GRADOVI = 'Svi gradovi'
export const SVE_ZEMLJE = 'Sve zemlje'
export type Sortiranje = 'najblize' | 'najnovije' | 'poklapanje'
export const SORTIRANJA: { v: Sortiranje; naziv: string }[] = [
  { v: 'najblize', naziv: 'Najbliže' },
  { v: 'najnovije', naziv: 'Najnovije' },
  { v: 'poklapanje', naziv: 'Poklapanje sa listom želja' },
]

export type Filteri = {
  tip: string[]
  nacin: Nacin | ''
  kat: string
  grad: string
  zemlja: string
  stanje: string
  slika: boolean
  dostava: boolean
  licno: boolean
  odmah: boolean
  ko: '' | 'gradjanin' | 'firma'
  sort: Sortiranje
}

export const PRAZNI_FILTERI: Filteri = { tip: [], nacin: '', kat: '', grad: GRAD_PODRAZUMEVAN, zemlja: ZEMLJA_PODRAZUMEVANA, stanje: '', slika: false, dostava: false, licno: false, odmah: false, ko: '', sort: 'najblize' }

const jeNacin = (x: string | null): x is Nacin => x === 'razmena' || x === 'poeni' || x === 'poklon'
const jeSort = (x: string | null): x is Sortiranje => x === 'najblize' || x === 'najnovije' || x === 'poklapanje'

/** Upit i filteri iz linka (nepoznate vrednosti se ignorišu, ništa se ne ruši). */
export function izLinka(q: URLSearchParams): { upit: string; filteri: Filteri } {
  const f = PRAZNI_FILTERI
  const ko = q.get('ko')
  return {
    upit: (q.get('q') ?? '').slice(0, 40),
    filteri: {
      tip: (q.get('tip') ?? '').split(',').filter((x) => /^[riu][riu]$/.test(x)),
      nacin: jeNacin(q.get('nacin')) ? (q.get('nacin') as Nacin) : f.nacin,
      kat: q.get('kat') ?? f.kat,
      grad: q.get('grad') ?? f.grad,
      zemlja: q.get('zemlja') ?? f.zemlja,
      stanje: q.get('stanje') ?? f.stanje,
      slika: q.get('slika') === '1',
      dostava: q.get('dostava') === '1',
      licno: q.get('licno') === '1',
      odmah: q.get('odmah') === '1',
      ko: ko === 'gradjanin' || ko === 'firma' ? ko : f.ko,
      sort: jeSort(q.get('sort')) ? (q.get('sort') as Sortiranje) : f.sort,
    },
  }
}

/** Upit za link: samo vrednosti koje se razlikuju od podrazumevanih. */
export function uLink(upit: string, f: Filteri): Record<string, string> {
  const izlaz: Record<string, string> = {}
  if (upit.trim()) izlaz.q = upit.trim()
  if (f.tip.length) izlaz.tip = f.tip.join(',')
  if (f.nacin) izlaz.nacin = f.nacin
  if (f.kat) izlaz.kat = f.kat
  if (f.grad !== GRAD_PODRAZUMEVAN) izlaz.grad = f.grad
  if (f.zemlja !== ZEMLJA_PODRAZUMEVANA) izlaz.zemlja = f.zemlja
  if (f.stanje) izlaz.stanje = f.stanje
  if (f.slika) izlaz.slika = '1'
  if (f.dostava) izlaz.dostava = '1'
  if (f.licno) izlaz.licno = '1'
  if (f.odmah) izlaz.odmah = '1'
  if (f.ko) izlaz.ko = f.ko
  if (f.sort !== PRAZNI_FILTERI.sort) izlaz.sort = f.sort
  return izlaz
}

/** Koliko je filtera podešeno (bez sortiranja). */
export function brojAktivnih(f: Filteri): number {
  return (
    (f.tip.length ? 1 : 0) +
    (f.nacin ? 1 : 0) +
    (f.kat ? 1 : 0) +
    (f.grad !== GRAD_PODRAZUMEVAN ? 1 : 0) +
    (f.zemlja !== ZEMLJA_PODRAZUMEVANA ? 1 : 0) +
    (f.stanje ? 1 : 0) +
    [f.slika, f.dostava, f.licno, f.odmah].filter(Boolean).length +
    (f.ko ? 1 : 0)
  )
}

const zemljaOglasa = (o: Oglas): string => o.drzava ?? ZEMLJA_PODRAZUMEVANA

/** Da li oglas prolazi sve podešene filtere. */
export function prolazi(o: Oglas, f: Filteri): boolean {
  if (f.tip.length && !f.tip.includes(tipRazmene(o) ?? '')) return false
  if (f.nacin && o.nacin !== f.nacin) return false
  if (f.kat && o.kat !== f.kat) return false
  if (f.grad !== SVI_GRADOVI && o.grad !== f.grad) return false
  if (f.zemlja !== SVE_ZEMLJE && zemljaOglasa(o) !== f.zemlja) return false
  if (f.stanje && o.stanje !== f.stanje) return false
  if (f.slika && !(o.vrsta === 'roba' && slikaOglasa(o.id))) return false
  if (f.dostava && !(o.vrsta === 'roba' && o.preuzimanje === 'licno-kurir')) return false
  if (f.licno && o.vrsta !== 'roba') return false
  if (f.odmah && o.aukcija) return false
  if (f.ko === 'gradjanin' && o.firma) return false
  if (f.ko === 'firma' && !o.firma) return false
  return true
}

export const primeni = (oglasi: Oglas[], f: Filteri): Oglas[] => oglasi.filter((o) => prolazi(o, f))

/** Rastojanje između dve opštine na ilustrativnoj mapi (u procentima); oglasi van Beograda su na kraju. */
function rastojanje(a: OpstinaId | undefined, b: OpstinaId | undefined): number {
  if (!a || !b) return Infinity
  const x = OPSTINA_PO_ID[a]
  const y = OPSTINA_PO_ID[b]
  return Math.hypot(x.x - y.x, x.y - y.y)
}

/**
 * Redosled: najviše dva istaknuta oglasa (čiji naslov ili opis odgovara upitu) idu prvi (P5), pa izabrano sortiranje (UX 6.3 P5). „Najbliže“ računa udaljenost opštine od gledaoca,
 * „Najnovije“ stavlja novije (kasnije objavljene) pre starijih, „Poklapanje“ ističe oglase koji odgovaraju listi želja gledaoca.
 */
export function poredaj(oglasi: Oglas[], sort: Sortiranje, kontekst: { opstina?: OpstinaId; zelje: string[]; upit?: string }): Oglas[] {
  const sa = oglasi.map((o, i) => ({ o, i }))
  if (sort === 'najblize') sa.sort((a, b) => rastojanje(kontekst.opstina, a.o.opstina) - rastojanje(kontekst.opstina, b.o.opstina) || a.i - b.i)
  else if (sort === 'najnovije') sa.sort((a, b) => b.i - a.i)
  else {
    const pogodak = (o: Oglas) => (kontekst.zelje.some((z) => odgovara(o, z)) ? 0 : 1)
    sa.sort((a, b) => pogodak(a.o) - pogodak(b.o) || a.i - b.i)
  }
  const lista = sa.map((x) => x.o)
  // D3: istaknuti idu prvi samo kad NASLOV ili OPIS odgovara upitu (ne preko kategorije); bez upita nema istaknutog reda
  const istaknuti = lista.filter((o) => o.istaknuto && !!kontekst.upit?.trim() && odgovaraTekstu(o, kontekst.upit)).slice(0, 2)
  return [...istaknuti, ...lista.filter((o) => !istaknuti.includes(o))]
}

/** Rezultat pretrage: upit i filteri zajedno. Bez upita i bez filtera nema rezultata (P5 tada pokazuje uputstvo). */
export function rezultati(oglasi: Oglas[], upit: string, f: Filteri, kontekst: { opstina?: OpstinaId; zelje: string[] }): Oglas[] {
  const imaUpit = upit.trim().length > 0
  if (!imaUpit && brojAktivnih(f) === 0) return []
  const osnova = imaUpit ? oglasi.filter((o) => odgovara(o, upit)) : oglasi
  return poredaj(primeni(osnova, f), f.sort, { ...kontekst, upit })
}
