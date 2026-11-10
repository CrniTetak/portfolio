// Proba okvira u pravom pregledaču (FAZA 0): zaglavlja (CSP, noindex…), lokalni fontovi, nema mrežnih poziva van sopstvene adrese,
// nema grešaka u konzoli ni CSP prijava, oznaka demoa, okvir (zaglavlje, stub, trake, podnožje), tema, jezik, traka priče,
// pretraga (jedino polje), mapa sa probnim krugom, probna fotografija i svih 84 ekrana (kostur) bez grešaka. Snimci u _snimci/ (van git-a).
// Preview (zaglavlja kao na hostingu):  npm run build ; npm run preview   pa   npm run e2e:okvir
// Dev (bez zaglavlja, samo mreža i konzola):  npm run dev   pa   BASE_URL=http://localhost:5173/ DEV=1 npm run e2e:okvir
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const DEV = process.env.DEV === '1'
const SNIMCI = join(fileURLToPath(new URL('..', import.meta.url)), '_snimci')
mkdirSync(SNIMCI, { recursive: true })
const { lista, proveri } = proveravac()
const origin = new URL(BASE).origin

const POCETNO = { v: 1, poz: { korak: 1, n: 0, grana: 'lanac' }, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [] } }

/** Postavlja stanje demoa u sessionStorage (posle prvog učitavanja, da ga aplikacija ne pregazi) i otvara traženu rutu. */
async function otvoriRutu(page, ruta, stanje = {}) {
  await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
  await sleep(350)
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { ...POCETNO, ...stanje })
  const odgovor = await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2, 7) + '#' + ruta, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await sleep(300)
  return odgovor
}
const stanjeIzSesije = (page) => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
const hash = (page) => page.evaluate(() => location.hash)

async function osnovnaProvera(naziv, sirina, visina, telefon, ruta, ime, { stanje = {}, snimak = true } = {}) {
  const { browser, page, problemi, spoljni } = await otvori({ sirina, visina, telefon })
  const odgovor = await otvoriRutu(page, ruta, stanje)
  const o = (opis) => `${naziv} ${ime}: ${opis}`
  proveri(o('stranica se učitava (HTTP 200)'), odgovor.status() === 200, odgovor.status())
  if (!DEV) {
    const h = odgovor.headers()
    const csp = h['content-security-policy'] ?? ''
    proveri(o("CSP ima form-action 'none'"), csp.includes("form-action 'none'"), csp)
    proveri(o("CSP ima object-src 'none'"), csp.includes("object-src 'none'"), csp)
    proveri(o('CSP ima upgrade-insecure-requests (DORADA PK16)'), csp.includes('upgrade-insecure-requests'), csp)
    proveri(o("CSP ima font-src 'self', img-src 'self' i connect-src 'none'"), csp.includes("font-src 'self'") && csp.includes("img-src 'self'") && csp.includes("connect-src 'none'"), csp)
    proveri(o("CSP style-src je samo 'self' (bez unsafe-inline)"), /style-src 'self'(;|$)/.test(csp) && !csp.includes('unsafe-inline'), csp)
    proveri(o('X-Robots-Tag noindex'), /noindex/.test(h['x-robots-tag'] ?? ''), h['x-robots-tag'])
    proveri(o('payment=() u Permissions-Policy'), /payment=\(\)/.test(h['permissions-policy'] ?? ''), h['permissions-policy'])
  }
  const d = await page.evaluate(() => {
    const traka = document.querySelector('[data-oznaka-demoa]')
    const rb = traka?.getBoundingClientRect()
    const ucitani = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`)
    const polja = [...document.querySelectorAll('input')].filter((i) => !['checkbox', 'radio', 'range'].includes(i.type))
    return {
      naslov: document.title,
      robots: document.querySelector('meta[name=robots]')?.content,
      lang: document.documentElement.lang,
      forme: document.querySelectorAll('form').length,
      polja: polja.map((i) => `${i.type}${i.hasAttribute('data-jedino-polje') ? '[jedino]' : ''}`),
      sviInputi: document.querySelectorAll('input[name], input[type=password], textarea, select[name]').length,
      loseHref: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((x) => !x.startsWith('#')),
      trakaVidljiva: !!traka && rb.top >= 0 && rb.bottom <= innerHeight && /Demo — izmišljeni podaci/.test(traka.textContent ?? ''),
      podnozje: document.querySelector('[data-podnozje]')?.textContent ?? '',
      jezik: document.querySelector('select[data-jezik]')?.value,
      ucitani,
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyBoja: getComputedStyle(document.body).backgroundColor,
      skrolUStranu: document.documentElement.scrollWidth > innerWidth,
      logo: document.querySelectorAll('svg[aria-label^="SWAPIT"]').length,
      h1: document.querySelectorAll('main h1').length,
      ekran: document.querySelector('main[data-ekran]')?.getAttribute('data-ekran'),
      okvir: document.querySelector('[data-okvir]')?.getAttribute('data-okvir'),
      csp: window.__csp ?? [],
    }
  })
  proveri(o('naslov dokumenta sadrži „SWAPIT“'), /SWAPIT/.test(d.naslov), d.naslov)
  proveri(o('meta robots noindex,nofollow'), d.robots === 'noindex, nofollow', d.robots)
  proveri(o('lang="sr-Latn" (P-S11)'), d.lang === 'sr-Latn', d.lang)
  proveri(o('nema <form>, polja za lozinku ni polja sa imenom'), d.forme === 0 && d.sviInputi === 0, `forme ${d.forme}, inputa ${d.sviInputi}`)
  proveri(o('jedino polje za kucanje je pretraga (najviše jedno)'), d.polja.every((p) => p === 'search[jedino]') && d.polja.length <= 1, d.polja.join(','))
  proveri(o('svi linkovi počinju sa #'), d.loseHref.length === 0, d.loseHref.join(', '))
  proveri(o('oznaka „Demo — izmišljeni podaci“ vidljiva bez skrolovanja'), d.trakaVidljiva)
  proveri(o('podnožje: pravni tekstovi, podrška i izbor jezika (Srpski)'), /Uslovi korišćenja/.test(d.podnozje) && /Politika privatnosti/.test(d.podnozje) && /Politika kolačića/.test(d.podnozje) && /Podrška/.test(d.podnozje) && d.jezik === 'Srpski', `${d.jezik}`)
  proveri(o('učitan Nunito (400 i 700)'), ['400', '700'].every((w) => d.ucitani.includes(`Nunito ${w}`)), d.ucitani.join('; '))
  proveri(o('font aplikacije je Nunito'), d.bodyFont.startsWith('Nunito'), d.bodyFont)
  if (ime === 'uvod') proveri(o('pun logo: slogan u Bebas Neue (spakovan lokalno)'), d.ucitani.includes('Bebas Neue 400') && d.logo >= 1, d.ucitani.join('; '))
  proveri(o('pozadina stranice je #F8F8F8 (svetla tema)'), d.bodyBoja === 'rgb(248, 248, 248)', d.bodyBoja)
  proveri(o('nema skrola u stranu'), !d.skrolUStranu)
  proveri(o('tačno jedan naslov h1'), d.h1 === 1, d.h1)
  if (['U1', 'U2'].includes(d.ekran)) proveri(o('uvodni ekran bez okvira (zaglavlje, stub, traka)'), d.okvir === 'sazet')
  proveri(o('nema CSP prijava'), d.csp.length === 0, d.csp.join('; '))
  if (snimak) await page.screenshot({ path: join(SNIMCI, `faza0-${naziv}-${ime}.png`) })
  const csp = await page.evaluate(() => window.__csp ?? [])
  await browser.close()
  return { problemi, spoljni: spoljni.filter(Boolean), csp, d }
}

const svi = { problemi: [], spoljni: [] }
const dodaj = (naziv, ime, r) => {
  svi.problemi.push(...r.problemi)
  svi.spoljni.push(...r.spoljni)
  proveri(`${naziv} ${ime}: nijedan mrežni zahtev van sopstvene adrese`, r.spoljni.length === 0, r.spoljni.join(', '))
  proveri(`${naziv} ${ime}: nema grešaka ni upozorenja u konzoli`, r.problemi.length === 0, r.problemi.join(' | '))
  proveri(`${naziv} ${ime}: nema CSP grešaka`, r.csp.length === 0, r.csp.join(' | '))
}

// ---------------------------------------------------------------------------------------------------------------------
// 1) Osnovne provere na računaru i telefonu, više ruta
// ---------------------------------------------------------------------------------------------------------------------
const RUTE = [
  ['/', 'uvod'],
  ['/ulaz', 'ulaz'],
  ['/ana/pocetna', 'pocetna'],
  ['/ana/oglas/markov-bicikl', 'oglas-slika'],
  ['/ana/mapa', 'mapa'],
]
for (const [naziv, w, h, tel] of [['racunar-1280', 1280, 800, false], ['telefon-390', 390, 844, true]])
  for (const [ruta, ime] of RUTE) dodaj(naziv, ime, await osnovnaProvera(naziv, w, h, tel, ruta, ime))

// ---------------------------------------------------------------------------------------------------------------------
// 2) Okvir u punom obliku (računar): zaglavlje, stub, trake, tema, jezik, restart, pretraga, uglovi
// ---------------------------------------------------------------------------------------------------------------------
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
  await otvoriRutu(page, '/ana/pocetna')
  const o = (opis) => `okvir računar: ${opis}`
  const sastav = await page.evaluate(() => {
    const vidljivo = (s) => {
      const e = document.querySelector(s)
      if (!e) return false
      const r = e.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }
    const trakaP = document.querySelector('[data-traka-price]')?.getBoundingClientRect()
    return {
      zaglavlje: vidljivo('[data-zaglavlje]'),
      stub: vidljivo('[data-stub]'),
      kategorija: document.querySelectorAll('[data-stub] li a').length,
      desna: vidljivo('[data-desna-traka]'),
      traka: vidljivo('[data-traka-price]'),
      tacaka: document.querySelectorAll('[data-traka-price] .pr-d').length,
      polje: document.querySelectorAll('input[data-jedino-polje=pretraga]').length,
      poeni: document.querySelector('[data-poeni-pilula]')?.textContent ?? '',
      zaglavljeVisina: document.querySelector('[data-zaglavlje]')?.getBoundingClientRect().height,
      oznakaVisina: document.querySelector('[data-oznaka-demoa]')?.getBoundingClientRect().height,
      trakaDno: trakaP ? Math.round(trakaP.bottom) : null,
      prozorVisina: innerHeight,
      logo: document.querySelectorAll('[data-zaglavlje] svg[aria-label^="SWAPIT"]').length,
    }
  })
  proveri(o('zaglavlje 56 px, oznaka demoa 28 px'), sastav.zaglavlje && sastav.zaglavljeVisina === 56 && sastav.oznakaVisina === 28, `${sastav.zaglavljeVisina}/${sastav.oznakaVisina}`)
  proveri(o('levi stub sa 31 kategorijom'), sastav.stub && sastav.kategorija === 31, sastav.kategorija)
  proveri(o('desna plutajuća traka'), sastav.desna)
  proveri(o('traka priče sa 9 tačaka, pri dnu prozora'), sastav.traka && sastav.tacaka === 9 && sastav.trakaDno === sastav.prozorVisina, `${sastav.tacaka} / ${sastav.trakaDno} vs ${sastav.prozorVisina}`)
  proveri(o('tačno jedno polje pretrage; znak u zaglavlju je inline SVG'), sastav.polje === 1 && sastav.logo === 1)
  proveri(o('brojač poena u zaglavlju (Ana pre koraka 1: 0 poena)'), /^0 poena$/.test(sastav.poeni.trim()), sastav.poeni)

  // tema: prekidač menja ceo demo i preživljava osvežavanje
  await page.click('[data-prekidac-teme]')
  await sleep(150)
  const tamna = await page.evaluate(() => [document.documentElement.getAttribute('data-tema'), getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector('.ko, .kartica') ?? document.body).backgroundColor])
  proveri(o('prekidač teme: tamna tema (pozadina #000E26, kartica #007BB8)'), tamna[0] === 'tamna' && tamna[1] === 'rgb(0, 14, 38)' && tamna[2] === 'rgb(0, 123, 184)', tamna.join(' | '))
  await page.screenshot({ path: join(SNIMCI, 'faza0-racunar-1280-pocetna-tamna.png') })
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(300)
  const posleOsvezavanja = await page.evaluate(() => [document.documentElement.getAttribute('data-tema'), getComputedStyle(document.body).backgroundColor])
  proveri(o('tema preživljava osvežavanje'), posleOsvezavanja[0] === 'tamna' && posleOsvezavanja[1] === 'rgb(0, 14, 38)', posleOsvezavanja.join(' | '))
  proveri(o('tema je sačuvana u sessionStorage zapisu (swapit.demo.v1)'), (await stanjeIzSesije(page))?.tema === 'tamna')
  await page.click('[data-prekidac-teme]')
  await sleep(150)
  proveri(o('povratak na svetlu temu'), (await page.evaluate(() => document.documentElement.getAttribute('data-tema'))) === 'svetla')

  // jezik: izbor drugog jezika samo prikazuje poruku i vraća izbor na srpski
  await page.select('select[data-jezik]', 'Engleski')
  await sleep(200)
  const jez = await page.evaluate(() => [document.querySelector('select[data-jezik]').value, document.querySelector('[data-toast]')?.textContent ?? ''])
  proveri(o('izbor jezika: poruka „Demo je na srpskom…“ i izbor ostaje „Srpski“'), jez[0] === 'Srpski' && jez[1].includes('Demo je na srpskom; ostali jezici dolaze u pravom proizvodu.'), jez.join(' | '))

  // traka priče: Dalje, Nazad, tačka 6 (račva), Gledaj kao
  const poz = async () => (await stanjeIzSesije(page))?.poz
  const kliknitacku = (k) => page.evaluate((n) => [...document.querySelectorAll('[data-traka-price] .pr-d')][n - 1].click(), k)
  const kliknirestart = () => page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button')].find((b) => b.textContent.includes('Restart demo')).click())
  await page.click('[data-traka-price] button[aria-label=Dalje]')
  await sleep(200)
  let p = await poz()
  proveri(o('Dalje: korak 1 početno → završno'), p.korak === 1 && p.n === 3, JSON.stringify(p))
  await page.click('[data-traka-price] button[aria-label=Dalje]')
  await sleep(200)
  p = await poz()
  proveri(o('Dalje: završno → korak 2 početno'), p.korak === 2 && p.n === 0, JSON.stringify(p))
  await page.click('[data-traka-price] button[aria-label=Nazad]')
  await sleep(200)
  p = await poz()
  proveri(o('Nazad: korak 2 početno → korak 1 početno'), p.korak === 1 && p.n === 0, JSON.stringify(p))
  await kliknitacku(6)
  await sleep(250)
  p = await poz()
  const h6 = await hash(page)
  proveri(o('klik na tačku 6: korak 6 početno i ekran X13 (lanac razmene) za Anu'), p.korak === 6 && p.n === 0 && p.grana === 'lanac' && h6.includes('/ana/lanac'), `${JSON.stringify(p)} ${h6}`)
  proveri(o('tačka 6 nosi oznaku račve, a prekidač „Račva“ je vidljiv na koraku 6'), await page.evaluate(() => !!document.querySelector('.pr-d.fork') && !!document.querySelector('[data-racva]')))
  await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] [data-racva] button')].find((b) => b.textContent.includes('Za poene'))?.click())
  await sleep(250)
  p = await poz()
  const racva = await page.evaluate(() => document.querySelector('[data-traka-racve]')?.textContent ?? '')
  proveri(o('račva „Za poene“: grana poeni i traka „Račva: za poene — Nazad na glavni tok“'), p.grana === 'poeni' && /Račva: za poene/.test(racva) && /Nazad na glavni tok/.test(racva), `${JSON.stringify(p)} ${racva}`)
  await page.evaluate(() => document.querySelector('[data-traka-racve] button')?.click())
  await sleep(250)
  p = await poz()
  proveri(o('„Nazad na glavni tok“ vraća lanac, korak 6 početno'), p.grana === 'lanac' && p.korak === 6 && p.n === 0, JSON.stringify(p))
  await kliknitacku(2)
  await sleep(200)
  p = await poz()
  proveri(o('skok na korak 2'), p.korak === 2 && p.n === 0, JSON.stringify(p))

  // Gledaj kao
  await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] .pr-seg button')].find((b) => b.textContent === 'Prodavnica')?.click())
  await sleep(300)
  const hP = await hash(page)
  const okvirP = await page.evaluate(() => ({ poeni: document.querySelector('[data-poeni-pilula]')?.textContent ?? '', nalog: [...document.querySelectorAll('.poeni-pilula')].map((x) => x.textContent).join('|'), ugao: document.querySelector('[data-ugao]')?.getAttribute('data-ugao') }))
  proveri(o('Gledaj kao: Prodavnica otvara ekran koraka 2 za taj ugao (F4, javni profil firme; matrica UX 3.3), zaglavlje pokazuje „Poslovni nalog“ umesto poena'), hP === '#/prodavnica/firma/zupcanik' && okvirP.ugao === 'prodavnica' && /Poslovni nalog/.test(okvirP.nalog) && okvirP.poeni === '', `${hP} ${JSON.stringify(okvirP)}`)
  await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] .pr-seg button')].find((b) => b.textContent === 'Moderacija')?.click())
  await sleep(300)
  proveri(o('Gledaj kao: Moderacija — zajednička strana (F4) ostaje, menja se ugao'), (await hash(page)).startsWith('#/moderacija/'), await hash(page))
  await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] .pr-seg button')].find((b) => b.textContent === 'Marko')?.click())
  await sleep(300)
  proveri(o('Gledaj kao: Marko — zajednička strana ostaje, menja se ugao'), (await hash(page)).startsWith('#/marko/'), await hash(page))

  // Restart dijalog
  await kliknirestart()
  await sleep(200)
  const dij = await page.evaluate(() => ({ naslov: document.querySelector('[role=dialog] h2')?.textContent, dugmad: [...document.querySelectorAll('[role=dialog] button')].map((b) => b.textContent.trim()).filter(Boolean) }))
  proveri(o('Restart: dijalog „Vratiti demo na korak 1?“ sa Da / Odustani'), dij.naslov === 'Vratiti demo na korak 1?' && dij.dugmad.includes('Da') && dij.dugmad.includes('Odustani'), JSON.stringify(dij))
  await page.keyboard.press('Escape')
  await sleep(200)
  proveri(o('Esc zatvara dijalog'), !(await page.evaluate(() => !!document.querySelector('[role=dialog]'))))
  await kliknirestart()
  await sleep(200)
  await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Da')?.click())
  await sleep(400)
  p = await poz()
  proveri(o('Restart (Da): korak 1 početno, tema i režim ostaju'), p.korak === 1 && p.n === 0 && p.grana === 'lanac', JSON.stringify(p))

  // pretraga: jedino polje; upit je u linku i preživljava osvežavanje
  await page.goto(BASE + '?r=p1#/ana/pocetna', { waitUntil: 'networkidle0' })
  await sleep(300)
  await page.type('input[data-jedino-polje=pretraga]', 'bicikl')
  await page.keyboard.press('Enter')
  await sleep(300)
  const hq = await hash(page)
  proveri(o('pretraga: Enter menja link u #/ana/pretraga?q=bicikl'), hq === '#/ana/pretraga?q=bicikl', hq)
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(300)
  const posleQ = await page.evaluate(() => [location.hash, document.querySelector('input[data-jedino-polje=pretraga]')?.value])
  proveri(o('upit u linku preživljava osvežavanje i vraća se u polje'), posleQ[0] === '#/ana/pretraga?q=bicikl' && posleQ[1] === 'bicikl', posleQ.join(' | '))
  const upisano = await page.evaluate((k) => sessionStorage.getItem(k) ?? '', KLJUC)
  proveri(o('upit pretrage se ne upisuje u sessionStorage'), !upisano.includes('bicikl'))
  const atributi = await page.evaluate(() => {
    const i = document.querySelector('input[data-jedino-polje=pretraga]')
    return { type: i.type, name: i.getAttribute('name'), autocomplete: i.getAttribute('autocomplete'), maxlength: i.maxLength, uForm: !!i.closest('form') }
  })
  proveri(o('polje pretrage: type=search, bez name, autocomplete=off, maxlength 40, van form'), atributi.type === 'search' && atributi.name === null && atributi.autocomplete === 'off' && atributi.maxlength === 40 && !atributi.uForm, JSON.stringify(atributi))

  // ugao koji ne sme da vidi ekran i nepostojeća ruta
  await page.goto(BASE + '?r=u1#/marko/moderacija', { waitUntil: 'networkidle0' })
  await sleep(300)
  proveri(o('#/marko/moderacija (ekran koji ugao ne vidi) vodi na kuću ugla uz poruku'), (await hash(page)) === '#/marko/pocetna' && (await page.evaluate(() => !!document.querySelector('[data-toast]'))), await hash(page))
  await page.goto(BASE + '?r=u2#/ana/ne-postoji', { waitUntil: 'networkidle0' })
  await sleep(300)
  // DORADA (QA): nepoznata adresa daje ekran „Nema te stranice“ sa dugmetom „Nazad na početnu“ (nikad prazno), adresa ostaje ista
  const nema = await page.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, dugme: [...document.querySelectorAll('main a')].map((a) => a.textContent?.trim()), href: [...document.querySelectorAll('main a')].map((a) => a.getAttribute('href')) }))
  proveri(o('nepoznata adresa → „Nema te stranice“ sa „Nazad na početnu“'), nema.h1 === 'Nema te stranice' && nema.dugme.includes('Nazad na početnu') && nema.href.includes('#/ana/pocetna'), JSON.stringify(nema))
  await page.goto(BASE + '?r=u3#/ne/postoji/uopste/ovo', { waitUntil: 'networkidle0' })
  await sleep(300)
  proveri(o('i potpuno nepoznata putanja daje „Nema te stranice“ (ne praznu stranu)'), await page.evaluate(() => document.querySelector('main h1')?.textContent === 'Nema te stranice' && document.body.innerText.trim().length > 40))

  dodaj('racunar-1280', 'okvir', { problemi, spoljni: spoljni.filter(Boolean), csp: await page.evaluate(() => window.__csp ?? []) })
  await browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 3) Telefon: jedna donja traka, panel, ikonska traka u slobodnom režimu, meni
// ---------------------------------------------------------------------------------------------------------------------
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 390, visina: 844, telefon: true })
  await otvoriRutu(page, '/ana/pocetna')
  const o = (opis) => `okvir telefon: ${opis}`
  const t = await page.evaluate(() => ({
    dok: !!document.querySelector('[data-traka-telefon]'),
    donjih: document.querySelectorAll('[data-donji]').length,
    ikonska: !!document.querySelector('[data-ikonska-traka]'),
    desna: !!document.querySelector('[data-desna-traka]'),
    stub: !!document.querySelector('[data-stub]') && getComputedStyle(document.querySelector('[data-stub]')).display !== 'none',
    dokVisina: document.querySelector('[data-traka-telefon]')?.getBoundingClientRect().height,
  }))
  proveri(o('vođena: jedna fiksna donja traka (dok) od 65 px, bez ikonske trake, desne trake i stuba'), t.dok && t.donjih === 1 && !t.ikonska && !t.desna && !t.stub && t.dokVisina === 65, JSON.stringify(t))
  await page.click('[data-traka-telefon] .mid')
  await sleep(300)
  const panel = await page.evaluate(() => {
    const s = document.querySelector('.pr-sheet')
    const r = s?.getBoundingClientRect()
    return { postoji: !!s, visina: r ? r.height / innerHeight : 0, koraka: document.querySelectorAll('.pr-sheet ol li').length, ugao: !!document.querySelector('.pr-sheet [aria-label="Gledaj kao"]'), zatvori: !!document.querySelector('.pr-sheet [aria-label="Zatvori panel"]'), restart: /Restart demo/.test(document.querySelector('.pr-sheet')?.textContent ?? '') }
  })
  proveri(o('panel odozdo: najviše 82% visine, 9 koraka, Gledaj kao, Restart'), panel.postoji && panel.visina <= 0.82 + 0.001 && panel.koraka === 9 && panel.ugao && panel.restart, JSON.stringify(panel))
  await page.keyboard.press('Escape')
  await sleep(250)
  proveri(o('Esc zatvara panel'), !(await page.evaluate(() => !!document.querySelector('.pr-sheet'))))
  // meni ≡
  await page.click('[data-meni-dugme]')
  await sleep(250)
  const meni = await page.evaluate(() => ({ stavki: document.querySelectorAll('[data-meni-telefon] a').length, kategorije: /Roba i kategorije/.test(document.querySelector('[data-meni-telefon]')?.textContent ?? '') }))
  proveri(o('meni ≡ nosi ikonsku listu iz Figme (roba, kamion, slušalice, mapa, zvezda, paket, koverat, profil)'), meni.stavki >= 8 && meni.kategorije, JSON.stringify(meni))
  await page.keyboard.press('Escape')
  await sleep(250)
  // slobodni režim: ikonska traka umesto trake priče, pločica u zaglavlju
  await otvoriRutu(page, '/ana/pocetna', { rezim: 'slobodno' })
  const sl = await page.evaluate(() => ({ dok: !!document.querySelector('[data-traka-telefon]'), ikonska: document.querySelectorAll('[data-ikonska-traka] a').length, donjih: document.querySelectorAll('[data-donji]').length, pilula: document.querySelector('[data-pilula-koraka]')?.textContent ?? '', ikonskaVisina: document.querySelector('[data-ikonska-traka]')?.getBoundingClientRect().height }))
  proveri(o('slobodno: samo ikonska traka (8 ikona, 56 px) i pločica „Korak 1/9“ u zaglavlju'), !sl.dok && sl.ikonska === 8 && sl.donjih === 1 && sl.ikonskaVisina === 56 && /Korak 1\/9/.test(sl.pilula), JSON.stringify(sl))
  await page.screenshot({ path: join(SNIMCI, 'faza0-telefon-390-slobodno.png') })
  dodaj('telefon-390', 'okvir', { problemi, spoljni: spoljni.filter(Boolean), csp: await page.evaluate(() => window.__csp ?? []) })
  await browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 4) Mapa i fotografija
// ---------------------------------------------------------------------------------------------------------------------
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
  await otvoriRutu(page, '/ana/mapa')
  const o = (opis) => `mapa: ${opis}`
  const m = await page.evaluate(() => {
    const svg = document.querySelector('[data-mapa] svg')
    const krug = document.querySelector('[data-krug]')
    const vb = svg?.viewBox.baseVal
    return {
      svg: !!svg,
      opstina: document.querySelectorAll('[data-opstina]').length,
      reke: [...document.querySelectorAll('[data-reka]')].map((r) => r.getAttribute('data-reka')).sort().join(','),
      ostrva: [...document.querySelectorAll('[data-ostrvo]')].map((r) => r.getAttribute('data-ostrvo')).sort().join(','),
      natpisi: [...document.querySelectorAll('.mapa-natpis')].map((t) => t.textContent),
      oznaka: document.querySelector('[data-mapa-oznaka]')?.textContent ?? '',
      krugUnutra: krug ? Number(krug.getAttribute('cx')) > 0 && Number(krug.getAttribute('cx')) < vb.width && Number(krug.getAttribute('cy')) > 0 && Number(krug.getAttribute('cy')) < vb.height : false,
      krugBoja: krug ? getComputedStyle(krug).stroke : '',
      kopnoBoja: getComputedStyle(document.querySelector('.mapa-opstina')).fill,
      inlineStil: document.querySelectorAll('[data-mapa] [style]').length,
    }
  })
  proveri(o('inline SVG sa 11 opština (sa Surčinom), Savom, Dunavom i dva ostrva'), m.svg && m.opstina === 11 && m.reke === 'dunav,sava' && m.ostrva === 'ada-ciganlija,veliko-ratno', JSON.stringify(m))
  // D2: na uskom ekranu (telefon) se natpisi gustog središta ne crtaju (ime izabranog područja piše ispod mape), pa je obavezno 6 spoljnih, a na širokom svih 11
  const spoljniNatpisi = ['Zemun', 'Novi Beograd', 'Palilula', 'Čukarica', 'Rakovica', 'Surčin']
  const gusti = ['Stari grad', 'Vračar', 'Savski venac', 'Zvezdara', 'Voždovac']
  proveri(o('natpisi opština'), spoljniNatpisi.every((n) => m.natpisi.includes(n)) && (gusti.every((n) => m.natpisi.includes(n)) || gusti.every((n) => !m.natpisi.includes(n))), m.natpisi.join(', '))
  proveri(o('oznaka „Ilustrativna mapa · Prikazujemo samo približnu lokaciju.“'), m.oznaka.includes('Ilustrativna mapa') && m.oznaka.includes('Prikazujemo samo približnu lokaciju.'), m.oznaka)
  proveri(o('probni krug je unutar mape (postavljen SVG atributima), boje iz CSS promenljivih, bez inline style'), m.krugUnutra && m.inlineStil === 0 && m.krugBoja !== '' && m.kopnoBoja !== '', JSON.stringify({ k: m.krugUnutra, s: m.inlineStil, b: m.krugBoja }))
  await page.screenshot({ path: join(SNIMCI, 'faza0-racunar-1280-mapa.png') })
  // tamna tema: boje mape se menjaju
  await page.click('[data-prekidac-teme]')
  await sleep(200)
  const tm = await page.evaluate(() => ({ kopno: getComputedStyle(document.querySelector('.mapa-opstina')).fill, natpis: getComputedStyle(document.querySelector('.mapa-natpis')).fill }))
  proveri(o('tamna tema: kopno #003A6E i beo natpis'), tm.kopno === 'rgb(0, 58, 110)' && tm.natpis === 'rgb(255, 255, 255)', JSON.stringify(tm))
  await page.screenshot({ path: join(SNIMCI, 'faza0-racunar-1280-mapa-tamna.png') })

  // probna fotografija
  await otvoriRutu(page, '/ana/oglas/romani-ive-andrica-komplet') // T4-3: Markov bicikl nema fotografiju (ilustracija)
  const f = await page.evaluate(() => {
    const img = document.querySelector('img[data-slika]')
    return img ? { ok: img.complete && img.naturalWidth > 0, src: img.currentSrc, alt: img.alt, w: img.naturalWidth, srcset: img.srcset, navodjenje: document.querySelector('[data-navodjenje]')?.textContent ?? '' } : null
  })
  proveri(o('probna slika učitana sa sopstvene adrese kao WebP (srcset)'), f?.ok && f.src.startsWith(origin) && f.src.endsWith('.webp') && /800w/.test(f.srcset) && /1600w/.test(f.srcset), JSON.stringify(f))
  proveri(o('slika ima alt i red „Foto: autor · licenca · Wikimedia Commons“'), f?.alt.length > 3 && /^Foto: .+ · .+ · (CC0|Public domain|CC BY)[^·]* · Wikimedia Commons( · Tekst licence: \S+)?\s*Slike su umanjene i isečene; prerađene slike ostaju pod istom licencom kao original\.$/.test(f?.navodjenje.trim()), f?.navodjenje)
  await page.screenshot({ path: join(SNIMCI, 'faza0-racunar-1280-oglas-slika.png') })
  dodaj('racunar-1280', 'mapa-slika', { problemi, spoljni: spoljni.filter(Boolean), csp: await page.evaluate(() => window.__csp ?? []) })
  await browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 5) Kostur: svih 84 ekrana se otvara bez grešaka, sa jednim h1, okvirom i nazivom iz registra
// ---------------------------------------------------------------------------------------------------------------------
{
  const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
  const { RUTE, link } = m.rute
  proveri('registar ima 84 ekrana', RUTE.length === 84, RUTE.length)
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
  await otvoriRutu(page, '/ana/pocetna')
  const lose = []
  let otvoreno = 0
  for (const r of RUTE) {
    const ugao = r.uglovi[0]
    const l = link(r.id, ugao)
    await page.evaluate((x) => (location.hash = x), '#' + l)
    await page.waitForFunction((id) => document.querySelector('main[data-ekran]')?.getAttribute('data-ekran') === id, { timeout: 4000 }, r.id).catch(() => {})
    const s = await page.evaluate(() => ({ ekran: document.querySelector('main[data-ekran]')?.getAttribute('data-ekran'), h1: [...document.querySelectorAll('main h1')].map((x) => x.textContent), oznaka: !!document.querySelector('[data-oznaka-demoa]'), podnozje: !!document.querySelector('[data-podnozje]'), naslov: document.title }))
    const ok = s.ekran === r.id && s.h1.length === 1 && s.oznaka && s.podnozje && s.naslov.length > 5
    if (ok) otvoreno++
    else lose.push(`${r.id} ${l}: ${JSON.stringify(s)}`)
  }
  proveri(`kostur: svih ${RUTE.length} ekrana se otvara (jedan h1, oznaka demoa, podnožje, naslov dokumenta)`, otvoreno === RUTE.length, lose.slice(0, 4).join(' || '))
  zatvori()
  dodaj('racunar-1280', '84-ekrana', { problemi, spoljni: spoljni.filter(Boolean), csp: await page.evaluate(() => window.__csp ?? []) })
  await browser.close()
}

// Talas 3: u izgrađenom paketu nema kosturâ („u izradi“, UIzradi, data-u-izradi) – svih 84 ekrana je izgrađeno
if (!DEV) {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'assets')
  const js = existsSync(dist) ? readdirSync(dist).filter((x) => x.endsWith('.js')).map((x) => readFileSync(join(dist, x), 'utf8')).join(' ') : ''
  proveri('paket (dist/assets/*.js) postoji i nije prazan', js.length > 1000)
  proveri('paket ne sadrži „u izradi“, UIzradi ni data-u-izradi', !/u izradi|UIzradi|data-u-izradi/i.test(js))
}
const ok = izvestaj(DEV ? 'e2e-okvir (dev)' : 'e2e-okvir', lista, svi.problemi, svi.spoljni)
console.log('Snimci: ' + SNIMCI)
process.exit(ok ? 0 : 1)
