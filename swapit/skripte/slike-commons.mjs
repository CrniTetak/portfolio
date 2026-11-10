// Preuzima fotografije sa Wikimedia Commons-a uz MAŠINSKU PROVERU LICENCE (PLAN B6.1). Samo razvoj; ne ide u build.
//
// Ulaz:  src/podaci/fotografije-izvor.json  (spisak: id slike → naziv datoteke na Commons-u, namena, alt, ekrani)
// Izlaz: izvor-slika/<id>.<ext>  (umanjena slika iz API-ja, ne original; van git-a i van builda)
//        src/podaci/fotografije.ts  (spisak sa autorom, licencom, adresom stranice kao tekstom i datumom provere)
//        docs/FOTOGRAFIJE.md        (tabela; pregled sadržaja — lica, logoi, tablice, natpisi — dopisuje čovek)
//
// Pravila:
//  - Dozvoljene licence (bela lista): CC0, Public domain (PD-self, PD-old…), CC BY 2.0–4.0, CC BY-SA 2.0–4.0.
//    Sve ostalo (GFDL-samo, „fair use“, nepoznato, NC, ND) → slika se odbija i NE preuzima.
//  - Pristojnost prema Wikimedia: jedan zahtev po jedan, pauza najmanje 1 s, User-Agent koji imenuje alat.
//    U User-Agent-u NEMA ličnog e-maila vlasnika; samo naziv alata i javni GitHub profil.
//  - Uslove API-ja i bot-pravila proveriti na dan preuzimanja: ovo su pravila u trenutku pisanja skripte.
//
// Pokretanje:
//   node skripte/slike-commons.mjs                    obrađuje ceo spisak
//   node skripte/slike-commons.mjs bicikl-deciji      samo navedene id-jeve
//   node skripte/slike-commons.mjs --trazi "child bicycle"   ispiše kandidate (naziv datoteke + licenca), ništa ne preuzima
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { licencaDozvoljena } from './licence.mjs'

const KOREN = fileURLToPath(new URL('..', import.meta.url))
const IZVOR_JSON = join(KOREN, 'src', 'podaci', 'fotografije-izvor.json')
const IZLAZ_TS = join(KOREN, 'src', 'podaci', 'fotografije.ts')
const IZLAZ_MD = join(KOREN, 'docs', 'FOTOGRAFIJE.md')
const IZLAZ_SLIKE = join(KOREN, 'izvor-slika')
const API = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT = 'SWAPIT-demo-slike/1.0 (https://github.com/CrniTetak)'
const PAUZA_MS = 1100
const SIRINA = 1600

const spavaj = (ms) => new Promise((r) => setTimeout(r, ms))
let poslednjiZahtev = 0
async function zahtev(url, binarno = false) {
  const cekaj = poslednjiZahtev + PAUZA_MS - Date.now()
  if (cekaj > 0) await spavaj(cekaj)
  poslednjiZahtev = Date.now()
  const odgovor = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: binarno ? 'image/*' : 'application/json' } })
  if (!odgovor.ok) throw new Error(`HTTP ${odgovor.status} za ${url}`)
  return binarno ? Buffer.from(await odgovor.arrayBuffer()) : odgovor.json()
}

const bezHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim()

/** Commons često dodaje tekst iz stranice (npr. „- Wikimedia Commons.(Want to use this image?)“); skida se. */
const ocistiAutora = (a) => {
  const c = a.replace(/\(Want to use this image\?\)/g, '').replace(/\s*-\s*Wikimedia Commons\.?/g, '').replace(/\s*[-–]\s*©.*$/, '').replace(/\s+/g, ' ').trim()
  return c.length > 70 ? c.slice(0, 70).replace(/\s+\S*$/, '') + '…' : c // predugačke potpise sa stranice skraćujemo
}

async function podaciOSlici(datoteka) {
  const naslov = datoteka.startsWith('File:') ? datoteka : `File:${datoteka}`
  const url = `${API}?action=query&format=json&formatversion=2&titles=${encodeURIComponent(naslov)}&prop=imageinfo&iiprop=${encodeURIComponent('url|extmetadata|size|mime')}&iiurlwidth=${SIRINA}`
  const j = await zahtev(url)
  const strana = j.query?.pages?.[0]
  const info = strana?.imageinfo?.[0]
  if (!info) throw new Error(`Datoteka ne postoji na Commons-u: ${naslov}`)
  const m = info.extmetadata ?? {}
  return {
    naslov,
    stranica: info.descriptionurl,
    thumbUrl: info.thumburl ?? info.url,
    mime: info.mime,
    sirina: info.thumbwidth ?? info.width,
    visina: info.thumbheight ?? info.height,
    licencaKratko: bezHtml(m.LicenseShortName?.value),
    licencaUrl: m.LicenseUrl?.value ?? '',
    autor: ocistiAutora(bezHtml(m.Artist?.value)) || 'nepoznat autor',
    opisUslova: bezHtml(m.UsageTerms?.value),
    zahtevaNavodjenje: bezHtml(m.AttributionRequired?.value).toLowerCase() === 'true',
  }
}

async function trazi(termin) {
  const url = `${API}?action=query&format=json&formatversion=2&generator=search&gsrsearch=${encodeURIComponent(termin)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=${encodeURIComponent('url|extmetadata|size')}`
  const j = await zahtev(url)
  for (const s of j.query?.pages ?? []) {
    const i = s.imageinfo?.[0]
    const lic = bezHtml(i?.extmetadata?.LicenseShortName?.value)
    console.log(`${licencaDozvoljena(lic) ? 'OK ' : 'NE '} ${s.title}  [${lic}]  ${i?.width}x${i?.height}`)
  }
}

function zapisiTs(spisak) {
  const red = (f) =>
    `  {\n    id: ${JSON.stringify(f.id)},\n    namene: ${JSON.stringify(f.namene)},\n    fokus: ${JSON.stringify(f.fokus)},\n    namena: ${JSON.stringify(f.namena)},\n    alt: ${JSON.stringify(f.alt)},\n    ekrani: ${JSON.stringify(f.ekrani)},\n    naslovNaCommons: ${JSON.stringify(f.naslov)},\n    stranica: ${JSON.stringify(f.stranica)},\n    autor: ${JSON.stringify(f.autor)},\n    licenca: ${JSON.stringify(f.licencaKratko)},\n    licencaUrl: ${JSON.stringify(f.licencaUrl)},\n    datumProvere: ${JSON.stringify(f.datumProvere)},\n    izmena: ${JSON.stringify(f.izmena)},\n  }`
  const sadrzaj = `// GENERISANO skriptom skripte/slike-commons.mjs (PLAN B6.1) — ne menjati rukom; menja se src/podaci/fotografije-izvor.json pa se skripta pokrene ponovo.
// Svaka slika: fajl u public/slike/, namena, alt, ekrani na kojima se vidi, izvor (naziv i adresa kao TEKST), autor, licenca i datum provere.
// Bela lista licenci: CC0, Public domain, CC BY 2.0–4.0, CC BY-SA 2.0–4.0 (provera: fotografije.test.ts).

export type Namena = 'kartica' | 'detalj' | 'prica' | 'reklama'

export type Fotografija = {
  /** Osnova imena fajla: public/slike/<id>-<namena>-<širina>.webp (npr. bicikli-zid-kartica-400.webp) */
  id: string
  /** Namene koje se prave iz originala (skripte/slike.mjs): kartica 1:1, detalj 4:3, prica 5:7, reklama 16:9. */
  namene: Namena[]
  /** Središte isecanja u originalu (0–1; levo-gore je 0,0). */
  fokus: [number, number]
  namena: string
  alt: string
  ekrani: string[]
  naslovNaCommons: string
  /** Adresa stranice sa opisom na Commons-u; samo TEKST (demo nema spoljnih linkova). */
  stranica: string
  autor: string
  licenca: string
  licencaUrl: string
  datumProvere: string
  izmena: string
}

export const FOTOGRAFIJE: Fotografija[] = [
${spisak.map(red).join(',\n')}${spisak.length ? ',' : ''}
]
`
  writeFileSync(IZLAZ_TS, sadrzaj)
}

function zapisiMd(spisak) {
  const redovi = spisak.map((f) => `| ${f.id} | ${f.namena} | ${f.ekrani.join(', ')} | ${f.naslov} | ${f.stranica} | ${f.autor} | ${f.licencaKratko} | ${f.datumProvere} | ${f.izmena} | ${f.pregled ?? 'čeka pregled sadržaja'} |`)
  const sadrzaj = `# Fotografije: izvor i licenca (SWAPIT demo)

Ovu tabelu piše skripta \`skripte/slike-commons.mjs\` (Wikimedia Commons API; licenca se proverava mašinski). Poslednja kolona („pregled sadržaja“) se dopisuje RUKOM posle gledanja slike: lica, logoi marki, tablice, natpisi (PLAN B5.8: fotografije bez istaknutih logoa, tablice nečitljive).
Dozvoljene licence: CC0, Public domain, CC BY 2.0–4.0, CC BY-SA 2.0–4.0. Slike su umanjene i isečene (izmenjeno: isečeno i smanjeno).
Adrese su TEKST (demo nema spoljnih linkova). Za CC BY i CC BY-SA autor se navodi ispod velike slike u O1 i u spisku „Izvori slika“ (U3, talas 3).

| id | namena | ekrani | naziv na Commons-u | stranica | autor | licenca | provereno | izmena | pregled sadržaja |
|---|---|---|---|---|---|---|---|---|---|
${redovi.join('\n')}
`
  writeFileSync(IZLAZ_MD, sadrzaj)
}

async function glavni() {
  const argumenti = process.argv.slice(2)
  if (argumenti[0] === '--trazi') {
    await trazi(argumenti.slice(1).join(' '))
    return
  }
  const spisakIzvor = JSON.parse(readFileSync(IZVOR_JSON, 'utf8'))
  const izabrani = argumenti.length ? spisakIzvor.filter((s) => argumenti.includes(s.id)) : spisakIzvor
  mkdirSync(IZLAZ_SLIKE, { recursive: true })
  const rezultat = []
  let odbijeno = 0
  for (const s of spisakIzvor) {
    if (!izabrani.includes(s) && argumenti.length) continue
    process.stdout.write(`${s.id}: `)
    const p = await podaciOSlici(s.datoteka)
    if (!licencaDozvoljena(p.licencaKratko)) {
      console.log(`ODBIJENO, licenca „${p.licencaKratko}“ nije na beloj listi (${p.stranica})`)
      odbijeno++
      continue
    }
    const ext = extname(new URL(p.thumbUrl).pathname).toLowerCase() || '.jpg'
    const putanja = join(IZLAZ_SLIKE, `${s.id}${ext}`)
    if (!existsSync(putanja)) writeFileSync(putanja, await zahtev(p.thumbUrl, true))
    console.log(`OK  ${p.licencaKratko} · ${p.autor} · ${p.sirina}x${p.visina} → izvor-slika/${s.id}${ext}`)
    rezultat.push({ id: s.id, namene: s.namene ?? ['kartica'], fokus: s.fokus ?? [0.5, 0.5], namena: s.namena, alt: s.alt, ekrani: s.ekrani ?? [], naslov: p.naslov, stranica: p.stranica, autor: p.autor, licencaKratko: p.licencaKratko, licencaUrl: p.licencaUrl, datumProvere: new Date().toISOString().slice(0, 10), izmena: 'isečeno i smanjeno', pregled: s.pregled })
  }
  if (!argumenti.length) {
    zapisiTs(rezultat)
    zapisiMd(rezultat)
    console.log(`Upisano: ${rezultat.length} slika (odbijeno: ${odbijeno}) → src/podaci/fotografije.ts, docs/FOTOGRAFIJE.md`)
  } else console.log('Zadati su pojedinačni id-jevi: spisak i tabela se NE prepisuju; pokreni bez argumenata za potpun upis.')
  process.exit(odbijeno ? 1 : 0)
}

await glavni()
