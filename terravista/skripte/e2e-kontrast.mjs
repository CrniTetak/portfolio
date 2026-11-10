// E2E KONTRAST (PLAN B8.2, talas 3): parovi boja iz dizajn/UI.md 2 (televizor, telefon, okvir) računaju se iz STVARNIH CSS promenljivih
// u pregledaču (ne iz teksta dokumenta), pa promena tokena koja pokvari kontrast obara proveru. Fokus-prsten: tri sloja
// (tamno–belo–tamno) u izračunatoj senci izabranog elementa, i na tapeti i na pločici kanala. Kontrast tekstа na stvarnim ekranima
// meri e2e-axe (pravilo color-contrast). Pokretanje (preview mora da radi): npm run e2e:kontrast
import { BASE, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { proveri, lista } = proveravac()

// [tekst, pozadina, najmanji odnos, opis]; 4,5 = običan tekst, 3 = veliki tekst/znakovi (UI.md 2)
const PAROVI = [
  ['--tv-ink', '--tv-bg', 4.5, 'TV: glavni tekst na pozadini'],
  ['--tv-ink', '--tv-surface', 4.5, 'TV: glavni tekst na kartici'],
  ['--tv-ink2', '--tv-bg', 4.5, 'TV: pomoćni tekst na pozadini'],
  ['--tv-ink2', '--tv-surface', 4.5, 'TV: pomoćni tekst na kartici'],
  ['--tv-ink3', '--tv-bg', 4.5, 'TV: najslabiji tekst na pozadini'],
  ['--tv-ink3', '--tv-surface', 4.5, 'TV: najslabiji tekst na kartici'],
  ['--dolina-svetla', '--tv-bg', 4.5, 'TV: „Pretplaćen“ na pozadini'],
  ['--dolina-svetla', '--tv-surface', 4.5, 'TV: „Pretplaćen“ na kartici'],
  ['--amber', '--tv-bg', 4.5, 'TV: oznaka „Reklama/Demo“ na pozadini'],
  ['--noc', '--tile', 4.5, 'TV: tekst na pločici kanala'],
  ['--noc', '--zemlja', 4.5, 'TV/okvir: dugme Noć na Zemlji (UI.md 2.2: 4,7:1)'],
  ['--noc', '--dolina-svetla', 4.5, 'TV: značka „Besplatno“'],
  ['--noc', '--pesak', 4.5, 'TV: značka cene'],
  ['--noc', '--amber', 4.5, 'TV/okvir: oznaka demoa, „Reklama“, podsetnik'],
  ['--zemlja', '--tv-bg', 3, 'TV: akcenat (traka napretka, veliki elementi)'],
  ['--ph-ink', '--pesak-svetao', 4.5, 'Telefon: glavni tekst na pozadini'],
  ['--ph-ink', '#ffffff', 4.5, 'Telefon: glavni tekst na beloj kartici'],
  ['--ph-ink2', '#ffffff', 4.5, 'Telefon: pomoćni tekst na beloj kartici'],
  ['--ph-ink2', '--pesak-svetao', 4.5, 'Telefon: pomoćni tekst na pozadini'],
  ['--ph-line', '#ffffff', 3, 'Telefon: ivica kontrola koje nose značenje'],
  ['#ffffff', '--dolina', 4.5, 'Telefon: beli tekst na glavnom dugmetu'],
  ['--dolina', '#ffffff', 4.5, 'Telefon: dolina kao tekst na beloj'],
  ['#ffffff', '--dolina-tamna', 4.5, 'Telefon: beli tekst na pritisnutom dugmetu'],
  ['--ph-ink', '--ph-readonly', 4.5, 'Telefon: prikaz-polje'],
  ['--pesak', '--noc', 4.5, 'Okvir: tekst trake priče'],
  ['--tv-ink2', '--noc', 4.5, 'Okvir: pomoćni tekst trake'],
]

const hex = (h) => {
  const s = h.trim().replace('#', '')
  const t = s.length === 3 ? [...s].map((c) => c + c).join('') : s
  return [0, 2, 4].map((i) => parseInt(t.slice(i, i + 2), 16))
}
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const odnos = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const o = await otvori({ sirina: 1366, visina: 768 })
const { page } = o
await page.goto(BASE + '#/tv/pocetna')
const vred = await page.evaluate(() => Object.fromEntries(['--tv-ink', '--tv-bg', '--tv-surface', '--tv-ink2', '--tv-ink3', '--dolina-svetla', '--amber', '--noc', '--tile', '--zemlja', '--pesak', '--ph-ink', '--pesak-svetao', '--ph-ink2', '--ph-line', '--dolina', '--dolina-tamna', '--ph-readonly'].map((k) => [k, getComputedStyle(document.documentElement).getPropertyValue(k).trim()])))
const boja = (t) => (t.startsWith('#') ? t : vred[t])
const lose = []
for (const [a, b, min, opis] of PAROVI) {
  const r = odnos(boja(a), boja(b))
  if (!(r >= min)) lose.push(`${opis}: ${r.toFixed(2)} < ${min}`)
}
proveri(`${PAROVI.length} parova boja iz UI.md 2 (izračunato iz stvarnih tokena) ispunjava najmanji kontrast`, lose.length === 0, lose.join(' | '))

// Fokus-prsten: tamno–belo–tamno u senci izabranog elementa (T2 kartica i pločica kanala u T5)
const prsten = async (hash) => {
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
  await sleep(900)
  return page.evaluate(() => {
    const el = document.querySelector('[data-tv-oblast] [data-izabran]')
    if (!el) return null
    const cs = getComputedStyle(el)
    return { sena: cs.boxShadow, obris: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor }
  })
}
for (const [hash, naziv] of [['#/tv/pocetna', 'T2 (tapeta)'], ['#/tv/kanali', 'T5 (pločica kanala)']]) {
  const r = await prsten(hash)
  const boje = r ? [...r.sena.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)].map((m) => m.slice(1, 4).map(Number).join(',')) : []
  const tamno = '5,9,15'
  const belo = '255,255,255'
  // slojevi senke: tamno, belo, tamno (pa senka ispod); dovoljno je da se redom pojave sva tri
  const i1 = boje.indexOf(tamno)
  const i2 = boje.indexOf(belo, i1 + 1)
  const i3 = i2 >= 0 ? boje.indexOf(tamno, i2 + 1) : -1
  proveri(`fokus-prsten ${naziv}: tamno–belo–tamno, vidljiv bez oslanjanja na boju brenda`, i1 >= 0 && i2 > i1 && i3 > i2, r ? r.sena.slice(0, 160) : 'nema izabranog elementa')
}
await o.browser.close()
process.exit(izvestaj('e2e-kontrast', lista, o.problemi, o.spoljni) ? 0 : 1)
