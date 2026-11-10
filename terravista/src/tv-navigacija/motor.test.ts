// Testovi motora fokusa (bez pregledača): početni izbor, tačno jedan izabran, pamćenje po ekranu, slojevi, Nazad, bez kruženja.
import { describe, expect, it } from 'vitest'
import { FokusMotor, SLOJ_EKRAN, type StavkaMotora } from './motor'

type Lazna = StavkaMotora & { izabran: boolean; aktivirano: number }

function lazna(id: string, x: number, y: number, vise: Partial<StavkaMotora> = {}): Lazna {
  const s: Lazna = {
    id,
    sloj: SLOJ_EKRAN,
    etiketa: id,
    rect: () => ({ x, y, sirina: 300, visina: 200 }),
    aktiviraj: () => {
      s.aktivirano++
    },
    prikaziIzabran: (da) => {
      s.izabran = da
    },
    izabran: false,
    aktivirano: 0,
    ...vise,
  }
  return s
}

const cekaj = () => new Promise<void>((r) => queueMicrotask(r))
const izabranih = (stavke: Lazna[]) => stavke.filter((s) => s.izabran).map((s) => s.id)

function napravi(stavke: Lazna[], pocetni?: string, kljuc = 'T2') {
  const motor = new FokusMotor()
  motor.noviEkran(kljuc, pocetni)
  for (const s of stavke) motor.registruj(s)
  return motor
}

describe('početni izbor', () => {
  it('bira početni element iz registra ekrana', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0), lazna('c', 800, 0)]
    napravi(s, 'b')
    await cekaj()
    expect(izabranih(s)).toEqual(['b'])
  })
  it('bez početnog ili sa nepostojećim bira prvi registrovani (nikad 0 izabranih)', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0)]
    napravi(s, 'nema')
    await cekaj()
    expect(izabranih(s)).toEqual(['a'])
  })
  it('početni može biti funkcija (zavisi od stanja)', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0)]
    napravi(s, undefined)
    const m = new FokusMotor()
    m.noviEkran('T2', () => 'b')
    for (const x of s) m.registruj(x)
    await cekaj()
    expect(s.find((x) => x.id === 'b')!.izabran).toBe(true)
  })
  it('onemogućen početni se preskače', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0, { onemogucen: true })]
    napravi(s, 'b')
    await cekaj()
    expect(izabranih(s)).toEqual(['a'])
  })
})

describe('kretanje i tačno jedan izabran', () => {
  it('posle svake strelice tačno jedan izabran; na ivici ostaje (bez kruženja)', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0), lazna('c', 800, 0)]
    const m = napravi(s, 'a')
    await cekaj()
    expect(m.pomeri('levo')).toBe(false)
    expect(izabranih(s)).toEqual(['a'])
    expect(m.pomeri('desno')).toBe(true)
    expect(m.pomeri('desno')).toBe(true)
    expect(izabranih(s)).toEqual(['c'])
    expect(m.pomeri('desno')).toBe(false)
    expect(izabranih(s)).toEqual(['c'])
    expect(m.pomeri('gore')).toBe(false)
  })
  it('udar na ivici se javlja', async () => {
    const s = [lazna('a', 0, 0)]
    const udari: string[] = []
    const m = new FokusMotor({ onUdar: (smer) => udari.push(smer) })
    m.noviEkran('T2', 'a')
    m.registruj(s[0])
    await cekaj()
    m.pomeri('dole')
    expect(udari).toEqual(['dole'])
  })
  it('klik = izaberi + OK', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0)]
    const m = napravi(s, 'a')
    await cekaj()
    m.klik('b')
    expect(izabranih(s)).toEqual(['b'])
    expect(s[1].aktivirano).toBe(1)
    expect(s[0].aktivirano).toBe(0)
  })
  it('OK aktivira izabrani; klik na onemogućen ne radi ništa', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0, { onemogucen: true })]
    const m = napravi(s, 'a')
    await cekaj()
    m.ok()
    m.klik('b')
    expect(s[0].aktivirano).toBe(1)
    expect(s[1].aktivirano).toBe(0)
    expect(izabranih(s)).toEqual(['a'])
  })
  it('uklanjanje izabranog elementa: izbor se odmah prebacuje na drugi (nikad 0)', async () => {
    const s = [lazna('a', 0, 0), lazna('b', 400, 0)]
    const m = new FokusMotor()
    m.noviEkran('T2', 'a')
    const odjavi = s.map((x) => m.registruj(x))
    await cekaj()
    odjavi[0]()
    await cekaj()
    expect(izabranih(s.slice(1))).toEqual(['b'])
  })
})

describe('pamćenje po ekranu', () => {
  it('pri povratku na ekran vraća zapamćeni izbor', async () => {
    const m = new FokusMotor()
    let s = [lazna('a', 0, 0), lazna('b', 400, 0), lazna('c', 800, 0)]
    m.noviEkran('T2', 'a')
    let odjave = s.map((x) => m.registruj(x))
    await cekaj()
    m.pomeri('desno')
    m.pomeri('desno')
    expect(izabranih(s)).toEqual(['c'])
    // odlazak na drugi ekran
    odjave.forEach((o) => o())
    const drugi = [lazna('x', 0, 0)]
    m.noviEkran('T8:doma', 'x')
    drugi.forEach((x) => m.registruj(x))
    await cekaj()
    expect(izabranih(drugi)).toEqual(['x'])
    // povratak
    s = [lazna('a', 0, 0), lazna('b', 400, 0), lazna('c', 800, 0)]
    m.noviEkran('T2', 'a')
    odjave = s.map((x) => m.registruj(x))
    await cekaj()
    expect(izabranih(s)).toEqual(['c'])
  })
  it('pamti element reda: povratak u red bira poslednji izabrani u njemu', async () => {
    const gore = [lazna('g0', 0, 0, { red: 'g', indeks: 0 }), lazna('g1', 400, 0, { red: 'g', indeks: 1 })]
    const dole = [lazna('d0', 0, 400, { red: 'd', indeks: 0 }), lazna('d1', 400, 400, { red: 'd', indeks: 1 })]
    const s = [...gore, ...dole]
    const m = napravi(s, 'g0')
    await cekaj()
    m.pomeri('dole') // d0
    m.pomeri('desno') // d1
    m.pomeri('gore') // ulazak u red g: zapamćeni g0 (a ne g1 koji je iznad d1)
    expect(izabranih(s)).toEqual(['g0'])
    m.pomeri('desno') // g1
    m.pomeri('levo') // g0
    m.pomeri('dole') // zapamćeni d1, ne najbliži d0
    expect(izabranih(s)).toEqual(['d1'])
  })
  it('zaboraviSve (Restart) briše pamćenje', async () => {
    const m = new FokusMotor()
    m.noviEkran('T2', 'a')
    const s = [lazna('a', 0, 0), lazna('b', 400, 0)]
    const odjave = s.map((x) => m.registruj(x))
    await cekaj()
    m.pomeri('desno')
    expect(izabranih(s)).toEqual(['b'])
    odjave.forEach((o) => o())
    m.zaboraviSve()
    // posle zaborava se na isti ekran ulazi na početni izbor, ne na zapamćeni
    const t = [lazna('a', 0, 0), lazna('b', 400, 0)]
    m.noviEkran('T2', 'a')
    t.forEach((x) => m.registruj(x))
    await cekaj()
    expect(izabranih(t)).toEqual(['a'])
  })
})

describe('slojevi (prozor preko ekrana)', () => {
  it('fokus ne izlazi iz prozora; zatvaranje vraća izbor na ekranu; tačno jedan izabran u svakom trenutku', async () => {
    const ekran = [lazna('a', 0, 0), lazna('b', 400, 0)]
    const m = napravi(ekran, 'a')
    await cekaj()
    m.pomeri('desno')
    expect(izabranih(ekran)).toEqual(['b'])

    let zatvoreno = 0
    m.otvoriSloj('panel', { pocetni: 'p-ok', onNazad: () => { zatvoreno++; m.zatvoriSloj('panel') } })
    const prozor = [lazna('p-ok', 100, 500, { sloj: 'panel' }), lazna('p-ne', 500, 500, { sloj: 'panel' })]
    prozor.forEach((x) => m.registruj(x))
    await cekaj()
    expect(izabranih(prozor)).toEqual(['p-ok'])
    expect(izabranih(ekran)).toEqual([]) // element ekrana ne svetli dok je prozor otvoren
    expect(m.pomeri('gore')).toBe(false) // ne beži u ekran
    expect(m.pomeri('levo')).toBe(false)
    expect(m.pomeri('desno')).toBe(true)
    expect(izabranih(prozor)).toEqual(['p-ne'])

    expect(m.nazad()).toBe('sloj') // prvo zatvara prozor
    expect(zatvoreno).toBe(1)
    await cekaj()
    expect(izabranih(ekran)).toEqual(['b']) // vraćen izbor sa ekrana
    expect(m.nazad()).toBe('ekran') // sad Nazad ide na prethodni ekran
  })
})

describe('izričiti susedi kroz motor', () => {
  it('„nista“ zadržava izbor, id preskače geometriju', async () => {
    const s = [lazna('a', 0, 0, { dole: 'c', desno: 'nista' }), lazna('b', 400, 0), lazna('c', 0, 900)]
    const m = napravi(s, 'a')
    await cekaj()
    expect(m.pomeri('desno')).toBe(false)
    expect(m.pomeri('dole')).toBe(true)
    expect(izabranih(s)).toEqual(['c'])
  })
})
