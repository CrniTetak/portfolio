// Matrica priče: za svaki korak i ulogu — koji ekrani pripadaju koraku i kuda vodi „Prikaži mi" (plan dorade 3, odeljak 2).
// Rute se računaju iz STVARNOG stanja (ID-jevi), kao nekadašnje ruta(s) u SKOKOVI.
import { POLAZNA } from '../okvir/pristup'
import { SIGMA } from '../podaci/akteri'
import { deltinZahtevLofta } from '../stanje/scenario'
import { izborDelte } from '../stanje/izvedeno'
import type { Stanje } from '../stanje/tipovi'
import type { Pozicija, UlogaPrice } from './tipovi'

export interface Celija {
  /** svi ekrani koji pripadaju koraku za ovu ulogu (ruta, može imati ?upit) */
  ekrani: string[]
  /** kuda vodi Prikaži mi za TRENUTNO pod-stanje */
  prikazi: string
}

/** Pathname bez ?upita (za poređenje sa tekućim linkom). */
export const bezUpita = (ruta: string): string => ruta.split('?')[0]

const POCETNA_ULOGE: Record<UlogaPrice, string> = { produkcija: '/pocetna', vlasnik: POLAZNA.vlasnik, partner: POLAZNA.partner }

export function celija(s: Stanje, poz: Pozicija, uloga: UlogaPrice): Celija {
  const { korak, odradjeno: odr, grana } = poz
  const izbor = izborDelte(s)
  const zahtev = deltinZahtevLofta(s)
  const sigmaLoft = s.zahtevi.find((z) => z.produkcijaId === SIGMA && z.lokacijaId === 'industrijski-loft')
  const izborRuta = izbor ? `/izbor/${izbor.id}` : '/produkcija'
  const rezervacija = zahtev ? `/produkcija/rezervacija/${zahtev.id}` : '/produkcija'
  const predracunId = zahtev ? s.predracuni.find((p) => p.zahtevId === zahtev.id)?.id : undefined
  const predracun = predracunId ? `/produkcija/predracun/${predracunId}` : rezervacija
  const vlasnikZahtev = zahtev ? `/vlasnik/zahtev/${zahtev.id}` : '/vlasnik'
  const dok = (vrsta: 'ugovor' | 'brief') => `/primeri?dokument=${vrsta}${zahtev ? `&rezervacija=${zahtev.id}` : ''}`
  const jedan = (r: string): Celija => ({ ekrani: [r], prikazi: r })

  if (uloga === 'produkcija') {
    switch (korak) {
      case 1: return jedan(POCETNA_ULOGE.produkcija)
      case 2: return jedan('/brief')
      case 3: return { ekrani: ['/produkcija', izborRuta], prikazi: odr === 0 ? '/produkcija' : izborRuta }
      // glas se daje na ekranu primaoca (tu je aktivno dugme); posle glasa se rezultat vidi na ekranu deljenja
      case 4: return { ekrani: [`${izborRuta}/deljenje`, `${izborRuta}/primalac`], prikazi: odr === 0 ? `${izborRuta}/primalac` : `${izborRuta}/deljenje` }
      case 5: {
        const ekrani = ['/lokacije/industrijski-loft', '/lokacije/brutalisticka-hala', '/produkcija/opcije']
        return { ekrani, prikazi: ekrani[Math.min(odr, 2)] }
      }
      case 6: {
        const forma = '/produkcija/zahtev/industrijski-loft'
        return { ekrani: [forma, rezervacija], prikazi: odr === 0 ? forma : rezervacija }
      }
      case 7: return jedan(rezervacija)
      case 8: return { ekrani: [predracun, rezervacija], prikazi: odr === 0 ? predracun : rezervacija }
      default: return grana === 'otkaz' ? jedan(rezervacija) : jedan(dok('ugovor'))
    }
  }

  if (uloga === 'vlasnik') {
    switch (korak) {
      case 5: {
        const sigma = sigmaLoft ? `/vlasnik/zahtev/${sigmaLoft.id}` : '/vlasnik'
        return { ekrani: ['/vlasnik', sigma], prikazi: odr >= 3 ? sigma : '/vlasnik' }
      }
      case 7: case 8: return jedan(vlasnikZahtev)
      case 9: return grana === 'otkaz' ? jedan(vlasnikZahtev) : jedan(dok('ugovor'))
      default: return jedan(POLAZNA.vlasnik)
    }
  }

  // partner
  if (korak === 9 && grana === 'vazi') return jedan(dok('brief'))
  return jedan(POLAZNA.partner)
}

/** Kuda vodi „Prikaži mi". */
export const prikaziMiRuta = (s: Stanje, poz: Pozicija, uloga: UlogaPrice): string => celija(s, poz, uloga).prikazi

/** Da li je link jedan od ekrana koraka za ovu ulogu (poređenje po pathname-u). */
export function jeEkranPrice(s: Stanje, poz: Pozicija, uloga: UlogaPrice, pathname: string): boolean {
  return celija(s, poz, uloga).ekrani.some((r) => bezUpita(r) === pathname)
}
