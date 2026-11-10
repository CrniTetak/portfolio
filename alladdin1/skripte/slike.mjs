// Pretvara originale iz izvor-slika/ (van git-a i van builda) u WebP u public/slike/.
// Koristi lokalni Chrome kroz puppeteer-core (crtanje na platno + izvoz u WebP), bez novog alata.
// Ime originala = id slike iz src/podaci/fotografije.ts (npr. izvor-slika/mermerne-stepenice.png).
// Izlaz: <id>-800.webp i <id>-1600.webp (kartice i hero 16:9, kvalitet ~78); 2400 samo ako original ima dovoljno piksela.
// Širina se NIKAD ne uvećava: ako original nije dovoljno velik, ta veličina se preskače.
// Pokretanje: npm run slike [id ...]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { CHROME } from './_zajednicko.mjs'

const koren = fileURLToPath(new URL('..', import.meta.url))
const ULAZ = join(koren, 'izvor-slika')
const IZLAZ = join(koren, 'public', 'slike')
const SIRINE = [800, 1600, 2400]
const RAZMERA = 16 / 9
const KVALITET = 0.78
const CILJ_KB_800 = 150 // budžet iz B6: pojedinačna slika za telefon najviše ~150 KB

mkdirSync(IZLAZ, { recursive: true })
const trazene = process.argv.slice(2)
const fajlovi = readdirSync(ULAZ).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && (!trazene.length || trazene.includes(basename(f, extname(f)))))
if (!fajlovi.length) {
  console.log('Nema originala u izvor-slika/ (ili ime ne odgovara).')
  process.exit(0)
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')
let prekoBudzeta = false

for (const f of fajlovi) {
  const id = basename(f, extname(f))
  const mime = /\.png$/i.test(f) ? 'image/png' : /\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${readFileSync(join(ULAZ, f)).toString('base64')}`
  const izlazi = await page.evaluate(
    async (dataUrl, sirine, razmera, kvalitet) => {
      const img = new Image()
      img.src = dataUrl
      await img.decode()
      // PNG iz Figme može imati providnost (poluprovidan sloj): slika se postavlja na potpuno neprozirnu, da ne izblede
      const izvor = document.createElement('canvas')
      izvor.width = img.naturalWidth
      izvor.height = img.naturalHeight
      const ix = izvor.getContext('2d')
      ix.drawImage(img, 0, 0)
      const pix = ix.getImageData(0, 0, izvor.width, izvor.height)
      for (let k = 3; k < pix.data.length; k += 4) pix.data[k] = 255
      ix.putImageData(pix, 0, 0)
      // središnje isecanje na 16:9
      let sw = img.naturalWidth
      let sh = Math.round(sw / razmera)
      if (sh > img.naturalHeight) {
        sh = img.naturalHeight
        sw = Math.round(sh * razmera)
      }
      const sx = Math.round((img.naturalWidth - sw) / 2)
      const sy = Math.round((img.naturalHeight - sh) / 2)
      const rez = []
      for (const w of sirine) {
        if (w > sw) {
          rez.push({ w, preskoceno: `original ima samo ${sw} px` })
          continue
        }
        const h = Math.round(w / razmera)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(izvor, sx, sy, sw, sh, 0, 0, w, h)
        const blob = await new Promise((r) => c.toBlob(r, 'image/webp', kvalitet))
        const buf = new Uint8Array(await blob.arrayBuffer())
        let s = ''
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
        rez.push({ w, h, b64: btoa(s) })
      }
      return { ulaz: `${img.naturalWidth}x${img.naturalHeight}`, rez }
    },
    dataUrl,
    SIRINE,
    RAZMERA,
    KVALITET,
  )
  console.log(`${f} (${izlazi.ulaz}):`)
  for (const r of izlazi.rez) {
    if (r.preskoceno) {
      console.log(`  ${r.w}: preskočeno (${r.preskoceno})`)
      continue
    }
    const putanja = join(IZLAZ, `${id}-${r.w}.webp`)
    writeFileSync(putanja, Buffer.from(r.b64, 'base64'))
    const kb = Math.round(statSync(putanja).size / 1024)
    const upozorenje = r.w === 800 && kb > CILJ_KB_800 ? '  <-- iznad budžeta, spustiti kvalitet' : ''
    if (upozorenje) prekoBudzeta = true
    console.log(`  ${r.w}x${r.h}: ${kb} KB${upozorenje}`)
  }
}
await browser.close()
process.exit(prekoBudzeta ? 1 : 0)
