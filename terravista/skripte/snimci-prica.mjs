// SNIMCI PRIČE (talas 1): ključne pozicije vođene priče (obe grane) na laptopu 1366×768 i na telefonu. Piše u _snimci/ (van git-a).
// Pokretanje (preview mora da radi): MSYS_NO_PATHCONV=1 node skripte/snimci-prica.mjs [prefiks]
import { mkdirSync } from 'node:fs'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const IZLAZ = new URL('../_snimci/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(IZLAZ, { recursive: true })
const prefiks = process.argv[2] ?? 'talas1'
const { m, zatvori } = await ucitajModule({ matrica: '/src/prica/matrica.ts' })
const { stanjeZa } = m.matrica
await zatvori()

// [naziv, korak, p, grana]
const POZICIJE = [
  ['k1-t1-pocetak', 1, 0, 'grcka'],
  ['k2-t2-besplatni', 2, 0, 'grcka'],
  ['k2-t9-gledanje-slika', 2, 1, 'grcka'],
  ['k2-t10-reklama', 2, 2, 'grcka'],
  ['k3-t5-po-izboru', 3, 0, 'grcka'],
  ['k3-t8-doma', 3, 1, 'grcka'],
  ['k4-t13-qr', 4, 1, 'grcka'],
  ['k4-p2-skeniranje', 4, 2, 'grcka'],
  ['k7-t19-pretplate-7-1', 7, 1, 'grcka'],
  ['k4-p3-narudzba', 4, 3, 'grcka'],
  ['k4-p3-stiklirano', 4, 4, 'grcka'],
  ['k4-p4-placanje', 4, 5, 'grcka'],
  ['k4-p5-aktivno', 4, 6, 'grcka'],
  ['k4-t14-otkljucano', 4, 7, 'grcka'],
  ['k5-t15-paketi', 5, 0, 'grcka'],
  ['k5-t16-paket', 5, 1, 'grcka'],
  ['k5-t16-pretplacen', 5, 6, 'grcka'],
  ['k6-t25-zemlja', 6, 0, 'grcka'],
  ['k6-t26-grcka', 6, 1, 'grcka'],
  ['k6-t27-srbija', 6, 1, 'srbija'],
  ['k6-t12-nedostupno', 6, 2, 'srbija'],
  ['k7-t19-pretplate', 7, 0, 'grcka'],
  ['k7-t20-otkazano', 7, 1, 'grcka'],
  ['k7-p8-pretplate', 7, 2, 'grcka'],
  ['k7-p9-otkaz', 7, 3, 'grcka'],
  ['k7-p10-otkazano', 7, 4, 'grcka'],
]

const { proveri, lista } = proveravac()
const svi = { problemi: [], spoljni: [] }
for (const [sirina, visina, telefon, oznaka, usko] of [[1366, 768, false, 'laptop-1366', false], [390, 844, true, 'telefon-390', true]]) {
  const { browser, page, problemi, spoljni } = await otvori({ sirina, visina, telefon })
  await page.goto(BASE + '#/')
  for (const [naziv, k, p, grana] of POZICIJE) {
    if (usko && !/k4-p[2-5]|k7-p|k2-t9|k4-t13|k6-t12/.test(naziv)) continue
    const st = stanjeZa(k, p, grana)
    await page.evaluate(([kljuc, v]) => sessionStorage.setItem(kljuc, JSON.stringify(v)), [KLJUC, { verzija: 1, korak: k, p, grana, rezim: 'vodjena', kakoViđeno: k !== 1 }])
    const telUUskom = usko && st.tel !== '/pocetna'
    const hash = st.tv.startsWith('/tv') ? `#${st.tv}?${telUUskom ? 'uredjaj=tel&' : ''}tel=${st.tel}` : `#${st.tv}`
    // svež dokument sa jedinstvenim upitom (bez trke: stara stranica ne sme da prepiše sessionStorage pre učitavanja)
    await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
    await sleep(600)
    await page.screenshot({ path: `${IZLAZ}${prefiks}-${oznaka}-${naziv}.png` })
  }
  svi.problemi.push(...problemi)
  svi.spoljni.push(...spoljni)
  await browser.close()
}
proveri('snimci su napravljeni bez grešaka u konzoli i bez spoljnih poziva', true)
console.log('Snimci su u', IZLAZ)
process.exit(izvestaj('snimci-prica', lista, svi.problemi, svi.spoljni) ? 0 : 1)
