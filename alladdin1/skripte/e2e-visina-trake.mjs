// Visina trake priče (računar) i doka (telefon) mora biti ISTA (±0 px) bez obzira na ulogu, korak, ishod (A/B/C), početak/kraj koraka,
// na ekranu priče ili van njega ("Back to story") i režim Guided/Free. Provera po širini i režimu; `IZVESTAJ=1` štampa i tabelu min/max.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts', koraci: '/src/prica/koraci.ts', matrica: '/src/pravila/matrica.ts' })
const { lista, proveri } = proveravac()
const ULOGE = ['organizer', 'traveler', 'advisor']
const SIRINE = [
  [1280, 800, false],
  [1440, 900, false],
  [1024, 768, false],
  [390, 844, true],
  [360, 640, true],
]
const POZICIJE = []
for (const ishod of ['A', 'B', 'C']) for (let k = ishod === 'A' ? 1 : 7; k <= 9; k++) for (const n of [0, m.koraci.brojRadnji(k, ishod)]) POZICIJE.push({ korak: k, n, ishod })

for (const [w, h, tel] of SIRINE) {
  const { browser, page } = await otvori({ sirina: w, visina: h, telefon: tel })
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  for (const rezim of ['guided', 'free']) {
    const visine = new Map()
    const odsecenja = []
    const zabelezi = (v, opis) => {
      if (!visine.has(v)) visine.set(v, [])
      if (visine.get(v).length < 3) visine.get(v).push(opis)
    }
    for (const uloga of ULOGE)
      for (const poz of POZICIJE)
        for (const naEkranu of [true, false]) {
          const pocetni = m.matrica.celija(poz.korak, uloga, poz.ishod)
          const ekran = naEkranu ? (poz.n === 0 ? pocetni.pocetno.ekran : (pocetni.zavrsno?.ekran ?? pocetni.pocetno.ekran)) : 'S2'
          await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz, rezim, potvrda18: true, poruke: { slobodno: true } })
          await page.goto(`${BASE}?r=${Math.random()}#${m.rute.link(ekran, uloga)}`, { waitUntil: 'load' })
          await sleep(120)
          const v = await page.evaluate(() => {
            const e = document.querySelector('[data-donji]')
            const p = document.querySelector('[data-tekst-price]')
            return { v: e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : 0, odsecen: p ? p.scrollHeight > p.clientHeight + 1 : false, tekst: p?.textContent.length ?? 0 }
          })
          if (v.odsecen) odsecenja.push(`${w}x${h} ${uloga} ${poz.korak}.${poz.n}${poz.ishod}`)
          zabelezi(v.v, `${uloga} ${poz.korak}.${poz.n}${poz.ishod} ${naEkranu ? 'na' : 'van'} ${ekran}`)
        }
    const razlicite = [...visine.keys()].sort((a, b) => a - b)
    if (process.env.IZVESTAJ) console.log(`${w}x${h} ${rezim}: visine ${razlicite.join(' / ')} px` + (razlicite.length > 1 ? ' | primeri: ' + razlicite.map((v) => `${v}: ${visine.get(v).join('; ')}`).join(' | ') : ''))
    proveri(`${w}x${h} ${rezim}: opis koraka nije odsečen (stane u fiksne redove)`, odsecenja.length === 0, [...new Set(odsecenja)].slice(0, 6).join('; '))
    proveri(`${w}x${h} ${rezim}: visina trake je ista u svim stanjima (${razlicite.join(' / ')} px)`, razlicite.length === 1, razlicite.map((v) => `${v}: ${visine.get(v).join('; ')}`).join(' | '))
  }
  await browser.close()
}
zatvori()
const ok = izvestaj('e2e-visina-trake', lista, [], [])
process.exit(ok ? 0 : 1)
