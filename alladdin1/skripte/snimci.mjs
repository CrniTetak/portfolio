// Snimci ekrana u pravom pregledaču (van git-a, u _snimci/). Svaki argument: "ruta|sirina|visina|korak|n|ishod|rezim|ime"
// npr.  node skripte/snimci.mjs "/organizer/account/passengers|1280|800|5|1|A|guided|g8"
// Bez argumenata pravi komplet snimaka ključnih ekrana talasa 1 (računar 1280×800 i telefon 390×844).
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { BASE, KLJUC, otvori, sleep } from './_zajednicko.mjs'

const SNIMCI = join(fileURLToPath(new URL('..', import.meta.url)), '_snimci')
mkdirSync(SNIMCI, { recursive: true })

const KOMPLET = [
  ['/', 'ulaz', 1, 0, 'A', 'guided'],
  ['/guest/home', 'pocetna', 1, 0, 'A', 'guided'],
  ['/organizer/account/overview', 'g6-korak1', 1, 0, 'A', 'guided'],
  ['/organizer/charter/package', 'g2-paket', 1, 1, 'A', 'guided'],
  ['/advisor/desk/inquiry', 'v2-ponuda', 2, 0, 'A', 'guided'],
  ['/organizer/charter/quote', 'g4-v2', 3, 2, 'A', 'guided'],
  ['/organizer/charter/reserve', 'g5-depozit', 4, 0, 'A', 'guided'],
  ['/organizer/account/passengers', 'g8-korak6', 6, 2, 'A', 'guided'],
  ['/organizer/account/overview', 'g6-korak6', 6, 2, 'A', 'guided'],
  ['/traveler/join/payment', 't3-rata2', 6, 0, 'A', 'guided'],
  ['/organizer/account/deadline', 'g15-rok', 7, 0, 'A', 'guided'],
  ['/advisor/desk/confirm', 'v4-potvrda', 7, 1, 'A', 'guided'],
  ['/organizer/account/finances', 'g13-kraj', 8, 2, 'A', 'guided'],
  ['/traveler/trips/documents', 't9-dokumenta', 9, 1, 'A', 'free'],
  ['/organizer/account/deadline', 'g15-ishodB', 7, 1, 'B', 'guided'],
]

const argumenti = process.argv.slice(2)
const stavke = argumenti.length
  ? argumenti.map((a) => {
      const [ruta, sirina, visina, korak, n, ishod, rezim, ime, tok] = a.split('|')
      return { ruta, sirina: +sirina, visina: +visina, korak: +korak, n: +n, ishod, rezim, ime, tok }
    })
  : KOMPLET.flatMap(([ruta, ime, korak, n, ishod, rezim]) => [
      { ruta, sirina: 1280, visina: 800, korak, n, ishod, rezim, ime: `talas1-racunar-${ime}` },
      { ruta, sirina: 390, visina: 844, korak, n, ishod, rezim, ime: `talas1-telefon-${ime}` },
    ])

for (const st of stavke) {
  const { browser, page, problemi } = await otvori({ sirina: st.sirina, visina: st.visina, telefon: st.sirina < 720 })
  // tok=pun: svi slobodni tokovi završeni (za K6, M7, Q6, T7, B2 ...)
  const PUN = { krstarenje: 'placeno', monteKarlo: 'potvrdjeno', konsijerz: 'placeno', transport: 'prihvaceno', clanstvo: 'prijavljeno', mkDogadjaj: null, savetnik: 0, usluga: 1, s8Kljuc: null, zahtevi: [], poslednji: null }
  // tok=bogat: usred tokova + tri zahteva bez punog toka (događaj, Vegas, krstarenje) i savetnik bira ponudu
  const BOGAT = { ...PUN, krstarenje: 'none', monteKarlo: 'ponuda', konsijerz: 'zatrazeno', transport: 'zatrazeno', clanstvo: 'prijavljeno', usluga: 2, zahtevi: ['e2', 'vegas', 'aegean'], poslednji: 'aegean', s8Kljuc: 'vegas' }
  const stanje = { v: 1, poz: { korak: st.korak, n: st.n, ishod: st.ishod }, rezim: st.rezim, potvrda18: true, poruke: { slobodno: true }, ...(st.tok === 'pun' ? { tokovi: PUN } : st.tok === 'bogat' ? { tokovi: BOGAT } : {}) }
  await page.evaluateOnNewDocument((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, stanje)
  await page.goto(`${BASE}#${st.ruta}`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await sleep(250)
  await page.screenshot({ path: join(SNIMCI, `${st.ime}.png`) })
  if (problemi.length) console.log(st.ime, problemi.join(' | '))
  await browser.close()
}
console.log(`Snimci: ${stavke.length} u ${SNIMCI}`)
