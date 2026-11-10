// KPI pločice na uskim ekranima (360 i 390 px): iznos mora da stane u jedan red i da ne izlazi iz pločice.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { lista, proveri } = proveravac()
const STANJA = [
  ['/organizer/account/finances', 8, 1, 'C'],
  ['/organizer/account/finances', 8, 2, 'A'],
  ['/organizer/account/finances', 7, 2, 'B'],
  ['/organizer/account/overview', 8, 2, 'A'],
  ['/organizer/account/overview', 6, 2, 'A'],
  ['/advisor/desk/groups', 7, 2, 'B'],
  ['/advisor/desk/groups', 8, 1, 'C'],
  ['/advisor/desk', 8, 2, 'A'],
  ['/traveler/all-in/status', 1, 0, 'A'],
]
for (const sirina of [360, 390]) {
  const { browser, page } = await otvori({ sirina, visina: 800, telefon: true })
  for (const [ruta, korak, n, ishod] of STANJA) {
    await page.evaluateOnNewDocument((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz: { korak, n, ishod }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })
    await page.goto(`${BASE}?r=${Math.random()}#${ruta}`, { waitUntil: 'load' })
    await sleep(250)
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('[data-kpi]')].map((e) => {
        const v = e.querySelector('.num')
        const lh = parseFloat(getComputedStyle(v).lineHeight)
        return { naziv: e.getAttribute('data-kpi'), tekst: v.textContent, redova: Math.round(v.getBoundingClientRect().height / lh), izlazi: v.scrollWidth > e.clientWidth - 2 }
      }),
    )
    for (const k of r) proveri(`${sirina}px ${ruta} ${korak}.${n}${ishod}: "${k.naziv}" (${k.tekst}) u jednom redu i unutar pločice`, k.redova <= 1 && !k.izlazi, JSON.stringify(k))
  }
  await browser.close()
}
const ok = izvestaj('e2e-kpi', lista, [], [])
process.exit(ok ? 0 : 1)
