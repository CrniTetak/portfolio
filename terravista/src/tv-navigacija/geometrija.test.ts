// Testovi geometrije (PLAN B8.1): red (indeksi, ivice), mreža kanala sa prelomom, vodič sa poljima različite širine,
// gornja traka ↔ sadržaj, izričiti susedi, „nista“, prazan sloj; nikad kruženje.
import { describe, expect, it } from 'vitest'
import { NISTA, sledeci, type Kandidat, type Smer } from './geometrija'

const k = (id: string, x: number, y: number, sirina: number, visina: number, vise: Partial<Kandidat> = {}): Kandidat => ({ id, rect: { x, y, sirina, visina }, ...vise })

/** Red kartica 320 × 200, razmak 32; `redIme` daje indekse. */
function red(redIme: string, y: number, n: number, x0 = 96): Kandidat[] {
  return Array.from({ length: n }, (_, i) => k(`${redIme}-${i}`, x0 + i * 352, y, 320, 200, { red: redIme, indeks: i }))
}
const idi = (svi: Kandidat[], od: string, smer: Smer, zapamcen?: Record<string, string>) =>
  sledeci(svi.find((x) => x.id === od)!, svi, smer, { zapamcenRed: zapamcen ? (r) => zapamcen[r] : undefined })

describe('red (levo-desno po indeksu)', () => {
  const svi = red('a', 400, 5)
  it('desno ide na sledeći indeks, levo na prethodni', () => {
    expect(idi(svi, 'a-1', 'desno')).toBe('a-2')
    expect(idi(svi, 'a-3', 'levo')).toBe('a-2')
  })
  it('na ivici reda ostaje (bez kruženja)', () => {
    expect(idi(svi, 'a-4', 'desno')).toBeNull()
    expect(idi(svi, 'a-0', 'levo')).toBeNull()
  })
  it('radi i kad su elementi van slike (negativne i velike koordinate)', () => {
    const daleko = red('a', 400, 12, -2000)
    expect(idi(daleko, 'a-10', 'desno')).toBe('a-11')
  })
  it('preskače onemogućen element', () => {
    const s = red('a', 400, 4)
    s[2] = { ...s[2], onemogucen: true }
    expect(idi(s, 'a-1', 'desno')).toBe('a-3')
    expect(idi(s, 'a-3', 'levo')).toBe('a-1')
  })
  it('levo-desno iz reda nikad ne beži u drugi red', () => {
    const s = [...red('a', 400, 3), ...red('b', 700, 3)]
    expect(idi(s, 'a-2', 'desno')).toBeNull()
    expect(idi(s, 'b-0', 'levo')).toBeNull()
  })
})

describe('red gore-dole (ulazak u drugi red)', () => {
  const s = [...red('a', 300, 5), ...red('b', 600, 5), ...red('c', 900, 3)]
  it('dole ulazi u najbliži element ispod (preklapanje po poprečnoj osi)', () => {
    expect(idi(s, 'a-2', 'dole')).toBe('b-2')
    expect(idi(s, 'b-1', 'gore')).toBe('a-1')
  })
  it('bira ZAPAMĆENI element reda u koji se ulazi', () => {
    expect(idi(s, 'a-2', 'dole', { b: 'b-4' })).toBe('b-4')
    expect(idi(s, 'c-0', 'gore', { b: 'b-3' })).toBe('b-3')
  })
  it('zapamćeni element koji više ne postoji se ignoriše', () => {
    expect(idi(s, 'a-1', 'dole', { b: 'b-99' })).toBe('b-1')
  })
  it('red kraći od onog iznad: dole od krajnjeg desnog ide na najbliži', () => {
    expect(idi(s, 'b-4', 'dole')).toBe('c-2')
  })
  it('na vrhu i na dnu ostaje (bez kruženja)', () => {
    expect(idi(s, 'a-0', 'gore')).toBeNull()
    expect(idi(s, 'c-1', 'dole')).toBeNull()
  })
})

describe('mreža kanala sa prelomom (bez redova)', () => {
  // 4 u redu, ukupno 10: poslednji red ima 2
  const mreza = Array.from({ length: 10 }, (_, i) => k(`m-${i}`, 96 + (i % 4) * 352, 300 + Math.floor(i / 4) * 240, 320, 200))
  it('levo-desno ide u istom redu', () => {
    expect(idi(mreza, 'm-1', 'desno')).toBe('m-2')
    expect(idi(mreza, 'm-2', 'levo')).toBe('m-1')
  })
  it('na početku i kraju reda NE preskače u drugi red (nema kruženja ni „preloma“)', () => {
    expect(idi(mreza, 'm-3', 'desno')).toBeNull()
    expect(idi(mreza, 'm-4', 'levo')).toBeNull()
    expect(idi(mreza, 'm-8', 'levo')).toBeNull()
  })
  it('gore-dole ide u istoj koloni', () => {
    expect(idi(mreza, 'm-1', 'dole')).toBe('m-5')
    expect(idi(mreza, 'm-6', 'gore')).toBe('m-2')
  })
  it('iz nepotpunog reda dole od kolone bez suseda ide na najbliži', () => {
    expect(idi(mreza, 'm-7', 'dole')).toBe('m-9')
    expect(idi(mreza, 'm-3', 'dole')).toBe('m-7')
  })
  it('na ivicama ostaje', () => {
    expect(idi(mreza, 'm-0', 'gore')).toBeNull()
    expect(idi(mreza, 'm-9', 'dole')).toBeNull()
  })
})

describe('vodič sa poljima različite širine', () => {
  // dva reda; gornji: 0–90 min i 90–135; donji: 0–45, 45–135
  const v = [
    k('g1a', 300, 200, 540, 88),
    k('g1b', 852, 200, 270, 88),
    k('g2a', 300, 300, 270, 88),
    k('g2b', 582, 300, 540, 88),
  ]
  it('dole iz dugog polja ostaje u istom vremenu (veće preklapanje po centru)', () => {
    expect(idi(v, 'g1a', 'dole')).toBe('g2a')
  })
  it('dole iz kasnijeg polja ide na polje koje se preklapa', () => {
    expect(idi(v, 'g1b', 'dole')).toBe('g2b')
  })
  it('levo-desno u istom redu', () => {
    expect(idi(v, 'g1a', 'desno')).toBe('g1b')
    expect(idi(v, 'g2b', 'levo')).toBe('g2a')
  })
  it('na kraju vodiča ostaje', () => {
    expect(idi(v, 'g1b', 'desno')).toBeNull()
    expect(idi(v, 'g2a', 'levo')).toBeNull()
  })
})

describe('gornja traka ↔ sadržaj', () => {
  const nav = Array.from({ length: 7 }, (_, i) => k(`nav-${i}`, 380 + i * 190, 54, 180, 72, { red: 'nav', indeks: i }))
  const sadrzaj = red('a', 300, 4)
  const svi = [...nav, ...sadrzaj]
  it('dole iz trake ulazi u sadržaj, gore iz sadržaja u traku', () => {
    expect(idi(svi, 'nav-1', 'dole')).toBeTruthy()
    expect(idi(svi, 'a-2', 'gore')).toMatch(/^nav-/)
  })
  it('traka se šeta po indeksu; levo od prvog stavke ostaje', () => {
    expect(idi(svi, 'nav-0', 'levo')).toBeNull()
    expect(idi(svi, 'nav-6', 'desno')).toBeNull()
  })
  it('sadržaj NIKAD ne „beži“ levo/desno u traku', () => {
    expect(idi(svi, 'a-0', 'levo')).toBeNull()
    expect(idi(svi, 'a-3', 'desno')).toBeNull()
  })
  it('vraća se u zapamćenu stavku trake', () => {
    expect(idi(svi, 'a-0', 'gore', { nav: 'nav-5' })).toBe('nav-5')
  })
})

describe('levo-desno samo u istom pojasu (nema dijagonalnog skakanja)', () => {
  const s = [
    ...Array.from({ length: 7 }, (_, i) => k(`nav-${i}`, 380 + i * 190, 54, 180, 72, { red: 'nav', indeks: i })),
    k('gledaj', 164, 200, 270, 88), // jedino dugme u tapeti; desno od njega (iznad) je traka
  ]
  it('desno/levo od jedinog elementa u pojasu ostaje, ne skače u traku iznad', () => {
    expect(idi(s, 'gledaj', 'desno')).toBeNull()
    expect(idi(s, 'gledaj', 'levo')).toBeNull()
  })
  it('gore iz tapete i dalje ide u traku (uspravno kretanje ne traži preklapanje)', () => {
    expect(idi(s, 'gledaj', 'gore')).toMatch(/^nav-/)
  })
})

describe('izričiti susedi, „nista“, prazan sloj', () => {
  it('izričit sused ima prednost nad geometrijom', () => {
    const s = [k('a', 0, 0, 100, 100, { dole: 'c' }), k('b', 0, 200, 100, 100), k('c', 600, 600, 100, 100)]
    expect(idi(s, 'a', 'dole')).toBe('c')
  })
  it('„nista“ zadržava izbor', () => {
    const s = [k('a', 0, 0, 100, 100, { dole: NISTA }), k('b', 0, 200, 100, 100)]
    expect(idi(s, 'a', 'dole')).toBeNull()
  })
  it('izričit sused koji ne postoji (ili je onemogućen) se ignoriše, važi geometrija', () => {
    const s = [k('a', 0, 0, 100, 100, { dole: 'nema' }), k('b', 0, 200, 100, 100)]
    expect(idi(s, 'a', 'dole')).toBe('b')
    const t = [k('a', 0, 0, 100, 100, { dole: 'c' }), k('b', 0, 200, 100, 100), k('c', 0, 400, 100, 100, { onemogucen: true })]
    expect(idi(t, 'a', 'dole')).toBe('b')
  })
  it('jedini element: svaka strelica ostaje', () => {
    const s = [k('a', 0, 0, 100, 100)]
    for (const smer of ['gore', 'dole', 'levo', 'desno'] as Smer[]) expect(idi(s, 'a', smer)).toBeNull()
  })
  it('prozor preko ekrana: samo elementi prosleđenog sloja su kandidati', () => {
    const prozor = [k('p-ok', 700, 500, 200, 80), k('p-odustani', 950, 500, 200, 80)]
    expect(idi(prozor, 'p-ok', 'desno')).toBe('p-odustani')
    expect(idi(prozor, 'p-ok', 'gore')).toBeNull() // element ekrana iznad nije u spisku sloja
  })
})

describe('nikad kruženje: duga šetnja uvek ostaje u skupu', () => {
  it('iz bilo kog elementa, u bilo kom smeru, rezultat je ili null ili drugi element', () => {
    const svi = [...red('a', 300, 5), ...red('b', 600, 3), ...red('c', 900, 6)]
    for (const e of svi)
      for (const smer of ['gore', 'dole', 'levo', 'desno'] as Smer[]) {
        const r = idi(svi, e.id, smer)
        expect(r === null || (r !== e.id && svi.some((x) => x.id === r))).toBe(true)
      }
  })
})
