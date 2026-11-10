// Kontrast (UI.md 2, PLAN B8.2) u OBE teme, u pravom pregledaču.
//  1) Parovi tokena iz UI.md 2 (tekst/pozadina, dugmad, fokus, mapa) računaju se iz stvarnih CSS promenljivih trenutne teme.
//  2) Svaki vidljiv tekst na SVAKOM ekranu (84 ekrana × uglovi, vođena i slobodno): boja teksta prema stvarnoj pozadini (slojevi, providnost,
//     gradijent = najgori stop; tekst u SVG-u prema obliku ispod njega). Običan tekst ≥ 4,5, veliki (≥ 24 px ili ≥ 18,66 px podebljan) ≥ 3,
//     onemogućena dugmad ≥ 4,2 (UI 5.8). Neizmerljivo (pozadina je slika) se samo broji i prijavljuje.
// Pokretanje: npm run build ; npm run preview ; npm run e2e:kontrast   (SNIMCI=putanja = i snimak tamne teme)
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { izvestaj, otvori, proveravac, ucitajModule } from './_zajednicko.mjs'
import { otvaranje } from './_stanje.mjs'

const SNIMCI = process.env.SNIMCI
if (SNIMCI) mkdirSync(SNIMCI, { recursive: true })
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
const { lista, proveri } = proveravac()

// [tema][opis, tekst-promenljiva, pozadina-promenljiva, najmanje]
const PAROVI = {
  svetla: [
    ['ink na stranici', 'ink', 'bg-page', 4.5], ['ink na kartici', 'ink', 'bg-card', 4.5], ['ink na bg-soft', 'ink', 'bg-soft', 4.5],
    ['ink-2 na stranici', 'ink-2', 'bg-page', 4.5], ['ink-2 na kartici', 'ink-2', 'bg-card', 4.5], ['ink-3 na stranici', 'ink-3', 'bg-page', 4.5], ['ink-3 na kartici', 'ink-3', 'bg-card', 4.5],
    ['plava (link) na kartici', 'blue', 'bg-card', 4.5], ['plava (link) na stranici', 'blue', 'bg-page', 4.5], ['beli tekst na plavoj', 'bg-card', 'blue', 4.5],
    ['zeleni tekst na kartici', 'green-text', 'bg-card', 4.5], ['zeleni tekst na stranici', 'green-text', 'bg-page', 4.5],
    ['tekst na zelenom dugmetu', 'green-on', 'green', 4.5], ['tekst na crvenom dugmetu', 'red-on', 'red', 4.5],
    ['onemogućeno dugme', 'disabled-ink', 'disabled-bg', 4.2], ['ivica polja na kartici', 'line-strong', 'bg-card', 3], ['fokus na kartici', 'focus', 'bg-card', 3], ['fokus na stranici', 'focus', 'bg-page', 3],
    ['natpis mape na kopnu', 'mapa-natpis', 'mapa-kopno', 4.5], ['natpis mape na kopnu 2', 'mapa-natpis', 'mapa-kopno-2', 4.5], ['natpis mape na vodi', 'mapa-natpis', 'mapa-voda', 4.5],
    ['krug mape prema kopnu', 'mapa-krug-ivica', 'mapa-kopno', 3],
  ],
  tamna: [
    ['ink na stranici', 'ink', 'bg-page', 4.5], ['ink na plavoj kartici', 'ink', 'bg-card', 4.5], ['ink na bg-soft', 'ink', 'bg-soft', 4.5], ['ink na stubu', 'stub-ink', 'stub', 4.5],
    ['ink-2 na stranici', 'ink-2', 'bg-page', 4.5], ['ink-2 na bg-soft', 'ink-2', 'bg-soft', 4.5], ['ink-2 na stubu', 'ink-2', 'stub', 4.5],
    ['zeleni tekst na stranici', 'green-text', 'bg-page', 4.5], ['zeleni tekst na stubu', 'green-text', 'stub', 4.5],
    ['tekst na zelenom dugmetu', 'green-on', 'green', 4.5], ['tekst na crvenom dugmetu', 'red-on', 'red', 4.5],
    ['onemogućeno dugme', 'disabled-ink', 'disabled-bg', 4.2], ['ivica na stranici', 'line', 'bg-page', 3], ['ivica polja na stranici', 'line-strong', 'bg-page', 3],
    ['fokus na stranici', 'focus', 'bg-page', 3], ['fokus na plavoj kartici', 'focus', 'bg-card', 3],
    ['natpis mape na kopnu', 'mapa-natpis', 'mapa-kopno', 4.5], ['natpis mape na kopnu 2', 'mapa-natpis', 'mapa-kopno-2', 4.5], ['natpis mape na vodi', 'mapa-natpis', 'mapa-voda', 4.5],
    ['krug mape prema kopnu', 'mapa-krug-ivica', 'mapa-kopno', 3],
  ],
}

/** Izvršava se u stranici: svi vidljivi tekstovi sa izmerenim kontrastom. */
const revizija = () => {
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const kontrast = (a, b) => {
    const la = lum(a)
    const lb = lum(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }
  const rgba = (s) => {
    const v = (s.match(/[\d.]+/g) ?? []).map(Number)
    if (/^color\(/.test(s) || v.length < 3) return null
    return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }
  }
  const mesaj = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 })
  const BELA = { r: 255, g: 255, b: 255, a: 1 }
  const gradijentBoje = (bi) => [...bi.matchAll(/rgba?\([^)]*\)/g)].map((x) => rgba(x[0])).filter(Boolean)
  /** Moguće pozadine (lista boja; gradijent daje više) ispod elementa; null = slika (neizmerljivo). */
  function pozadine(el) {
    const prica = el.closest('.prica:not(.prica-nova)')
    if (prica) {
      // pločica priče: tekst stoji na tamnom sloju (::after, rgba(0,14,38,.82)) preko gradijenta
      const g = gradijentBoje(getComputedStyle(prica).backgroundImage)
      if (g.length) return g.map((x) => mesaj({ r: 0, g: 14, b: 38, a: 0.82 }, x))
    }
    let lanac = []
    for (let e = el; e; e = e.parentElement) lanac.push(e)
    let boje = [null] // null = još nema podloge
    for (const e of lanac) {
      const cs = getComputedStyle(e)
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        if (/url\(/.test(cs.backgroundImage)) return null
        const g = gradijentBoje(cs.backgroundImage)
        // providni stopovi (senke skrola na tabovima i sl.) su dekoracija, ne podloga teksta: takav sloj se preskače
        if (g.length && g.every((x) => x.a >= 0.99)) return g.map((x) => (x.a < 1 ? mesaj(x, rgba(cs.backgroundColor) && rgba(cs.backgroundColor).a > 0 ? mesaj(rgba(cs.backgroundColor), BELA) : BELA) : x))
      }
      const bg = rgba(cs.backgroundColor)
      if (bg && bg.a > 0) {
        if (bg.a >= 1) return [bg]
        const ispod = e.parentElement ? pozadine(e.parentElement) : [BELA]
        return ispod ? ispod.map((x) => mesaj(bg, x)) : null
      }
    }
    return [rgba(getComputedStyle(document.documentElement).backgroundColor) ?? BELA]
  }
  const providnost = (el) => {
    let o = 1
    for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity)
    return o
  }
  const vid = (e) => {
    if (e.getClientRects().length === 0) return false
    const cs = getComputedStyle(e)
    if (cs.visibility === 'hidden' || cs.display === 'none') return false
    const r = e.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return false
    // sr-only / isečeno
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || (r.width <= 1 && r.height <= 1)) return false
    return true
  }
  const opis = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`
  const rez = []
  const svgTekstovi = []
  let neizmereno = 0
  const probajDisabled = (e) => !!e.closest('button:disabled, [aria-disabled=true], input:disabled, select:disabled, fieldset:disabled')
  const sviTekstovi = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue
    const e = n.parentElement
    if (!e || e.closest('script, style, noscript, [aria-hidden=true], .sr-only')) continue
    if (!vid(e)) continue
    if (e.closest('svg[aria-label^="SWAPIT"]') || e.tagName.toLowerCase() === 'textpath') continue // logo je robna marka sa nazivom za čitač ekrana
    sviTekstovi.push([e, n.nodeValue.trim().slice(0, 30)])
  }
  const videni = new Set()
  for (const [e, t] of sviTekstovi) {
    if (videni.has(e)) continue
    videni.add(e)
    const cs = getComputedStyle(e)
    const jeSvg = e instanceof SVGElement
    const velik = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight, 10) >= 700)
    let fg = rgba(jeSvg ? cs.fill : cs.color)
    if (!fg) continue
    let bgs
    if (jeSvg) {
      // tekst u SVG-u (mapa) se meri po stvarnim pikselima (vidi dole u Node-u): ovde se samo prikuplja
      e.scrollIntoView({ block: 'center', inline: 'center' })
      const r = e.getBoundingClientRect()
      svgTekstovi.push({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, boja: [fg.r, fg.g, fg.b], velik, tekst: t, opis: opis(e) })
      e.setAttribute('data-kontrast-svg', String(svgTekstovi.length - 1))
      continue
    } else bgs = pozadine(e)
    if (!bgs) {
      neizmereno++
      continue
    }
    const o = providnost(e)
    let najgori = Infinity
    for (const bg of bgs) {
      const crna = bg
      let f = fg
      if (f.a < 1 || o < 1) f = mesaj({ ...f, a: f.a * o }, crna)
      najgori = Math.min(najgori, kontrast([f.r, f.g, f.b], [crna.r, crna.g, crna.b]))
    }
    const onem = probajDisabled(e)
    const najmanje = onem ? 4.2 : velik ? 3 : 4.5
    if (najgori < najmanje - 0.01) rez.push({ opis: opis(e), tekst: t, kontrast: Math.round(najgori * 100) / 100, najmanje, onemogucen: onem })
  }
  return { brojTekstova: videni.size, neizmereno, padovi: rez, svgTekstovi }
}

const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
await page.setBypassCSP(true) // samo za merenje piksela SVG teksta (slika snimka se dekodira na platnu); CSP proverava e2e-okvir
const otvoriRutu = otvaranje(page)
/**
 * Tekst u SVG-u (mapa): za svaki natpis se snimi isečak sa tekstom i bez njega; pikseli koji se razlikuju su slova, a pozadina ispod slova je isti
 * piksel iz snimka bez teksta. Meri se kontrast boje teksta prema TIM pikselima (5. percentil, bez usamljenih tačaka i tankih linija koje preseku slovo).
 */
async function izmeriSvg(page, r, gde, padovi) {
  const isecak = (t) => ({ x: Math.max(0, t.x - 2), y: t.y - 2, width: Math.max(1, t.w + 4), height: Math.max(1, t.h + 4) })
  const sa = []
  for (const t of r.svgTekstovi) sa.push(await page.screenshot({ clip: isecak(t), captureBeyondViewport: true, encoding: 'base64' }))
  await page.evaluate(() => document.querySelectorAll('[data-kontrast-svg]').forEach((e) => (e.style.visibility = 'hidden')))
  const bez = []
  for (const t of r.svgTekstovi) bez.push(await page.screenshot({ clip: isecak(t), captureBeyondViewport: true, encoding: 'base64' }))
  await page.evaluate(() => document.querySelectorAll('[data-kontrast-svg]').forEach((e) => (e.style.visibility = '', e.removeAttribute('data-kontrast-svg'))))
  for (let i = 0; i < r.svgTekstovi.length; i++) {
    const t = r.svgTekstovi[i]
    const rez = await page.evaluate(async (a64, b64, boja) => {
      const ucitaj = async (x) => {
        const img = new Image()
        img.src = 'data:image/png;base64,' + x
        await img.decode()
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const g = c.getContext('2d')
        g.drawImage(img, 0, 0)
        return g.getImageData(0, 0, c.width, c.height).data
      }
      const A = await ucitaj(a64)
      const B = await ucitaj(b64)
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      const lum = (r, g, bb) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb)
      const lt = lum(...boja)
      const odnos = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
      const jezgro = [] // boja teksta prema pozadini ISPOD slova (snimak bez teksta); obris slova (halo) se NE računa kao pozadina
      for (let p = 0; p < A.length; p += 4) {
        const razlika = Math.abs(A[p] - B[p]) + Math.abs(A[p + 1] - B[p + 1]) + Math.abs(A[p + 2] - B[p + 2])
        if (razlika < 30) continue // nije slovo ni obris
        jezgro.push(odnos(lt, lum(B[p], B[p + 1], B[p + 2])))
      }
      const k = jezgro
      k.sort((x, y) => x - y)
      return { n: k.length, najgori: k.length ? k[Math.floor(k.length * 0.05)] : null } // 5. percentil: tanka linija koja preseca slovo ne obara proveru, veće preklapanje (≥ 5% slova) obara
    }, sa[i], bez[i], t.boja)
    if (rez.n < 8) continue // slova se ne vide ili su van isečka: nema šta da se meri
    const najmanje = t.velik ? 3 : 4.5
    if (rez.najgori < najmanje - 0.01) {
      const kljuc = `svg ${t.opis} „${t.tekst}“ min ${najmanje}`
      const stari = padovi.get(kljuc) ?? { n: 0, najgori: 99, gde: [] }
      stari.n++
      stari.najgori = Math.min(stari.najgori, Math.round(rez.najgori * 100) / 100)
      if (stari.gde.length < 3) stari.gde.push(gde)
      padovi.set(kljuc, stari)
    }
  }
}
const STANJA = [
  ['vodjena', { korak: 1, n: 0, grana: 'lanac' }],
  ['vodjena', { korak: 6, n: 0, grana: 'lanac' }],
  ['slobodno', { korak: 4, n: 0, grana: 'lanac' }],
  ['vodjena', { korak: 1, n: 0, grana: 'lanac' }, 'telefon'], // isti ekrani na 360×640 (tabele postaju kartice, meni ≡, traka telefona)
]
for (const tema of ['svetla', 'tamna']) {
  // 1) parovi tokena
  await otvoriRutu('/ana/pocetna', { tema })
  await page.waitForFunction((t) => document.documentElement.getAttribute('data-tema') === t, { timeout: 5000 }, tema)
  const vr = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    const izlaz = {}
    for (const n of ['ink', 'ink-2', 'ink-3', 'bg-page', 'bg-card', 'bg-soft', 'blue', 'green', 'green-on', 'green-text', 'red', 'red-on', 'disabled-ink', 'disabled-bg', 'line', 'line-strong', 'focus', 'stub', 'stub-ink', 'mapa-kopno', 'mapa-kopno-2', 'mapa-voda', 'mapa-natpis', 'mapa-krug-ivica']) izlaz[n] = cs.getPropertyValue('--' + n).trim()
    return izlaz
  })
  const hex = (s) => {
    const x = s.replace('#', '')
    const h = x.length === 3 ? x.split('').map((c) => c + c).join('') : x
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  for (const [opis, t, p, min] of PAROVI[tema]) {
    if (!vr[t] || !vr[p]) {
      proveri(`${tema}: par „${opis}“ (promenljiva ne postoji: ${!vr[t] ? t : p})`, false)
      continue
    }
    const a = lum(hex(vr[t]))
    const b = lum(hex(vr[p]))
    const k = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    proveri(`${tema}: ${opis} ≥ ${min} (${k.toFixed(2)}:1; ${vr[t]} na ${vr[p]})`, k >= min - 0.005, `${k.toFixed(2)}`)
  }
  // 2) stvarni tekstovi na svim ekranima
  let ekrana = 0
  let tekstova = 0
  let neizmereno = 0
  const padovi = new Map()
  for (const [rezim, poz, uredjaj] of STANJA) {
    const tel = uredjaj === 'telefon'
    await page.setViewport(tel ? { width: 360, height: 640, isMobile: true, hasTouch: true } : { width: 1280, height: 800, isMobile: false, hasTouch: false })
    for (const ruta of m.rute.RUTE)
      for (const ugao of ruta.uglovi) {
        if (rezim === 'vodjena' && poz.korak === 6 && ruta.uglovi.length > 1 && ugao !== ruta.uglovi[0]) continue // korak 6 samo prvi ugao ekrana
        await otvoriRutu(m.rute.link(ruta.id, ugao), { tema, rezim, poz }, { pauza: 50 })
        const r = await page.evaluate(revizija)
        if (r.svgTekstovi.length) await izmeriSvg(page, r, `${tel ? 'tel ' : ''}${ruta.id}/${ugao}/${rezim}${poz.korak === 6 ? '6' : ''}`, padovi)
        ekrana++
        tekstova += r.brojTekstova
        neizmereno += r.neizmereno
        for (const p of r.padovi) {
          const k = `${p.opis} „${p.tekst}“ ${p.onemogucen ? '(onemogućeno) ' : ''}min ${p.najmanje}`
          const stari = padovi.get(k) ?? { n: 0, najgori: 99, gde: [] }
          stari.n++
          stari.najgori = Math.min(stari.najgori, p.kontrast)
          if (stari.gde.length < 3) stari.gde.push(`${tel ? 'tel ' : ''}${ruta.id}/${ugao}/${rezim}${poz.korak === 6 ? '6' : ''}`)
          padovi.set(k, stari)
        }
      }
  }
  await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false })
  console.log(`${tema}: ${ekrana} strana, ${tekstova} tekstova izmereno, ${neizmereno} preko slike (neizmereno)`)
  const spisak = [...padovi.entries()].sort((a, b) => b[1].n - a[1].n)
  for (const [k, v] of spisak.slice(0, 40)) console.log(`   PAD ${k}: ${v.n}×, najgori ${v.najgori}:1, npr. ${v.gde.join(', ')}`)
  proveri(`${tema}: tekst svih ${ekrana} strana ima propisan kontrast (${spisak.length} različitih nalaza)`, spisak.length === 0, spisak.slice(0, 5).map(([k, v]) => `${k} ${v.najgori}`).join(' | '))
  if (SNIMCI && tema === 'tamna') {
    await otvoriRutu('/ana/pocetna', { tema, poz: { korak: 1, n: 0, grana: 'lanac' } })
    await page.screenshot({ path: join(SNIMCI, 'kontrast-tamna-p1.png') })
  }
}
await browser.close()
zatvori()
const ok = izvestaj('e2e-kontrast', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
