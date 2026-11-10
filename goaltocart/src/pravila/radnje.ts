// Pravilo 1.6 (UX.md): dugme je aktivno samo ako je njegova radnja SLEDEĆA u listi, a gledalac je u ulozi koja je izvodi.
// Inače je dugme vidljivo, ali neaktivno, uz razlog: "Done", "Available at step N" ili "Waiting for ...".
// Dugmad za pregled (otvori, proširi, "Download pack") ovde ne učestvuju i rade uvek.
import { putanja, radnjeKoraka } from '../prica/koraci'
import { redniBroj, sledecaRadnja } from '../prica/reducer'
import type { Pozicija, RadnjaDef, Uloga } from '../prica/tipovi'
import { CEKA_ULOGU } from '../tekstovi/prica'

export type UlogaUKlubu = 'sporting' | 'finance' | 'legal'

export interface StanjeDugmeta {
  aktivno: boolean
  /** Razlog ispod/pored neaktivnog dugmeta (engleski). */
  razlog?: string
  radnja?: RadnjaDef
  /** Status radnje u priči. */
  status: 'gotovo' | 'sledeca' | 'kasnije' | 'nema'
}

function indeksRadnje(id: string, poz: Pick<Pozicija, 'grana'>): { idx: number; radnja: (RadnjaDef & { korak: number }) | undefined } {
  const lista = putanja(poz.grana)
  const idx = lista.findIndex((r) => r.id === id)
  return { idx, radnja: lista[idx] }
}

/** Da li je radnja već odrađena u datoj poziciji. */
export function jeUradjeno(id: string, poz: Pozicija): boolean {
  const { idx } = indeksRadnje(id, poz)
  return idx >= 0 && idx < redniBroj(poz)
}

const ULOGA_UKLUBU_NAZIV: Record<'finance' | 'legal', string> = { finance: 'Finance', legal: 'Legal' }

/**
 * Stanje dugmeta za radnju.
 * @param uloga uloga gledaoca (koja uloga gleda ekran)
 * @param actAs za odobrenja: izabrana uloga u klubu ("Act as")
 * @param simulacija true kad je ovo dugme "Simulate: ..." za "sustav" radnju
 */
export function stanjeRadnje(id: string, uloga: Uloga, poz: Pozicija, actAs?: UlogaUKlubu): StanjeDugmeta {
  const { idx, radnja } = indeksRadnje(id, poz)
  if (!radnja) return { aktivno: false, razlog: 'Not part of this story branch', status: 'nema' }
  const tren = redniBroj(poz)
  if (idx < tren) return { aktivno: false, razlog: 'Done', radnja, status: 'gotovo' }

  // Radnja iz drugog koraka: tek kad priča stigne tamo (čak i kad je tekući korak završen, korak se menja preko Next)
  if (radnja.korak !== poz.korak) {
    return { aktivno: false, razlog: `Available at step ${radnja.korak}`, radnja, status: 'kasnije' }
  }
  const sl = sledecaRadnja(poz)
  if (sl && sl.id !== id) {
    // isti korak, ali nije na redu: čeka se ono što je na redu
    const cekaNa = sl.uloga !== 'sustav' && sl.uloga !== uloga ? CEKA_ULOGU[sl.uloga] : sl.uloga === 'sustav' ? sl.ceka : undefined
    return { aktivno: false, razlog: cekaNa ?? 'Available after the earlier actions', radnja, status: 'kasnije' }
  }

  // idx === tren: ovo je SLEDEĆA radnja
  if (radnja.uloga === 'sustav') {
    // "Simulate" dugme: aktivno za uloge koje ga prikazuju
    const smeDaVidi = radnja.simulira?.some((s) => s.uloga === uloga) ?? false
    return smeDaVidi
      ? { aktivno: true, radnja, status: 'sledeca' }
      : { aktivno: false, razlog: radnja.ceka, radnja, status: 'sledeca' }
  }
  if (radnja.uloga !== uloga) {
    return { aktivno: false, razlog: CEKA_ULOGU[radnja.uloga], radnja, status: 'sledeca' }
  }
  if (radnja.odobrava && actAs !== radnja.odobrava) {
    return {
      aktivno: false,
      razlog: `Switch “Act as” to ${ULOGA_UKLUBU_NAZIV[radnja.odobrava]}`,
      radnja,
      status: 'sledeca',
    }
  }
  return { aktivno: true, radnja, status: 'sledeca' }
}

/** Da li je NEKA radnja ove uloge trenutno na redu (npr. za tačku "Needs your attention"). */
export function sledecaZaUlogu(poz: Pozicija, uloga: Uloga): RadnjaDef | undefined {
  const sl = sledecaRadnja(poz)
  return sl && sl.uloga === uloga ? sl : undefined
}

/** Ko je na redu: uloga ili 'sustav' ili nikoga (korak završen). */
export function naRedu(poz: Pozicija): Uloga | 'sustav' | null {
  return sledecaRadnja(poz)?.uloga ?? null
}

/** Radnje koraka (pomoćno za ekrane). */
export const radnjeTekucegKoraka = (poz: Pozicija) => radnjeKoraka(poz.korak, poz.grana)
