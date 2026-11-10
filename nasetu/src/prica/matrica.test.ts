import { describe, expect, it } from 'vitest'
import { smeNaLink } from '../okvir/pristup'
import { adresaZaUlogu } from '../stanje/izvedeno'
import { izgradiSvet } from './izgradi'
import { putanja } from './koraci'
import { bezUpita, celija, jeEkranPrice, prikaziMiRuta } from './matrica'
import { POSTAVKE, svePozicije } from './pomocno-za-testove'
import { poUloziZa, nazivKoraka, opisKoraka } from '../tekstovi/prica'
import { ULOGE_PRICE, type Pozicija, type UlogaPrice } from './tipovi'

/** Spisak ruta iz App.tsx (obrasci). Test pada ako priča vodi na link koji ne postoji. */
const RUTE = [
  /^\/pocetna$/, /^\/lokacije$/, /^\/lokacije\/[^/]+$/, /^\/brief$/, /^\/izbor\/[^/]+$/, /^\/izbor\/[^/]+\/deljenje$/,
  /^\/izbor\/[^/]+\/primalac$/, /^\/primeri$/, /^\/pravno$/, /^\/produkcija$/, /^\/produkcija\/opcije$/,
  /^\/produkcija\/zahtev\/[^/]+$/, /^\/produkcija\/rezervacija\/[^/]+$/, /^\/produkcija\/predracun\/[^/]+$/,
  /^\/vlasnik$/, /^\/vlasnik\/zahtev\/[^/]+$/, /^\/partner$/,
]

/** Gde stoji dugme svake radnje (pathname), za ulogu koja ga vidi. */
const EKRAN_RADNJE: Record<string, { uloga: UlogaPrice; ruta: (s: ReturnType<typeof izgradiSvet>) => RegExp }> = {
  brief: { uloga: 'produkcija', ruta: () => /^\/brief$/ },
  izbor: { uloga: 'produkcija', ruta: () => /^\/produkcija$/ },
  glas: { uloga: 'produkcija', ruta: () => /^\/izbor\/[^/]+\/primalac$/ },
  opcijaLoft: { uloga: 'produkcija', ruta: () => /^\/lokacije\/industrijski-loft$/ },
  opcijaHala: { uloga: 'produkcija', ruta: () => /^\/lokacije\/brutalisticka-hala$/ },
  osporavanje: { uloga: 'produkcija', ruta: () => /^\/produkcija\/opcije$/ },
  zahtev: { uloga: 'produkcija', ruta: () => /^\/produkcija\/zahtev\/industrijski-loft$/ },
  odobri: { uloga: 'vlasnik', ruta: () => /^\/vlasnik\/zahtev\/[^/]+$/ },
  uplata: { uloga: 'produkcija', ruta: () => /^\/produkcija\/predracun\/[^/]+$/ },
  otkazi: { uloga: 'vlasnik', ruta: () => /^\/vlasnik\/zahtev\/[^/]+$/ },
}

describe('matrica priče (korak × uloga × grana)', () => {
  it('Prikaži mi daje postojeću rutu, dozvoljenu toj ulozi, bez nedefinisanih ID-jeva', () => {
    for (const p of svePozicije()) {
      const s = izgradiSvet(p, POSTAVKE)
      for (const u of ULOGE_PRICE) {
        const ruta = prikaziMiRuta(s, p, u)
        expect(ruta, `${JSON.stringify(p)} ${u}`).not.toContain('undefined')
        expect(RUTE.some((r) => r.test(bezUpita(ruta))), `${ruta} nije poznata ruta`).toBe(true)
        expect(smeNaLink(bezUpita(ruta), u), `${u} ne sme na ${ruta}`).toBe(true)
        expect(jeEkranPrice(s, p, u, bezUpita(ruta))).toBe(true)
        for (const e of celija(s, p, u).ekrani) {
          expect(e).not.toContain('undefined')
          expect(smeNaLink(bezUpita(e), u)).toBe(true)
        }
      }
    }
  })

  it('svaka radnja ima ekran u ćeliji svoje uloge (Nasetu simulacije stoje na ekranu Produkcije)', () => {
    for (const grana of ['vazi', 'otkaz'] as const) {
      const lista = putanja(grana)
      lista.forEach((r) => {
        const odr = lista.filter((x) => x.korak === r.korak).indexOf(r)
        const p: Pozicija = { korak: r.korak, odradjeno: odr, grana: r.korak === 9 ? grana : 'vazi' }
        const s = izgradiSvet(p, POSTAVKE)
        const dogovor = EKRAN_RADNJE[r.id]
        expect(dogovor, r.id).toBeDefined()
        const ekrani = celija(s, p, dogovor.uloga).ekrani.map(bezUpita)
        expect(ekrani.some((e) => dogovor.ruta(s).test(e)), `${r.id}: ${ekrani.join(', ')}`).toBe(true)
      })
    }
  })

  it('tekstovi nisu prazni za svih 9 koraka × 3 uloge (+ grana otkaz)', () => {
    for (const p of svePozicije()) {
      expect(nazivKoraka(p.korak, p.grana)).not.toBe('')
      expect(opisKoraka(p)).not.toBe('')
      for (const u of ULOGE_PRICE) expect(poUloziZa(p, u)).not.toBe('')
    }
  })

  it('adresa se NE vidi produkciji ni partneru ni na jednoj poziciji pre uplate (i posle otkazivanja)', () => {
    for (const p of svePozicije()) {
      const s = izgradiSvet(p, POSTAVKE)
      const uplacenoNaPoziciji = p.korak > 8 && p.grana === 'vazi' || (p.korak === 8 && p.odradjeno === 1)
        || (p.korak === 9 && p.grana === 'otkaz' && p.odradjeno === 0)
      for (const u of ULOGE_PRICE) {
        const nivo = adresaZaUlogu({ ...s, uloga: u }, 'industrijski-loft').nivo
        // Vlasnik lokacije po pravilu (logika/adresa.ts) vidi SVOJU adresu; ekrani priče je ne prikazuju pre uplate (e2e-prica to proverava)
        if (u === 'vlasnik') expect(nivo).toBe('sve')
        else if (u === 'produkcija' && uplacenoNaPoziciji) expect(nivo, JSON.stringify(p)).toBe('sve')
        else expect(nivo, `${JSON.stringify(p)} ${u}`).toBe('zona')
      }
    }
  })
})
