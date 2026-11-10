// E2E TEŽINA (PLAN B7.3, B8.2, talas 3): budžet stranice. Prvi prikaz (uvod i početni ekran televizora) ≤ ~1 MB preneto,
// ceo build (dist/) ≤ 3 MB, nijedna pojedinačna slika > 250 KB, nijedan JS fajl > 250 KB (gzip).
// Meri se na preview-u (Vite preview ne kompresuje, pa se prenos računa kao gzip veličina tela odgovora).
// Pokretanje (preview mora da radi; build mora biti svež): npm run e2e:tezina
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { BASE, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { proveri, lista } = proveravac()
const kb = (b) => Math.round(b / 1024)
const BUDZET_PRVI_PRIKAZ = 1024 * 1024
const BUDZET_BUILD = 3 * 1024 * 1024
const BUDZET_SLIKA = 250 * 1024
const BUDZET_JS_GZ = 250 * 1024

// 1) preneta težina prvog prikaza u pregledaču (gzip tela svakog odgovora)
const o = await otvori({ sirina: 1366, visina: 768 })
for (const hash of ['#/', '#/tv/pocetna']) {
  const { page } = o
  const tela = []
  const slusaj = async (r) => {
    try {
      if (!r.url().startsWith(new URL(BASE).origin)) return
      const b = await r.buffer()
      tela.push({ url: r.url().replace(new URL(BASE).origin, ''), gz: gzipSync(b).length })
    } catch {
      /* preusmerenje ili prazno telo */
    }
  }
  const obaveze = []
  page.on('response', (r) => obaveze.push(slusaj(r)))
  await page.goto(BASE + '?t=' + Math.random().toString(36).slice(2) + hash)
  await sleep(800)
  await Promise.all(obaveze)
  page.removeAllListeners('response')
  const ukupno = tela.reduce((a, t) => a + t.gz, 0)
  const najveci = [...tela].sort((a, b) => b.gz - a.gz).slice(0, 3).map((t) => `${t.url} ${kb(t.gz)} KB`)
  proveri(`prvi prikaz ${hash}: ${kb(ukupno)} KB preneto (budžet ${kb(BUDZET_PRVI_PRIKAZ)} KB)`, ukupno <= BUDZET_PRVI_PRIKAZ, najveci.join(', '))
}
await o.browser.close()

// 2) težina builda na disku
const DIST = fileURLToPath(new URL('../' + (process.env.DIST_DIR ?? 'dist') + '/', import.meta.url))
const fajlovi = []
const hodaj = (dir) => {
  for (const ime of readdirSync(dir)) {
    const p = join(dir, ime)
    if (statSync(p).isDirectory()) hodaj(p)
    else fajlovi.push(p)
  }
}
hodaj(DIST)
const velicina = (p) => statSync(p).size
const ukupnoBuild = fajlovi.reduce((a, p) => a + velicina(p), 0)
proveri(`ceo build: ${kb(ukupnoBuild)} KB (budžet ${kb(BUDZET_BUILD)} KB)`, ukupnoBuild <= BUDZET_BUILD)
const slike = fajlovi.filter((p) => /\.(webp|png|jpe?g|svg)$/i.test(p) && /slike|logotipi/.test(p.replaceAll('\\', '/')))
const velike = slike.filter((p) => velicina(p) > BUDZET_SLIKA).map((p) => `${p.slice(DIST.length)} ${kb(velicina(p))} KB`)
proveri(`slike i logotipi (${slike.length} fajlova): nijedan > ${kb(BUDZET_SLIKA)} KB`, velike.length === 0, velike.join(', '))
const jsFajlovi = fajlovi.filter((p) => p.endsWith('.js'))
const teskiJs = jsFajlovi.filter((p) => gzipSync(readFileSync(p)).length > BUDZET_JS_GZ).map((p) => p.slice(DIST.length))
proveri(`JS (${jsFajlovi.length} fajlova): nijedan > ${kb(BUDZET_JS_GZ)} KB gzip`, teskiJs.length === 0, teskiJs.join(', '))
for (const p of lista) console.log('  ' + (p.ok ? 'OK ' : 'X  ') + p.opis)
process.exit(izvestaj('e2e-tezina', lista, o.problemi, o.spoljni) ? 0 : 1)
