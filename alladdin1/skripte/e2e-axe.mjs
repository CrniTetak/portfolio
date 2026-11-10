// Automatska pristupačnost (axe-core iz node_modules, ubacuje se u pregledač tokom probe; ne ulazi u build).
// Ruta × uloga × ključna stanja, Guided i Free, plus otvoren panel i dijalozi. 0 kritičnih i ozbiljnih nalaza je uslov.
import { readFileSync } from 'node:fs'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const axeKod = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts', koraci: '/src/prica/koraci.ts' })
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
await page.setBypassCSP(true) // CSP bi zabranio ubacivanje axe-a; sama aplikacija se ovde ne proverava na CSP (to radi e2e-okvir)

const nalazi = new Map()
async function axe(kontekst) {
  await page.evaluate(axeKod)
  const rez = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ciljevi: v.nodes.slice(0, 2).map((x) => x.target.join(' ')), pomoc: v.help }))
  })
  for (const v of rez) {
    const kljuc = `${v.id} (${v.impact})`
    const stari = nalazi.get(kljuc) ?? { n: 0, primeri: [], pomoc: v.pomoc, impact: v.impact }
    stari.n += v.n
    if (stari.primeri.length < 3) stari.primeri.push(`${kontekst}: ${v.ciljevi.join(' | ')}`)
    nalazi.set(kljuc, stari)
  }
  proveri(`axe ${kontekst}: nema kritičnih ni ozbiljnih nalaza`, !rez.some((v) => ['critical', 'serious'].includes(v.impact)), rez.filter((v) => ['critical', 'serious'].includes(v.impact)).map((v) => v.id).join(', '))
}

await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
let n = 0
const stanja = [
  { korak: 1, n: 0, ishod: 'A' },
  { korak: 5, n: 2, ishod: 'A' },
  { korak: 6, n: 2, ishod: 'A' },
  { korak: 7, n: 0, ishod: 'A' },
  { korak: 8, n: 2, ishod: 'B' },
]
const sveRute = m.rute.RUTE.filter((r) => r.izgradjen && r.id !== 'S1' && r.id !== 'S6' && r.id !== 'S7')
for (const rezim of ['guided', 'free']) {
  for (const poz of stanja) {
    await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz, rezim, potvrda18: true, poruke: { slobodno: true } })
    for (const ruta of sveRute) {
      for (const uloga of ruta.uloge.length === 4 ? ['guest', 'organizer'] : ruta.uloge) {
        await page.goto(`${BASE}?r=${++n}#${m.rute.link(ruta.id, uloga)}`, { waitUntil: 'networkidle0' })
        await axe(`${ruta.id}/${uloga}/${poz.korak}.${poz.n}${poz.ishod}/${rezim}`)
      }
    }
  }
}
// S1, S6, S7
for (const h of ['/', '/legal/terms', '/legal/responsible', '/about']) {
  await page.goto(`${BASE}?r=${++n}#${h}`, { waitUntil: 'networkidle0' })
  await axe(`javno ${h}`)
}
// dijalozi i meni
await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz: { korak: 4, n: 0, ishod: 'A' }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })
await page.goto(`${BASE}?r=${++n}#/organizer/account/overview`, { waitUntil: 'networkidle0' })
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Restart demo'))?.click())
await sleep(200)
await axe('dijalog Restart')
await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent === 'Cancel')?.click())
await page.goto(`${BASE}?r=${++n}#/guest/charter/package`, { waitUntil: 'networkidle0' })
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Request a group quote'))?.click())
await sleep(200)
await axe('dijalog Enter demo as…')
// telefon: panel i hamburger
await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true })
await page.goto(`${BASE}?r=${++n}#/organizer/account/overview`, { waitUntil: 'networkidle0' })
await axe('telefon 360 početna')
await page.evaluate(() => document.querySelector('[data-traka-telefon] button[aria-haspopup]')?.click())
await sleep(200)
await axe('telefon 360 panel')
await page.goto(`${BASE}?r=${++n}#/organizer/account/overview`, { waitUntil: 'networkidle0' })
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Open menu')?.click())
await sleep(200)
await axe('telefon 360 hamburger')

console.log('Nalazi (sve težine):')
for (const [k, v] of [...nalazi.entries()].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${k}: ${v.n}× — ${v.pomoc}\n     npr. ${v.primeri.join(' ;; ')}`)
await browser.close()
zatvori()
const ok = izvestaj('e2e-axe', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
