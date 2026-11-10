// Pomoćna skripta za razvoj: više snimaka ekrana odjednom (jedan pregledač).
// Upotreba: node skripte/snimci.mjs "ruta|sirina|visina|korak|odradjeno|rezim|ime[|cela]" ...
// Zahteva `npm run preview` (port 4190). Snimci idu u e2e-slike/ (van git-a).
import { mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4190/'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync('e2e-slike', { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const greske = []
for (const spec of process.argv.slice(2)) {
  const [ruta, sirina, visina, korak = '1', odradjeno = '0', rezim = 'guided', ime = 'snimak', cela = '', grana = 'approved'] = spec.split('|')
  const page = await browser.newPage()
  if (process.env.DBG) page.on('framenavigated', (f) => console.log('nav', f.url()))
  page.on('pageerror', (e) => greske.push(`${ime} pageerror: ${e.message}`))
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) greske.push(`${ime} console.${m.type()}: ${m.text()}`) })
  await page.setViewport({ width: +sirina, height: +visina, deviceScaleFactor: 1, isMobile: +sirina < 720, hasTouch: +sirina < 720 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate((k, o, r, g) => {
    sessionStorage.setItem('goaltocart.demo.v1', JSON.stringify({ verzija: 1, korak: +k, odradjeno: +o, grana: g, rezim: r, vidjenUvodFree: true }))
  }, korak, odradjeno, rezim, grana)
  await page.goto(BASE + '#' + ruta, { waitUntil: 'networkidle0' })
  await page.reload({ waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 250))
  if (process.env.DBG) console.log(ime, await page.evaluate(() => location.href + ' | ' + document.querySelector('[data-ekran]')?.getAttribute('data-ekran')))
  await page.screenshot({ path: `e2e-slike/${ime}.png`, fullPage: cela === 'cela' })
  await page.close()
}
if (greske.length) console.log('GRESKE:\n' + [...new Set(greske)].join('\n'))
await browser.close()
console.log('gotovo')
