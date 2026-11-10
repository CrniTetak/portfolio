// BRAVE (B3, B7): čiste funkcije koje čitaju IZVORNI TEKST i vraćaju listu kršenja. Pokreće ih pravila/brave.test.ts
// nad celim src/. Brave su aktivne od faze 0; kako se kod dodaje, one ga odmah čuvaju.
import { DOZVOLJENI_BROJEVI, DOZVOLJENI_IZUZECI, ZABRANJENI_IZRAZI, ZABRANJENI_OBRASCI_U_KODU, ZABRANJENI_ZARGON } from './zabrane'

/** Skida komentare, import redove i vrednosti className, da se ne hvataju lažni nalazi (npr. "w-[50%]" ili "// EUR 5"). */
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

/** B7: zabranjeni izrazi u tekstu (cele reči/fraze, bez obzira na veličinu slova). */
export function krsenjaIzraza(tekst: string): string[] {
  const t = ocisti(tekst)
  const nadjeno: string[] = []
  for (const izraz of ZABRANJENI_IZRAZI) {
    if (DOZVOLJENI_IZUZECI.some((i) => i.izraz === izraz)) continue
    const esc = izraz.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    if (new RegExp(`(^|[^A-Za-z0-9])${esc}($|[^A-Za-z0-9])`, 'i').test(t)) nadjeno.push(izraz)
  }
  return nadjeno
}

/** B3: ručno pisan iznos, procenat ili datum van scenario/. Sve brojke dolaze iz scenario/ kroz format.ts. */
export function krsenjaBrojki(tekst: string): string[] {
  const t = ocisti(tekst)
  const nadjeno: string[] = []
  if (/\d{1,3}(,\d{3})+/.test(t)) nadjeno.push('iznos sa zarezom za hiljade')
  if (/EUR\s?[−-]?\d/.test(t)) nadjeno.push('EUR iznos')
  if (/\d\s?%/.test(t)) nadjeno.push('procenat')
  if (/\b\d{1,2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\b/.test(t)) nadjeno.push('datum')
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

/** B3: brava uvoza. Ekrani i okvir ne uvoze scenario/uslovi direktno, nego samo kroz racun, stanjeGrupe i ponude. */
export function krsenjaUvoza(tekst: string): string[] {
  return /from\s+['"][^'"]*scenario\/uslovi['"]/.test(tekst) ? ['direktan uvoz scenario/uslovi'] : []
}

/** B3: izmišljeno ime iz strane.ts napisano rukom. `imena` se vade iz strane.ts (vidi izvuciImena). */
export function krsenjaImena(tekst: string, imena: string[]): string[] {
  const t = ocisti(tekst)
  return imena.filter((ime) => t.includes(ime))
}

/** Svi znakovni nizovi duži od 3 znaka iz strane.ts (kad fajl postoji). Kratki nizovi (npr. "EUR") se ne uzimaju. */
export function izvuciImena(izvorStrane: string): string[] {
  const bez = izvorStrane.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  const imena = new Set<string>()
  for (const m of bez.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    const s = (m[1] ?? m[2] ?? '').trim()
    // ključevi i tehničke vrednosti (bez razmaka, malim slovima, putanje) se preskaču; ostaju imena i nazivi
    if (s.length >= 4 && /[A-Z]/.test(s)) imena.add(s)
  }
  return [...imena]
}

/** Naziv brenda se NIKAD ne piše velikim slovima ("ALLADDIN1" se čita kao "Aladdin"): uvek "AllAddIn1" ili logo. */
export function krsenjaBrenda(tekst: string): string[] {
  return /ALLADDIN1/.test(tekst) || /ALL\s?ADD\s?IN\s?1/.test(tekst) ? ['naziv brenda velikim slovima'] : []
}

/** CSS pravila sa text-transform: uppercase na naslovima (h1–h3) ili logou: naslovi mogu da sadrže naziv brenda. */
export function krsenjaVelikihSlovaCss(css: string): string[] {
  const nadjeno: string[] = []
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selektor = m[1].trim()
    if (/text-transform\s*:\s*uppercase/.test(m[2]) && /(^|[\s,>])(h1|h2|h3)\b|\.logo/.test(selektor)) nadjeno.push(selektor)
  }
  return nadjeno
}

/** JSX tekst (između > i <) bez atributa; koristi se za proveru golih brojeva. */
function jsxTekstovi(tekst: string): string[] {
  const t = ocisti(tekst).replace(/=>/g, '=_').replace(/\{[^{}]*\}/g, ' ').replace(/\{[^{}]*\}/g, ' ')
  // tekst posle završetka oznake (ispred > nema razmaka): ne hvata poređenja tipa "a > b"
  return [...t.matchAll(/(?<=[\w"'}\])/])>([^<>]+)</g)].map((m) => m[1])
}

/** Lista Tailwind klasa: sve reči malim slovima/crticama, bar jedna sa crticom, dvotačkom ili zagradom. */
function jeListaKlasa(niz: string): boolean {
  const reci = niz.trim().split(/\s+/)
  return reci.every((r) => /^[!a-z0-9:_\-[\]/.%#()&>*,]+$/.test(r)) && reci.some((r) => /[-:[]/.test(r))
}

/** Rečenice u navodnicima i šablonima (uslovni JSX, konstante teksta): samo nizovi sa razmakom i slovima, ${...} se izbacuje. */
function tekstoviIzNizova(tekst: string): string[] {
  const t = ocisti(tekst)
  const izlaz: string[] = []
  for (const m of t.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const niz = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^{}]*\}/g, ' ')
    // CSS klase (Tailwind) i SVG transformacije nisu tekst za čitanje
    if (jeListaKlasa(niz)) continue
    // SVG transformacije (translate/rotate/scale) nisu tekst za čitanje
    if (/\s/.test(niz.trim()) && /[A-Za-z]{3}/.test(niz) && !/\b(translate|rotate|scale|matrix)\(/.test(niz)) izlaz.push(niz)
  }
  return izlaz
}

/** Svi tekstovi koje korisnik može da vidi: JSX tekst i rečenice u nizovima. */
function vidljiviTekstovi(tekst: string): string[] {
  return [...jsxTekstovi(tekst), ...tekstoviIzNizova(tekst)]
}

/** B3: gol broj od 2+ cifara u tekstu ekrana (iznosi, brojevi sedišta, trajanja, vremena...) mora doći iz scenario/. Čita i JSX i rečenice u nizovima. */
export function krsenjaGolihBrojeva(tekst: string): string[] {
  const nadjeno: string[] = []
  for (const seg of vidljiviTekstovi(tekst)) {
    for (const m of seg.matchAll(/\b\d{2,}\b/g)) {
      const okolina = seg.slice(Math.max(0, m.index! - 12), m.index! + m[0].length + 12).trim()
      if (!DOZVOLJENI_BROJEVI.some((d) => d.obrazac.test(m[0]))) nadjeno.push(okolina)
    }
  }
  return nadjeno
}

/** B3: i jednocifren broj uz jedinicu (nights, guests, days, stars, months...) u vidljivom tekstu mora doći iz scenario/. */
export function krsenjaBrojevaUzJedinice(tekst: string): string[] {
  const nadjeno: string[] = []
  for (const seg of vidljiviTekstovi(tekst))
    for (const m of seg.matchAll(/(^|[^\w$.])(\d{1,2})[\s-]+(nights?|guests?|days?|stars?|months?|years?|seats?|travell?ers?|passengers?|hours?|weeks?|rooms?|people|persons?|trips?)\b/gi)) nadjeno.push(m[0].trim())
  // brojevi rečima (one…twelve) uz iste jedinice, npr. "five stars", "seven days"
  for (const seg of vidljiviTekstovi(tekst))
    for (const m of seg.matchAll(/(^|[^\w$.])(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[\s-]+(nights?|guests?|days?|stars?|months?|years?|seats?|travell?ers?|passengers?|hours?|weeks?|rooms?|people|persons?|trips?)\b/gi)) nadjeno.push(m[0].trim())
  return nadjeno
}

/** Tailwind `uppercase` na elementu čiji tekst sadrži naziv brenda. */
export function krsenjaBrendaUppercase(tekst: string): string[] {
  return [...tekst.matchAll(/className=\{?[`"'][^`"']*\buppercase\b[^`"']*[`"']\}?[^>]*>[^<]*AllAddIn1/g)].map((m) => m[0].slice(0, 60))
}

/** "Pay … now" (obećanje trenutne naplate) nije dozvoljeno ni kad je iznos između ("Pay EUR 1,000 now"). */
export function krsenjaPlatiSada(tekst: string): string[] {
  return /\bPay\b[^\n<>]{0,40}\bnow\b/i.test(ocisti(tekst)) ? ['Pay … now'] : []
}

/** Programerski žargon i "u izradi" fraze u tekstu ekrana. */
export function krsenjaZargona(tekst: string): string[] {
  const t = ocisti(tekst)
  return ZABRANJENI_ZARGON.filter((z) => new RegExp(`(^|[^A-Za-z0-9])${z.replace(/[.*+?^${}()|[\]\/]/g, '\$&')}($|[^A-Za-z0-9])`, 'i').test(t))
}
