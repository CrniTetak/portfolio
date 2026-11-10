// Kontrast teksta preko hero slike (S2, S8...) na telefonu: tekst se sakrije, snimi se pozadina ispod njega i meri se NAJSVETLIJA tačka
// (najgori slučaj) prema boji teksta. Granica WCAG AA: 4.5 za običan tekst, 3 za veliki (naslov).
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { lista, proveri } = proveravac()
const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
for (const sirina of [360, 390, 414, 719]) {
  const { browser, page } = await otvori({ sirina, visina: 800, telefon: true })
  await page.setBypassCSP(true) // samo za merenje: slika snimka se dekodira u canvasu
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ v: 1, poz: { korak: 1, n: 0, ishod: 'A' }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })), KLJUC)
  await page.goto(`${BASE}?r=${Math.random()}#/guest/home`, { waitUntil: 'load' })
  await sleep(500)
  await page.evaluate(() => document.fonts.ready)
  const t = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.slika-tekst h1, .slika-tekst p')]
    const boja = (e) => getComputedStyle(e).color.match(/[\d.]+/g).map(Number)
    return els.map((e) => {
      const r = e.getBoundingClientRect()
      return { tag: e.tagName, x: r.x, y: r.y + scrollY, w: r.width, h: r.height, boja: boja(e), velik: parseFloat(getComputedStyle(e).fontSize) >= 24 }
    })
  })
  await page.addStyleTag({ content: '.slika-tekst{visibility:hidden!important}' })
  await sleep(150)
  for (const e of t) {
    const png = await page.screenshot({ clip: { x: Math.max(0, e.x), y: e.y, width: Math.max(1, e.w), height: Math.max(1, e.h) }, captureBeyondViewport: true, encoding: 'base64' })
    const maxL = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, c.width, c.height).data
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      let m = 0
      for (let i = 0; i < d.length; i += 4) m = Math.max(m, 0.2126 * f(d[i]) + 0.7152 * f(d[i + 1]) + 0.0722 * f(d[i + 2]))
      return m
    }, png)
    const lt = lum(...e.boja)
    const kontrast = (lt + 0.05) / (maxL + 0.05)
    console.log(`${sirina}px ${e.tag}: kontrast (najgori slučaj) ${kontrast.toFixed(2)}`)
    proveri(`${sirina}px ${e.tag} preko slike: kontrast ≥ ${e.velik ? 3 : 4.5} (${kontrast.toFixed(2)})`, kontrast >= (e.velik ? 3 : 4.5))
  }
  await browser.close()
}
const ok = izvestaj('e2e-kontrast', lista, [], [])
process.exit(ok ? 0 : 1)
