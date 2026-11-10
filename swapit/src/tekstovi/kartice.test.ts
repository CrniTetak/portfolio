// Kartica priče: opšti opis + JEDNA rečenica po uglu, za svih 9 koraka × 4 ugla × obe grane. Mora da stane u fiksnu visinu trake
// (2 reda od 1280 px; e2e-visina-trake proverava stvarnu visinu u pregledaču kad se doda).
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import { UGLOVI, type Grana } from '../prica/tipovi'
import { opisKartice, poUgluZa, tekstKartice } from './kartice'

describe('kartice priče', () => {
  for (const ugao of UGLOVI)
    it(`${ugao}: svaki korak i grana ima jednu kratku rečenicu i opis staje u traku`, () => {
      for (const grana of ['lanac', 'poeni'] as Grana[])
        for (let korak = 1; korak <= 9; korak++) {
          if (grana === 'poeni' && korak < 6) continue
          const poz = { korak, n: brojRadnji(korak, grana), grana }
          const rec = poUgluZa(poz, ugao)
          expect(rec, `${ugao} ${korak}${grana}`).toMatch(/^[A-ZČĆŠĐŽ][^.]+\.$/)
          expect(rec.length, rec).toBeLessThanOrEqual(75)
          expect(tekstKartice(poz).length, tekstKartice(poz)).toBeLessThanOrEqual(125)
          expect(opisKartice(poz, ugao).length, `${ugao} ${korak}${grana}`).toBeLessThanOrEqual(195)
        }
    })
  it('račva menja opis koraka 6–8, a korak 9 je isti', () => {
    for (const k of [6, 7, 8]) expect(tekstKartice({ korak: k, n: 0, grana: 'poeni' })).not.toBe(tekstKartice({ korak: k, n: 0, grana: 'lanac' }))
    expect(tekstKartice({ korak: 9, n: 0, grana: 'poeni' })).toBe(tekstKartice({ korak: 9, n: 0, grana: 'lanac' }))
  })
})
