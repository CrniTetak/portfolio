// Zajedničko za e2e-tokovi: jedan spisak provera (singleton), pomoćnici za proveru ekrana i tekstova, i spisak uređaja. Koriste ga tokovi-1…4.mjs.
import { proveravac, ucitajModule } from './_zajednicko.mjs'

// Iznosi u proverama dolaze iz ISTOG izvora kao aplikacija (scenario/cene.ts + format.ts), ne iz brojki upisanih rukom.
const { m: izvor } = await ucitajModule({ cene: '/src/scenario/cene.ts', format: '/src/scenario/format.ts' })
export const C = izvor.cene.CENE
/** „1.149 din“ — isto kao na ekranu. */
export const D = (n) => izvor.format.din(n)
/** Bilo šta između dva dela teksta. */
export const SVE = Symbol('sve')
/** Regularni izraz od delova: tekst se traži doslovno (specijalni znaci se escape-uju), SVE = bilo šta. */
export function rx(...delovi) {
  return new RegExp(delovi.map((d) => (d === SVE ? '[^]*' : String(d).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join(''))
}

export const { lista, proveri } = proveravac()
export const sesije = []
export const ANA = 'ana_zvz84'
export const MARKO = 'marko_voz77'
/** Formulacija koja bi izgledala kao prenos poena između korisnika (N-1): „od/za korisnika X“ ili ime korisnika uz poene. */
export const KORISNICI_U_POENIMA = /(od|za)\s+(korisnik\w*|[a-z]+_[a-z]{2,3}\d{2})[^.]{0,40}poen|poen[^.]{0,60}(od|za)\s+(korisnik\w*|[a-z]+_[a-z]{2,3}\d{2})/i

export const UREDJAJI = [{ naziv: 'racunar', sirina: 1280, visina: 800, telefon: false }, ...(process.env.TELEFON === '0' ? [] : [{ naziv: 'telefon', sirina: 390, visina: 844, telefon: true }])]

/** Svaki ekran u toku: nije kostur, nije „Nema te stranice“, nije prazan. */
export async function zdravo(S, opis) {
  const d = await S.page.evaluate(() => ({ kostur: !!document.querySelector('[data-u-izradi]'), nema: !!document.querySelector('[data-nema-stranice]'), tekst: (document.querySelector('main')?.innerText ?? '').trim(), izradi: /u izradi/i.test(document.body.innerText), h1: document.querySelectorAll('main h1').length }))
  proveri(`${S.uredjaj.naziv} ${opis}: ekran nije kostur, „u izradi“ ni „Nema te stranice“`, !d.kostur && !d.nema && !d.izradi, JSON.stringify(d).slice(0, 120))
  proveri(`${S.uredjaj.naziv} ${opis}: ekran nije prazan (ima naslov i sadržaj)`, d.tekst.length > 40 && d.h1 >= 1, `h1=${d.h1} duzina=${d.tekst.length}`)
}
export const ima = (S, opis, tekst, re) => proveri(`${S.uredjaj.naziv} ${opis}`, re.test(tekst), re + ' ← ' + tekst.replace(/\s+/g, ' ').slice(0, 200))
export const nema = (S, opis, tekst, re) => proveri(`${S.uredjaj.naziv} ${opis}`, !re.test(tekst), re + ' ← ' + tekst.replace(/\s+/g, ' ').slice(0, 200))

/** Jedan tok u zaštićenom bloku: greška u toku je neuspela provera, a ne rušenje cele skripte. */
export async function korak(S, opis, f) {
  try {
    await f()
  } catch (e) {
    proveri(`${S.uredjaj.naziv} ${opis}: izvršeno bez greške`, false, e.message)
  }
}
