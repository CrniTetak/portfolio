// Provera prikaza na telefonima i tabletima (B7.4): 17 veličina kao u Nasetu + OBAVEZNO 360 x 640 (UX 1.3).
// Za ključne ekrane svake uloge, u Guided i Free režimu:
//  (a) nema skrola u stranu,
//  (b) pri dnu je najviše JEDAN fiksni sloj (telefon: spojena traka ILI donja navigacija),
//  (c) oznaka "DEMO — fictional data" je vidljiva bez skrolovanja,
//  (d) poslednji sadržaj i pravna napomena mogu da se skroluju iznad donje trake (nisu zaklonjeni),
//  (e) panel od dole ne prelazi ~82% visine,
//  (f) mete za dodir >= 44 px (telefon),
//  (g) snimak ekrana (e2e-slike/, van git-a).
//
// Pokretanje:  npm run build && npm run preview   (jedan prozor)   pa   npm run e2e:telefon   (drugi prozor)
// Opcije:      node skripte/e2e-telefon.mjs --brzo   (samo 360x640 i još 3 veličine)
import { mkdirSync } from 'node:fs'
import { BASE, KLJUC, izvestaj, otvori, sleep } from './_zajednicko.mjs'

const BRZO = process.argv.includes('--brzo')
const VELICINE = [
  // telefoni uspravno
  [320, 568, 'telefon'], [360, 640, 'telefon'], [360, 800, 'telefon'], [375, 667, 'telefon'], [390, 844, 'telefon'], [393, 852, 'telefon'],
  [412, 915, 'telefon'], [430, 932, 'telefon'],
  // tableti uspravno
  [768, 1024, 'tablet'], [800, 1280, 'tablet'], [820, 1180, 'tablet'], [834, 1194, 'tablet'], [1024, 1366, 'tablet'],
  // tableti položeno
  [1024, 768, 'tablet'], [1180, 820, 'tablet'], [1280, 800, 'tablet'], [1366, 1024, 'tablet'],
  // telefon položeno
  [844, 390, 'telefon'],
]
const IZABRANE = BRZO ? VELICINE.filter(([w, h]) => (w === 360 && h === 640) || (w === 320 && h === 568) || (w === 768 && h === 1024) || (w === 844 && h === 390)) : VELICINE

// [uloga, ruta, korak, odrađeno, opis]
const EKRANI = [
  ['selling', '/selling/dashboard', 4, 0, 'S1'],
  ['selling', '/selling/offers', 1, 0, 'S3'],
  ['selling', '/selling/signing', 4, 0, 'S6'],
  ['selling', '/selling/payouts', 7, 0, 'S9'],
  ['selling', '/selling/approvals', 8, 3, 'S12'],
  ['buying', '/buying/dashboard', 5, 0, 'B1'],
  ['buying', '/buying/offers', 1, 1, 'B3'],
  ['buying', '/buying/secure-funds', 5, 0, 'B7'],
  ['buying', '/buying/payments', 8, 5, 'B9'],
  ['player', '/player/home', 4, 0, 'P1'],
  ['player', '/player/share', 8, 8, 'P3'],
  ['player', '/player/documents', 4, 2, 'P5'],
  ['agent', '/agent/home', 2, 0, 'A1'],
  ['agent', '/agent/commission', 7, 1, 'A4'],
  ['agent', '/agent/documents', 4, 3, 'A5'],
  ['financier', '/financier/dashboard', 8, 1, 'F1'],
  ['financier', '/financier/receivables/main', 8, 1, 'F3'],
  ['financier', '/financier/receivables/main/offer', 8, 1, 'F4'],
  ['financier', '/financier/offers', 8, 5, 'F5'],
  ['financier', '/financier/positions', 8, 8, 'F6'],
  // grana Rejected (povraćaj kupcu)
  ['selling', '/selling/exceptions', 7, 0, 'S13-rej', 'rejected'],
  ['selling', '/selling/dashboard', 9, 1, 'S1-rej', 'rejected'],
  ['buying', '/buying/secure-funds', 7, 1, 'B7-rej', 'rejected'],
  ['buying', '/buying/exceptions', 9, 0, 'B11-rej', 'rejected'],
  ['buying', '/buying/deal', 8, 0, 'B2-rej', 'rejected'],
  ['player', '/player/home', 8, 0, 'P1-rej', 'rejected'],
  ['agent', '/agent/exception', 7, 1, 'A7-rej', 'rejected'],
  ['player', '/player/exception', 7, 1, 'P8-rej', 'rejected'],
  ['agent', '/agent/deal', 8, 0, 'A2-rej', 'rejected'],
  ['agent', '/agent/commission', 7, 1, 'A4-rej', 'rejected'],
  ['financier', '/financier/dashboard', 8, 0, 'F1-rej', 'rejected'],
  ['financier', '/financier/receivables/main', 8, 0, 'F3-rej', 'rejected'],
  ['financier', '/financier/offers', 7, 0, 'F5-rej', 'rejected'],
  ['financier', '/financier/positions', 9, 1, 'F6-rej', 'rejected'],
  // korak 9 glavnog puta i finansijer pre koraka 8 (kartica "Jump to step 8")
  ['player', '/player/exception', 9, 1, 'P8-9'],
  ['agent', '/agent/exception', 9, 1, 'A7-9'],
  ['selling', '/selling/exceptions', 9, 1, 'S13-9'],
  ['buying', '/buying/exceptions', 9, 1, 'B11-9'],
  ['financier', '/financier/dashboard', 9, 1, 'F1-9'],
  ['financier', '/financier/dashboard', 5, 0, 'F1-5'],
  ['financier', '/financier/receivables/main', 5, 0, 'F3-5'],
]

mkdirSync('e2e-slike/telefon', { recursive: true })
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
const nalazi = []
const brojac = { provere: 0 }
const proveri = (ok, opis) => { brojac.provere++; if (!ok) nalazi.push(opis) }

// Proba u stranici (izvršava se u pregledaču)
function probaUStranici() {
  const vidljiv = (e) => {
    const cs = getComputedStyle(e)
    const r = e.getBoundingClientRect()
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0
  }
  const VW = window.innerWidth
  const VH = window.innerHeight
  const izlaz = {}
  // (a) skrol u stranu
  izlaz.skrolUStranu = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - VW
  // (b) fiksni slojevi pri dnu: donja traka (grid red), spojena traka, donja navigacija; plus sve position:fixed pri dnu (osim prolaznog toasta i prekrivača)
  const slojevi = []
  for (const sel of ['.dock', '.bottomnav', '.demobar']) {
    const e = document.querySelector(sel)
    if (e && vidljiv(e)) slojevi.push(sel)
  }
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e)
    if (cs.position !== 'fixed' || !vidljiv(e)) continue
    if (e.closest('.overlay') || e.classList.contains('toast') || e.classList.contains('skip')) continue
    const r = e.getBoundingClientRect()
    if (r.bottom >= VH - 2) slojevi.push('fixed:' + (e.className || e.tagName))
  }
  izlaz.slojevi = slojevi
  // (c) oznaka DEMO vidljiva bez skrolovanja
  const demo = document.querySelector('[data-oznaka-demo]')
  const dr = demo?.getBoundingClientRect()
  izlaz.demoVidljivo = !!dr && vidljiv(demo) && dr.top >= 0 && dr.bottom <= VH && dr.left >= 0 && dr.right <= VW
  // visina donje trake
  const donji = document.querySelector('.bottom')
  izlaz.visinaTrake = donji ? Math.round(donji.getBoundingClientRect().height) : 0
  izlaz.sadrzajVisina = (() => { const m = document.querySelector('main'); return m ? Math.round(m.getBoundingClientRect().height) : 0 })()
  // (d) skrol do kraja sadržaja: poslednji element i pravna napomena iznad trake
  const glavni = document.querySelector('.main') ?? document.querySelector('.entrymain')
  if (glavni) glavni.scrollTop = glavni.scrollHeight
  window.scrollTo(0, document.body.scrollHeight)
  const legal = document.querySelector('.legal')
  const lr = legal?.getBoundingClientRect()
  const gornjaIvicaTrake = donji ? donji.getBoundingClientRect().top : VH
  izlaz.legalIznadTrake = !legal || (lr.bottom <= gornjaIvicaTrake + 1 && lr.top >= 0)
  izlaz.legalTekst = legal ? legal.textContent : null
  // (f) mete za dodir
  const male = []
  const kandidati = document.querySelectorAll('button, .btn, .nav-item, .bottomnav a, .tabs a, .rolecard, summary, select, input:not([type=hidden])')
  for (const e of kandidati) {
    if (!vidljiv(e) || e.disabled || e.closest('dialog:not([open])')) continue
    if (e.tagName === 'INPUT' && (e.readOnly || e.closest('fieldset[disabled]'))) continue
    if (e.tagName === 'SUMMARY') continue // "Why this matters" je tekstualni link u listi
    const r = e.getBoundingClientRect()
    if (r.height < 43.5 || r.width < 43.5) male.push(`${e.tagName.toLowerCase()}.${(e.className || '').toString().split(' ')[0]} "${e.textContent.trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
  }
  izlaz.maleMete = male
  return izlaz
}

let brojSnimaka = 0
for (const [w, h, vrsta] of IZABRANE) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 720, hasTouch: w < 720 })
  const telefon = w < 720
  for (const rezim of ['guided', 'free']) {
    for (const [uloga, ruta, korak, odr, ime, grana = 'approved'] of EKRANI) {
      const oznaka = `${w}x${h} ${rezim} ${ime}`
      await page.goto(BASE, { waitUntil: 'networkidle0' })
      await page.evaluate((k, kor, o, r, g) => {
        sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: kor, odradjeno: o, grana: g, rezim: r, vidjenUvodFree: true }))
      }, KLJUC, korak, odr, rezim, grana)
      await page.goto(BASE + '#' + ruta, { waitUntil: 'networkidle0' })
      await page.reload({ waitUntil: 'networkidle0' })
      await sleep(80)
      // snimak PRE skrola (prvi utisak), samo za ključne veličine
      const kljucna = (w === 360 && h === 640) || (w === 1280 && h === 800)
      if (kljucna) {
        await page.screenshot({ path: `e2e-slike/telefon/${w}x${h}-${rezim}-${ime}.png` })
        brojSnimaka++
      }
      const r = await page.evaluate(probaUStranici)
      proveri(r.skrolUStranu <= 1, `${oznaka}: skrol u stranu (${r.skrolUStranu}px)`)
      proveri(r.slojevi.length <= 1, `${oznaka}: ${r.slojevi.length} fiksnih slojeva pri dnu (${r.slojevi.join(', ')})`)
      proveri(r.demoVidljivo, `${oznaka}: oznaka DEMO nije vidljiva bez skrolovanja`)
      proveri(r.legalIznadTrake, `${oznaka}: pravna napomena je zaklonjena trakom`)
      proveri(r.legalTekst === null || r.legalTekst.includes('Demo — illustrative only, not legal or financial advice'), `${oznaka}: pravna napomena nema tekst`)
      proveri(r.sadrzajVisina >= 150, `${oznaka}: za sadržaj ostaje samo ${r.sadrzajVisina}px (traka ${r.visinaTrake}px)`)
      if (telefon) {
        proveri(r.maleMete.length === 0, `${oznaka}: mete za dodir < 44px: ${r.maleMete.slice(0, 4).join('; ')}`)
        // guided = spojena traka, free = donja navigacija; nikad oba
        const imaDock = r.slojevi.includes('.dock')
        const imaNav = r.slojevi.includes('.bottomnav')
        proveri(rezim === 'guided' ? imaDock && !imaNav : imaNav && !imaDock, `${oznaka}: pogrešan sloj pri dnu za režim (${r.slojevi.join(', ')})`)
      }
      // (e) panel od dole (telefon): otvori i izmeri
      if (telefon) {
        const otvoren = await page.evaluate((rezim) => {
          const dugme = rezim === 'guided' ? document.querySelector('[data-pocetak-panela]') : document.querySelector('.step-pill-top')
          if (!dugme) return false
          dugme.click()
          return true
        }, rezim)
        proveri(otvoren, `${oznaka}: nema dugmeta za otvaranje panela`)
        if (otvoren) {
          await sleep(120)
          const p = await page.evaluate(() => {
            const s = document.querySelector('.sheet')
            if (!s) return null
            const r = s.getBoundingClientRect()
            const dugmad = [...s.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0)
            const male = dugmad.filter((b) => { const x = b.getBoundingClientRect(); return x.height < 43.5 || x.width < 43.5 }).map((b) => `${b.textContent.trim().slice(0, 18)} ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`)
            return { visina: r.height, VH: window.innerHeight, male, dno: r.bottom }
          })
          proveri(!!p, `${oznaka}: panel se ne otvara`)
          if (p) {
            proveri(p.visina <= p.VH * 0.82 + 1, `${oznaka}: panel je visok ${Math.round(p.visina)}px od ${p.VH}px (${Math.round((p.visina / p.VH) * 100)}%)`)
            proveri(p.male.length === 0, `${oznaka}: mete u panelu < 44px: ${p.male.join('; ')}`)
            if (w === 360 && h === 640 && ime === 'S3') {
              await page.screenshot({ path: `e2e-slike/telefon/${w}x${h}-${rezim}-${ime}-panel.png` })
              brojSnimaka++
            }
          }
          await page.keyboard.press('Escape')
          await sleep(60)
        }
      }
    }
  }
  // C1 (ulaz) na ovoj veličini
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => sessionStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  const c1 = await page.evaluate(probaUStranici)
  proveri(c1.skrolUStranu <= 1, `${w}x${h} C1: skrol u stranu (${c1.skrolUStranu}px)`)
  proveri(c1.demoVidljivo, `${w}x${h} C1: oznaka DEMO nije vidljiva`)
  if (telefon) proveri(c1.maleMete.length === 0, `${w}x${h} C1: mete < 44px: ${c1.maleMete.join('; ')}`)
  if (w === 360 && h === 640) {
    await page.screenshot({ path: `e2e-slike/telefon/${w}x${h}-C1.png` })
    brojSnimaka++
  }
  console.log(`  ${w}x${h} (${vrsta}) gotovo`)
}

await browser.close()
const provere = [{ opis: `${brojac.provere} provera na ${IZABRANE.length} veličina, ${EKRANI.length} ekrana x 2 režima`, ok: nalazi.length === 0 }]
for (const n of nalazi.slice(0, 80)) console.log('  X ' + n)
if (nalazi.length > 80) console.log(`  ... i još ${nalazi.length - 80}`)
console.log(`Provera: ${brojac.provere}, nalaza: ${nalazi.length}, snimaka: ${brojSnimaka} (e2e-slike/telefon/)`)
const ok = izvestaj('e2e-telefon', provere.map((p) => ({ ...p, opis: p.opis + (nalazi.length ? ` (${nalazi.length} nalaza)` : '') })), problemi, spoljni)
process.exit(ok ? 0 : 1)
