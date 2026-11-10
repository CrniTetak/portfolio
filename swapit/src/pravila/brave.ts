// BRAVE (PLAN B3, B7): čiste funkcije koje čitaju IZVORNI TEKST i vraćaju listu kršenja. Pokreće ih pravila/brave.test.ts
// nad celim src/. Brave su aktivne od faze 0; kako se kod dodaje, one ga odmah čuvaju.
import { DOZVOLJENI_BROJEVI, DOZVOLJENI_IZUZECI, ZABRANJENI_IZRAZI, ZABRANJENI_OBRASCI_U_KODU, ZABRANJENI_ZARGON } from './zabrane'

/** Skida komentare, import redove i vrednosti className, da se ne hvataju lažni nalazi (npr. „w-[50%]“ ili „// 12 din“). */
export function ocisti(tekst: string): string {
  return tekst
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, '$1')
    .replace(/^\s*import[^\n]*$/gm, '')
    .replace(/^\s*export\s+\{[^}]*\}\s+from[^\n]*$/gm, '')
    .replace(/className\s*=\s*"[^"]*"/g, 'className=""')
    .replace(/className\s*=\s*\{`[^`]*`\}/g, 'className=""')
}

/** B7: obrasci i pravi unos u kodu. */
export function krsenjaObrazaca(tekst: string): string[] {
  const t = ocisti(tekst)
  return ZABRANJENI_OBRASCI_U_KODU.filter((z) => z.obrazac.test(t)).map((z) => z.naziv)
}

/** B7: broj pojavljivanja polja za kucanje (type="search") u kodu; dozvoljeno je jedno, u PoljePretrage.tsx. */
export const brojPoljaPretrage = (tekst: string): number => [...ocisti(tekst).matchAll(/type\s*=\s*["']search["']/g)].length

/** B7: autoComplete u kodu (dozvoljeno samo „off“ na polju pretrage). */
export const imaAutoComplete = (tekst: string): boolean => /autoComplete\s*=/i.test(ocisti(tekst))

/** B7: zabranjeni izrazi u tekstu (cele reči/fraze, bez obzira na veličinu slova). */
export function krsenjaIzraza(tekst: string): string[] {
  const t = ocisti(tekst)
  const nadjeno: string[] = []
  for (const izraz of ZABRANJENI_IZRAZI) {
    if (DOZVOLJENI_IZUZECI.some((i) => i.izraz === izraz)) continue
    const esc = izraz.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, 'iu').test(t)) nadjeno.push(izraz)
  }
  return nadjeno
}

/** B3: ručno pisan iznos (din, poena), broj sa tačkom za hiljade ili datum u tekstu ekrana; sve brojke dolaze iz scenario/ kroz format.ts. */
export function krsenjaBrojki(tekst: string): string[] {
  const t = ocisti(tekst)
  const nadjeno: string[] = []
  if (/\d{1,3}(\.\d{3})+/.test(t)) nadjeno.push('broj sa tačkom za hiljade')
  if (/\d\s?(din\b|dinara|poena\b|poen\b)/i.test(t)) nadjeno.push('iznos u dinarima ili poenima')
  if (/\d\s?%/.test(t)) nadjeno.push('procenat')
  if (/\b\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\b/.test(t)) nadjeno.push('datum')
  return nadjeno
}

/** B3: sat računara i lokalni formati van format.ts. */
export function krsenjaVremena(tekst: string): string[] {
  const t = ocisti(tekst)
  const nadjeno: string[] = []
  if (/Date\.now\s*\(/.test(t)) nadjeno.push('Date.now')
  if (/new\s+Date\s*\(\s*\)/.test(t)) nadjeno.push('new Date() bez argumenta')
  if (/toLocale\w*String\s*\(/.test(t)) nadjeno.push('toLocale*String')
  if (/Intl\.(DateTimeFormat|NumberFormat)/.test(t)) nadjeno.push('Intl formatiranje')
  return nadjeno
}

/** B3: brava uvoza. Ekrani ne uvoze ulazne fajlove scenarija direktno; čitaju svet() i format. */
export function krsenjaUvoza(tekst: string): string[] {
  const ulazni = ['oglasi', 'korisnici', 'firme', 'kategorije', 'recenzije', 'cene', 'opstine', 'tabla']
  return ulazni.filter((f) => new RegExp(`from\\s+['"][^'"]*scenario/${f}['"]`).test(tekst)).map((f) => `direktan uvoz scenario/${f}`)
}

/** B3: izmišljeno ime iz strane.ts / korisnici.ts napisano rukom (cela reč, bez obzira na padež slova oko nje). */
export function krsenjaImena(tekst: string, imena: string[]): string[] {
  const t = ocisti(tekst)
  const izbegni = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return imena.filter((ime) => new RegExp('(^|[^\\p{L}\\p{N}_])' + izbegni(ime) + '($|[^\\p{L}\\p{N}_])', 'u').test(t))
}

/** Svi znakovni nizovi duži od 3 znaka sa velikim slovom iz izvora (nazivi, imena). */
export function izvuciImena(izvor: string): string[] {
  const bez = izvor.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  const imena = new Set<string>()
  for (const m of bez.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    const s = (m[1] ?? m[2] ?? '').trim()
    if (s.length >= 4 && /[A-ZČĆŠĐŽ]/.test(s) && !/[()=:{}<>]/.test(s)) imena.add(s)
  }
  return [...imena]
}

/** Naziv brenda se piše „SWAPIT“ kao u logou; mešavine „Swapit“ i „SwapIt“ nisu dozvoljene (isto važi za dokumenta). */
export function krsenjaBrenda(tekst: string): string[] {
  return /\b(Swapit|SwapIt|SwapIT)\b/.test(ocisti(tekst)) ? ['naziv brenda nije „SWAPIT“'] : []
}

/** JSX tekst (između > i <) bez atributa; koristi se za proveru golih brojeva. */
function jsxTekstovi(tekst: string): string[] {
  let t = ocisti(tekst).replace(/=>/g, '=_')
  // izrazi u vitičastim zagradama se skidaju iznutra ka spolja, dok ih ima (ugnježdeni izrazi i funkcije u JSX-u)
  for (let i = 0; i < 12 && /\{[^{}]*\}/.test(t); i++) t = t.replace(/\{[^{}]*\}/g, ' ')
  return [...t.matchAll(/(?<=[\w"'}\])/])>([^<>]+)</g)].map((m) => m[1])
}

/** Lista Tailwind klasa: sve reči malim slovima/crticama, bar jedna sa crticom, dvotačkom ili zagradom. */
function jeListaKlasa(niz: string): boolean {
  const reci = niz.trim().split(/\s+/)
  return reci.every((r) => /^[!a-z0-9:_\-[\]/.%#()&>*,]+$/.test(r)) && reci.some((r) => /[-:[]/.test(r))
}

/** Rečenice u navodnicima i šablonima: samo nizovi sa razmakom i slovima, ${...} se izbacuje. */
function tekstoviIzNizova(tekst: string): string[] {
  const t = ocisti(tekst)
  const izlaz: string[] = []
  for (const m of t.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const niz = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^{}]*\}/g, ' ')
    if (jeListaKlasa(niz)) continue
    if (/\s/.test(niz.trim()) && /[A-Za-zČĆŠĐŽčćšđž]{3}/.test(niz) && !/\b(translate|rotate|scale|matrix)\(/.test(niz)) izlaz.push(niz)
  }
  return izlaz
}

const vidljiviTekstovi = (tekst: string): string[] => [...jsxTekstovi(tekst), ...tekstoviIzNizova(tekst)]

/** B3: gol broj od 2+ cifara u tekstu ekrana (iznosi, brojevi, datumi…) mora doći iz scenario/. Čita i JSX i rečenice u nizovima. */
export function krsenjaGolihBrojeva(tekst: string): string[] {
  const nadjeno: string[] = []
  for (const seg of vidljiviTekstovi(tekst))
    for (const m of seg.matchAll(/\b\d{2,}\b/g)) {
      const okolina = seg.slice(Math.max(0, m.index! - 12), m.index! + m[0].length + 12).trim()
      if (!DOZVOLJENI_BROJEVI.some((d) => d.obrazac.test(m[0]))) nadjeno.push(okolina)
    }
  return nadjeno
}

/** B3: i jednocifren broj uz jedinicu (din, poena, km, dana, oglasa, razmena…) u vidljivom tekstu mora doći iz scenario/. */
export function krsenjaBrojevaUzJedinice(tekst: string): string[] {
  const nadjeno: string[] = []
  const jedinice = '(din|poen|poena|km|dan|dana|oglas|oglasa|razmena|razmene|razmenu|stvari|recenzija|recenzije|nedelj[ae]|meseci?|sati|sata|minuta)'
  for (const seg of vidljiviTekstovi(tekst)) for (const m of seg.matchAll(new RegExp(`(^|[^\\w$.])(\\d{1,2})[\\s-]+${jedinice}(?![\\p{L}])`, 'giu'))) nadjeno.push(m[0].trim())
  return nadjeno
}

/** Programerski žargon i „u izradi“ fraze u tekstu ekrana (fraza „u izradi“ ne sme nigde: svih 84 ekrana je izgrađeno). */
export function krsenjaZargona(tekst: string, dozvoliUIzradi = false): string[] {
  const t = ocisti(tekst)
  const lista = dozvoliUIzradi ? ZABRANJENI_ZARGON : [...ZABRANJENI_ZARGON, 'u izradi']
  return lista.filter((z) => new RegExp(`(^|[^\\p{L}\\p{N}])${z.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(t))
}
