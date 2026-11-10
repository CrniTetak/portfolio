// Zajednički pomoćnici za e2e skripte (puppeteer-core + lokalni Chrome).
// Pokretanje svih e2e skripti traži `npm run build` i `npm run preview` (port 4190) u drugom prozoru.
import { createServer } from 'vite'
import puppeteer from 'puppeteer-core'

export const BASE = process.env.BASE_URL ?? 'http://localhost:4190/'
export const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export const KLJUC = 'goaltocart.demo.v1'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Učitava TypeScript module iz src/ (scenario, prica, pravila) kroz Vite, da e2e koristi ISTE podatke kao aplikacija. */
export async function ucitajModule() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true } })
  const m = {
    matrica: await server.ssrLoadModule('/src/pravila/matrica.ts'),
    rute: await server.ssrLoadModule('/src/pravila/rute.ts'),
    vidljivost: await server.ssrLoadModule('/src/pravila/vidljivost.ts'),
    koraci: await server.ssrLoadModule('/src/prica/koraci.ts'),
    reducer: await server.ssrLoadModule('/src/prica/reducer.ts'),
    navigacija: await server.ssrLoadModule('/src/prica/navigacija.ts'),
    datumi: await server.ssrLoadModule('/src/scenario/datumi.ts'),
    racun: await server.ssrLoadModule('/src/scenario/racun.ts'),
    uslovi: await server.ssrLoadModule('/src/scenario/uslovi.ts'),
    strane: await server.ssrLoadModule('/src/scenario/strane.ts'),
    format: await server.ssrLoadModule('/src/scenario/format.ts'),
  }
  return { m, zatvori: () => server.close() }
}

/** Pokreće pregledač i vraća stranicu sa praćenjem grešaka u konzoli i SVIH mrežnih zahteva. */
export async function otvori({ sirina = 1280, visina = 800, telefon = false } = {}) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const problemi = []
  const spoljni = []
  const origin = new URL(BASE).origin
  page.on('pageerror', (e) => problemi.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemi.push(`console.${m.type()}: ${m.text()}`) })
  page.on('request', (r) => {
    const u = r.url()
    if (u.startsWith(origin) || u.startsWith('blob:') || u.startsWith('data:') || u.startsWith('about:')) return
    spoljni.push(u)
  })
  await page.setViewport({ width: sirina, height: visina, deviceScaleFactor: 1, isMobile: telefon, hasTouch: telefon })
  return { browser, page, problemi, spoljni }
}

export function napraviOkvir(page) {
  const uzmi = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
  const ruta = () => page.evaluate(() => location.hash.replace(/^#/, '') || '/')
  const ekran = () => page.evaluate(() => document.querySelector('[data-ekran]')?.getAttribute('data-ekran') ?? null)
  const stanjeEkrana = () => page.evaluate(() => document.querySelector('[data-ekran]')?.getAttribute('data-stanje') ?? null)
  const tekst = () => page.evaluate(() => document.body.innerText)
  /** Klikne prvo vidljivo dugme/link čiji je tekst tačno `t` (ili sadrži, ako sadrzi=true). */
  const klik = async (t, { sadrzi = false, sel = 'button, a', pocekaj = 120, unutar = null } = {}) => {
    const ok = await page.evaluate((t, sadrzi, sel, unutar) => {
      const koren = unutar ? document.querySelector(unutar) : document
      const lista = [...(koren?.querySelectorAll(sel) ?? [])].filter((e) => e.getClientRects().length > 0)
      const el = lista.find((e) => {
        const x = (e.getAttribute('aria-label') && !e.textContent.trim() ? e.getAttribute('aria-label') : e.textContent).replace(/\s+/g, ' ').trim()
        return sadrzi ? x.includes(t) : x === t
      })
      if (!el) return 'nema'
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return 'neaktivno'
      el.click()
      return 'ok'
    }, t, sadrzi, sel, unutar)
    if (ok !== 'ok') throw new Error(`Dugme "${t}" nije kliknuto (${ok}) na ruti ${await ruta()}`)
    await sleep(pocekaj)
  }
  /** Da li postoji vidljivo dugme/link sa tim tekstom, i da li je aktivno. */
  const dugme = (t, { sadrzi = false, sel = 'button, a' } = {}) =>
    page.evaluate((t, sadrzi, sel) => {
      const lista = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0)
      const el = lista.find((e) => {
        const x = e.textContent.replace(/\s+/g, ' ').trim()
        return sadrzi ? x.includes(t) : x === t
      })
      if (!el) return null
      return { aktivno: !(el.disabled || el.getAttribute('aria-disabled') === 'true') }
    }, t, sadrzi, sel)
  const idi = async (hashRuta) => {
    await page.evaluate((r) => { location.hash = r }, hashRuta)
    await sleep(150)
  }
  return { uzmi, ruta, ekran, stanjeEkrana, tekst, klik, dugme, idi }
}

export function izvestaj(naziv, provere, problemi, spoljni) {
  const pali = provere.filter((p) => !p.ok)
  for (const p of provere) if (!p.ok) console.log('  X ' + p.opis + (p.detalj ? ' -> ' + p.detalj : ''))
  console.log(`${naziv}: ${provere.length - pali.length}/${provere.length} provera prošlo`)
  if (problemi.length) console.log('Greške u konzoli:\n  ' + [...new Set(problemi)].join('\n  '))
  if (spoljni.length) console.log('SPOLJNI MREŽNI ZAHTEVI:\n  ' + [...new Set(spoljni)].join('\n  '))
  return pali.length === 0 && problemi.length === 0 && spoljni.length === 0
}

export function proveravac() {
  const lista = []
  const proveri = (opis, uslov, detalj = '') => lista.push({ opis, ok: !!uslov, detalj: uslov ? '' : String(detalj) })
  return { lista, proveri }
}
