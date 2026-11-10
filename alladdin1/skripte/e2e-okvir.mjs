// Proba okvira u pravom pregledaču: zaglavlja (CSP, noindex...), lokalni fontovi, nema mrežnih poziva van sopstvene adrese,
// nema grešaka u konzoli ni CSP prijava, oznaka demoa, podnožje, probna slika; snimci u _snimci/ (van git-a i builda).
// Preview (zaglavlja kao na hostingu):  npm run build ; npm run preview   pa   npm run e2e:okvir
// Dev (bez zaglavlja, samo mreža i konzola):  npm run dev   pa   BASE_URL=http://localhost:5173/ DEV=1 npm run e2e:okvir
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const DEV = process.env.DEV === '1'
const SNIMCI = join(fileURLToPath(new URL('..', import.meta.url)), '_snimci')
mkdirSync(SNIMCI, { recursive: true })
const { lista, proveri } = proveravac()
const prefiks = DEV ? 'talas1-dev' : 'talas1'

async function prolaz(naziv, sirina, visina, telefon, ruta, ime) {
  const { browser, page, problemi, spoljni } = await otvori({ sirina, visina, telefon })
  await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
  await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ v: 1, poz: { korak: 1, n: 0, ishod: 'A' }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })), KLJUC)
  const odgovor = await page.goto(BASE + '?r=1#' + ruta, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await sleep(300)
  const o = (opis) => `${naziv} ${ime}: ${opis}`
  proveri(o('stranica se učitava (HTTP 200)'), odgovor.status() === 200, odgovor.status())
  if (!DEV) {
    const h = odgovor.headers()
    const csp = h['content-security-policy'] ?? ''
    proveri(o("CSP ima form-action 'none'"), csp.includes("form-action 'none'"), csp)
    proveri(o("CSP ima object-src 'none'"), csp.includes("object-src 'none'"), csp)
    proveri(o("CSP ima font-src 'self' i connect-src 'none'"), csp.includes("font-src 'self'") && csp.includes("connect-src 'none'"), csp)
    proveri(o('X-Robots-Tag noindex'), /noindex/.test(h['x-robots-tag'] ?? ''), h['x-robots-tag'])
    proveri(o('payment=() u Permissions-Policy'), /payment=\(\)/.test(h['permissions-policy'] ?? ''), h['permissions-policy'])
  }
  const d = await page.evaluate(() => {
    const traka = document.querySelector('[data-oznaka-demoa]')
    const rb = traka?.getBoundingClientRect()
    const img = document.querySelector('.slika img')
    const ucitani = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`)
    const h1 = document.querySelector('h1')
    return {
      naslov: document.title,
      robots: document.querySelector('meta[name=robots]')?.content,
      lang: document.documentElement.lang,
      forme: document.querySelectorAll('form').length,
      unosi: [...document.querySelectorAll('input')].filter((i) => !['checkbox', 'radio'].includes(i.type)).length + document.querySelectorAll('textarea').length,
      loseHref: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((x) => !x.startsWith('#')),
      trakaVidljiva: !!traka && rb.top >= 0 && rb.bottom <= innerHeight,
      podnozje18: document.querySelector('[data-podnozje]')?.textContent.includes('18+') && document.querySelector('[data-podnozje]')?.textContent.includes('Play responsibly'),
      slika: img ? { ok: img.complete && img.naturalWidth > 0, src: img.currentSrc, alt: img.alt } : null,
      ucitani,
      h1Font: h1 ? getComputedStyle(h1).fontFamily : '',
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyBoja: getComputedStyle(document.body).backgroundColor,
      skrolUStranu: document.documentElement.scrollWidth > innerWidth,
      logo: document.querySelectorAll('svg[aria-label="AllAddIn1"]').length,
      logoCrvena: getComputedStyle(document.querySelector('.logo-crveno') ?? document.querySelector('.logo-segment') ?? document.body).fill,
      csp: window.__csp ?? [],
    }
  })
  proveri(o('naslov dokumenta = naslov ekrana (uz sufiks " — AllAddIn1 demo")'), /AllAddIn1/.test(d.naslov) && d.naslov.length > 15 && d.naslov !== 'AllAddIn1 — DEMO', d.naslov)
  proveri(o('meta robots noindex,nofollow'), d.robots === 'noindex, nofollow', d.robots)
  proveri(o('lang="en"'), d.lang === 'en', d.lang)
  proveri(o('nema <form> ni polja za kucanje'), d.forme === 0 && d.unosi === 0)
  proveri(o('svi linkovi počinju sa #'), d.loseHref.length === 0, d.loseHref.join(', '))
  proveri(o('oznaka demoa vidljiva bez skrolovanja'), d.trakaVidljiva)
  proveri(o('podnožje ima 18+ i "Play responsibly"'), d.podnozje18)
  if (ime === 'pocetna') proveri(o('probna slika učitana sa sopstvene adrese'), d.slika?.ok && d.slika.src.startsWith(new URL(BASE).origin) && d.slika.src.endsWith('.webp'), JSON.stringify(d.slika))
  proveri(o('učitan Cormorant Garamond'), d.ucitani.some((f) => f.startsWith('Cormorant Garamond')), d.ucitani.join('; '))
  proveri(o('učitan Source Serif 4'), d.ucitani.some((f) => f.startsWith('Source Serif 4')), d.ucitani.join('; '))
  proveri(o('naslov u Cormorant-u, tekst u Source Serif-u'), d.h1Font.startsWith('"Cormorant Garamond"') && d.bodyFont.startsWith('"Source Serif 4"'), `${d.h1Font} | ${d.bodyFont}`)
  proveri(o('pozadina je bg-0 (#05090F)'), d.bodyBoja === 'rgb(5, 9, 15)', d.bodyBoja)
  proveri(o('nema skrola u stranu'), !d.skrolUStranu)
  proveri(o('logo je inline SVG'), d.logo >= 1, d.logo)
  proveri(o('crveno u logou iz teme (#9B1C15 ili #7E1E16)'), ['rgb(155, 28, 21)', 'rgb(126, 30, 22)'].includes(d.logoCrvena), d.logoCrvena)
  proveri(o('nema CSP prijava'), d.csp.length === 0, d.csp.join('; '))
  await page.screenshot({ path: join(SNIMCI, `${prefiks}-${naziv}-${ime}.png`) })
  const csp = await page.evaluate(() => window.__csp ?? [])
  await browser.close()
  return { problemi, spoljni: spoljni.filter(Boolean), csp }
}

const svi = { problemi: [], spoljni: [] }
for (const [naziv, w, h, tel] of [['racunar-1280', 1280, 800, false], ['telefon-390', 390, 844, true]]) {
  for (const [ruta, ime] of [['/guest/home', 'pocetna'], ['/', 'ulaz']]) {
    const r = await prolaz(naziv, w, h, tel, ruta, ime)
    svi.problemi.push(...r.problemi)
    svi.spoljni.push(...r.spoljni)
    proveri(`${naziv} ${ime}: nijedan mrežni zahtev van sopstvene adrese`, r.spoljni.length === 0, r.spoljni.join(', '))
    proveri(`${naziv} ${ime}: nema grešaka ni upozorenja u konzoli`, r.problemi.length === 0, r.problemi.join(' | '))
    proveri(`${naziv} ${ime}: nema CSP grešaka`, r.csp.length === 0, r.csp.join(' | '))
  }
}
const ok = izvestaj(DEV ? 'e2e-okvir (dev)' : 'e2e-okvir', lista, svi.problemi, svi.spoljni)
console.log('Snimci: ' + SNIMCI)
process.exit(ok ? 0 : 1)
