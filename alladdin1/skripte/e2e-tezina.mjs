// Budžet težine (PLAN B6) na 360×640: prvi prikaz bilo kog ekrana najviše ~1 MB svih fajlova zajedno (tekst se meri kao gzip, kao na Cloudflare-u),
// pojedinačna slika najviše ~150 KB. Bez keša, svaki ekran u svežoj stranici.
import { gzipSync } from 'node:zlib'
import { BASE, KLJUC, izvestaj, otvori, proveravac, ucitajModule, sleep } from './_zajednicko.mjs'

const BUDZET_UKUPNO = 1024 * 1024
const BUDZET_SLIKA = 150 * 1024
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts' })
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 360, visina: 640, telefon: true })
await page.setCacheEnabled(false)
let najvise = { id: '', bajtova: 0 }
let najvecaSlika = { id: '', bajtova: 0, url: '' }
const tekstualni = /text\/|javascript|json|svg|xml/
for (const ruta of m.rute.RUTE.filter((r) => r.izgradjen)) {
  const uloga = ruta.uloge.includes('guest') ? 'guest' : ruta.uloge[0]
  let ukupno = 0
  const slike = []
  const zadaci = []
  const slusaj = (r) =>
    zadaci.push(
      r.buffer().then((b) => {
        const tip = r.headers()['content-type'] ?? ''
        const n = tekstualni.test(tip) ? gzipSync(b).length : b.length
        ukupno += n
        if (/image\//.test(tip)) slike.push({ url: r.url(), n })
      }).catch(() => {}),
    )
  page.on('response', slusaj)
  await page.evaluateOnNewDocument((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz: { korak: 1, n: 0, ishod: 'A' }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })
  await page.goto(`${BASE}?r=${Math.random()}#${m.rute.link(ruta.id, uloga)}`, { waitUntil: 'load' })
  await sleep(300)
  await Promise.all(zadaci)
  page.off('response', slusaj)
  if (ukupno > najvise.bajtova) najvise = { id: ruta.id, bajtova: ukupno }
  for (const s of slike) if (s.n > najvecaSlika.bajtova) najvecaSlika = { id: ruta.id, bajtova: s.n, url: s.url }
  proveri(`${ruta.id}: prvi prikaz ≤ 1 MB (${Math.round(ukupno / 1024)} KB)`, ukupno <= BUDZET_UKUPNO)
  for (const s of slike) proveri(`${ruta.id}: slika ≤ 150 KB (${s.url.split('/').pop()} ${Math.round(s.n / 1024)} KB)`, s.n <= BUDZET_SLIKA)
}
console.log(`Najteži ekran: ${najvise.id} ${Math.round(najvise.bajtova / 1024)} KB; najteža slika: ${najvecaSlika.url.split('/').pop()} ${Math.round(najvecaSlika.bajtova / 1024)} KB`)
await browser.close()
zatvori()
const ok = izvestaj('e2e-tezina', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
