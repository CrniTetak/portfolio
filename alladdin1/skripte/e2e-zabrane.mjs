// Zabrane i sadržajne brave na SVAKOM izgrađenom ekranu × ulogama × ključnim stanjima priče (B7, B8.4) u pravom pregledaču.
// Pokretanje: npm run build ; npm run preview ; npm run e2e:zabrane   (BRZO=1 = samo početno i završno stanje A)
import { BASE, KLJUC, izvestaj, otvori, proveravac, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  rute: '/src/pravila/rute.ts',
  koraci: '/src/prica/koraci.ts',
  stanje: '/src/scenario/stanjeGrupe.ts',
  racun: '/src/scenario/racun.ts',
  ponude: '/src/scenario/ponude.ts',
  strane: '/src/scenario/strane.ts',
  zabrane: '/src/pravila/zabrane.ts',
  foto: '/src/podaci/fotografije.ts',
  tokovi: '/src/tokovi/tokovi.ts',
  format: '/src/scenario/format.ts',
  ocekivano: '/src/scenario/ocekivano.ts',
})
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })

// ---- skup poznatih iznosa: sve što izračunaju racun.ts, stanjeGrupe.ts i ponude.ts (+ zbirovi po putniku)
const poznati = new Set()
const skupi = (o) => {
  if (typeof o === 'number') poznati.add(Math.abs(o))
  else if (Array.isArray(o)) o.forEach(skupi)
  else if (o && typeof o === 'object') Object.values(o).forEach(skupi)
}
skupi(m.racun)
skupi(m.ponude)
const R = m.racun
;[R.AVANS_PO_PUTNIKU + R.RATA2_PO_PUTNIKU, R.RATA2_PO_PUTNIKU + R.RATA3_PO_PUTNIKU, R.CENA_V2, R.CENA_V1, R.DODATAK_V2].forEach((x) => poznati.add(x))
const POZICIJE = []
for (const ishod of ['A', 'B', 'C']) {
  for (let k = ishod === 'A' ? 1 : 7; k <= 9; k++) {
    const duz = m.koraci.brojRadnji(k, ishod)
    for (let n = 0; n <= duz; n++) POZICIJE.push({ korak: k, n, ishod })
  }
}
// iznosi u svakom stanju i izvedeni (sedišta × rata)
for (const p of POZICIJE) {
  const s = m.stanje.stanjeGrupe(p)
  skupi(s)
  skupi(m.stanje.tabla(p))
  skupi(m.stanje.izvod(p))
}

// ---- stanja koja se proveravaju
const KLJUCNA = POZICIJE.filter((p) => {
  const duz = m.koraci.brojRadnji(p.korak, p.ishod)
  return p.n === 0 || p.n === duz || (p.korak === 5 && p.n === 1)
})
// podrazumevano: početno i završno stanje glavnog puta + završna stanja B i C; FULL=1 = sva ključna stanja (dugo traje)
const kraj = (p) => p.n === m.koraci.brojRadnji(p.korak, p.ishod)
const stanja = process.env.FULL ? KLJUCNA : KLJUCNA.filter((p) => (p.ishod === 'A' && (p.n === 0 || kraj(p))) || (p.ishod !== 'A' && kraj(p)))

const ZABRANJENO_PUTNIKU = [...m.strane.LJUDI.putnici, 'Active Bookings', 'Remaining to be Charged', 'Needs your attention', 'Passenger debts']
const sveRute = m.rute.RUTE.filter((r) => r.izgradjen && !['S1', 'S6', 'S7'].includes(r.id))
const bezUloge = ['S1', 'S6', 'S7']
if (sveRute.length + bezUloge.length !== 65) console.log('UPOZORENJE: nisu svih 65 ekrana izgrađeni')
const uslov = (ruta) => (ruta.uloge.length === 4 ? ['organizer', 'traveler', 'advisor', 'guest'] : ruta.uloge)

let brojStranica = 0
const iznosiNepoznati = new Map()
const dozvoljeniIzraz = new Set(m.zabrane.DOZVOLJENI_IZUZECI.map((x) => x.izraz))
const izrazi = m.zabrane.ZABRANJENI_IZRAZI.filter((x) => !dozvoljeniIzraz.has(x))

// ključna polja na PRAVOM mestu: vrednost na ekranu = vrednost izračunata iz scenario/ (G6, G13, V3, T3)
function provera_kljucnih(r, ruta, uloga, poz, d) {
  const f = m.format
  // vrednosti iz ocekivano.ts (prepisane iz UX.md), NEZAVISNE od stanjeGrupe: G6, G13, G14, T6, V3
  const EKRAN_OCEKIVANJA = { g6: 'G6', g13C: 'G13', g14A: 'G14', g14B: 'G14', g14C: 'G14', t6C: 'T6', v3B: 'V3' }
  for (const [kljuc, o] of Object.entries(m.ocekivano.OCEKIVANO_EKRANI)) {
    if (EKRAN_OCEKIVANJA[kljuc] !== ruta.id || o.poz.korak !== poz.korak || o.poz.n !== poz.n || o.poz.ishod !== poz.ishod) continue
    const t = d.tekst.toLowerCase()
    for (const x of o.tekst) r(`${ruta.id} (ocekivano.ts ${kljuc}): prikazuje "${x}"`, t.includes(x.toLowerCase()), '')
    for (const x of o.nema ?? []) r(`${ruta.id} (ocekivano.ts ${kljuc}): ne prikazuje "${x}"`, !t.includes(x.toLowerCase()), '')
  }
  const s = m.stanje.stanjeGrupe(poz)
  if (ruta.id === 'G14' && s.prihvacena) r('G14: ukupno izvoda', d.tekst.includes(f.eur(m.stanje.izvod(poz).ukupno)), '')
  if (ruta.id === 'G6') {
    const t = m.stanje.tabla(poz)
    r('G6: Active Bookings', d.kpi['Active Bookings'] === String(t.aktivne), d.kpi['Active Bookings'])
    r('G6: Remaining to be Charged', d.kpi['Remaining to be Charged'] === f.eur(t.preostaloZaNaplatu), d.kpi['Remaining to be Charged'])
    r('G6: Enrolled passengers', d.kpi['Enrolled passengers'] === f.odOd(t.potvrdjeniPutnici, t.ukupnoSedista), d.kpi['Enrolled passengers'])
  }
  if (ruta.id === 'G13' && s.prihvacena) {
    r('G13: Total paid', d.kpi['Total paid'] === f.eur(s.placeno), d.kpi['Total paid'])
    r('G13: Total package value', d.kpi['Total package value'] === (s.otkazano ? '—' : f.eur(s.vrednostBloka)), d.kpi['Total package value'])
    r('G13: Remaining to collect', d.kpi['Remaining to collect'] === (s.otkazano ? '—' : f.eur(s.preostalo)), d.kpi['Remaining to collect'])
    r('G13: Issued invoices', d.kpi['Issued invoices'] === String(s.fakture), d.kpi['Issued invoices'])
  }
  if (ruta.id === 'V3' && s.prihvacena) {
    r('V3: Installment 2 paid', d.kpi['Installment 2 paid'] === f.odOdIli(s.otkazano, s.rata2Sedista, s.blokSedista), d.kpi['Installment 2 paid'])
    r('V3: Enrolled', d.kpi['Enrolled'] === f.odOdIli(s.otkazano, s.upisano, s.blokSedista), d.kpi['Enrolled'])
  }
  if (ruta.id === 'T3' && s.marko.upisan && !s.otkazano && !s.marko.rata3Placena) {
    const ocek = f.eur(s.marko.rata2Placena ? m.racun.RATA3_PO_PUTNIKU : m.racun.RATA2_PO_PUTNIKU)
    r('T3: dugme "Pay EUR …" nosi iznos tekuće rate', d.dugmeCena.length === 1 && d.dugmeCena[0] === 'Pay ' + ocek, d.dugmeCena.join('|'))
  }
}

async function pregledaj(ruta, uloga, poz) {
  const kontekst = `${ruta.id}/${uloga}/${poz.korak}.${poz.n}${poz.ishod}`
  const d = await page.evaluate(async () => {
    // lazy slike van ekrana se učitavaju na zahtev: za proveru se učitaju odmah
    await Promise.all([...document.querySelectorAll('img')].map((i) => (i.loading === 'lazy' && !i.complete ? ((i.loading = 'eager'), i.decode().catch(() => {})) : null)))
    const vidljiv = (e) => !!e && e.getClientRects().length > 0
    const traka = document.querySelector('[data-oznaka-demoa]')
    const rb = traka?.getBoundingClientRect()
    const podnozje = document.querySelector('[data-podnozje]')
    return {
      tekst: document.body.innerText,
      forme: document.querySelectorAll('form').length,
      stikliranih: document.querySelectorAll('input[type=checkbox]:checked:not(:disabled)').length,
      losiUnos: [...document.querySelectorAll('input')].filter((i) => !['checkbox', 'radio'].includes(i.type)).length,
      textarea: document.querySelectorAll('textarea').length,
      lozinka: document.querySelectorAll('input[type=password]').length,
      name: document.querySelectorAll('input[name], select[name], button[name], textarea[name]').length,
      autocomplete: document.querySelectorAll('[autocomplete]').length,
      losiHref: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('#')),
      trakaVidljiva: vidljiv(traka) && rb.top >= 0 && rb.bottom <= innerHeight,
      podnozje: !!podnozje && podnozje.textContent.includes('18+') && podnozje.textContent.includes('Play responsibly'),
      organizator: !!document.querySelector('[data-organizator]'),
      partner18: !!document.querySelector('[data-partner18]'),
      prazno: !!document.querySelector('[data-prazno]'),
      slike: [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.getAttribute('alt') })),
      kpi: Object.fromEntries([...document.querySelectorAll('[data-kpi]')].map((e) => [e.getAttribute('data-kpi'), (e.querySelector('.num')?.textContent ?? '').trim()])),
      dugmeCena: [...document.querySelectorAll('button')].filter((b) => /^Pay EUR/.test(b.textContent.trim())).map((b) => b.textContent.trim()),
      brendVelikim: [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).textTransform === 'uppercase' && [...e.childNodes].some((n) => n.nodeType === 3 && /AllAddIn1/i.test(n.textContent))).length,
      csp: window.__csp ?? [],
      zaglavljeTekst: document.querySelector('[data-zaglavlje]')?.textContent ?? '',
    }
  })
  const r = (opis, uslov, detalj = '') => proveri(`${kontekst}: ${opis}`, uslov, detalj)
  r('nijedna kvačica nije unapred štiklirana', d.stikliranih === 0, String(d.stikliranih))
  r('nema <form>', d.forme === 0)
  r('nema pravog polja za kucanje', d.losiUnos === 0 && d.textarea === 0 && d.lozinka === 0)
  r('nema name ni autocomplete na kontrolama', d.name === 0 && d.autocomplete === 0)
  r('svi linkovi počinju sa #', d.losiHref.length === 0, d.losiHref.join(','))
  r('oznaka demoa vidljiva bez skrolovanja', d.trakaVidljiva)
  r('podnožje ima 18+ i Play responsibly', d.podnozje)
  if (ruta.cena && !d.prazno) {
    r('ekran sa cenom ima red organizatora', d.organizator)
    r('ekran sa cenom ima "Not an offer"', /Not an offer/.test(d.tekst))
  }
  if (ruta.kazino && !d.prazno) r('kazino ekran ima traku partnera 18+', d.partner18)
  const nadjeni = izrazi.filter((x) => new RegExp(`(^|[^A-Za-z0-9])${x.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^A-Za-z0-9])`, 'i').test(d.tekst))
  r('nema zabranjenih izraza', nadjeni.length === 0, nadjeni.join(', '))
  for (const mt of d.tekst.matchAll(/\+?EUR\s?[−-]?(\d[\d,]*)(\.\d+)?/g)) {
    const n = Number(mt[1].replace(/,/g, ''))
    if (!poznati.has(n)) iznosiNepoznati.set(`${n} @ ${kontekst}`, mt[0])
  }
  for (const s of d.slike) {
    const ime = decodeURIComponent(s.src.split('/').pop()).replace(/-\d+\.webp$/, '')
    r('slika je sa sopstvene adrese i u spisku', s.src.startsWith(new URL(BASE).origin) && m.foto.FOTOGRAFIJE.some((f) => f.id === ime) && s.ok && (s.alt ?? '').length > 0, JSON.stringify(s))
  }
  if (uloga === 'traveler') r('ugao putnika: nema tuđih putnika ni pločica organizatora', !ZABRANJENO_PUTNIKU.some((z) => d.tekst.includes(z)), ZABRANJENO_PUTNIKU.filter((z) => d.tekst.includes(z)).join(', '))
  if (uloga === 'guest') r('gost u zaglavlju nema ime osobe', ![m.strane.LJUDI.organizator.ime, m.strane.LJUDI.putnik.ime, m.strane.LJUDI.savetnik.ime].some((z) => d.zaglavljeTekst.includes(z)))
  r('naziv brenda se ne prikazuje velikim slovima (text-transform)', d.brendVelikim === 0, String(d.brendVelikim))
  const nula = d.tekst.match(/.{0,15}\/ 0\b.{0,10}/)
  r('nema "/ 0" (npr. "96 / 0") ni "Seats left: 120" posle otkaza', !nula && !(poz.ishod === 'C' && poz.korak >= 7 && poz.n === m.koraci.brojRadnji(poz.korak, 'C') && /Seats left: 120/.test(d.tekst)), nula ? nula[0] : '')
  r('nema "Pay … now"', !/\bPay\b.{0,30}\bnow\b/i.test(d.tekst))
  if (ruta.izgradjen) r('izgrađen ekran nema "Coming soon"', !/Coming soon/.test(d.tekst))
  provera_kljucnih(r, ruta, uloga, poz, d)
  r('nema CSP prijava', d.csp.length === 0, d.csp.join('; '))
  brojStranica++
}

await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
let brojac = 0
// stanja slobodnih tokova (pored stanja priče): ništa, usred toka, sve završeno
const T0 = m.tokovi.POCETNI_TOKOVI
const TOK_STANJA = [
  { ...T0, monteKarlo: 'ponuda', konsijerz: 'zatrazeno', transport: 'ponuda', poslednji: 'royal' },
  // usred toka + dva zahteva bez punog toka (događaj iz M8 i paket iz S8), odbijena ponuda transporta u sledećem stanju
  { ...T0, monteKarlo: 'prihvaceno', konsijerz: 'prihvaceno', transport: 'zatrazeno', zahtevi: ['e2', 'vegas'], poslednji: 'vegas', s8Kljuc: 'vegas', mkDogadjaj: 'e2' },
  { ...T0, krstarenje: 'placeno', monteKarlo: 'odbijeno', konsijerz: 'odbijeno', transport: 'odbijeno', zahtevi: ['aegean', 'e1', 'e3'], poslednji: 'e3', usluga: 1 },
  { ...T0, krstarenje: 'placeno', monteKarlo: 'potvrdjeno', konsijerz: 'placeno', transport: 'prihvaceno', clanstvo: 'prijavljeno', usluga: 2, savetnik: 1 },
]
const SVA_STANJA = [...stanja.map((poz) => ({ poz, tokovi: T0 })), ...TOK_STANJA.map((tokovi) => ({ poz: { korak: 1, n: 0, ishod: 'A' }, tokovi }))]
let redniBroj = 0
for (const { poz, tokovi } of SVA_STANJA) {
  console.log(`[${++redniBroj}/${SVA_STANJA.length}] stanje ${poz.korak}.${poz.n}${poz.ishod}, stranica do sada ${brojStranica}`)
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz, rezim: 'guided', potvrda18: true, poruke: { slobodno: true }, tokovi })
  for (const ruta of sveRute) {
    for (const uloga of uslov(ruta)) {
      await page.goto(`${BASE}?r=${++brojac}#${m.rute.link(ruta.id, uloga)}`, { waitUntil: 'networkidle0', timeout: 15000 }).catch((e) => proveri(`${ruta.id}/${uloga}: učitavanje prekoračilo rok (${e.message})`, false))
      await pregledaj(ruta, uloga, poz)
    }
  }
  // S1, S6, S7 i ostale javne strane bez uloge u linku
  for (const h of ['/', '/legal/terms', '/legal/privacy', '/legal/responsible', '/legal/contact', '/about']) {
    await page.goto(`${BASE}?r=${++brojac}#${h}`, { waitUntil: 'networkidle0', timeout: 15000 }).catch((e) => proveri(`${h}: učitavanje prekoračilo rok (${e.message})`, false))
    const ruta = m.rute.RUTE.find((x) => x.id === (h === '/' ? 'S1' : h === '/about' ? 'S7' : 'S6'))
    await pregledaj(ruta, 'guest', poz)
  }
}
for (const [k, v] of iznosiNepoznati) proveri(`nepoznat iznos ${v} (${k})`, false, 'iznos nije izračunat iz scenario/')
proveri('popis EUR iznosa: svaki iznos na ekranima je izračunat iz scenario/', iznosiNepoznati.size === 0)
console.log(`Pregledano stranica: ${brojStranica}, stanja: ${stanja.length}, poznatih iznosa: ${poznati.size}`)

await browser.close()
zatvori()
const ok = izvestaj('e2e-zabrane', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
