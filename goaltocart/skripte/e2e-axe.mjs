// Automatska provera pristupačnosti (axe-core, B7.5). Biblioteka se ubacuje u stranu iz node_modules (bez mreže) i NE ulazi u build.
// Prolaz = nema nalaza težine "serious" i "critical". Nalazi težine "moderate" i "minor" se samo prijavljuju.
// Pokretanje:  npm run build && npm run preview   pa   node skripte/e2e-axe.mjs
import { readFileSync } from 'node:fs'
import { BASE, KLJUC, otvori, sleep } from './_zajednicko.mjs'

const axeKod = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')

const EKRANI = [
  ['selling', '/', 1, 0], // C1 se otvara bez uloge
  ['selling', '/selling/dashboard', 4, 0],
  ['selling', '/selling/offers', 1, 0],
  ['selling', '/selling/rules-check', 3, 0],
  ['selling', '/selling/signing', 4, 0],
  ['selling', '/selling/payouts', 7, 0],
  ['selling', '/selling/installments', 8, 5],
  ['selling', '/selling/financing', 8, 2],
  ['selling', '/selling/approvals', 8, 3],
  ['selling', '/selling/exceptions', 9, 1],
  ['buying', '/buying/dashboard', 5, 0],
  ['buying', '/buying/offers', 1, 1],
  ['buying', '/buying/personal-terms', 2, 1],
  ['buying', '/buying/secure-funds', 5, 3],
  ['buying', '/buying/payments', 8, 5],
  ['player', '/player/home', 4, 0],
  ['player', '/player/contract', 2, 1],
  ['player', '/player/share', 8, 8],
  ['player', '/player/medical', 2, 2],
  ['player', '/player/documents', 4, 2],
  ['player', '/player/receipt', 7, 1],
  ['player', '/player/privacy', 3, 0],
  ['player', '/player/exception', 9, 1],
  ['agent', '/agent/home', 2, 1],
  ['agent', '/agent/deal', 2, 1],
  ['agent', '/agent/personal-terms', 2, 1],
  ['agent', '/agent/commission', 7, 1],
  ['agent', '/agent/documents', 4, 3],
  ['agent', '/agent/licence', 3, 1],
  ['agent', '/agent/exception', 9, 1],
  ['financier', '/financier/dashboard', 8, 1],
  ['financier', '/financier/receivables', 8, 1],
  ['financier', '/financier/receivables/main', 8, 1],
  ['financier', '/financier/receivables/main/offer', 8, 1],
  ['financier', '/financier/offers', 8, 5],
  ['financier', '/financier/positions', 8, 8],
  ['financier', '/financier/preview', 9, 0],
  ['selling', '/selling/registration', 6, 2, 'rejected'],
  ['selling', '/selling/exceptions', 7, 0, 'rejected'],
  ['selling', '/selling/dashboard', 9, 1, 'rejected'],
  ['selling', '/selling/deal', 8, 0, 'rejected'],
  ['buying', '/buying/secure-funds', 7, 1, 'rejected'],
  ['buying', '/buying/exceptions', 9, 0, 'rejected'],
  ['player', '/player/home', 8, 0, 'rejected'],
  ['player', '/player/exception', 7, 1, 'rejected'],
  ['agent', '/agent/commission', 7, 1, 'rejected'],
  ['agent', '/agent/exception', 8, 0, 'rejected'],
  ['financier', '/financier/dashboard', 8, 0, 'rejected'],
  ['selling', '/about', 1, 0],
  ['selling', '/selling/transfers/player-c', 3, 0],
]

const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 900 })
const sve = []

async function izvrsi(oznaka) {
  await page.evaluate(axeKod)
  const rez = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { resultTypes: ['violations'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, opis: v.help, cvorovi: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').split('\n').slice(0, 3).join(' | ')) }))
  })
  for (const v of rez) sve.push({ oznaka, ...v })
}

for (const [sirina, visina, rezimi] of [[1280, 900, ['guided', 'free']], [360, 640, ['guided', 'free']]]) {
  await page.setViewport({ width: sirina, height: visina, deviceScaleFactor: 1, isMobile: sirina < 720, hasTouch: sirina < 720 })
  for (const rezim of rezimi) {
    for (const [, ruta, korak, odr, grana = 'approved'] of EKRANI) {
      await page.goto(BASE, { waitUntil: 'networkidle0' })
      await page.evaluate((k, kor, o, r, g) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: kor, odradjeno: o, grana: g, rezim: r, vidjenUvodFree: false })), KLJUC, korak, odr, rezim, grana)
      await page.goto(BASE + '#' + ruta, { waitUntil: 'networkidle0' })
      await page.reload({ waitUntil: 'networkidle0' })
      await sleep(100)
      await izvrsi(`${sirina}px ${rezim} ${ruta}`)
      // panel/meni na telefonu
      if (sirina < 720 && ruta === '/selling/offers') {
        await page.evaluate((rezim) => (rezim === 'guided' ? document.querySelector('[data-pocetak-panela]') : document.querySelector('.step-pill-top'))?.click(), rezim)
        await sleep(150)
        await izvrsi(`${sirina}px ${rezim} ${ruta} (panel)`)
      }
    }
  }
}
// dijalog Restart
await page.setViewport({ width: 1280, height: 900 })
await page.goto(BASE + '#/selling/dashboard', { waitUntil: 'networkidle0' })
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Restart demo'))?.click())
await sleep(200)
await izvrsi('Restart dijalog')

await browser.close()
const ozbiljni = sve.filter((v) => ['serious', 'critical'].includes(v.impact))
const grupe = new Map()
for (const v of sve) {
  const k = `${v.impact} · ${v.id}: ${v.opis}`
  if (!grupe.has(k)) grupe.set(k, { n: 0, primeri: new Set(), cvorovi: v.cvorovi })
  const g = grupe.get(k)
  g.n++
  if (g.primeri.size < 3) g.primeri.add(v.oznaka)
}
for (const [k, g] of grupe) console.log(`  ${k}  (${g.n}x)  npr. ${[...g.primeri].join(' | ')}\n      ${g.cvorovi.slice(0, 2).join('\n      ')}`)
console.log(`axe: ${EKRANI.length * 4} prolaza, nalaza ozbiljno/kritično: ${ozbiljni.length}, ukupno: ${sve.length}`)
if (problemi.length) console.log('Greške u konzoli:', [...new Set(problemi)])
if (spoljni.length) console.log('Spoljni zahtevi:', spoljni)
process.exit(ozbiljni.length === 0 && problemi.length === 0 && spoljni.length === 0 ? 0 : 1)
