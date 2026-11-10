// Zajednički pomoćnici za skripte (puppeteer-core + lokalni Chrome/Edge), po uzoru na GoalToCart.
// Probe nad gotovim buildom traže `npm run build` i `npm run preview` (port 4192) u drugom prozoru.
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import puppeteer from 'puppeteer-core'

export const BASE = process.env.BASE_URL ?? 'http://localhost:4192/'
export const KLJUC = 'swapit.demo.v1'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const PRETRAZIVACI = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
/** Putanja do pregledača: CHROME_PATH, ili prvi pronađeni Chrome/Edge. */
export const CHROME = process.env.CHROME_PATH ?? PRETRAZIVACI.find((p) => existsSync(p)) ?? PRETRAZIVACI[0]

/** Učitava TypeScript module iz src/ kroz Vite, da skripte koriste ISTE podatke kao aplikacija. `spisak` = { ime: '/src/putanja.ts' }. */
export async function ucitajModule(spisak) {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true } })
  const m = {}
  for (const [ime, putanja] of Object.entries(spisak)) m[ime] = await server.ssrLoadModule(putanja)
  return { m, zatvori: () => server.close() }
}

/**
 * Pokreće pregledač i vraća stranicu sa praćenjem: grešaka u konzoli, SVIH mrežnih zahteva van sopstvene adrese
 * i prijava o kršenju CSP-a (securitypolicyviolation). Dozvoljen je samo WebSocket ka istom hostu (Vite dev).
 */
export async function otvori({ sirina = 1280, visina = 800, telefon = false } = {}) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const problemi = []
  const spoljni = []
  const url = new URL(BASE)
  page.on('pageerror', (e) => problemi.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) problemi.push(`console.${m.type()}: ${m.text()}`)
  })
  page.on('request', (r) => {
    const u = r.url()
    if (u.startsWith(url.origin) || u.startsWith('blob:') || u.startsWith('data:') || u.startsWith('about:')) return
    if ((u.startsWith('ws://') || u.startsWith('wss://')) && new URL(u).host === url.host) return
    spoljni.push(u)
  })
  // CSP prijave iz same strane: hvata i ono što konzola ne prijavi
  await page.evaluateOnNewDocument(() => {
    window.__csp = []
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} -> ${e.blockedURI}`))
  })
  // Brže učitavanje za serije proba: umesto "networkidle0" (čeka 500 ms mirovanja) čeka se "load" i pojava ekrana ([data-ekran]).
  const goto = page.goto.bind(page)
  page.goto = async (url, opts = {}) => {
    const odgovor = await goto(url, { ...opts, waitUntil: opts.waitUntil === 'networkidle0' ? 'load' : opts.waitUntil })
    await page.waitForSelector('[data-ekran]', { timeout: 5000 }).catch(() => {})
    // ekrani se učitavaju lenjo (talas 4): čeka se da nestane oznaka „Učitavam ekran“
    await page.waitForFunction(() => !document.querySelector('[data-ucitava]'), { timeout: 5000 }).catch(() => {})
    return odgovor
  }
  await page.setViewport({ width: sirina, height: visina, deviceScaleFactor: 1, isMobile: telefon, hasTouch: telefon })
  return { browser, page, problemi, spoljni }
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
