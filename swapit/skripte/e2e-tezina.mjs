// Budžet težine (PLAN B6.4) na 360×640: prvi prikaz bilo kog ekrana najviše ~1 MB svih fajlova zajedno (tekst se meri kao gzip, kao na Cloudflare-u),
// pojedinačna slika najviše 150 KB (slika za karticu 400 px ≤ 40 KB se proverava u skripti za slike). Bez keša, svaki ekran u svežoj stranici.
// Posebno se meri glavni JS paket (gzip) i najteži ekran. Pokretanje: npm run build ; npm run preview ; npm run e2e:tezina
import { gzipSync } from 'node:zlib'
import { KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule, BASE } from './_zajednicko.mjs'
import { POCETNO } from './_stanje.mjs'

const BUDZET_UKUPNO = 1024 * 1024
const BUDZET_SLIKA = 150 * 1024
const BUDZET_KARTICA = 40 * 1024
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 360, visina: 640, telefon: true })
await page.setCacheEnabled(false)
let najvise = { id: '', bajtova: 0 }
let najvecaSlika = { id: '', bajtova: 0, url: '' }
let najveciJs = { ime: '', bajtova: 0 }
const tekstualni = /text\/|javascript|json|svg|xml/
let ekrana = 0
for (const ruta of m.rute.RUTE) {
  const ugao = ruta.uglovi[0] ?? 'ana'
  let ukupno = 0
  const slike = []
  const zadaci = []
  const slusaj = (r) =>
    zadaci.push(
      r
        .buffer()
        .then((b) => {
          const tip = r.headers()['content-type'] ?? ''
          const n = tekstualni.test(tip) ? gzipSync(b).length : b.length
          ukupno += n
          if (/image\//.test(tip)) slike.push({ url: r.url(), n })
          if (/javascript/.test(tip) && n > najveciJs.bajtova) najveciJs = { ime: r.url().split('/').pop(), bajtova: n }
        })
        .catch(() => {}),
    )
  page.on('response', slusaj)
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { ...POCETNO, poz: { korak: 1, n: 0, grana: 'lanac' } })
  ukupno = 0
  slike.length = 0
  zadaci.length = 0
  await page.setCacheEnabled(false)
  await page.goto(`${BASE}?r=${Math.random().toString(36).slice(2, 8)}#${m.rute.link(ruta.id, ugao)}`, { waitUntil: 'load' })
  // sporo skrolovanje do kraja: lenje slike se učitavaju samo kad se približe, a „prvi prikaz“ je ono što korisnik vidi bez skrola
  await sleep(450)
  await Promise.all(zadaci)
  page.off('response', slusaj)
  ekrana++
  if (process.env.PROGRES) console.log(ruta.id, Math.round(ukupno / 1024) + ' KB')
  if (ukupno > najvise.bajtova) najvise = { id: ruta.id, bajtova: ukupno }
  for (const s of slike) if (s.n > najvecaSlika.bajtova) najvecaSlika = { id: ruta.id, bajtova: s.n, url: s.url }
  proveri(`${ruta.id}: prvi prikaz ≤ 1 MB (${Math.round(ukupno / 1024)} KB)`, ukupno <= BUDZET_UKUPNO)
  for (const s of slike) {
    proveri(`${ruta.id}: slika ≤ 150 KB (${s.url.split('/').pop()} ${Math.round(s.n / 1024)} KB)`, s.n <= BUDZET_SLIKA)
    if (/-kartica-400\.webp$/.test(s.url)) proveri(`${ruta.id}: slika kartice 400 px ≤ 40 KB (${s.url.split('/').pop()} ${Math.round(s.n / 1024)} KB)`, s.n <= BUDZET_KARTICA)
  }
}
console.log(`Izmereno ${ekrana} ekrana. Najteži prvi prikaz: ${najvise.id} ${Math.round(najvise.bajtova / 1024)} KB; najteža slika: ${najvecaSlika.url.split('/').pop()} ${Math.round(najvecaSlika.bajtova / 1024)} KB; najveći JS (gzip): ${najveciJs.ime} ${Math.round(najveciJs.bajtova / 1024)} KB`)
await browser.close()
zatvori()
const ok = izvestaj('e2e-tezina', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
