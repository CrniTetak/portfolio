// Zabrane i sadržajne brave na SVAKOM izgrađenom ekranu × uglovima × ključnim stanjima priče (PLAN B7, B8) u pravom pregledaču.
// Proverava: nema <form>, polja za kucanje (osim pretrage), name/autocomplete, spoljnih linkova; obavezne kvačice nisu unapred štiklirane;
// oznaka demoa i podnožje; zabranjeni izrazi; oznake Građanin/Firma, „Istaknuto · plaćeno“, „Sponzorisano“; telefon tek u X8; približna lokacija;
// popis „… din“ i „… poena“ (svaki iznos mora biti izračunat u scenario/); i RADNJE VAN KORAKA / UGLA su neaktivne (dugme je aktivno samo ako reducer dozvoljava).
// Talas 3: svih 84 ekrana je izgrađeno; pored ključnih stanja priče proverava se i režim „Slobodno klikanje“ sa bogatim slobodnim tokovima, svi oglasi (O1),
// sve kategorije (P7), svi korisnici (N1, N4), sve firme (F4), sve priče (P8) i sve svrhe plaćanja (Z3, Z4) u uglovima koji ih smeju.
// Pokretanje: npm run build ; npm run preview ; npm run e2e:zabrane   (FULL=1 = sva stanja priče)
import { BASE, KLJUC, izvestaj, otvori, proveravac, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  rute: '/src/pravila/rute.ts',
  koraci: '/src/prica/koraci.ts',
  reducer: '/src/prica/reducer.ts',
  zabrane: '/src/pravila/zabrane.ts',
  svet: '/src/scenario/svet.ts',
  foto: '/src/podaci/fotografije.ts',
  cene: '/src/scenario/cene.ts',
  strane: '/src/scenario/strane.ts',
  pomocno: '/src/scenario/pomocno.ts',
  poslovno: '/src/scenario/poslovno.ts',
  oper: '/src/tokovi/operacije.ts',
  tokovi: '/src/tokovi/tokovi.ts',
})
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
const origin = new URL(BASE).origin

// ---- poznati iznosi: sve cene, vrednosti poena i poeni korisnika u svim stanjima
const poznati = new Set()
const skupi = (o) => {
  if (typeof o === 'number') poznati.add(Math.abs(o))
  else if (Array.isArray(o)) o.forEach(skupi)
  else if (o && typeof o === 'object') Object.values(o).forEach(skupi)
}
skupi(m.cene.CENE)
skupi(m.cene.VREDNOSTI_POENA)
poznati.add(m.cene.POCETNI_POENI)
for (const p of m.pomocno.svePozicije()) {
  const s = m.svet.svet(p)
  for (const k of Object.values(s.korisnici)) poznati.add(k.poeni)
  // izvedeni iznosi akcije (prijave × popust po biciklu, naknada) računaju se u svet(), pa su poznati
  if (s.akcija) {
    poznati.add(s.akcija.izdatiPopusti)
    poznati.add(s.akcija.naknada)
  }
}
for (const o of m.svet.svet({ korak: 1, n: 0, grana: 'lanac' }).oglasi) if (o.vrednostPoena) poznati.add(o.vrednostPoena)

const sva = m.pomocno.svePozicije()
const kljucna = sva.filter((p) => {
  const duz = m.koraci.brojRadnji(p.korak, p.grana)
  return p.n === 0 || p.n === duz
})
const BRZA = [
  { korak: 1, n: 0, grana: 'lanac' },
  { korak: 3, n: 0, grana: 'lanac' },
  { korak: 4, n: 2, grana: 'lanac' },
  { korak: 5, n: 5, grana: 'lanac' },
  { korak: 7, n: 6, grana: 'lanac' },
  { korak: 8, n: 5, grana: 'lanac' },
  { korak: 8, n: m.koraci.brojRadnji(8, 'poeni'), grana: 'poeni' },
  // talas 2: Moderacija (4, 5), račva „za poene“ (6R, 7R), korak 9 (Prodavnica, akcija, reklama)
  { korak: 4, n: 0, grana: 'lanac' },
  { korak: 5, n: 0, grana: 'lanac' },
  { korak: 6, n: 2, grana: 'poeni' },
  { korak: 7, n: 1, grana: 'poeni' },
  { korak: 7, n: 3, grana: 'poeni' },
  { korak: 8, n: 0, grana: 'poeni' },
  { korak: 9, n: 0, grana: 'lanac' },
  { korak: 9, n: 4, grana: 'lanac' },
  { korak: 9, n: m.koraci.brojRadnji(9, 'lanac'), grana: 'lanac' },
]
// slobodni tokovi: bogato stanje (novi oglasi, ponuda, razmena do kraja, poeni, isticanje, paket i aukcija, akcija, prijava oglasa, priča, omiljeno, želja)
const { oper: O, tokovi: TK } = m
const NACRT = { primer: 'primer-solje', vrsta: 'roba', kat: 'kucni-dekor', nacin: 'razmena', trazi: 'roba', stanje: 'Korišćeno', preuzimanje: 'licno' }
let tb = TK.POCETNI_TOKOVI
tb = TK.dodajNoviOglas(tb, O.napraviOglas(tb, 'ana_zvz84', false, 'zvz', NACRT))
tb = TK.dodajNoviOglas(tb, O.napraviOglas(tb, 'ana_zvz84', false, 'zvz', { ...NACRT, primer: 'primer-cizme', kat: 'odeca', nacin: 'poklon' }))
tb = TK.dodajNoviOglas(tb, O.napraviOglas(tb, 'zupcanik', true, 'zvz', { ...NACRT, primer: 'primer-kaciga', kat: 'bicikli-i-trotineti' }))
const pon = O.posaljiPonudu(tb, { cilj: 'markova-jakna', od: 'ana_zvz84', stvari: [{ naslov: 'Set šolja i tanjira (šest komada)', vrsta: 'roba', oglas: 'moj-ana_zvz84-1' }] })
tb = O.dogovorZavrsen(O.pokreniRazmenu(O.odgovoriNaPonudu(pon.tokovi, pon.id, 'prihvacena'), { id: pon.id, tip: 'razmena', cilj: 'markova-jakna', naslov: 'Dečja jakna', vlasnik: 'marko_voz77', od: 'ana_zvz84', stvari: [{ naslov: 'Set šolja i tanjira (šest komada)', vrsta: 'roba', oglas: 'moj-ana_zvz84-1' }] }), pon.id)
tb = O.pokreniRazmenu(tb, { id: 'poeni-setic', tip: 'poeni', cilj: 'setic-za-kupanje-bebe', naslov: 'Setić za kupanje bebe', vlasnik: 'petar_voz79', od: 'ana_zvz84', stvari: [], poeni: 10, raspolozivo: 20 })
tb = O.potvrdiPrijem(O.dogovorZavrsen(tb, 'poeni-setic'), 'poeni-setic', 'ana_zvz84')
tb = O.pokreniAukciju(O.kupiPaket(O.istakniOglas(tb, 'moj-ana_zvz84-2', 14), 3), 'moj-ana_zvz84-1', 7)
tb = O.izmeniPoslovno(tb, { plan: 'Majstor', akcija: true, reklama: 'akcija', radnoVreme: 1 })
tb = O.prijaviZaAkciju(tb, { k: 'ana_zvz84', stvar: 'Dečji bicikl 16 inča (stari, ćerkin)', procena: 'Dobro', termin: 'utorak' })
tb = O.odluciPrijavu(O.prijaviOglas(O.prijaviOglas(tb, 'retro-laptop', 'Prevara', 'ana_zvz84'), 'gramofon', 'Lažan opis', 'ana_zvz84'), O.idPrijave('gramofon'), 'ostavi')
tb = O.objaviPricu(O.dodajZelju(O.sacuvajPretragu(O.prebaciPratim(tb, 'ana_zvz84', 'marko_voz77'), 'ana_zvz84', 'q=bicikl'), 'ana_zvz84', 'z-bicikl'), 'ana_zvz84', 'Sutra delim jabuke iz bašte na Zvezdari, dođite ko voli.')
tb = O.naruciDostavu(tb, pon.id, 'mala', 1)
tb = { ...tb, omiljeno: ['markov-bicikl', 'moj-ana_zvz84-1'] }
const BOGATO = JSON.parse(JSON.stringify(tb))
for (const p of sva) {
  const sb = m.svet.svet(p, BOGATO)
  for (const k of Object.values(sb.korisnici)) poznati.add(k.poeni)
  if (sb.akcija) { poznati.add(sb.akcija.izdatiPopusti); poznati.add(sb.akcija.naknada) }
}
const SLOBODNA_STANJA = [
  { poz: { korak: 1, n: m.koraci.brojRadnji(1, 'lanac'), grana: 'lanac' }, rezim: 'slobodno', tokovi: BOGATO },
  { poz: { korak: 1, n: m.koraci.brojRadnji(1, 'lanac'), grana: 'lanac' }, rezim: 'slobodno', tokovi: { noviOglasi: [], omiljeno: [] } },
]
const stanja = (process.env.FULL ? kljucna : BRZA).map((poz) => ({ poz, rezim: 'vodjena', tokovi: { noviOglasi: [], omiljeno: [] } })).concat(SLOBODNA_STANJA)
const rute = m.rute.RUTE.filter((r) => r.izgradjen)
const uglovi = (r) => r.uglovi

const dozvoljeniIzuzeci = new Set(m.zabrane.DOZVOLJENI_IZUZECI.map((x) => x.izraz))
const izrazi = m.zabrane.ZABRANJENI_IZRAZI.filter((x) => !dozvoljeniIzuzeci.has(x))
const nepoznati = new Map()
let brojStranica = 0

async function pregledaj(ruta, ugao, poz, rezim = 'vodjena', putanja = null) {
  const kontekst = `${ruta.id}/${ugao}/${poz.korak}.${poz.n}${poz.grana === 'poeni' ? 'R' : ''}${rezim === 'slobodno' ? '/slobodno' : ''}${putanja ? ' ' + putanja : ''}`
  const d = await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('img')].map((i) => (i.loading === 'lazy' && !i.complete ? ((i.loading = 'eager'), i.decode().catch(() => {})) : null)))
    const vidljiv = (e) => !!e && e.getClientRects().length > 0
    const oznaka = document.querySelector('[data-oznaka-demoa]')
    const rb = oznaka?.getBoundingClientRect()
    return {
      ekran: document.querySelector('main[data-ekran]')?.getAttribute('data-ekran'),
      tekst: document.body.innerText,
      forme: document.querySelectorAll('form').length,
      obaveznihStiklirano: document.querySelectorAll('input[data-obavezna]:checked').length,
      losiUnos: [...document.querySelectorAll('input')].filter((i) => !['checkbox', 'radio', 'range'].includes(i.type) && !i.hasAttribute('data-jedino-polje')).length,
      textarea: document.querySelectorAll('textarea').length,
      lozinka: document.querySelectorAll('input[type=password]').length,
      name: document.querySelectorAll('input[name], select[name], button[name], textarea[name]').length,
      autocomplete: document.querySelectorAll('[autocomplete]:not([data-jedino-polje])').length,
      losiHref: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('#')),
      oznakaVidljiva: vidljiv(oznaka) && rb.top >= 0 && rb.bottom <= innerHeight,
      podnozje: document.querySelector('[data-podnozje]')?.textContent ?? '',
      kostur: !!document.querySelector('[data-u-izradi]'),
      slike: [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.getAttribute('alt') })),
      // kartice oglasa: svaka mora imati Građanin ili Firma; istaknute moraju imati „Istaknuto · plaćeno“
      kartice: [...document.querySelectorAll('[data-oglas]')].map((k) => ({ id: k.getAttribute('data-oglas'), znacka: /Građanin|Firma/.test(k.textContent), istaknuto: k.classList.contains('ko-istaknuto'), oznaceno: /Istaknuto · plaćeno/.test(k.textContent) })),
      reklame: [...document.querySelectorAll('[data-reklama]')].map((k) => /Sponzorisano/.test(k.textContent)),
      // dugmad radnji priče: koja nije link i nije onemogućena
      radnje: [...document.querySelectorAll('[data-radnja]')].map((w) => ({ id: w.getAttribute('data-radnja'), pregled: w.hasAttribute('data-pregled'), aktivno: !!w.querySelector('button') && w.querySelector('button').getAttribute('aria-disabled') !== 'true' })),
      csp: window.__csp ?? [],
      html: document.querySelector('main')?.innerHTML.slice(0, 4000) ?? '',
    }
  })
  const r = (opis, uslov, detalj = '') => proveri(`${kontekst}: ${opis}`, uslov, detalj)
  r('ekran je otvoren', d.ekran === ruta.id || (ruta.id === 'O1' && d.ekran === 'O1'), d.ekran)
  r('nema <form>', d.forme === 0)
  r('nema pravog polja za kucanje (osim pretrage)', d.losiUnos === 0 && d.textarea === 0 && d.lozinka === 0)
  r('nema name ni autocomplete na kontrolama', d.name === 0 && d.autocomplete === 0)
  r('svi linkovi počinju sa #', d.losiHref.length === 0, d.losiHref.join(','))
  r('obavezne kvačice nisu unapred štiklirane', d.obaveznihStiklirano === 0, String(d.obaveznihStiklirano))
  r('oznaka „Demo — izmišljeni podaci“ vidljiva bez skrolovanja', d.oznakaVidljiva)
  r('podnožje: pravni tekstovi, podrška i jezik', /Uslovi korišćenja/.test(d.podnozje) && /Politika privatnosti/.test(d.podnozje) && /Podrška/.test(d.podnozje))
  const nadjeni = izrazi.filter((x) => new RegExp(`(^|[^\\p{L}\\p{N}])${x.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(d.tekst))
  r('nema zabranjenih izraza', nadjeni.length === 0, nadjeni.join(', '))
  if (ruta.izgradjen) r('izgrađen ekran nije kostur', !d.kostur)
  for (const k of d.kartice) {
    r(`kartica ${k.id}: Građanin ili Firma`, k.znacka)
    if (k.istaknuto) r(`kartica ${k.id}: „Istaknuto · plaćeno“`, k.oznaceno)
  }
  r('svaka reklama nosi „Sponzorisano“', d.reklame.every(Boolean))
  if (ruta.cena && /din/.test(d.tekst)) r('ekran sa cenom: „sa PDV-om“ ili ilustrativno', /PDV|ilustrativno|nije cenovnik/.test(d.tekst) || /Još nije počelo/.test(d.tekst))
  if (/din\b/.test(d.tekst) && ruta.cena && !/Još nije počelo/.test(d.tekst) && ['Z3', 'D1', 'D2'].includes(ruta.id)) r('iznos stoji uz „ilustrativno“ ili „sa PDV-om“', /ilustrativno|nije cenovnik|sa PDV-om/.test(d.tekst))
  if (ruta.id === 'O1' && /Poklanjam|Za razmenu|Za poene/.test(d.tekst)) r('O1: obaveštenje o pravima potrošača ili „Druga strana je firma“', /Prava potrošača|Druga strana je firma/.test(d.tekst) || /Razmena je obavljena/.test(d.tekst))
  if (['O1', 'N1'].includes(ruta.id) && /proverena razmena/.test(d.tekst)) r('recenzija: napomena „samo ko je obavio razmenu“', /Recenziju može da ostavi samo ko je obavio razmenu/.test(d.tekst))
  // U3 „O ovom demou“ izričito nabraja očigledno lažne podatke (uključujući lažni broj telefona), pa je izuzet
  if (!['X8', 'C2', 'U3'].includes(ruta.id)) r('broj telefona se ne vidi van X8', !new RegExp(m.strane.TELEFON_DEMO.replace(/[()]/g, '\\$&')).test(d.tekst))
  if (['P6', 'O1'].includes(ruta.id) && /približna lokacija|Približna lokacija/i.test(d.tekst)) r('mapa: „Prikazujemo samo približnu lokaciju“', /Prikazujemo samo približnu lokaciju/.test(d.tekst))
  for (const mt of d.tekst.matchAll(/(\d[\d.]*)\s?(din|poena|poen)\b/g)) {
    const n = Number(mt[1].replace(/\./g, ''))
    if (!poznati.has(n)) nepoznati.set(`${n} ${mt[2]} @ ${kontekst}`, mt[0])
  }
  for (const sl of d.slike) {
    const ime = decodeURIComponent(sl.src.split('/').pop()).replace(/-\d+\.webp$/, '').replace(/-(kartica|detalj|prica|reklama)$/, '')
    const kartica = /-kartica-\d+\.webp$/.test(sl.src)
    // P-S6: alt je prazan na karticama u listama (naslov je pored), a na detalju je opis prizora
    r('slika je sa sopstvene adrese, u spisku, alt: prazan na kartici / opis na detalju', sl.src.startsWith(origin) && m.foto.FOTOGRAFIJE.some((f) => f.id === ime) && sl.ok && (kartica ? (sl.alt ?? '') === '' : (sl.alt ?? '').length > 0), JSON.stringify(sl))
  }
  // RADNJE VAN KORAKA / UGLA su neaktivne: dugme je aktivno samo ako ga reducer dozvoljava
  for (const rd of d.radnje) {
    if (rd.pregled) continue
    const dozvoljeno = m.reducer.mozeRadnja(poz, rd.id, ugao)
    r(`radnja ${rd.id} je ${dozvoljeno ? 'dozvoljena' : 'neaktivna'} u ovom koraku i uglu`, !rd.aktivno || dozvoljeno, `aktivno=${rd.aktivno} dozvoljeno=${dozvoljeno}`)
  }
  // N-1 (PRAVNO): nigde „od/za korisnika X“ uz poene; plaćanje firme bez potrošačkog teksta; spisak zabranjenih stvari je isti svuda
  r('nema formulacije „od/za korisnika“ uz poene (poene dodeljuje i oduzima SWAPIT)', !/\b(od|za) korisnik\w*[^.]{0,50}poen|poen\w*[^.]{0,50}\b(od|za) korisnik/i.test(d.tekst), (d.tekst.match(/[^.\n]*(od|za) korisnik[^.\n]*/i) ?? [''])[0])
  r('nigde fraza „u izradi“', !/u izradi/i.test(d.tekst))
  if (['V1', 'V3', 'V4', 'S2', 'O5'].includes(ruta.id) && !/Još nije počelo|Nema te stranice|Ne možeš|Moderacija prijave ne šalje/.test(d.tekst) && !(ruta.id === 'V4' && /još nije odlučila/.test(d.tekst))) {
    const fali = m.poslovno.ZABRANJENE_STVARI.filter((x) => !d.tekst.includes(x.naziv)).map((x) => x.naziv)
    if (ruta.id !== 'O5' || /Pošalji prijavu/.test(d.tekst)) r('spisak zabranjenih stvari je isti izvor (sve stavke stoje na ekranu)', fali.length === 0, fali.join(' | '))
  }
  if (ruta.id === 'Z3' && /data-svrha="(pretplata|akcija|reklama)"/.test(d.html)) {
    r('V-3: plaćanje firme: poslovni tekst, bez potrošačkog prava na odustanak i bez kvačice', /Plaćaš kao poslovni korisnik\. Uslovi otkazivanja su u ugovoru o poslovnom nalogu \(nacrt — pregleda advokat\)\./.test(d.tekst) && !/Pravo na odustanak|Želim da usluga počne odmah/.test(d.tekst))
  }
  if (ruta.id === 'Z3' && /data-svrha="akcija"/.test(d.html)) r('N-3: reklama akcije je uključena u cenu akcije', /Reklama „Sponzorisano“ za akciju \(\d+ dana na početnoj\) je uključena u cenu akcije\./.test(d.tekst))
  r('nema CSP prijava', d.csp.length === 0, d.csp.join('; '))
  brojStranica++
}

let br = 0
async function otvoriStanje({ poz, rezim, tokovi }) {
  await page.goto(`${BASE}?r=${++br}#/`, { waitUntil: 'networkidle0' })
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz, rezim, tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi })
  await page.goto(`${BASE}?r=${++br}#/ana/pocetna`, { waitUntil: 'networkidle0' })
}
async function idiNa(hash, id) {
  await page.evaluate((x) => (location.hash = x), hash)
  await page.waitForFunction((i) => document.querySelector('main[data-ekran]')?.getAttribute('data-ekran') === i, { timeout: 4000 }, id).catch(() => {})
  await new Promise((r) => setTimeout(r, 60))
}
for (const st of stanja) {
  await otvoriStanje(st)
  for (const ruta of rute)
    for (const ugao of uglovi(ruta)) {
      await idiNa('#' + m.rute.link(ruta.id, ugao), ruta.id)
      await pregledaj(ruta, ugao, st.poz, st.rezim)
    }
}

// ---- svi oglasi (O1), kategorije (P7), korisnici (N1, N4), firme (F4), priče (P8) i svrhe plaćanja (Z3, Z4) u slobodnom režimu sa bogatim tokovima
{
  const st = SLOBODNA_STANJA[0]
  await otvoriStanje(st)
  const R = (id) => m.rute.RUTA_PO_ID[id]
  const s0 = m.svet.svet(st.poz, st.tokovi)
  const oglasi = [...s0.oglasi, ...s0.region].map((o) => o.id)
  for (const id of oglasi) for (const ugao of ['ana', 'prodavnica']) { await idiNa('#' + m.rute.link('O1', ugao, { oglas: id }), 'O1'); await pregledaj(R('O1'), ugao, st.poz, 'slobodno', id) }
  for (const k of s0.korisnici ? Object.keys(s0.korisnici) : []) { await idiNa('#' + m.rute.link('N1', 'ana', { korisnik: k }), 'N1'); await pregledaj(R('N1'), 'ana', st.poz, 'slobodno', k); await idiNa('#' + m.rute.link('N4', 'marko', { korisnik: k }), 'N4'); await pregledaj(R('N4'), 'marko', st.poz, 'slobodno', k) }
  for (const f of m.svet.FIRME) { await idiNa('#' + m.rute.link('F4', 'ana', { firma: f.id }), 'F4'); await pregledaj(R('F4'), 'ana', st.poz, 'slobodno', f.id) }
  for (const k of m.svet.KATEGORIJE) for (const ugao of ['ana', 'prodavnica']) { await idiNa('#' + m.rute.link('P7', ugao, { kat: k.id }), 'P7'); await pregledaj(R('P7'), ugao, st.poz, 'slobodno', k.id) }
  for (const p of ['jabuke', 'knjige', 'biciklisti', 'popravke', 'razmena', 'baste', 'moja-1']) { await idiNa('#' + m.rute.link('P8', 'ana', { prica: p }), 'P8'); await pregledaj(R('P8'), 'ana', st.poz, 'slobodno', p) }
  for (const [svrha, ref] of [['isticanje', 'moj-ana_zvz84-2'], ['paket', '3'], ['pretplata', 'radnja'], ['akcija', 'SW-PLT-0001'], ['reklama', 'profil'], ['dostava', 'SW-DEMO-0002']])
    for (const ugao of ['ana', 'prodavnica']) for (const id of ['Z3', 'Z4']) { await idiNa('#' + m.rute.link(id, ugao, { svrha, ref }), id); await pregledaj(R(id), ugao, st.poz, 'slobodno', svrha) }
  for (const tekst of ['uslovi', 'privatnost', 'kolacici']) { await idiNa('#' + m.rute.link('S4', 'ana', { tekst }), 'S4'); await pregledaj(R('S4'), 'ana', st.poz, 'slobodno', tekst) }
  for (const o of ['mtb-bicikl-storm', 'retro-laptop', 'moj-ana_zvz84-1']) for (const id of ['J2', 'J4']) { await idiNa('#' + m.rute.link(id, 'ana', { oglas: o }), id); await pregledaj(R(id), 'ana', st.poz, 'slobodno', o) }
}
for (const [k, v] of nepoznati) proveri(`nepoznat iznos ${v} (${k})`, false, 'iznos nije izračunat iz scenario/')
proveri('popis „din“ i „poena“: svaki iznos na ekranima je izračunat iz scenario/', nepoznati.size === 0)
console.log(`Pregledano stranica: ${brojStranica}, stanja: ${stanja.length}, poznatih iznosa: ${poznati.size}`)
await browser.close()
zatvori()
const ok = izvestaj('e2e-zabrane', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
