// Telefon (PLAN B8.2): veličine ekrana × ključni ekrani × uglovi × oba režima × obe teme, pa SVI ekrani na 360×640.
// Proverava: (a) nema vodoravnog skrola, (b) najviše JEDAN fiksni sloj pri dnu, (c) oznaka demoa vidljiva, (d) podnožje može iznad donje trake,
// (e) panel priče ≤ 82% visine i zaklanja donju traku, (f) mete za dodir ≥ 44 px u donjoj traci i zaglavlju, (g) dugmad trake su cela (tekst nije odsečen),
// (h) slike ne izlaze iz okvira, (i) tabele postaju kartice, (j) nema CSP prijava. Snimci 360×640 idu u SNIMCI=putanja (ako je zadato).
// Pokretanje: npm run build ; npm run preview ; npm run e2e:telefon
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'
import { otvaranje } from './_stanje.mjs'

const SNIMCI = process.env.SNIMCI
if (SNIMCI) mkdirSync(SNIMCI, { recursive: true })
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
const { lista, proveri } = proveravac()
const sviProblemi = []
const sviSpoljni = []

const VELICINE = [
  [390, 844],
  [360, 640],
  [320, 568],
  [375, 667],
  [412, 915],
  [430, 932],
  [844, 390], // telefon položen
]
// ključni ekrani: [id, ugao]
const KLJUCNI = [
  ['P1', 'ana'], ['P4', 'ana'], ['P6', 'ana'], ['P7', 'ana'], ['O1', 'ana'], ['O2', 'ana'], ['X1', 'ana'], ['X7', 'marko'], ['X13', 'ana'], ['W1', 'ana'],
  ['D1', 'ana'], ['Z3', 'ana'], ['N1', 'marko'], ['F3', 'prodavnica'], ['A4', 'prodavnica'], ['F6', 'prodavnica'], ['V1', 'moderacija'], ['V3', 'moderacija'], ['U3', 'ana'], ['R2', 'ana'],
]
const STANJA = [
  ['vodjena', { korak: 1, n: 0, grana: 'lanac' }],
  ['slobodno', { korak: 4, n: 0, grana: 'lanac' }],
]

/** Merenje jedne strane: sve što se proverava, jednim prolazom kroz DOM. */
const izmeri = async () => {
  const vid = (e) => e.getClientRects().length > 0
  const fiksni = [...document.querySelectorAll('body *')].filter((e) => {
    const cs = getComputedStyle(e)
    if (cs.position !== 'fixed' || !vid(e)) return false
    const r = e.getBoundingClientRect()
    if (r.height < 10 || r.width < 10) return false
    if (e.matches('[data-toast-regija]') && !e.querySelector('[data-toast]')) return false
    if (cs.pointerEvents === 'none' && !e.textContent.trim()) return false
    return r.bottom >= innerHeight - 20
  })
  const traka = document.querySelector('[data-donji]')
  const podnozje = document.querySelector('[data-podnozje]')
  const oznaka = document.querySelector('[data-oznaka-demoa]')
  const ro = oznaka?.getBoundingClientRect()
  const scrollX0 = window.scrollX
  window.scrollTo(0, document.documentElement.scrollHeight)
  await new Promise((r) => setTimeout(r, 250)) // lenje slike mogu da produže stranu
  window.scrollTo(0, document.documentElement.scrollHeight)
  const pr = podnozje?.getBoundingClientRect()
  const tr = traka?.getBoundingClientRect()
  const mete = [...document.querySelectorAll('[data-donji] button, [data-donji] a, [data-zaglavlje] button, [data-zaglavlje] a')].filter(vid).map((b) => {
    const r = b.getBoundingClientRect()
    return { t: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }
  })
  const dugmad = [...document.querySelectorAll('[data-traka-telefon] button, [data-ikonska-traka] a, [data-ikonska-traka] button')].filter(vid).map((b) => {
    const r = b.getBoundingClientRect()
    return { t: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 24), ceo: b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1, unutra: r.left >= -0.5 && r.right <= innerWidth + 0.5 }
  })
  const tabela = [...document.querySelectorAll('main table')].filter(vid).filter((t) => !t.closest('.tabela-kartice'))
  const unutarSkrola = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return true } return false }
  const slike = [...document.querySelectorAll('main img')].filter(vid).filter((i) => !unutarSkrola(i)).map((i) => i.getBoundingClientRect()).filter((r) => r.right > innerWidth + 1 || r.left < -1).length
  window.scrollTo(scrollX0, 0)
  const krivci = []
  if (document.documentElement.scrollWidth > innerWidth + 1)
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect()
      if (r.right > innerWidth + 1 && r.width > 0 && vid(e) && !e.closest('[aria-hidden=true]')) krivci.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 28)} (${Math.round(r.right)})`)
      if (krivci.length >= 3) break
    }
  return {
    skrol: document.documentElement.scrollWidth > innerWidth + 1,
    krivci,
    fiksnih: fiksni.length,
    fiksniOpis: fiksni.map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 30)}`),
    oznakaVidljiva: !!ro && vid(oznaka) && ro.top >= 0 && ro.bottom <= innerHeight,
    podnozjeIznadTrake: !pr ? false : tr ? pr.bottom <= tr.top + 1 : pr.bottom <= innerHeight + 1,
    mete,
    dugmad,
    nepreklopljeneTabele: tabela.length,
    slike,
    imaTraku: !!document.querySelector('[data-traka-telefon]'),
    imaIkonsku: !!document.querySelector('[data-ikonska-traka]'),
    ekran: document.querySelector('main[data-ekran]')?.getAttribute('data-ekran') ?? null,
    csp: window.__csp ?? [],
  }
}

async function proveriStranu(page, kontekst, { telefonskiRaspored, rezim, ocekujTraku }) {
  const d = await page.evaluate(izmeri)
  proveri(`${kontekst}: ekran se otvorio`, !!d.ekran)
  proveri(`${kontekst}: nema vodoravnog skrola`, !d.skrol, d.krivci.join('; '))
  proveri(`${kontekst}: najviše jedan fiksni sloj pri dnu`, d.fiksnih <= 1, d.fiksniOpis.join(' | '))
  proveri(`${kontekst}: oznaka demoa vidljiva`, d.oznakaVidljiva)
  proveri(`${kontekst}: podnožje se može skrolovati iznad donje trake`, d.podnozjeIznadTrake)
  proveri(`${kontekst}: slike unutar okvira`, d.slike === 0)
  proveri(`${kontekst}: tabele su kartice`, d.nepreklopljeneTabele === 0)
  proveri(`${kontekst}: nema CSP prijava`, d.csp.length === 0, d.csp.join('; '))
  const odsecena = d.dugmad.filter((b) => !b.ceo || !b.unutra)
  proveri(`${kontekst}: dugmad donje trake su cela`, odsecena.length === 0, odsecena.map((b) => b.t).join('; '))
  if (telefonskiRaspored) {
    const male = d.mete.filter((x) => x.h < 43.5 || x.w < 43.5)
    proveri(`${kontekst}: mete za dodir ≥ 44 px (traka i zaglavlje)`, male.length === 0, male.map((x) => `${x.t} ${x.w}x${x.h}`).join('; '))
    if (ocekujTraku && rezim === 'vodjena') proveri(`${kontekst}: u vođenoj priči stoji traka priče`, d.imaTraku && !d.imaIkonsku)
    if (ocekujTraku && rezim === 'slobodno') proveri(`${kontekst}: u slobodnom režimu stoji ikonska traka`, d.imaIkonsku && !d.imaTraku)
  }
  return d
}

// ---------------------------------------------------------------------------------------------------------------------
// 1) VELIČINE × KLJUČNI EKRANI × REŽIM × TEMA
// ---------------------------------------------------------------------------------------------------------------------
for (const [w, h] of VELICINE) {
  const telefon = true
  const raspored = w < 720
  const { browser, page, problemi, spoljni } = await otvori({ sirina: w, visina: h, telefon })
  const otvoriRutu = otvaranje(page)
  for (const tema of ['svetla', 'tamna'])
    for (const [rezim, poz] of STANJA)
      for (const [id, ugao] of KLJUCNI) {
        const ruta = m.rute.link(id, ugao)
        await otvoriRutu(ruta, { poz, rezim, tema })
        const kontekst = `${w}x${h} ${id}/${ugao} ${rezim} ${tema}`
        await proveriStranu(page, kontekst, { telefonskiRaspored: raspored, rezim, ocekujTraku: !['U3', 'R2'].includes(id) && id !== 'R1' && id !== 'R5' })
        if (SNIMCI && w === 360 && h === 640 && id === 'P1' && ugao === 'ana' && rezim === 'vodjena') await page.screenshot({ path: join(SNIMCI, `telefon-360x640-p1-${tema}.png`) })
      }
  // panel priče: vođena (dodir na sredinu pločice) i slobodno (pločica u zaglavlju)
  if (raspored)
    for (const tema of ['svetla', 'tamna'])
      for (const [rezim, poz] of STANJA) {
        await otvoriRutu(m.rute.link('P1', 'ana'), { poz, rezim, tema })
        await page.evaluate(() => document.querySelector('[data-traka-telefon] .mid, [data-pilula-koraka]')?.click())
        await sleep(250)
        const p = await page.evaluate(() => {
          const d = document.querySelector('[role=dialog][aria-label="Panel priče"]')
          if (!d) return null
          const r = d.getBoundingClientRect()
          return { h: r.height, vis: innerHeight, gore: r.top, bezTrake: !document.querySelector('[data-traka-telefon]'), skrol: document.documentElement.scrollWidth > innerWidth + 1 }
        })
        const k = `${w}x${h} panel ${rezim} ${tema}`
        proveri(`${k}: otvara se`, !!p)
        if (p) {
          proveri(`${k}: najviše 82% visine`, p.h <= p.vis * 0.82 + 1, `${Math.round(p.h)} od ${p.vis}`)
          proveri(`${k}: nema vodoravnog skrola`, !p.skrol)
          if (rezim === 'vodjena') proveri(`${k}: donja traka je zaklonjena dok je panel otvoren (jedan sloj)`, p.bezTrake)
          if (SNIMCI && w === 360 && h === 640) await page.screenshot({ path: join(SNIMCI, `telefon-360x640-panel-${rezim}-${tema}.png`) })
        }
      }
  sviProblemi.push(...problemi)
  sviSpoljni.push(...spoljni)
  await browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 2) SVI EKRANI NA 360×640 (svaka ruta × njeni uglovi), vođena i slobodno, obe teme
// ---------------------------------------------------------------------------------------------------------------------
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 360, visina: 640, telefon: true })
  const otvoriRutu = otvaranje(page)
  let n = 0
  const padovi = []
  for (const tema of ['svetla', 'tamna'])
    for (const [rezim, poz] of STANJA)
      for (const ruta of m.rute.RUTE)
        for (const ugao of ruta.uglovi) {
          await otvoriRutu(m.rute.link(ruta.id, ugao), { poz, rezim, tema }, { pauza: 60 })
          const d = await page.evaluate(izmeri)
          n++
          const kontekst = `${ruta.id}/${ugao} ${rezim} ${tema}`
          if (!d.ekran) padovi.push(`${kontekst}: ekran se nije otvorio`)
          if (d.skrol) padovi.push(`${kontekst}: vodoravni skrol ${d.krivci.join('; ')}`)
          if (d.fiksnih > 1) padovi.push(`${kontekst}: ${d.fiksnih} fiksna sloja ${d.fiksniOpis.join(' | ')}`)
          if (!d.oznakaVidljiva) padovi.push(`${kontekst}: oznaka demoa nije vidljiva`)
          if (!d.podnozjeIznadTrake) padovi.push(`${kontekst}: podnožje ispod trake`)
          if (d.nepreklopljeneTabele) padovi.push(`${kontekst}: tabela nije postala kartice`)
          if (d.slike) padovi.push(`${kontekst}: slika van okvira`)
          const male = d.mete.filter((x) => x.h < 43.5 || x.w < 43.5)
          if (male.length) padovi.push(`${kontekst}: male mete ${male.map((x) => `${x.t} ${x.w}x${x.h}`).join('; ')}`)
          if (d.dugmad.some((b) => !b.ceo || !b.unutra)) padovi.push(`${kontekst}: dugme trake odsečeno`)
          if (d.csp.length) padovi.push(`${kontekst}: CSP ${d.csp.join('; ')}`)
        }
  proveri(`360×640: svih ${n} kombinacija (ekran × ugao × režim × tema) bez skrola u stranu, sa jednim fiksnim slojem, celim dugmadima i metama ≥ 44 px`, padovi.length === 0, padovi.slice(0, 8).join(' || '))
  if (padovi.length) console.log('PADOVI (360×640):\n  ' + padovi.slice(0, 40).join('\n  '))
  sviProblemi.push(...problemi)
  sviSpoljni.push(...spoljni)
  await browser.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// S10 (završna dorada): meni ≡ ugla Prodavnica i Moderacija na telefonu 390 — do SVAKE stavke menija ugla se stiže klikom
// ---------------------------------------------------------------------------------------------------------------------
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 390, visina: 844, telefon: true })
  const otvoriRutu = otvaranje(page)
  const STAVKE = {
    prodavnica: [['F3', 'Pregled'], ['O6', 'Moji oglasi'], ['F4', 'Profil firme'], ['F6', 'Rezultati'], ['A4', 'Akcije'], ['F9', 'Reklame'], ['F8', 'Pretplata']],
    moderacija: [['V1', 'Prijave'], ['V3', 'Odluke'], ['S2', 'Pravila']],
  }
  for (const [ugao, stavke] of Object.entries(STAVKE))
    for (const [ekran, naziv] of stavke) {
      await otvoriRutu(m.rute.link(ugao === 'prodavnica' ? 'F3' : 'V1', ugao), { poz: { korak: 1, n: 3, grana: 'lanac' }, rezim: 'slobodno', tema: 'svetla' })
      await page.click('[data-meni-dugme]')
      await sleep(200)
      const kliknuto = await page.evaluate((n) => {
        const grupa = document.querySelector('[data-meni-ugla-telefon]')
        const a = [...document.querySelectorAll('[data-meni-telefon] a')].find((x) => x.textContent.trim() === n)
        if (!grupa || !a) return false
        a.click()
        return true
      }, naziv)
      await sleep(350)
      const stigao = await page.evaluate(() => document.querySelector('main[data-ekran]')?.getAttribute('data-ekran'))
      proveri(`S10: ${ugao} meni ≡ → „${naziv}“ vodi na ${ekran}`, kliknuto && stigao === ekran, `${kliknuto} ${stigao}`)
    }
  sviProblemi.push(...problemi)
  sviSpoljni.push(...spoljni)
  await browser.close()
}

zatvori()
const ok = izvestaj('e2e-telefon', lista, sviProblemi, sviSpoljni)
process.exit(ok ? 0 : 1)
