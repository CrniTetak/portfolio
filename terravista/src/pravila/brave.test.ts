// BRAVE (PLAN B3, B6.5): izvorne provere koje mašinski čuvaju pravila.
//  - „zamena kanala = jedna stavka“: nijedan naziv kanala/paketa, iznos, ime lika ili sirov datum van podaci/ (velika/mala slova se ne razlikuju);
//    brojevi od 3+ cifara su zabranjeni u .tsx i tekstovi/*.ts (konstante idu u okvir/mere.ts);
//  - ekrani čitaju podatke samo kroz podaci/svet.ts i prikazuju brojeve samo kroz podaci/format.ts;
//  - nema forme, nema polja za kucanje, sva dugmad type="button", svi linkovi počinju sa #, nema spoljnih adresa i mrežnih poziva;
//  - nema zabranjenih izraza ni u izvoru ni u podacima i priči (prikazani tekst).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KANALI, FILMSKA_RIZNICA } from '../podaci/kanali'
import { LIKOVI } from '../podaci/likovi'
import { PAKETI } from '../podaci/paketi'
import { nadjiZabranjeno, netacnaRecenicaONedostupnosti } from './zabrane'

const SRC = fileURLToPath(new URL('..', import.meta.url))

function fajlovi(dir: string, uslov: (p: string) => boolean): string[] {
  const izlaz: string[] = []
  for (const ime of readdirSync(dir)) {
    const p = join(dir, ime)
    if (statSync(p).isDirectory()) izlaz.push(...fajlovi(p, uslov))
    else if (uslov(p)) izlaz.push(p)
  }
  return izlaz
}
const rel = (p: string) => relative(SRC, p).replaceAll('\\', '/')

/** Uklanja komentare (da brave ne reaguju na objašnjenja), ali ne dira tekst u navodnicima. */
export function bezKomentara(tekst: string): string {
  let izlaz = ''
  let i = 0
  let navodnik: string | null = null
  while (i < tekst.length) {
    const c = tekst[i]
    const sledeci = tekst[i + 1]
    if (navodnik) {
      izlaz += c
      if (c === '\\') {
        izlaz += tekst[i + 1] ?? ''
        i += 2
        continue
      }
      if (c === navodnik) navodnik = null
      i++
      continue
    }
    if (c === '/' && sledeci === '*') {
      const kraj = tekst.indexOf('*/', i + 2)
      i = kraj < 0 ? tekst.length : kraj + 2
      continue
    }
    if (c === '/' && sledeci === '/' && tekst[i - 1] !== ':') {
      const kraj = tekst.indexOf('\n', i)
      i = kraj < 0 ? tekst.length : kraj
      continue
    }
    if (c === '"' || c === "'" || c === '`') navodnik = c
    izlaz += c
    i++
  }
  return izlaz
}

const TSX = fajlovi(SRC, (p) => p.endsWith('.tsx'))
const TEKSTOVI = fajlovi(join(SRC, 'tekstovi'), (p) => p.endsWith('.ts') && !p.endsWith('.test.ts'))
const SVE_NAZIVE = [...new Set([...TSX, ...TEKSTOVI])]
/** Svi izvorni fajlovi osim podataka (podaci/ je JEDINO mesto gde smeju da stoje nazivi, iznosi i imena) i testova. */
const SVE_OSIM_PODATAKA = fajlovi(SRC, (p) => /\.(ts|tsx)$/.test(p) && !p.endsWith('.test.ts') && !rel(p).startsWith('podaci/') && !rel(p).startsWith('assets/'))
/** Tekstovi iz podataka i priče (ono što se prikazuje); pregledaju se na zabranjene izraze. */
const TEKSTOVI_PODATAKA = fajlovi(SRC, (p) => /\.ts$/.test(p) && !p.endsWith('.test.ts') && ['podaci/', 'prica/', 'tekstovi/'].some((d) => rel(p).startsWith(d)))
const izvor = (p: string) => bezKomentara(readFileSync(p, 'utf8'))

describe('brave: izvor sadrži fajlove za proveru', () => {
  it('postoje .tsx fajlovi (provera ne sme da prođe „na prazno“)', () => {
    expect(TSX.length).toBeGreaterThan(20)
    expect(SVE_OSIM_PODATAKA.length).toBeGreaterThan(TSX.length)
    expect(TEKSTOVI_PODATAKA.length).toBeGreaterThan(10)
  })
})

/** Šifre i mesta za podatke nisu prikazani tekst: {ana}, 'ana', nastavi-kao-ana, /tabla/vesna. */
const bezSifri = (t: string) =>
  t
    .replace(/\{\w+\}/g, '')
    .replace(/lik\(\s*(['"`])(ana|nikola|sara|vesna)\1\s*\)/gi, '')
    .replace(/[\w/-]*[-/](?:ana|nikola|sara|vesna)(?![\p{L}])/giu, '')

const escRe = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('brava „bez ručnog upisa“ (zamena kanala = jedna stavka)', () => {
  const nazivi = [...KANALI.map((k) => k.naziv), ...PAKETI.map((p) => p.naziv), FILMSKA_RIZNICA.naziv]
  const imena = LIKOVI.flatMap((l) => [l.ime, ...(l.prezime ? [l.prezime] : [])])
  const pravila: { naziv: string; nadji: (t: string) => string | null; samoPrikaz?: boolean }[] = [
    {
      naziv: 'naziv kanala ili paketa',
      nadji: (t) => nazivi.find((n) => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(n)}(?![\\p{L}\\p{N}])`, 'iu').test(t)) ?? null,
    },
    { naziv: 'iznos u evrima (€, EUR, 2,99)', nadji: (t) => /€|\bEUR\b|\d+,\d{2}(?!\d)/.exec(t)?.[0] ?? null },
    { naziv: 'broj od tri ili više cifara', nadji: (t) => /(?<![\w#.-])\d{3,}(?![\w-])/.exec(t)?.[0] ?? null, samoPrikaz: true },
    { naziv: 'ime lika', nadji: (t) => imena.find((n) => new RegExp(`(?<![\\p{L}])${n}(?![\\p{L}])`, 'iu').test(bezSifri(t))) ?? null },
    { naziv: 'Date.now / new Date() bez argumenta / toLocale*', nadji: (t) => /Date\.now|new Date\(\s*\)|toLocale\w*/.exec(t)?.[0] ?? null },
  ]
  // nazivi, iznosi, imena i datumi: svi izvorni fajlovi osim podaci/ i testova; brojevi sa 3+ cifre: samo .tsx i tekstovi/
  for (const f of SVE_OSIM_PODATAKA) {
    it(`${rel(f)}`, () => {
      const t = izvor(f)
      for (const p of pravila) {
        if (p.samoPrikaz && !SVE_NAZIVE.includes(f)) continue
        // pravila/zabrane.ts i svg-cistac.ts sadrže uzorke (regularne izraze), a ne prikazani tekst
        if (rel(f) === 'pravila/zabrane.ts' && p.naziv.startsWith('iznos')) continue
        expect(p.nadji(t), `${rel(f)}: ${p.naziv}`).toBeNull()
      }
    })
  }
  it('brava stvarno hvata prekršaj (proba na izmišljenom izvoru)', () => {
    const lose = 'return <p>doma tv je otključan za 2,99 € i Ana gleda 1920</p>'
    expect(pravila.filter((p) => p.nadji(lose) !== null).map((p) => p.naziv)).toEqual(['naziv kanala ili paketa', 'iznos u evrima (€, EUR, 2,99)', 'broj od tri ili više cifara', 'ime lika'])
    expect(pravila.filter((p) => p.nadji("lik('ana') {ana} nastavi-kao-ana '/tabla/vesna'") !== null)).toEqual([])
  })
})

describe('brava uvoza: ekrani čitaju podatke samo kroz svet.ts, brojeve kroz format.ts', () => {
  const DOZVOLJENO = new Set(['svet', 'format', 'stalni-tekstovi'])
  for (const f of SVE_NAZIVE) {
    it(`${rel(f)}`, () => {
      const uvozi = [...readFileSync(f, 'utf8').matchAll(/from\s+['"]([^'"]*podaci\/([\w-]+))['"]/g)]
      for (const [, putanja, ime] of uvozi) expect(DOZVOLJENO.has(ime), `${rel(f)} uvozi ${putanja}`).toBe(true)
    })
  }
})

/** Tagovi koji počinju sa `<ime` do pravog kraja oznake (vodi računa o { } da `=>` u atributima ne prekine oznaku). */
function oznake(tekst: string, ime: string): string[] {
  const izlaz: string[] = []
  const re = new RegExp(`<${ime}(?=[\\s>/])`, 'g')
  for (let m = re.exec(tekst); m; m = re.exec(tekst)) {
    let dubina = 0
    let j = m.index
    for (; j < tekst.length; j++) {
      const c = tekst[j]
      if (c === '{') dubina++
      else if (c === '}') dubina--
      else if (c === '>' && dubina === 0) break
    }
    izlaz.push(tekst.slice(m.index, j + 1))
  }
  return izlaz
}

describe('brava formi (PLAN B6.5): nema forme, nema polja za kucanje, sva dugmad type="button", svi linkovi počinju sa #', () => {
  for (const f of TSX) {
    it(`${rel(f)}`, () => {
      const t = izvor(f)
      expect(t, 'form').not.toMatch(/<form[\s>]/)
      expect(t, 'textarea').not.toMatch(/<textarea[\s>]/)
      expect(t, 'select').not.toMatch(/<select[\s>]/)
      expect(t, 'contenteditable').not.toMatch(/contentEditable/i)
      expect(t, 'name=/autocomplete').not.toMatch(/\s(?:autoComplete|autocomplete)\s*=/)
      for (const o of oznake(t, 'input')) expect(o, `input: ${o}`).toMatch(/type=["'{]+\s*["']?(?:checkbox|radio)/)
      for (const o of oznake(t, 'button')) expect(o, `button: ${o.slice(0, 80)}`).toMatch(/type=["']button["']/)
      for (const o of oznake(t, 'a')) {
        const h = /href=\{?[`"']([^`"']*)/.exec(o)
        expect(h, `a bez href: ${o}`).not.toBeNull()
        expect(h![1].startsWith('#'), `spoljni link: ${o}`).toBe(true)
      }
      expect(t, 'spoljna adresa').not.toMatch(/https?:\/\//)
    })
  }
})

describe('brava zabranjenih izraza u izvoru', () => {
  for (const f of SVE_NAZIVE) {
    it(`${rel(f)}`, () => {
      expect(nadjiZabranjeno(izvor(f)), rel(f)).toEqual([])
      expect(netacnaRecenicaONedostupnosti(izvor(f)), `${rel(f)}: netačna rečenica o nedostupnosti`).toBe(false)
    })
  }
})

describe('brava zabranjenih izraza u podacima i priči (prikazani tekst)', () => {
  for (const f of TEKSTOVI_PODATAKA) {
    it(`${rel(f)}`, () => {
      expect(nadjiZabranjeno(izvor(f)), rel(f)).toEqual([])
    })
  }
  // evidencija logotipa i slika (autor, alt, licenca…) se prikazuje u U3 i ispod slike: i ona prolazi istu bravu
  for (const ime of ['logotipi-evidencija.json', 'slike-evidencija.json']) {
    it(`podaci/${ime}`, () => {
      const tekstovi: string[] = []
      const skupi = (v: unknown) => {
        if (typeof v === 'string') tekstovi.push(v)
        else if (Array.isArray(v)) v.forEach(skupi)
        else if (v && typeof v === 'object') Object.values(v).forEach(skupi)
      }
      skupi(JSON.parse(readFileSync(join(SRC, 'podaci', ime), 'utf8')))
      for (const t of tekstovi) expect(nadjiZabranjeno(t), `${ime}: ${t}`).toEqual([])
    })
  }
})

describe('brava mrežnih i opasnih poziva (nijedan fajl osim podataka i testova)', () => {
  const ZABRANJENO: [string, RegExp][] = [
    ['window.open', /window\.open\s*\(/],
    ['fetch', /\bfetch\s*\(/],
    ['XMLHttpRequest', /XMLHttpRequest/],
    ['WebSocket / EventSource', /new\s+(?:WebSocket|EventSource)\b/],
    ['location.href / assign / replace', /location\.(?:href|assign|replace)\b/],
    ['target="_blank"', /target\s*=\s*[{"'`]*_blank/],
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['sendBeacon / postMessage', /sendBeacon|postMessage\s*\(/],
    ['eval / new Function', /\beval\s*\(|new\s+Function\s*\(/],
    ['innerHTML / outerHTML / insertAdjacentHTML', /\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML/],
    ['document.write', /document\.write/],
    ['<iframe / <script / <object / <embed', /<(?:iframe|script|object|embed)[\s>]/i],
    ['localStorage / document.cookie', /localStorage|document\.cookie/],
  ]
  for (const f of SVE_OSIM_PODATAKA) {
    it(`${rel(f)}`, () => {
      // pravila/brave i zabrane/svg-cistac sadrže uzorke ovih izraza kao tekst provere; ovaj fajl se ne skenira
      if (rel(f) === 'pravila/svg-cistac.ts') return
      const t = izvor(f)
      for (const [naziv, re] of ZABRANJENO) {
        // jedini izuzetak: znak TerraVista je naš sopstveni statički SVG iz projekta (komponenta ZnakTerraVista.tsx)
        if (naziv === 'dangerouslySetInnerHTML' && rel(f) === 'komponente/tv/ZnakTerraVista.tsx') continue
        expect(re.test(t), `${rel(f)}: ${naziv}`).toBe(false)
      }
    })
  }
})

describe('brava spoljnih adresa i dinamičkih uvoza (podaci/ i stilovi)', () => {
  const PODACI = fajlovi(SRC, (p) => /\.ts$/.test(p) && !p.endsWith('.test.ts') && rel(p).startsWith('podaci/'))
  const STILOVI = fajlovi(SRC, (p) => /\.css$/.test(p))
  const SPOLJNO: [string, RegExp][] = [
    ['http(s):// adresa u kodu', /https?:\/\//],
    ['dinamički import(', /\bimport\s*\(/],
    ['new Image', /new\s+Image\b/],
  ]
  for (const f of PODACI) {
    it(`${rel(f)}`, () => {
      const t = izvor(f)
      for (const [naziv, re] of SPOLJNO) expect(re.test(t), `${rel(f)}: ${naziv}`).toBe(false)
    })
  }
  for (const f of STILOVI) {
    it(`${rel(f)}: bez url(http…) i @import url`, () => {
      const t = readFileSync(f, 'utf8')
      expect(/url\(\s*['"]?(?:https?:)?\/\//i.test(t), `${rel(f)}: url(http…)`).toBe(false)
      expect(/@import\s+(?:url\()?\s*['"]?https?:/i.test(t), `${rel(f)}: @import`).toBe(false)
    })
  }
})
