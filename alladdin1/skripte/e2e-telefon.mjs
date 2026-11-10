// Telefon i tableti (UX 10, B8.4): veličine ekrana × ključni ekrani svih uloga, Guided i Free.
// Proverava: (a) nema skrola u stranu, (b) najviše JEDAN fiksni sloj pri dnu, (c) oznaka demoa vidljiva, (d) poslednji sadržaj i podnožje mogu iznad donje trake,
// (e) panel odozdo ≤ 82% visine, (f) mete za dodir ≥ 44 px u traci i zaglavlju, (g) slike ne izlaze iz okvira, (h) tabele su kartice. Snimci u _snimci/.
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const SNIMCI = join(fileURLToPath(new URL('..', import.meta.url)), '_snimci')
mkdirSync(SNIMCI, { recursive: true })
const VELICINE = [
  [360, 640], [320, 568], [375, 667], [390, 844], [393, 852], [412, 915], [414, 896], [430, 932], [360, 800], [768, 1024], [820, 1180], [844, 390],
]
const EKRANI = [
  ['/organizer/charter/package', 1, 1, 'A', 'g2'],
  ['/organizer/account/overview', 6, 2, 'A', 'g6'],
  ['/organizer/account/passengers', 6, 2, 'A', 'g8'],
  ['/organizer/account/finances', 8, 2, 'A', 'g13'],
  ['/traveler/join/payment', 6, 0, 'A', 't3'],
  ['/advisor/desk/groups', 6, 2, 'A', 'v3'],
  ['/organizer/account/finances/statement', 8, 2, 'B', 'g14'],
  ['/organizer/account/passengers/record', 6, 2, 'A', 'g12'],
  ['/organizer/account/advisor', 6, 2, 'A', 'g17'],
  ['/traveler/messages', 9, 1, 'A', 't8'],
  ['/traveler/cruises/package', 1, 0, 'A', 'k4'],
  ['/traveler/packages', 1, 0, 'A', 's5'],
  ['/traveler/concierge', 1, 0, 'A', 'q1'],
  ['/traveler/trips/booking', 1, 0, 'A', 't7'],
  ['/advisor/desk/requests', 1, 0, 'A', 'v5'],
  ['/guest/home', 1, 0, 'A', 's2'],
]
const SNIMI = new Set(['360x640'])
const { lista, proveri } = proveravac()
const problemiSvi = []
const spoljniSvi = []

for (const [w, h] of VELICINE) {
  const telefon = w < 720
  const { browser, page, problemi, spoljni } = await otvori({ sirina: w, visina: h, telefon })
  await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
  let n = 0
  for (const rezim of ['guided', 'free']) {
    for (const [ruta, korak, nn, ishod, ime] of EKRANI) {
      await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz: { korak, n: nn, ishod }, rezim, potvrda18: true, poruke: { slobodno: true } })
      await page.goto(`${BASE}?r=${++n}#${ruta}`, { waitUntil: 'networkidle0' })
      await sleep(120)
      const kontekst = `${w}x${h} ${ime} ${rezim}`
      const d = await page.evaluate(() => {
        const vis = (e) => e.getClientRects().length > 0
        const fiksni = [...document.querySelectorAll('body *')].filter((e) => {
          const cs = getComputedStyle(e)
          if (cs.position !== 'fixed' || !vis(e)) return false
          const r = e.getBoundingClientRect()
          if (r.height < 10 || r.width < 10) return false
          if (e.matches('[data-toast-regija]') && !e.querySelector('[data-toast]')) return false
          if (cs.pointerEvents === 'none' && !e.textContent.trim()) return false
          // pri dnu: donja ivica u poslednjih 20 px ekrana
          return r.bottom >= innerHeight - 20
        })
        const traka = document.querySelector('[data-traka-telefon], [data-traka-price]')
        const podnozje = document.querySelector('[data-podnozje]')
        const strip = document.querySelector('[data-oznaka-demoa]')
        const rs = strip.getBoundingClientRect()
        window.scrollTo(0, document.body.scrollHeight)
        const pr = podnozje.getBoundingClientRect()
        const tr = traka?.getBoundingClientRect()
        const mete = [...document.querySelectorAll('[data-traka-telefon] button, [data-zaglavlje] button')].filter(vis).filter((b) => !b.classList.contains('btn-link-mini')).map((b) => {
          const r = b.getBoundingClientRect()
          return { t: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) }
        })
        const tabela = [...document.querySelectorAll('table')].some(vis)
        const kartice = [...document.querySelectorAll('ul[aria-label]')].some((u) => vis(u) && u.querySelector('.card'))
        const slike = [...document.querySelectorAll('img')].filter(vis).map((i) => i.getBoundingClientRect()).filter((r) => r.right > innerWidth + 1 || r.left < -1).length
        return {
          skrol: document.documentElement.scrollWidth > innerWidth + 1,
          fiksnih: fiksni.length,
          fiksniOpis: fiksni.map((e) => e.getAttribute('data-traka-telefon') !== null ? 'traka-telefon' : e.className.toString().slice(0, 40)),
          stripVidljiv: rs.top >= 0 && rs.bottom <= innerHeight && vis(strip),
          podnozjeIznadTrake: tr ? pr.bottom <= tr.top + 1 : pr.bottom <= innerHeight + 1,
          mete,
          tabela,
          kartice,
          slike,
          imaTraku: !!document.querySelector('[data-traka-telefon]'),
          csp: window.__csp ?? [],
        }
      })
      proveri(`${kontekst}: nema skrola u stranu`, !d.skrol)
      proveri(`${kontekst}: najviše jedan fiksni sloj pri dnu`, d.fiksnih <= 1, d.fiksniOpis.join(' | '))
      proveri(`${kontekst}: oznaka demoa vidljiva`, d.stripVidljiv)
      proveri(`${kontekst}: podnožje se može skrolovati iznad trake`, d.podnozjeIznadTrake)
      proveri(`${kontekst}: slike unutar okvira`, d.slike === 0)
      if (telefon) {
        const male = d.mete.filter((x) => x.h < 43.5 || x.w < 43.5)
        proveri(`${kontekst}: mete za dodir ≥ 44 px u traci i zaglavlju`, male.length === 0, male.map((x) => `${x.t} ${x.w}x${x.h}`).join('; '))
        if (ime === 'g8') proveri(`${kontekst}: tabela je postala kartice`, !d.tabela && d.kartice)
        if (rezim === 'guided' && ime !== 's2') proveri(`${kontekst}: donja traka postoji u Guided`, d.imaTraku)
        if (rezim === 'free') proveri(`${kontekst}: u Free nema donje trake`, !d.imaTraku)
      }
      proveri(`${kontekst}: nema CSP prijava`, d.csp.length === 0, d.csp.join('; '))
      if (SNIMI.has(`${w}x${h}`) && rezim === 'guided') {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: join(SNIMCI, `talas1-telefon-${w}x${h}-${ime}.png`) })
      }
    }
  }
  // panel odozdo (e): otvori pločicu u Guided i Free
  if (telefon) {
    for (const rezim of ['guided', 'free']) {
      await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz: { korak: 7, n: 0, ishod: 'A' }, rezim, potvrda18: true, poruke: { slobodno: true } })
      await page.goto(`${BASE}?r=${++n}#/organizer/account/deadline`, { waitUntil: 'networkidle0' })
      await page.evaluate(() => document.querySelector('[data-pilula-koraka], [data-traka-telefon] button[aria-haspopup]')?.click())
      await sleep(200)
      const p = await page.evaluate(() => {
        const d = document.querySelector('[role=dialog][aria-label="Story panel"]')
        if (!d) return null
        const r = d.getBoundingClientRect()
        const fiksnihDrugih = [...document.querySelectorAll('[data-traka-telefon]')].length
        return { h: r.height, vis: innerHeight, drugih: fiksnihDrugih }
      })
      proveri(`${w}x${h} panel (${rezim}): otvara se`, !!p)
      if (p) {
        proveri(`${w}x${h} panel (${rezim}): najviše 82% visine`, p.h <= p.vis * 0.82 + 1, `${p.h} od ${p.vis}`)
        proveri(`${w}x${h} panel (${rezim}): donja traka je zaklonjena dok je panel otvoren`, p.drugih === 0)
        if (SNIMI.has(`${w}x${h}`)) await page.screenshot({ path: join(SNIMCI, `talas1-telefon-${w}x${h}-panel-${rezim}.png`) })
      }
    }
  }
  problemiSvi.push(...problemi)
  spoljniSvi.push(...spoljni)
  await browser.close()
}
const ok = izvestaj('e2e-telefon', lista, problemiSvi, spoljniSvi)
process.exit(ok ? 0 : 1)
