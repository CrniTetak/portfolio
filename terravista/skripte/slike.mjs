// SLIKE PROGRAMA (PLAN B7.3): Commons → bela lista licenci → WebP po namenama. Samo razvoj; ne ide u build.
//
// Ulaz:  skripte/slike-izvor.json  [{ id, commons, alt, emisije: [id emisije], fokus: [x, y] }]
// Izlaz: izvor-slika/<id>.<ext>             preuzeta umanjena slika (van git-a i van builda)
//        public/slike/<id>.webp             16:9, 1920 × 1080 (jedan fajl; manje namene se prave u talasima po potrebi)
//        src/podaci/slike-evidencija.json   autor, licenca, stranica izvora (tekst), datum provere, alt, emisije
//        docs/SLIKE.md                      ista evidencija; pregled sadržaja (lica, logoi, natpisi) dopisuje ČOVEK
//
// Pravila: samo licence sa bele liste (src/pravila/licence.ts: CC0, javno vlasništvo, CC BY, CC BY-SA); sve ostalo se odbija i ne preuzima.
// Jedan zahtev po jedan, pauza ≥ 1 s, User-Agent koji imenuje alat, bez ličnog e-maila. Ako Commons nije dostupan — ostaju samo gradijenti.
// Pokretanje: npm run slike
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { CHROME, ucitajModule } from './_zajednicko.mjs'
import { API, podaciODatoteci, zahtev } from './commons.mjs'

const KOREN = fileURLToPath(new URL('..', import.meta.url))
const IZVOR_JSON = join(KOREN, 'skripte', 'slike-izvor.json')
const IZVOR = join(KOREN, 'izvor-slika')
const JAVNO = join(KOREN, 'public', 'slike')
const EVIDENCIJA_JSON = join(KOREN, 'src', 'podaci', 'slike-evidencija.json')
const EVIDENCIJA_MD = join(KOREN, 'docs', 'SLIKE.md')
const SIRINA = 1920
const VISINA = 1080

async function umanjenaAdresa(naslov) {
  const url = `${API}?action=query&format=json&formatversion=2&titles=${encodeURIComponent(naslov)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=${SIRINA}`
  const j = await zahtev(url)
  const i = j.query?.pages?.[0]?.imageinfo?.[0]
  if (!i) throw new Error('nema podataka o slici')
  return { adresa: i.thumburl ?? i.url, mime: i.thumbmime ?? i.mime }
}

/** Isecanje na 16 : 9 oko zadatog središta i umanjenje na 1920 × 1080 (WebP) preko lokalnog Chrome-a. */
async function uWebp(buffer, mime, fokus) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    const r = await page.evaluate(
      async (ulaz, tip, f, sir, vis) => {
        const img = new Image()
        img.src = `data:${tip};base64,${ulaz}`
        await img.decode()
        const odnos = sir / vis
        let sw = img.naturalWidth
        let sh = sw / odnos
        if (sh > img.naturalHeight) {
          sh = img.naturalHeight
          sw = sh * odnos
        }
        const sx = Math.max(0, Math.min(img.naturalWidth - sw, f[0] * img.naturalWidth - sw / 2))
        const sy = Math.max(0, Math.min(img.naturalHeight - sh, f[1] * img.naturalHeight - sh / 2))
        const c = document.createElement('canvas')
        c.width = sir
        c.height = vis
        const ctx = c.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sir, vis)
        const blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.78))
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let s = ''
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return btoa(s)
      },
      buffer.toString('base64'),
      mime,
      fokus,
      SIRINA,
      VISINA,
    )
    return Buffer.from(r, 'base64')
  } finally {
    await browser.close()
  }
}

/** Uklanja sliku: stavku iz evidencije i fajlove iz public/slike/ i izvor-slika/ (odbijena ili izbačena iz spiska). */
function ukloni(id, fajl) {
  rmSync(join(JAVNO, fajl ?? `${id}.webp`), { force: true })
  for (const f of existsSync(IZVOR) ? readdirSync(IZVOR) : []) if (f.startsWith(id + '.')) rmSync(join(IZVOR, f), { force: true })
}

async function glavni() {
  const spisak = JSON.parse(readFileSync(IZVOR_JSON, 'utf8'))
  const { m, zatvori } = await ucitajModule({ licence: '/src/pravila/licence.ts' })
  const { licencaDozvoljena, trebaNavodjenje } = m.licence
  mkdirSync(IZVOR, { recursive: true })
  mkdirSync(JAVNO, { recursive: true })
  // spaja se sa postojećom evidencijom (kao logotipi.mjs): ne obrađene stavke i ručno dopisan „pregled“ ostaju
  const postojeca = existsSync(EVIDENCIJA_JSON) ? JSON.parse(readFileSync(EVIDENCIJA_JSON, 'utf8')) : []
  const poId = new Map(postojeca.map((e) => [e.id, e]))
  let odbijeno = 0
  let gresaka = 0
  // stavke koje više nisu u spisku izvora brišu se iz evidencije i sa diska
  const uSpisku = new Set(spisak.map((s) => s.id))
  for (const e of postojeca) {
    if (!uSpisku.has(e.id)) {
      ukloni(e.id, e.fajl)
      poId.delete(e.id)
      console.log(`${e.id}: IZBAČENA iz spiska — uklonjena iz evidencije i sa diska`)
    }
  }
  for (const s of spisak) {
    process.stdout.write(`${s.id}: `)
    try {
      const info = await podaciODatoteci(s.commons)
      if (!['', 'trademarked'].includes(info.ogranicenja)) throw new Error(`neočekivano ograničenje: „${info.ogranicenja}“`)
      if (!licencaDozvoljena(info.licencaKratko)) {
        odbijeno++
        console.log(`ODBIJENA licenca „${info.licencaKratko}“ — ne preuzima se, uklanja se iz evidencije i sa diska`)
        ukloni(s.id, poId.get(s.id)?.fajl)
        poId.delete(s.id)
        continue
      }
      if (!info.autor || info.autor.trim().length < 2) throw new Error('nema autora na Commons-u — slika se odbija (CC BY traži navođenje)')
      const { adresa, mime } = await umanjenaAdresa(info.naslov)
      if (!['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(adresa).hostname)) throw new Error(`neočekivan host: ${new URL(adresa).hostname}`)
      const bin = await zahtev(adresa, true)
      if (bin.length > 15 * 1024 * 1024) throw new Error('slika je prevelika')
      const izvorFajl = `${s.id}.${mime.split('/')[1]}`
      const sha1 = createHash('sha1').update(bin).digest('hex')
      writeFileSync(join(IZVOR, izvorFajl), bin)
      const staro = poId.get(s.id)
      // izmenjen izvor (drugi sadržaj) → ručni pregled više ne važi i mora ponovo
      const pregled = staro && staro.izvorSha1 === sha1 ? staro.pregled : undefined
      if (staro?.pregled && !pregled) console.log('  (izvor je izmenjen: ručni „pregled“ je obrisan, treba ponovo)')
      const webp = await uWebp(bin, mime, s.fokus ?? [0.5, 0.5])
      const fajl = `${s.id}.webp`
      writeFileSync(join(JAVNO, fajl), webp)
      poId.set(s.id, {
        pregled,
        id: s.id,
        fajl,
        izvorFajl,
        izvorSha1: sha1,
        alt: s.alt,
        autor: info.autor.length > 90 ? info.autor.slice(0, 90).replace(/\s+\S*$/, '') + '…' : info.autor, // seče se samo na granici reči
        licenca: info.licencaKratko,
        izvor: decodeURIComponent(info.stranica),
        datumProvere: new Date().toISOString().slice(0, 10),
        emisije: s.emisije,
      })
      console.log(`OK (${info.licencaKratko}${trebaNavodjenje(info.licencaKratko) ? ', traži navođenje autora' : ''}; ${Math.round(webp.length / 1024)} KB)`)
    } catch (e) {
      gresaka++
      console.log('GREŠKA — ' + e.message)
    }
  }
  await zatvori()
  const evidencija = [...poId.values()].map((e) => (e.pregled === undefined ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'pregled')) : e))
  writeFileSync(EVIDENCIJA_JSON, JSON.stringify(evidencija, null, 2) + '\n')
  const ćelija = (x) => String(x ?? '').split('|').join('/').split('\n').join(' ').trim()
  const redovi = evidencija.map((e) => `| ${ćelija(e.id)} | ${ćelija(e.fajl)} | ${ćelija(e.izvor)} | ${ćelija(e.autor)} | ${ćelija(e.licenca)} | ${e.datumProvere} | ${ćelija(e.emisije.join(', '))} | ${ćelija(e.pregled ?? 'čeka pregled sadržaja')} |`)
  writeFileSync(
    EVIDENCIJA_MD,
    `# Slike programa: izvor i licenca (TerraVista demo)

Ovu tabelu piše skripta \`skripte/slike.mjs\` (Wikimedia Commons API; licenca se proverava mašinski prema beloj listi: CC0, javno vlasništvo, CC BY, CC BY-SA). Poslednja kolona („pregled sadržaja“) se dopisuje RUKOM posle gledanja slike: lica, logoi marki, tablice, natpisi.
Slike su isečene na 16 : 9 i umanjene (izmenjeno: isečeno i smanjeno). Adrese su TEKST (demo nema spoljnih linkova). Autor i licenca se navode ispod slike na ekranu (T9) i u spisku izvora (U3, talas 2). Podložno promeni: licencu proveriti ponovo pre javnog prikaza.

| id | fajl | stranica izvora | autor | licenca | provereno | emisije | pregled sadržaja |
|---|---|---|---|---|---|---|---|
${redovi.join('\n')}
`,
  )
  console.log(`Gotovo: ${evidencija.length} slika, odbijeno ${odbijeno}, grešaka ${gresaka}.`)
  process.exit(gresaka || odbijeno ? 1 : 0)
}

if (!existsSync(IZVOR_JSON)) throw new Error('nema skripte/slike-izvor.json')
await glavni()
