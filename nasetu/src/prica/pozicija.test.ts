import { describe, expect, it } from 'vitest'
import { pocetnoStanje } from '../stanje/scenario'
import { izgradiSvet } from './izgradi'
import { putanja } from './koraci'
import { ciljBack, ciljGrana, ciljNext, ciljSkok } from './navigacija'
import { jeVazecaPozicija, jeZavrsenKorak, normalizuj, pozicijaPosleBroja, redniBroj } from './pozicija'
import { POSTAVKE, svePozicije } from './pomocno-za-testove'
import { primeni } from './most'
import type { Grana, Pozicija } from './tipovi'

describe('pozicija u priči', () => {
  it('ima 9 koraka; glavna grana ima 9 radnji, grana otkaz 10', () => {
    expect(putanja('vazi')).toHaveLength(9)
    expect(putanja('otkaz')).toHaveLength(10)
    expect(svePozicije().every(jeVazecaPozicija)).toBe(true)
  })

  it('normalizuj: račva se vraća na glavnu granu pre koraka 9; odrađeno se seče na broj radnji', () => {
    expect(normalizuj({ korak: 5, odradjeno: 0, grana: 'otkaz' }).grana).toBe('vazi')
    expect(normalizuj({ korak: 9, odradjeno: 0, grana: 'otkaz' }).grana).toBe('otkaz')
    expect(normalizuj({ korak: 2, odradjeno: 7, grana: 'vazi' }).odradjeno).toBe(1)
    expect(jeVazecaPozicija({ korak: 4, odradjeno: 0, grana: 'otkaz' })).toBe(false)
    expect(jeVazecaPozicija({ korak: 10, odradjeno: 0, grana: 'vazi' })).toBe(false)
    expect(jeVazecaPozicija({ korak: 9, odradjeno: 2, grana: 'otkaz' })).toBe(false)
  })

  it('Dalje: početno → završno → početak sledećeg; na kraju priče nema cilja', () => {
    expect(ciljNext({ korak: 5, odradjeno: 0, grana: 'vazi' })).toEqual({ korak: 5, odradjeno: 3, grana: 'vazi' })
    expect(ciljNext({ korak: 5, odradjeno: 3, grana: 'vazi' })).toEqual({ korak: 6, odradjeno: 0, grana: 'vazi' })
    expect(ciljNext({ korak: 1, odradjeno: 0, grana: 'vazi' })).toEqual({ korak: 2, odradjeno: 0, grana: 'vazi' })
    expect(ciljNext({ korak: 9, odradjeno: 0, grana: 'vazi' })).toBeNull()
    expect(ciljNext({ korak: 9, odradjeno: 0, grana: 'otkaz' })).toEqual({ korak: 9, odradjeno: 1, grana: 'otkaz' })
    expect(ciljNext({ korak: 9, odradjeno: 1, grana: 'otkaz' })).toBeNull()
  })

  it('Nazad: iz završnog/delimičnog na početak koraka; iz početnog na prethodni; na 1/početno ostaje', () => {
    expect(ciljBack({ korak: 5, odradjeno: 2, grana: 'vazi' })).toEqual({ korak: 5, odradjeno: 0, grana: 'vazi' })
    expect(ciljBack({ korak: 5, odradjeno: 0, grana: 'vazi' })).toEqual({ korak: 4, odradjeno: 0, grana: 'vazi' })
    expect(ciljBack({ korak: 9, odradjeno: 0, grana: 'otkaz' })).toEqual({ korak: 8, odradjeno: 0, grana: 'vazi' })
    expect(ciljBack({ korak: 1, odradjeno: 0, grana: 'vazi' })).toEqual({ korak: 1, odradjeno: 0, grana: 'vazi' })
  })

  it('račva samo na koraku 9; skok pre 9 vraća glavnu granu', () => {
    expect(ciljGrana({ korak: 5, odradjeno: 0, grana: 'vazi' }, 'otkaz').grana).toBe('vazi')
    expect(ciljGrana({ korak: 9, odradjeno: 0, grana: 'vazi' }, 'otkaz')).toEqual({ korak: 9, odradjeno: 0, grana: 'otkaz' })
    expect(ciljSkok({ korak: 9, odradjeno: 1, grana: 'otkaz' }, 3)).toEqual({ korak: 3, odradjeno: 0, grana: 'vazi' })
    expect(ciljSkok({ korak: 3, odradjeno: 1, grana: 'vazi' }, 9)).toEqual({ korak: 9, odradjeno: 0, grana: 'vazi' })
  })

  it('pozicijaPosleBroja i redniBroj se slažu', () => {
    for (const grana of ['vazi', 'otkaz'] as Grana[]) {
      for (let n = 0; n <= putanja(grana).length; n++) {
        const p = pozicijaPosleBroja(grana, n)
        expect(jeVazecaPozicija(p)).toBe(true)
        expect(redniBroj(p)).toBe(n)
      }
    }
  })
})

describe('svet se gradi iz pozicije isto kao ručnim radnjama', () => {
  for (const grana of ['vazi', 'otkaz'] as Grana[]) {
    it(`ceo put radnju po radnju (${grana}): vođeni režim, svaka radnja prolazi i pomera poziciju`, () => {
      let s = izgradiSvet({ korak: 1, odradjeno: 0, grana: 'vazi' }, POSTAVKE)
      expect(s).toEqual({ ...pocetnoStanje(), prica: s.prica })
      const lista = putanja(grana)
      lista.forEach((r, i) => {
        // Dalje na korak koji sadrži radnju (svet se ne menja, samo pozicija)
        if (s.prica.korak < r.korak) s = { ...s, prica: { ...s.prica, korak: r.korak, odradjeno: 0, grana: r.korak === 9 ? grana : 'vazi' } }
        const novo = primeni(s, r.napravi(s))
        expect(novo, `radnja ${r.id} je odbijena`).not.toBe(s)
        s = novo
        // ručno odigrana radnja daje isto što i izgradiSvet za istu poziciju
        const poz: Pozicija = pozicijaPosleBroja(grana, i + 1)
        expect(s.prica).toMatchObject({ korak: poz.korak, odradjeno: poz.odradjeno })
        expect({ ...s, prica: null }).toEqual({ ...izgradiSvet({ ...poz, grana: poz.korak < 9 ? 'vazi' : grana }, POSTAVKE), prica: null })
      })
    })
  }

  it('za SVAKU poziciju: skok, Dalje i Nazad daju isto što i ponovno odigravanje (bez izuzetka)', () => {
    for (const p of svePozicije()) {
      const svet = izgradiSvet(p, POSTAVKE)
      expect(svet.prica).toMatchObject(p)
      expect(svet.prica.odstupljeno).toBe(false)
      for (const cilj of [ciljNext(p), ciljBack(p), ciljSkok(p, 1), ciljSkok(p, 9)]) {
        if (cilj) expect(jeVazecaPozicija(cilj)).toBe(true)
        if (cilj) expect(() => izgradiSvet(cilj, POSTAVKE)).not.toThrow()
      }
    }
  })

  it('završno stanje koraka == početno sledećeg (isti svet)', () => {
    for (const p of svePozicije()) {
      if (!jeZavrsenKorak(p) || p.korak >= 9) continue
      const sledeci = ciljNext(p)!
      expect({ ...izgradiSvet(p, POSTAVKE), prica: null }).toEqual({ ...izgradiSvet(sledeci, POSTAVKE), prica: null })
    }
  })

  it('radnja koja nije sledeća se odbija', () => {
    const s = izgradiSvet({ korak: 1, odradjeno: 0, grana: 'vazi' }, POSTAVKE)
    const zahtev = putanja('vazi')[6].napravi(s) // zahtev za rezervaciju, a brief još nije poslat
    expect(primeni(s, zahtev)).toBe(s)
  })
})
