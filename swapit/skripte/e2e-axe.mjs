// Automatska pristupačnost (axe-core iz node_modules, ubacuje se u pregledač tokom probe; ne ulazi u build).
// Sve rute × njihovi uglovi × vođena i slobodno × OBE teme (računar 1280), pa telefon 360 (panel priče, meni ≡, ključni ekrani) i dijalozi.
// Uslov: 0 kritičnih i ozbiljnih nalaza. Umereni/laki se ispisuju kao informacija (ne ruše proveru).
// Pokretanje: npm run build ; npm run preview ; npm run e2e:axe   (QUICK=1 = samo vođena, jedna pozicija)
import { readFileSync } from 'node:fs'
import { izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'
import { otvaranje } from './_stanje.mjs'

const axeKod = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
await page.setBypassCSP(true) // CSP bi zabranio ubacivanje axe-a; sama aplikacija se ovde ne proverava na CSP (to radi e2e-okvir)
const otvoriRutu = otvaranje(page)

const nalazi = new Map()
let provera = 0
let teski = 0
async function axe(kontekst) {
  await page.evaluate(axeKod)
  const rez = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ciljevi: v.nodes.slice(0, 2).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary ?? '').split('\n').slice(0, 2).join(' ').slice(0, 160)), pomoc: v.help }))
  })
  provera++
  for (const v of rez) {
    const kljuc = `${v.id} (${v.impact})`
    const stari = nalazi.get(kljuc) ?? { n: 0, primeri: [], pomoc: v.pomoc, impact: v.impact }
    stari.n += v.n
    if (stari.primeri.length < 3) stari.primeri.push(`${kontekst}: ${v.ciljevi.join(' | ')}`)
    nalazi.set(kljuc, stari)
  }
  const tesko = rez.filter((v) => ['critical', 'serious'].includes(v.impact))
  if (tesko.length) {
    teski++
    proveri(`axe ${kontekst}: nema kritičnih ni ozbiljnih nalaza`, false, tesko.map((v) => v.id).join(', '))
  }
}

const quick = process.env.QUICK === '1'
const STANJA = quick
  ? [{ korak: 1, n: 0, grana: 'lanac' }]
  : [
      { korak: 1, n: 0, grana: 'lanac' },
      { korak: 6, n: 3, grana: 'lanac' },
      { korak: 9, n: 6, grana: 'lanac' },
    ]
for (const tema of ['svetla', 'tamna'])
  for (const rezim of ['vodjena', 'slobodno'])
    for (const poz of rezim === 'vodjena' ? STANJA : [STANJA[0]])
      for (const ruta of m.rute.RUTE)
        for (const ugao of ruta.uglovi) {
          if (poz.korak !== 1 && ruta.uglovi.length > 2 && ugao !== ruta.uglovi[0]) continue // ostali koraci: prvi ugao ekrana
          await otvoriRutu(m.rute.link(ruta.id, ugao), { tema, rezim, poz }, { pauza: 60 })
          await axe(`${ruta.id}/${ugao}/${rezim}/${poz.korak}.${poz.n}/${tema}`)
        }
proveri(`axe: ${provera} strana (ekran × ugao × režim × pozicija × tema) bez kritičnih i ozbiljnih nalaza`, teski === 0, `${teski} strana ima nalaz`)

// dijalozi i paneli, obe teme
for (const tema of ['svetla', 'tamna']) {
  const poz = { korak: 4, n: 0, grana: 'lanac' }
  await otvoriRutu('/ana/pocetna', { tema, poz })
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Restart demo'))?.click())
  await sleep(250)
  await axe(`dijalog Restart/${tema}`)
  await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Odustani')?.click())
  // pregled opcija u zaglavlju: meni profila
  await otvoriRutu('/ana/pocetna', { tema, poz, rezim: 'slobodno' })
  await page.evaluate(() => document.querySelector('[data-meni-profila] button')?.click())
  await sleep(250)
  await axe(`meni profila/${tema}`)
  // telefon
  await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true })
  await otvoriRutu('/ana/pocetna', { tema, poz })
  await axe(`telefon 360 P1 vođena/${tema}`)
  await page.evaluate(() => document.querySelector('[data-traka-telefon] .mid')?.click())
  await sleep(250)
  await axe(`telefon 360 panel priče/${tema}`)
  await otvoriRutu('/ana/pocetna', { tema, poz, rezim: 'slobodno' })
  await axe(`telefon 360 P1 slobodno/${tema}`)
  await page.evaluate(() => document.querySelector('[data-meni-dugme]')?.click())
  await sleep(250)
  await axe(`telefon 360 meni ≡/${tema}`)
  for (const [id, ugao] of [['O1', 'ana'], ['X1', 'ana'], ['F3', 'prodavnica'], ['V1', 'moderacija'], ['P6', 'ana']]) {
    await otvoriRutu(m.rute.link(id, ugao), { tema, poz })
    await axe(`telefon 360 ${id}/${ugao}/${tema}`)
  }
  await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false })
}

if (nalazi.size) console.log('Nalazi (sve težine):')
for (const [k, v] of [...nalazi.entries()].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${k}: ${v.n}× — ${v.pomoc}\n     npr. ${v.primeri.join(' ;; ')}`)
console.log(`axe: ukupno pokrenuto ${provera} puta`)
await browser.close()
zatvori()
const ok = izvestaj('e2e-axe', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
