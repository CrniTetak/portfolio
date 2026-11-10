// Pretvara originale iz izvor-slika/ (van git-a i van builda) u WebP u public/slike/ po NAMENAMA (PLAN B6.4).
// Koristi lokalni Chrome kroz puppeteer-core (crtanje na platno + izvoz u WebP), bez novog alata (kao AllAddIn1).
// Spisak slika, namene i središte isecanja su u src/podaci/fotografije-izvor.json; ime originala = id slike (izvor-slika/<id>.jpg|png|webp).
//
// Namene i odnosi (širine u px): kartica 1:1 (400, 800) · detalj 4:3 (800, 1600) · prica 5:7 (320, 640) · reklama 16:9 (800).
// Izlaz: public/slike/<id>-<namena>-<širina>.webp. Širina se NIKAD ne uvećava: ako original nije dovoljno velik, ta veličina se preskače.
// Kvalitet ~0,78 (po slici se može spustiti poljem "kvalitet" u fotografije-izvor.json kad je tekstura gusta); neprozirna pozadina. Budžet težine (e2e-tezina): slika za karticu ≤ ~40 KB, za detalj ≤ ~150 KB (upozorava se ovde).
//
// Pokretanje: npm run slike [id ...]
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { CHROME } from './_zajednicko.mjs'

const koren = fileURLToPath(new URL('..', import.meta.url))
const ULAZ = join(koren, 'izvor-slika')
const IZLAZ = join(koren, 'public', 'slike')
const SPISAK = JSON.parse(readFileSync(join(koren, 'src', 'podaci', 'fotografije-izvor.json'), 'utf8'))
const KVALITET = 0.78

const NAMENE = {
  kartica: { razmera: 1, sirine: [400, 800], budzetKb: { 400: 40 } },
  detalj: { razmera: 4 / 3, sirine: [800, 1600], budzetKb: { 800: 150 } },
  prica: { razmera: 5 / 7, sirine: [320, 640], budzetKb: {} },
  reklama: { razmera: 16 / 9, sirine: [800], budzetKb: { 800: 150 } },
}

mkdirSync(IZLAZ, { recursive: true })
const trazene = process.argv.slice(2)
const izabrane = SPISAK.filter((s) => !trazene.length || trazene.includes(s.id))
if (!izabrane.length) {
  console.log('Nema slika za obradu (proveri id u src/podaci/fotografije-izvor.json).')
  process.exit(0)
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')
let prekoBudzeta = false

for (const s of izabrane) {
  const izvorni = ['.jpg', '.jpeg', '.png', '.webp'].map((e) => join(ULAZ, s.id + e)).find((p) => existsSync(p))
  if (!izvorni) {
    console.log(`${s.id}: nema originala u izvor-slika/ (pokreni npm run slike:commons)`)
    prekoBudzeta = true
    continue
  }
  const mime = /\.png$/i.test(izvorni) ? 'image/png' : /\.webp$/i.test(izvorni) ? 'image/webp' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${readFileSync(izvorni).toString('base64')}`
  const namene = (s.namene ?? ['kartica']).map((n) => ({ naziv: n, ...NAMENE[n] }))
  const izlazi = await page.evaluate(
    async (dataUrl, namene, fokus, kvalitet) => {
      const img = new Image()
      img.src = dataUrl
      await img.decode()
      // neprozirna pozadina: providnost se postavlja na potpuno neprozirno, da slika ne izblede
      const izvor = document.createElement('canvas')
      izvor.width = img.naturalWidth
      izvor.height = img.naturalHeight
      const ix = izvor.getContext('2d')
      ix.drawImage(img, 0, 0)
      const pix = ix.getImageData(0, 0, izvor.width, izvor.height)
      for (let k = 3; k < pix.data.length; k += 4) pix.data[k] = 255
      ix.putImageData(pix, 0, 0)
      const rez = []
      for (const n of namene) {
        // najveći isečak tog odnosa sa središtem u „fokusu“ (ograničen na sliku)
        let sw = img.naturalWidth
        let sh = Math.round(sw / n.razmera)
        if (sh > img.naturalHeight) {
          sh = img.naturalHeight
          sw = Math.round(sh * n.razmera)
        }
        const sx = Math.round(Math.min(Math.max(fokus[0] * img.naturalWidth - sw / 2, 0), img.naturalWidth - sw))
        const sy = Math.round(Math.min(Math.max(fokus[1] * img.naturalHeight - sh / 2, 0), img.naturalHeight - sh))
        for (const w of n.sirine) {
          if (w > sw) {
            rez.push({ namena: n.naziv, w, preskoceno: `original daje samo ${sw} px` })
            continue
          }
          const h = Math.round(w / n.razmera)
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const ctx = c.getContext('2d')
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(izvor, sx, sy, sw, sh, 0, 0, w, h)
          const blob = await new Promise((r) => c.toBlob(r, 'image/webp', kvalitet))
          const buf = new Uint8Array(await blob.arrayBuffer())
          let t = ''
          for (let i = 0; i < buf.length; i += 0x8000) t += String.fromCharCode(...buf.subarray(i, i + 0x8000))
          rez.push({ namena: n.naziv, w, h, b64: btoa(t) })
        }
      }
      return { ulaz: `${img.naturalWidth}x${img.naturalHeight}`, rez }
    },
    dataUrl,
    namene,
    s.fokus ?? [0.5, 0.5],
    s.kvalitet ?? KVALITET,
  )
  console.log(`${s.id} (${extname(izvorni)}, ${izlazi.ulaz}):`)
  for (const r of izlazi.rez) {
    if (r.preskoceno) {
      console.log(`  ${r.namena} ${r.w}: preskočeno (${r.preskoceno})`)
      continue
    }
    const putanja = join(IZLAZ, `${s.id}-${r.namena}-${r.w}.webp`)
    writeFileSync(putanja, Buffer.from(r.b64, 'base64'))
    const kb = Math.round(statSync(putanja).size / 1024)
    const granica = NAMENE[r.namena].budzetKb[r.w]
    const upozorenje = granica && kb > granica ? `  <-- iznad budžeta (${granica} KB), spustiti kvalitet` : ''
    if (upozorenje) prekoBudzeta = true
    console.log(`  ${r.namena} ${r.w}x${r.h}: ${kb} KB${upozorenje}`)
  }
}
await browser.close()
process.exit(prekoBudzeta ? 1 : 0)
