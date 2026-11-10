// Visina donje trake (računar: traka priče; telefon: traka sa dugmadima) mora biti ISTA (±0 px) pri promeni ugla, koraka, grane i ekrana (na ekranu priče
// i van njega, „Nazad na priču“), a opis koraka ne sme biti odsečen. Proverava se po širini. (e2e-dorada meri isto na 1024–1440 i 320; ovo je potpun prolaz.)
// Pokretanje: npm run build ; npm run preview ; npm run e2e:visina-trake   (IZVESTAJ=1 = ispiše i visine po širini)
import { izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'
import { otvaranje, UGLOVI } from './_stanje.mjs'

const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts', koraci: '/src/prica/koraci.ts' })
const { lista, proveri } = proveravac()
const SIRINE = [
  [1440, 900, false],
  [1366, 768, false],
  [1280, 800, false],
  [1024, 768, false],
  [800, 1000, false], // P-V2: 720–1023 px vođena priča koristi traku/panel kao telefon
  [390, 844, true],
  [360, 640, true],
  [320, 568, true],
]
const sviProblemi = []
for (const [w, h, tel] of SIRINE) {
  const { browser, page, problemi } = await otvori({ sirina: w, visina: h, telefon: tel })
  const otvoriRutu = otvaranje(page)
  const visine = new Map()
  const odsecenja = []
  const beleska = (v, opis) => {
    if (!visine.has(v)) visine.set(v, [])
    if (visine.get(v).length < 3) visine.get(v).push(opis)
  }
  let stanja = 0
  for (const grana of ['lanac', 'poeni'])
    for (const ugao of UGLOVI) {
      const prvi = grana === 'poeni' ? 6 : 1
      for (let korak = prvi; korak <= 9; korak++) {
        const brojRadnji = m.koraci.brojRadnji ? m.koraci.brojRadnji(korak, grana) : 3
        for (const n of [0, brojRadnji]) {
          // na ekranu priče (kućni ekran ugla) i van njega (S2 pravila zajednice; traka nudi „Nazad na priču“)
          for (const ekran of ['kuca', 'van']) {
            const ruta = ekran === 'kuca' ? m.rute.link(m.rute.KUCA[ugao], ugao) : m.rute.link('S2', ugao)
            await otvoriRutu(ruta, { poz: { korak, n, grana }, rezim: 'vodjena' }, { pauza: 40 })
            const v = await page.evaluate(() => {
              const e = document.querySelector('[data-donji]')
              const p = document.querySelector('[data-tekst-price]')
              return { v: e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : 0, odsecen: p ? (p.scrollHeight > p.clientHeight + 1 && getComputedStyle(p).overflowY !== 'auto') || p.scrollWidth > p.clientWidth + 1 : false, // P-V2: opis koji ne stane ima skrol unutar iste visine (nije odsečen)
              skrol: p ? p.scrollHeight > p.clientHeight + 1 && getComputedStyle(p).overflowY === 'auto' && p.tabIndex === 0 : false, ima: !!e }
            })
            stanja++
            if (!v.ima) odsecenja.push(`${w} ${ugao} ${korak}.${n}${grana}: nema donje trake`)
            if (v.odsecen) odsecenja.push(`${w}x${h} ${ugao} ${korak}.${n}${grana} ${ekran}`)
            beleska(v.v, `${ugao} ${korak}.${n}${grana} ${ekran}`)
          }
        }
      }
    }
  const razlicite = [...visine.keys()].sort((a, b) => a - b)
  if (process.env.IZVESTAJ) console.log(`${w}x${h}: visine ${razlicite.join(' / ')} px (${stanja} stanja)`)
  proveri(`${w}x${h}: opis koraka nije odsečen i traka postoji (${stanja} stanja)`, odsecenja.length === 0, [...new Set(odsecenja)].slice(0, 6).join('; '))
  proveri(`${w}x${h}: visina trake je ista u svim stanjima (${razlicite.join(' / ')} px)`, razlicite.length === 1, razlicite.map((v) => `${v}: ${visine.get(v).join('; ')}`).join(' | '))
  sviProblemi.push(...problemi)
  await browser.close()
  await sleep(50)
}
zatvori()
const ok = izvestaj('e2e-visina-trake', lista, sviProblemi, [])
process.exit(ok ? 0 : 1)
