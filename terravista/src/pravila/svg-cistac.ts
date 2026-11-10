// ČISTAČ i PROVERA SVG-a (PLAN B7.1, rizik 6). Isti kod koristi skripta za preuzimanje logotipa (skripte/logotipi.mjs) i brava (test).
// Čišćenje NE menja oblik ni boje: uklanja samo ono što ne pripada slici — skripte, foreignObject, atribute on*, spoljne reference,
// komentare, metapodatke i editorske dodatke (inkscape/sodipodi/rdf). Logotip se prikazuje kao <img> (nikad inline), a CSP dodatno brani.

const NAMESPACE_DOZVOLJENI = new Set(['xmlns', 'xmlns:xlink'])

/** Uklanja element (par ili samozatvarajući) po nazivu oznake; naziv može imati prostor imena (sodipodi:namedview). */
function ukloniElement(s: string, naziv: string): string {
  const n = naziv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const par = new RegExp(`<${n}\\b[^>]*?(?:/>|>[\\s\\S]*?</${n}\\s*>)`, 'gi')
  return s.replace(par, '')
}

/** Čisti SVG u petlji dok se tekst menja (jedan prolaz može da otkrije nov element ili atribut, npr. ugnježdene oznake). */
export function ocistiSvg(ulaz: string): string {
  let tekst = ulaz
  for (let i = 0; i < 10; i++) {
    const sledeci = jedanProlaz(tekst)
    if (sledeci === tekst) break
    tekst = sledeci
  }
  return tekst
}

function jedanProlaz(ulaz: string): string {
  let s = ulaz.replace(/^﻿/, '')
  s = s.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/gi, '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  for (const el of ['script', 'foreignObject', 'metadata', 'title', 'desc', 'sodipodi:namedview', 'rdf:RDF', 'cc:Work', 'dc:title']) s = ukloniElement(s, el)
  // preostali editorski elementi (inkscape:…, sodipodi:…) i sve sa prostorom imena rdf/cc/dc
  s = s.replace(/<(?:inkscape|sodipodi|rdf|cc|dc):[^>]*?(?:\/>|>[\s\S]*?<\/(?:inkscape|sodipodi|rdf|cc|dc):[^>]*>)/gi, '')
  // atributi: on*, editorski, spoljne reference
  s = s.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
  s = s.replace(/\s+(?:inkscape|sodipodi|rdf|cc|dc):[\w-]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
  s = s.replace(/\s+xmlns:([\w-]+)\s*=\s*("[^"]*"|'[^']*')/gi, (m, ime: string) => (NAMESPACE_DOZVOLJENI.has(`xmlns:${ime}`) ? m : ''))
  s = s.replace(/\s+(?:xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, '')
  // stilovi: @import i url() ka spoljnim adresama
  s = s.replace(/@import[^;]*;?/gi, '').replace(/url\(\s*(["']?)(?!#)[^)]*\1\s*\)/gi, 'none')
  return s.replace(/>\s+</g, '><').trim() + '\n'
}

/** Vraća spisak problema (prazan = čist). Dozvoljene su samo deklaracije prostora imena `xmlns` i `xmlns:xlink`. */
export function proveriSvg(tekst: string): string[] {
  const problemi: string[] = []
  const bezImenaProstora = tekst.replace(/\sxmlns(?::xlink)?\s*=\s*("[^"]*"|'[^']*')/g, '')
  if (!/<svg[\s>]/i.test(tekst)) problemi.push('nije SVG (nema <svg>)')
  if (/<script/i.test(tekst)) problemi.push('sadrži <script')
  if (/<foreignObject/i.test(tekst)) problemi.push('sadrži foreignObject')
  if (/(?:^|[\s"'/<])on[a-z]+\s*=/i.test(tekst)) problemi.push('sadrži atribut on…=')
  if (/javascript:/i.test(tekst)) problemi.push('sadrži javascript:')
  if (/(?:href|src)\s*=\s*(?!["']?#)/i.test(tekst)) problemi.push('sadrži spoljnu href/src referencu')
  if (/<!(?:DOCTYPE|ENTITY)/i.test(tekst)) problemi.push('sadrži DOCTYPE ili ENTITY')
  if (/url\(\s*["']?(?!#)/i.test(tekst)) problemi.push('sadrži url() ka spoljnoj adresi')
  if (/@import/i.test(tekst)) problemi.push('sadrži @import')
  if (/\bhttps?:/i.test(bezImenaProstora)) problemi.push('sadrži http(s) adresu')
  if (/<(?:metadata|sodipodi:|inkscape:|rdf:)/i.test(tekst)) problemi.push('sadrži metapodatke ili editorske dodatke')
  return problemi
}
