// Zajednički upit Commons API-ja (licenca, autor, adresa) — za logotipe (logotipi.mjs) i kasnije slike (slike.mjs). Samo razvoj.
// Pristojnost prema Wikimedia: jedan zahtev po jedan, pauza najmanje 1 s, User-Agent koji imenuje alat.
// Uslove API-ja proveriti na dan preuzimanja: ovo su pravila u trenutku pisanja skripte.
export const API = 'https://commons.wikimedia.org/w/api.php'
export const USER_AGENT = 'TerraVista-demo-build/0.1 (internal prototype)'
const PAUZA_MS = 1100

const spavaj = (ms) => new Promise((r) => setTimeout(r, ms))
let poslednjiZahtev = 0

/** Jedan zahtev po jedan, sa pauzom. `binarno` = vraća Buffer (preuzimanje fajla), inače JSON. */
export async function zahtev(url, binarno = false) {
  const cekaj = poslednjiZahtev + PAUZA_MS - Date.now()
  if (cekaj > 0) await spavaj(cekaj)
  poslednjiZahtev = Date.now()
  const odgovor = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: binarno ? '*/*' : 'application/json' } })
  if (!odgovor.ok) throw new Error(`HTTP ${odgovor.status} za ${url}`)
  return binarno ? Buffer.from(await odgovor.arrayBuffer()) : odgovor.json()
}

const bezHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim()

/** Podaci o datoteci sa Commons-a: licenca (kratko), žig, autor, stranica, direktan URL originala, vreme poslednje izmene, opis. */
export async function podaciODatoteci(datoteka) {
  const naslov = datoteka.startsWith('File:') ? datoteka : `File:${datoteka}`
  const url = `${API}?action=query&format=json&formatversion=2&titles=${encodeURIComponent(naslov)}&prop=imageinfo&iiprop=${encodeURIComponent('url|extmetadata|size|mime|timestamp|sha1')}`
  const j = await zahtev(url)
  const info = j.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) throw new Error(`Datoteka ne postoji na Commons-u: ${naslov}`)
  const m = info.extmetadata ?? {}
  return {
    naslov,
    stranica: info.descriptionurl,
    url: info.url,
    mime: info.mime,
    sirina: info.width,
    visina: info.height,
    vremeOtpremanja: info.timestamp,
    licencaKratko: bezHtml(m.LicenseShortName?.value),
    ogranicenja: bezHtml(m.Restrictions?.value),
    autor: bezHtml(m.Artist?.value) || 'nepoznat autor',
    opis: bezHtml(m.ImageDescription?.value),
    uslovi: bezHtml(m.UsageTerms?.value),
  }
}
