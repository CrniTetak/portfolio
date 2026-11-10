// SKROL i MERENJE televizora (PLAN B5.2): pomeranje reda i ekrana da izabrani element bude cela vidljiv u bezbednoj zoni,
// i merenje elementa u „TV jedinicama“ za geometriju. Jedini deo navigacije koji dodiruje DOM.
//
// Sve mere su u TV jedinicama (neumanjeno platno). Platno je umanjeno CSS transformacijom (skaliranje), pa se odnos
// „stvarni pikseli / TV jedinice“ računa iz platna. Izabrani element je uvećan 6 % oko središta, zato se veličina čita iz
// offsetWidth/offsetHeight (ne menja se transformacijom), a središte iz getBoundingClientRect (uvećanje ga ne pomera).
import type { Pravougaonik } from './geometrija'

/** Koliko mora da ostane slobodno oko izabranog elementa (prsten 11 + uvećanje 6 %, do 27 kod najšire kartice), u TV jedinicama. */
export const MARGINA = 40
/** Vodoravno (redovi): veća margina da izabrani element ne dođe u zonu bledenja ivice reda. */
export const MARGINA_VODORAVNO = 64

function platno(el: Element): HTMLElement | null {
  return el.closest<HTMLElement>('[data-tv-platno]')
}

/** Stvarni pikseli po TV jedinici (skala umanjenja platna). */
export function skalaPlatna(el: Element): number {
  const p = platno(el)
  if (!p || p.offsetWidth === 0) return 1
  return p.getBoundingClientRect().width / p.offsetWidth
}

/** Mera elementa u TV jedinicama, u odnosu na gornji levi ugao platna. */
export function izmeri(el: HTMLElement): Pravougaonik {
  const p = platno(el)
  const s = skalaPlatna(el)
  const r = el.getBoundingClientRect()
  const o = p ? p.getBoundingClientRect() : { left: 0, top: 0 }
  const sirina = el.offsetWidth
  const visina = el.offsetHeight
  const cx = (r.left + r.width / 2 - o.left) / s
  const cy = (r.top + r.height / 2 - o.top) / s
  return { x: cx - sirina / 2, y: cy - visina / 2, sirina, visina }
}

/** Položaj elementa unutar sadržaja kontejnera (TV jedinice), nezavisno od trenutnog skrola. */
function uSadrzaju(el: HTMLElement, kont: HTMLElement, s: number): { x: number; y: number; sirina: number; visina: number } {
  const r = el.getBoundingClientRect()
  const c = kont.getBoundingClientRect()
  const sirina = el.offsetWidth
  const visina = el.offsetHeight
  const cx = (r.left + r.width / 2 - c.left) / s - kont.clientLeft + kont.scrollLeft
  const cy = (r.top + r.height / 2 - c.top) / s - kont.clientTop + kont.scrollTop
  return { x: cx - sirina / 2, y: cy - visina / 2, sirina, visina }
}

/** Zadnja grupa (red/sekcija) koja je poravnata u kontejneru — da kretanje unutar iste grupe ne „preskače“ prikaz. */
const poslednjaGrupa = new WeakMap<HTMLElement, Element | null>()

/** Čista računica: novi skrol da [od, do] bude u prozoru dužine `prozor` uz marginu; minimalan pomak. */
export function skrolDoVidljivog(skrol: number, od: number, do_: number, prozor: number, margina = MARGINA): number {
  if (od - margina < skrol) return Math.max(0, od - margina)
  if (do_ + margina > skrol + prozor) return Math.max(0, do_ + margina - prozor)
  return skrol
}

/**
 * Vodoravno: red (`data-tv-skrol~="x"`) se pomera da izabrani element bude ceo vidljiv.
 * Uspravno: ekran (`data-tv-skrol~="y"`) se pomera po redovima — kad se pređe u drugu grupu (`data-tv-grupa`), njen vrh se poravna
 * sa vrhom vidljivog dela; unutar iste grupe pomak je minimalan (da dugačak vodič ne skače).
 */
export function osiguraVidljivost(el: HTMLElement): void {
  const s = skalaPlatna(el)
  const red = el.closest<HTMLElement>('[data-tv-skrol~="x"]')
  if (red) {
    const m = uSadrzaju(el, red, s)
    // data-tv-levo = širina lepljive kolone (vodič); element ne sme da ostane ispod nje
    const levo = Number(red.dataset.tvLevo ?? 0)
    const nov = skrolDoVidljivog(red.scrollLeft + levo, m.x, m.x + m.sirina, red.clientWidth - levo, MARGINA_VODORAVNO) - levo
    red.scrollLeft = Math.max(0, nov)
    azurirajMasku(red)
  }
  const ekran = el.closest<HTMLElement>('[data-tv-skrol~="y"]')
  if (ekran) {
    const grupa = el.closest<HTMLElement>('[data-tv-grupa]')
    const m = uSadrzaju(el, ekran, s)
    let cilj = ekran.scrollTop
    if (grupa && grupa !== poslednjaGrupa.get(ekran)) {
      cilj = Math.max(0, uSadrzaju(grupa, ekran, s).y - MARGINA / 2)
      poslednjaGrupa.set(ekran, grupa)
    }
    cilj = skrolDoVidljivog(cilj, m.y, m.y + m.visina, ekran.clientHeight)
    ekran.scrollTop = Math.min(cilj, Math.max(0, ekran.scrollHeight - ekran.clientHeight))
  }
}

/**
 * Red koji ima još sadržaja levo/desno meko bledi na toj ivici (kartica koja „viri“ izgleda kao nastavak, a ne kao greška).
 * Postavlja data-vise-pre / data-vise-posle; CSS crta masku.
 */
export function azurirajMasku(red: HTMLElement): void {
  const pre = red.scrollLeft > 2
  const posle = red.scrollLeft + red.clientWidth < red.scrollWidth - 2
  red.dataset.visePre = pre ? 'da' : 'ne'
  red.dataset.visePosle = posle ? 'da' : 'ne'
}

/** Zaboravlja poslednju grupu (pri novom ekranu). */
export function zaboraviGrupu(ekran: HTMLElement): void {
  poslednjaGrupa.delete(ekran)
}
