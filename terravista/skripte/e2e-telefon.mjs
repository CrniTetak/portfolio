// E2E TELEFON (PLAN B8.2, talas 3): sve veličine telefona i tablet, SVIH 53 ekrana: nema skrola u stranu
// (document.scrollWidth ≤ tražena širina, i nijedan element ne izlazi desno van prozora), oznaka demoa je vidljiva u celini,
// najviše jedan fiksni sloj uz dno (traka), mete dodira ≥ 44 px (traka, mini daljinski, „Izgubio si se?“, tabovi telefona). Pokretanje (preview mora da radi): npm run e2e:telefon
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({ ekrani: '/src/pravila/ekrani.ts' })
const { EKRANI, sastavi } = m.ekrani
await zatvori()

const primer = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
const posebno = { T4: { id: 'klasik-tv-1' }, T10: { id: 'reklama-1' }, T16: { id: 'srbija' }, P7: { id: 'srbija' }, P10: { id: 'srbija' }, P13: { id: 'DEMO-0001' } }
const parametriZa = (e) => posebno[e.id] ?? Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))
const hashZa = (e) => {
  const p = sastavi(e.id, parametriZa(e))
  return e.uredjaj === 'tel' ? `#/tv/pocetna?uredjaj=tel&tel=${p}` : '#' + p
}

const SVE_VELICINE = [[360, 640], [375, 667], [390, 844], [320, 568], [640, 360], [844, 390], [768, 1024]]
// TEL_VELICINE=390x844,320x568 sužava probu (za brzu proveru); podrazumevano su sve
const IZBOR = process.env.TEL_VELICINE?.split(',')
const VELICINE = IZBOR ? SVE_VELICINE.filter(([w, h]) => IZBOR.includes(w + 'x' + h)) : SVE_VELICINE
const { proveri, lista } = proveravac()
const problemi = []
const spoljni = []

// dva početna stanja: (1) slobodno razgledanje sa upisanim stanjem, (2) PRVI ULAZ bez ičega upisanog (vođena priča, korak 1, široka traka)
for (const prviUlaz of process.env.SAMO_PRVI_ULAZ ? [true] : [false, true]) for (const [w, h] of prviUlaz ? SVE_VELICINE.filter(([w]) => [390, 320, 360, 844, 768].includes(w) && (!IZBOR || VELICINE.some(([vw, vh]) => vw === w))) : VELICINE) {
  const o = await otvori({ sirina: w, visina: h, telefon: process.env.MOBILNI === '1' })
  const { page } = o
  await page.evaluateOnNewDocument((sir) => { window.__sirina = sir }, w)
  await page.goto(BASE + '#/')
  if (!prviUlaz) await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })), KLJUC)
  const lose = []
  for (const e of EKRANI) {
    await page.goto(BASE + '?r=' + e.id + hashZa(e))
    await sleep(60)
    const r = await page.evaluate(() => {
      const sw = document.documentElement.scrollWidth
      const iw = window.__sirina // tražena širina (ne innerWidth: na mobilnom pregledniku se raspored može sam raširiti)
      // elementi koji vire desno van prozora (osim onih unutar namenskog vodoravnog pomeranja)
      const viri = []
      for (const el of document.body.querySelectorAll('*')) {
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) continue
        if (b.right > iw + 1 && !el.closest('[data-tv-skrol="x"], .tv-red-okno, [data-tv-oblast], .tabla-blok--siroko')) viri.push(el.className?.toString().slice(0, 40) || el.tagName)
      }
      const tr = document.querySelector('[data-traka]')
      if (tr && tr.scrollWidth > tr.clientWidth + 1) viri.push('traka priče šira od ekrana: ' + tr.scrollWidth)
      // mete dodira ≥ 44 px (uski raspored): dugmad trake, mini daljinski, „Izgubio si se?“
      const sitne = []
      if (iw <= 844) {
        for (const el of document.querySelectorAll('[data-traka] button, .mini-daljinski button, .daljinski--kompaktan button, .prekidac-uredjaja button, [data-izgubio-se] button, [data-tel-platno] .tel-tab')) {
          const b = el.getBoundingClientRect()
          if (b.width > 0 && !el.disabled && (b.height < 43.5 || b.width < 43.5)) sitne.push(`${(el.getAttribute('aria-label') ?? el.textContent).trim().slice(0, 18)} ${Math.round(b.width)}×${Math.round(b.height)}`)
        }
      }
      const oz = document.querySelector('[data-oznaka-demoa]')?.getBoundingClientRect()
      const fiksni = [...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().bottom >= innerHeight - 2).length
      return { sitne: [...new Set(sitne)].slice(0, 4), sw, iw, viri: [...new Set(viri)].slice(0, 4), oznaka: !!oz && oz.left >= -0.5 && oz.right <= iw + 0.5, fiksni }
    })
    if (r.sw > r.iw || r.viri.length > 0) lose.push(`${e.id}: scrollWidth ${r.sw} > ${r.iw} (${r.viri.join(', ')})`)
    else if (r.sitne.length) lose.push(`${e.id}: mete dodira < 44 px: ${r.sitne.join(', ')}`)
    else if (!r.oznaka) lose.push(`${e.id}: oznaka demoa nije cela u prozoru`)
    else if (r.fiksni > 1) lose.push(`${e.id}: ${r.fiksni} fiksna sloja uz dno`)
  }
  proveri(`${prviUlaz ? "prvi ulaz, " : ""}${w}×${h}: svih ${EKRANI.length} ekrana bez skrola u stranu, oznaka demoa cela, najviše 1 fiksni sloj uz dno`, lose.length === 0, lose.slice(0, 8).join(' | '))
  problemi.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}
process.exit(izvestaj('e2e-telefon', lista, problemi, spoljni) ? 0 : 1)
