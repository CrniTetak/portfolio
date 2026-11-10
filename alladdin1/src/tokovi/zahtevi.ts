// JEDAN spisak individualnih zahteva/rezervacija iz stanja tokova; koristi ga T5 (putnik), T7 (putnik) i V5 (savetnik), pa su ref, tip i status svuda isti.
// Svaki zahtev je poseban red: novi zahtev nikad ne prepisuje postojeći ni potvrđeni.
import { datum, eur, noci, opsegDatuma } from '../scenario/format'
import { cenaOdTekst, konsijerzUkupno, krstarenjeUkupno, monteKarloUkupno, paket, refKataloga, TRANSPORT, TRANSPORT_USLUGE, type TipZahteva } from '../scenario/ponude'
import { GALA_NAZIV, REF, REF_TOKOVI, SAVETNICI_KONSIJERZA } from '../scenario/strane'
import { GALA, KRSTARENJE_POLAZAK, MONTE_KARLO_DO, MONTE_KARLO_OD } from '../scenario/datumi'
import type { Tokovi } from './tokovi'

export type TipReda = TipZahteva | 'Concierge' | 'Transport'
export type AkcijaSavetnika = 'monteKarlo' | 'konsijerz' | 'transport'
export type Zahtev = {
  id: string
  tip: TipReda
  naziv: string
  ref: string
  /** Faze koje putnik vidi (T7 traka); kod odbijene ponude poslednja je "Declined". */
  faze: string[]
  faza: number
  odbijeno: boolean
  iznos: string | null
  opis: string
  /** Šta savetnik može da uradi u V5 dok je zahtev u ovom stanju. */
  akcija?: AkcijaSavetnika
  /** Status za savetnika (V5). */
  status: 'New' | 'Quoted' | 'Accepted' | 'Declined'
}

const TRI_FAZE = ['Requested', 'Quoted', 'Confirmed']
const ODBIJENO = ['Requested', 'Quoted', 'Declined']
export const TEKST_BEZ_PONUDE = 'Quote requested — your advisor prepares a tailored quote'

export function sviZahtevi(t: Tokovi): Zahtev[] {
  const l: Zahtev[] = []
  if (t.krstarenje === 'placeno')
    l.push({ id: 'krstarenje', tip: 'Cruise', naziv: paket('iberian').naziv, ref: REF_TOKOVI.krstarenje, faze: ['Confirmed'], faza: 0, odbijeno: false, iznos: eur(krstarenjeUkupno), opis: `Departure ${datum(KRSTARENJE_POLAZAK)}`, status: 'Accepted' })
  if (t.monteKarlo !== 'none') {
    const odb = t.monteKarlo === 'odbijeno'
    const faza = t.monteKarlo === 'zatrazeno' ? 0 : t.monteKarlo === 'potvrdjeno' ? 2 : odb ? 2 : 1
    l.push({
      id: 'monteKarlo', tip: 'Monte Carlo', naziv: paket('royal').naziv, ref: t.monteKarlo === 'potvrdjeno' ? REF_TOKOVI.monteKarlo : REF.zahtev1,
      faze: odb ? ODBIJENO : TRI_FAZE, faza, odbijeno: odb, iznos: faza >= 1 ? eur(monteKarloUkupno) : null, opis: opsegDatuma(MONTE_KARLO_OD, MONTE_KARLO_DO),
      akcija: t.monteKarlo === 'zatrazeno' ? 'monteKarlo' : undefined,
      status: odb ? 'Declined' : t.monteKarlo === 'zatrazeno' ? 'New' : t.monteKarlo === 'ponuda' ? 'Quoted' : 'Accepted',
    })
  }
  if (t.konsijerz !== 'none') {
    const odb = t.konsijerz === 'odbijeno'
    const faza = t.konsijerz === 'zatrazeno' ? 0 : t.konsijerz === 'placeno' ? 2 : odb ? 2 : 1
    l.push({
      id: 'konsijerz', tip: 'Concierge', naziv: `${GALA_NAZIV} · ${SAVETNICI_KONSIJERZA[t.savetnik].ime}`, ref: t.konsijerz === 'placeno' ? REF_TOKOVI.konsijerz : REF.zahtev3,
      faze: odb ? ODBIJENO : TRI_FAZE, faza, odbijeno: odb, iznos: faza >= 1 ? eur(konsijerzUkupno) : null, opis: datum(GALA),
      akcija: t.konsijerz === 'zatrazeno' ? 'konsijerz' : undefined,
      status: odb ? 'Declined' : t.konsijerz === 'zatrazeno' ? 'New' : t.konsijerz === 'ponuda' ? 'Quoted' : 'Accepted',
    })
  }
  if (t.transport !== 'none') {
    const u = TRANSPORT_USLUGE[t.usluga]
    const odb = t.transport === 'odbijeno'
    const faza = t.transport === 'zatrazeno' ? 0 : t.transport === 'prihvaceno' ? 2 : odb ? 2 : 1
    l.push({
      id: 'transport', tip: 'Transport', naziv: `${u.naziv} · ${u.polazak} → ${u.odrediste}`, ref: REF.zahtev2,
      faze: odb ? ODBIJENO : TRI_FAZE, faza, odbijeno: odb, iznos: faza >= 1 ? eur(u.cena) : null, opis: `Up to ${TRANSPORT.maks} passengers · illustrative`,
      akcija: t.transport === 'zatrazeno' ? 'transport' : undefined,
      status: odb ? 'Declined' : t.transport === 'zatrazeno' ? 'New' : t.transport === 'ponuda' ? 'Quoted' : 'Accepted',
    })
  }
  // Zahtevi bez punog toka: pošteno završavaju na "Quote requested", svaki sa svojim nazivom, datumima i cenom "od".
  t.zahtevi.forEach((kljuc, i) => {
    const p = paket(kljuc)
    l.push({ id: `kat-${kljuc}`, tip: p.tip, naziv: p.naziv, ref: refKataloga(i), faze: ['Quote requested'], faza: 0, odbijeno: false, iznos: null, opis: `${opsegDatuma(p.od, p.do)} · ${noci(p.noci)} · ${cenaOdTekst(p)}`, status: 'New' })
  })
  return l
}
