// E2E AXE (PLAN B8.2/B8.3, talas 3): axe-core nad svih 53 ekrana (laptop, slobodno), nad ključnim položajima vođene priče,
// nad otvorenim prozorima (dijalog Restarta, „Kako se upravlja“, meni uskog telefona) i nad uskim telefonom 390×844.
// Prolazi samo ako nema NIJEDNOG nalaza težine „critical“ ili „serious“ (moderate/minor se samo ispisuju kao broj).
// Pokretanje (preview mora da radi): npm run e2e:axe
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const { m, zatvori } = await ucitajModule({ ekrani: '/src/pravila/ekrani.ts' })
const { EKRANI, sastavi } = m.ekrani
await zatvori()

const primer = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
const posebno = { T4: { id: 'klasik-tv-1' }, T10: { id: 'reklama-1' }, T16: { id: 'srbija' }, P7: { id: 'srbija' }, P10: { id: 'srbija' }, P13: { id: 'DEMO-0001' } }
const parametriZa = (e) => posebno[e.id] ?? Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))
const hashZa = (e, usko) => {
  const p = sastavi(e.id, parametriZa(e))
  return e.uredjaj === 'tel' ? `#/tv/pocetna?${usko ? 'uredjaj=tel&' : ''}tel=${p}` : '#' + p
}

const { proveri, lista } = proveravac()
const problemi = []
const spoljni = []
let umereni = 0
const umereniPoPravilu = new Map()

/** Pokreće axe i vraća ozbiljne nalaze kao kratke tekstove. */
async function axe(page) {
  await page.evaluate(AXE)
  const r = await page.evaluate(async () => {
    const x = await window.axe.run(document, { resultTypes: ['violations'] })
    return x.violations.map((v) => ({ id: v.id, uticaj: v.impact, n: v.nodes.length, cilj: v.nodes[0]?.target?.join(' ').slice(0, 80) }))
  })
  for (const v of r.filter((x) => !['critical', 'serious'].includes(x.uticaj))) {
    umereni++
    umereniPoPravilu.set(`${v.id} (${v.uticaj})`, (umereniPoPravilu.get(`${v.id} (${v.uticaj})`) ?? 0) + 1)
  }
  return r.filter((v) => ['critical', 'serious'].includes(v.uticaj)).map((v) => `${v.id} (${v.uticaj}, ${v.n}×) ${v.cilj}`)
}

async function seriju(naziv, opcije, prolazi) {
  const o = await otvori(opcije)
  await o.page.setBypassCSP(true) // samo za ubacivanje axe-a u probu; sama stranica ima CSP u _headers
  const lose = []
  await prolazi(o.page, lose)
  proveri(`${naziv}: 0 kritičnih i ozbiljnih nalaza`, lose.length === 0, lose.slice(0, 6).join(' | '))
  problemi.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}
const seme = (page, z) => page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, kakoViđeno: true, ...v })), [KLJUC, z])
const ode = async (page, hash) => {
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
  await sleep(300)
}

await seriju(`svih ${EKRANI.length} ekrana, laptop 1366×768, slobodno`, { sirina: 1366, visina: 768 }, async (page, lose) => {
  await page.goto(BASE + '#/')
  await seme(page, { korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno' })
  for (const e of EKRANI) {
    await ode(page, hashZa(e, false))
    for (const n of await axe(page)) lose.push(`${e.id}: ${n}`)
  }
})

await seriju('vođena priča, svih 9 koraka (obe grane), laptop', { sirina: 1366, visina: 768 }, async (page, lose) => {
  await page.goto(BASE + '#/')
  for (const grana of ['grcka', 'srbija']) {
    for (let k = 1; k <= 9; k++) {
      await seme(page, { korak: k, p: 0, grana, rezim: 'vodjena' })
      await ode(page, '#/tv/pocetna')
      for (const n of await axe(page)) lose.push(`${grana} ${k}: ${n}`)
    }
  }
})

await seriju('otvoreni prozori: dijalog Restarta, „Kako se upravlja“', { sirina: 1366, visina: 768 }, async (page, lose) => {
  await page.goto(BASE + '#/')
  await seme(page, { korak: 2, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Restart'))?.click())
  await page.waitForSelector('.dijalog', { timeout: 3000 }).catch(() => lose.push('dijalog Restarta se ne otvara'))
  for (const n of await axe(page)) lose.push(`Restart: ${n}`)
  await page.keyboard.press('Escape')
  await sleep(150)
  await page.evaluate(() => document.querySelector('[data-traka] button[aria-label^="Uputstvo"]')?.click())
  await sleep(250)
  if (!(await page.$('.tv-prozor[aria-modal="true"]'))) lose.push('prozor „Kako se upravlja“ se nije otvorio (proba bi bila prazna)')
  for (const n of await axe(page)) lose.push(`Pomoć: ${n}`)
})

await seriju('uski telefon 390×844: svi ekrani (televizor/telefon), meni „≡“', { sirina: 390, visina: 844, telefon: true }, async (page, lose) => {
  await page.goto(BASE + '#/')
  await seme(page, { korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno' })
  for (const e of EKRANI) {
    await ode(page, hashZa(e, true))
    for (const n of await axe(page)) lose.push(`${e.id}: ${n}`)
  }
  await ode(page, '#/tv/pocetna')
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => (b.getAttribute('aria-label') ?? '').startsWith('Meni'))?.click())
  await sleep(200)
  if (!(await page.$('.meni-telefona'))) lose.push('meni „≡“ se nije otvorio (proba bi bila prazna)')
  for (const n of await axe(page)) lose.push(`meni: ${n}`)
})

await seriju('uski telefon 390×844, prvi ulaz (vođena priča, široka traka): ključni ekrani', { sirina: 390, visina: 844, telefon: true }, async (page, lose) => {
  for (const hash of ['#/', '#/ulaz', '#/tv/pocetna', '#/tv/pocetna?uredjaj=tel&tel=/pocetna', '#/tabla/vesna', '#/tabla/platforma', '#/o-demou']) {
    await ode(page, hash)
    for (const n of await axe(page)) lose.push(`${hash}: ${n}`)
  }
})

console.log(`Umereni i sitni nalazi (informacija, ne obara proveru): ${umereni}${umereni ? ' — ' + [...umereniPoPravilu].map(([k, n]) => `${k} ×${n}`).join(', ') : ''}`)
process.exit(izvestaj('e2e-axe', lista, problemi, spoljni) ? 0 : 1)
