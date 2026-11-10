// SNIMCI ekrana (PLAN B8.2): laptop 1366 i 1920, telefon uspravno i vodoravno. Piše u _snimci/ (van git-a).
// Pokretanje (preview mora da radi): npm run snimci   |   MSYS_NO_PATHCONV=1 node skripte/snimci.mjs [prefiks]
import { mkdirSync } from 'node:fs'
import { BASE, otvori, sleep, izvestaj, proveravac } from './_zajednicko.mjs'

const IZLAZ = new URL('../_snimci/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(IZLAZ, { recursive: true })
const prefiks = process.argv[2] ?? 'faza0'

const idi = async (page, hash) => {
  await page.goto(BASE + hash)
  if (!hash.includes('#/tv')) return
  await sleep(250)
}
const snimi = async (page, ime) => {
  await sleep(200)
  await page.screenshot({ path: `${IZLAZ}${prefiks}-${ime}.png` })
}

const { proveri, lista } = proveravac()
let problemi = []
let spoljni = []

// ---- laptop 1366 × 768 i 1920 × 1080
for (const [sirina, visina] of [[1366, 768], [1920, 1080]]) {
  const { browser, page, problemi: p, spoljni: s } = await otvori({ sirina, visina })
  await page.goto(BASE + '#/tv/pocetna')
  await snimi(page, `laptop-${sirina}-t2-pocetna`)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowRight')
  await snimi(page, `laptop-${sirina}-t2-red-fokus`)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowRight')
  await snimi(page, `laptop-${sirina}-t2-logotipi-po-izboru`)
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await snimi(page, `laptop-${sirina}-t2-viasat-i-prva`)
  await idi(page, '#/tv/vodic')
  await snimi(page, `laptop-${sirina}-t3-vodic`)
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown')
  await snimi(page, `laptop-${sirina}-t3-vodic-dole`)
  await idi(page, '#/tv/kanali')
  await snimi(page, `laptop-${sirina}-t5-kanali`)
  await idi(page, '#/tv/pocetna?tel=/narudzba/doma-tv')
  await snimi(page, `laptop-${sirina}-t2-sa-telefonom`)
  await idi(page, '#/tv/pocetna')
  await page.click('[data-traka] button[aria-label="Uputstvo: kako se upravlja"]')
  await sleep(150)
  await snimi(page, `laptop-${sirina}-kako-se-upravlja`)
  await idi(page, '#/')
  await snimi(page, `laptop-${sirina}-uvod`)
  proveri(`laptop ${sirina}: nema greške ni spoljnog poziva`, p.length === 0 && s.length === 0, [...p, ...s].join(' | '))
  problemi.push(...p); spoljni.push(...s)
  await browser.close()
}

// ---- telefon uspravno (390 × 844)
{
  const { browser, page, problemi: p, spoljni: s } = await otvori({ sirina: 390, visina: 844, telefon: true })
  await page.goto(BASE + '#/tv/pocetna')
  await snimi(page, 'telefon-390-tv-uspravno')
  await idi(page, '#/tv/pocetna?uredjaj=tel&tel=/pocetna')
  await snimi(page, 'telefon-390-telefon')
  await idi(page, '#/tv/pocetna')
  await page.click('[data-traka] button[aria-label="Meni demoa"]')
  await snimi(page, 'telefon-390-meni')
  problemi.push(...p); spoljni.push(...s)
  await browser.close()
}
// ---- telefon vodoravno (844 × 390)
{
  const { browser, page, problemi: p, spoljni: s } = await otvori({ sirina: 844, visina: 390, telefon: true })
  await page.goto(BASE + '#/tv/pocetna')
  await snimi(page, 'telefon-844-tv-vodoravno')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await snimi(page, 'telefon-844-tv-vodoravno-red')
  problemi.push(...p); spoljni.push(...s)
  await browser.close()
}
console.log('Snimci su u', IZLAZ)
process.exit(izvestaj('snimci', lista, problemi, spoljni) ? 0 : 1)
