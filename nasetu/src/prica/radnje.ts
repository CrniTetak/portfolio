// Pravilo „jedna istina" (plan 5.3): u vođenom režimu dugme je aktivno samo ako je njegova radnja SLEDEĆA u priči,
// a gledalac je u ulozi koja je izvodi. Ostalo je vidljivo, ali ugašeno, uz razlog. Pregled (otvaranje, filtriranje) radi uvek.
import { CEKA_ULOGU, RAZLOG_KASNIJE, RAZLOG_VAN_PRICE, RAZLOG_NASETU, RAZLOG_PRETHODNA, RAZLOG_GOTOVO, RAZLOG_OTKAZ_GRANA } from '../tekstovi/prica'
import type { Uloga } from '../stanje/tipovi'
import { nadjiRadnju, putanja, type RadnjaPrice } from './koraci'
import { redniBroj, sledecaRadnja } from './pozicija'
import type { StanjePrice } from './tipovi'

/** 'nema' = id nije radnja priče (npr. pogrešan id); dugme je tada ugašeno uz opšti razlog. */
export type StatusRadnje = 'gotovo' | 'sledeca' | 'kasnije' | 'slobodno' | 'nema'

export interface StanjeDugmeta {
  aktivno: boolean
  /** razlog ispod ugašenog dugmeta */
  razlog?: string
  status: StatusRadnje
  radnja?: RadnjaPrice
}

export function stanjeRadnje(id: string, uloga: Uloga, p: StanjePrice): StanjeDugmeta {
  const radnja = nadjiRadnju(id)
  if (p.rezim === 'slobodno') return { aktivno: true, status: 'slobodno', radnja }
  if (!radnja) return { aktivno: false, razlog: RAZLOG_VAN_PRICE, status: 'nema' }

  const lista = putanja(p.grana)
  const idx = lista.findIndex((r) => r.id === id)
  if (idx < 0) return { aktivno: false, razlog: RAZLOG_OTKAZ_GRANA, status: 'kasnije', radnja }
  if (idx < redniBroj(p)) return { aktivno: false, razlog: RAZLOG_GOTOVO, status: 'gotovo', radnja }
  if (radnja.korak !== p.korak) return { aktivno: false, razlog: RAZLOG_KASNIJE(radnja.korak), status: 'kasnije', radnja }

  const sl = sledecaRadnja(p)
  if (sl && sl.id !== id) {
    const ceka = sl.uloga === 'nasetu' ? RAZLOG_NASETU : sl.uloga !== uloga ? CEKA_ULOGU[sl.uloga] : RAZLOG_PRETHODNA
    return { aktivno: false, razlog: ceka, status: 'kasnije', radnja }
  }

  // ovo je SLEDEĆA radnja
  if (radnja.uloga === 'nasetu') {
    // dugme Simuliraj stoji na ekranu Produkcije
    return uloga === 'produkcija'
      ? { aktivno: true, status: 'sledeca', radnja }
      : { aktivno: false, razlog: RAZLOG_NASETU, status: 'sledeca', radnja }
  }
  if (radnja.uloga !== uloga) return { aktivno: false, razlog: CEKA_ULOGU[radnja.uloga], status: 'sledeca', radnja }
  return { aktivno: true, status: 'sledeca', radnja }
}
