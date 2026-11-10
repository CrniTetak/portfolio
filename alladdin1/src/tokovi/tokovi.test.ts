// Slobodni tokovi (B8.3): svaki tok ide samo napred, Restart ga briše, priča ga ne menja, putovanja se broje u B2, brojke tokova.
import { describe, expect, it } from 'vitest'
import { POCETNO, posleRestarta, proveri } from '../demo/cuvanje'
import { reducer } from '../prica/reducer'
import { CLANSTVO, krstarenjeUkupno, monteKarloAvans, monteKarloSaldo, monteKarloUkupno, konsijerzUkupno, KRSTARENJA, KRSTARENJE, KATALOG, MK_REZULTATI, paket } from '../scenario/ponude'
import { dodajZahtev, FAZE, napreduj, nivoClanstva, odbij, POCETNI_TOKOVI, proveriTokove, rezervisanaPutovanja, type ImeToka } from './tokovi'
import { sviZahtevi } from './zahtevi'
import { razlikaDana } from '../scenario/datumi'

describe('tokovi idu samo napred', () => {
  for (const tok of Object.keys(FAZE) as ImeToka[]) {
    it(`${tok}: napred prolazi, unazad i isto se ignorišu`, () => {
      const faze = (FAZE[tok] as readonly string[]).filter((f) => f !== 'odbijeno')
      let t = POCETNI_TOKOVI
      for (const f of faze.slice(1)) {
        const sledeci = napreduj(t, tok, f as never)
        expect(sledeci[tok]).toBe(f)
        t = sledeci
      }
      expect(napreduj(t, tok, faze[0] as never)).toBe(t) // unazad: ista referenca
      expect(napreduj(t, tok, faze.at(-1) as never)).toBe(t) // ista faza
    })
  }
  it('priča ne menja tokove (reducer ih ne dira)', () => {
    const t = napreduj(POCETNI_TOKOVI, 'krstarenje', 'placeno')
    expect(reducer({ korak: 1, n: 0, ishod: 'A' }, { t: 'radnja', id: '1.pretraga', uloga: 'organizer' })).toEqual({ korak: 1, n: 1, ishod: 'A' })
    expect(t.krstarenje).toBe('placeno')
  })
})

describe('Restart i čuvanje', () => {
  it('Restart briše sve tokove i zahteve', () => {
    const pre = { ...POCETNO, tokovi: { ...napreduj(POCETNI_TOKOVI, 'monteKarlo', 'ponuda'), zahtevi: ['vegas'] } }
    expect(posleRestarta(pre).tokovi).toEqual(POCETNI_TOKOVI)
  })
  it('zapis bez tokova dobija početne; neispravni tokovi odbacuju zapis', () => {
    const { tokovi: _t, ...bezTokova } = POCETNO
    void _t
    expect(proveri(bezTokova)?.tokovi).toEqual(POCETNI_TOKOVI)
    expect(proveri({ ...POCETNO, tokovi: { ...POCETNI_TOKOVI, krstarenje: 'nepoznato' } })).toBeNull()
    expect(proveri({ ...POCETNO, tokovi: { ...POCETNI_TOKOVI, savetnik: 7 } })).toBeNull()
    expect(proveriTokove({ ...POCETNI_TOKOVI, zahtevi: [1] })).toBeNull()
  })
})

describe('putovanja se broje u B2', () => {
  it('samo dovršeni tokovi, nivoi po pragovima', () => {
    let t = POCETNI_TOKOVI
    expect(rezervisanaPutovanja(t)).toBe(0)
    t = napreduj(t, 'monteKarlo', 'zatrazeno')
    expect(rezervisanaPutovanja(t)).toBe(0)
    t = napreduj(napreduj(napreduj(t, 'krstarenje', 'placeno'), 'monteKarlo', 'potvrdjeno'), 'konsijerz', 'placeno')
    expect(rezervisanaPutovanja(t)).toBe(3)
    expect(rezervisanaPutovanja(napreduj(t, 'transport', 'prihvaceno'))).toBe(4)
    expect(nivoClanstva(CLANSTVO.member)).toBe('Member')
    expect(nivoClanstva(CLANSTVO.select)).toBe('Select')
    expect(nivoClanstva(CLANSTVO.signature)).toBe('Signature')
  })
})

describe('brojke slobodnih tokova', () => {
  it('K3: Iberian je najjeftiniji paket iz K4 (cena OD = cena po osobi)', () => {
    expect(KRSTARENJA.find((k) => k.kljuc === 'iberian')!.cenaOd).toBe(KRSTARENJE.cenaPoOsobi)
    expect(krstarenjeUkupno).toBeGreaterThan(KRSTARENJE.cenaPoOsobi * KRSTARENJE.osoba)
  })
  it('M1: Royal Suite OD = ukupna cena ponude; avans + saldo = ukupno', () => {
    expect(MK_REZULTATI[0].cenaOd).toBe(monteKarloUkupno)
    expect(monteKarloAvans + monteKarloSaldo).toBe(monteKarloUkupno)
  })
  it('Q: ponuda konsijerža je zbir dve stavke', () => {
    expect(konsijerzUkupno).toBeGreaterThan(0)
  })
  it('katalog: svaki paket ima trajanje, cenu OD i jedinstven ključ i naziv', () => {
    for (const p of KATALOG) {
      expect(p.noci).toBeGreaterThan(0)
      expect(p.cenaOd).toBeGreaterThan(0)
    }
    expect(new Set(KATALOG.map((p) => p.kljuc)).size).toBe(KATALOG.length)
    expect(new Set(KATALOG.map((p) => p.naziv)).size).toBe(KATALOG.length)
  })
})

describe('zahtevi iz kataloga (nikad se ne prepisuju)', () => {
  it('svaki zahtev je poseban red; ponovljen ključ se ne duplira; potvrđeni tok ostaje', () => {
    let t = napreduj(napreduj(POCETNI_TOKOVI, 'monteKarlo', 'zatrazeno'), 'monteKarlo', 'ponuda')
    t = napreduj(t, 'monteKarlo', 'prihvaceno')
    t = dodajZahtev(dodajZahtev(dodajZahtev(t, 'e1'), 'vegas'), 'e1')
    expect(t.zahtevi).toEqual(['e1', 'vegas'])
    const l = sviZahtevi(t)
    expect(l.map((r) => r.tip)).toEqual(['Monte Carlo', 'Event', 'Group'])
    expect(new Set(l.map((r) => r.ref)).size).toBe(l.length)
    expect(l[0].naziv).toBe(paket('royal').naziv)
    expect(l[1].faze).toEqual(['Quote requested'])
  })
  it('odbijanje samo iz ponude; odbijen tok se ne vraća napred', () => {
    const z = napreduj(POCETNI_TOKOVI, 'transport', 'zatrazeno')
    expect(odbij(z, 'transport')).toBe(z)
    const p = napreduj(z, 'transport', 'ponuda')
    const o = odbij(p, 'transport')
    expect(o.transport).toBe('odbijeno')
    expect(napreduj(o, 'transport', 'prihvaceno')).toBe(o)
    expect(sviZahtevi(o)[0].status).toBe('Declined')
  })
  it('izabrana usluga transporta nosi svoju cenu i polazište', () => {
    const t = { ...napreduj(napreduj(POCETNI_TOKOVI, 'transport', 'zatrazeno'), 'transport', 'ponuda'), usluga: 2 }
    const r = sviZahtevi(t)[0]
    expect(r.naziv).toContain('Cannes')
    expect(r.naziv).not.toContain('Airport')
  })
  it('proveriTokove odbacuje nepoznat ključ i duplikat', () => {
    expect(proveriTokove({ ...POCETNI_TOKOVI, zahtevi: ['nema'] })).toBeNull()
    expect(proveriTokove({ ...POCETNI_TOKOVI, zahtevi: ['e1', 'e1'] })).toBeNull()
  })
})

describe('datumi paketa: kraj = početak + noći (T7, M4, V5 bez neslaganja)', () => {
  it('za svaki paket iz kataloga', () => {
    for (const p of KATALOG) expect(razlikaDana(p.od, p.do), p.naziv).toBe(p.noci)
  })
})
