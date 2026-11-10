// Kartica priče: opšti opis + JEDNA rečenica po ulozi, za svih 9 koraka × 3 uloge × ishode (7–9).
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import type { Ishod, Uloga } from '../prica/tipovi'
import { opisKartice, poUloziZa } from './kartice'

describe('rečenice po ulozi', () => {
  for (const uloga of ['organizer', 'traveler', 'advisor'] as Uloga[])
    it(`${uloga}: svaki korak i ishod ima jednu kratku rečenicu`, () => {
      for (const ishod of ['A', 'B', 'C'] as Ishod[])
        for (let korak = 1; korak <= 9; korak++) {
          const r = poUloziZa({ korak, n: 0, ishod }, uloga)
          expect(r, `${uloga} ${korak}${ishod}`).toMatch(/^[A-Z][^.]+\.$/)
          expect(r.length, r).toBeLessThanOrEqual(75)
          expect(opisKartice({ korak, n: brojRadnji(korak, ishod), ishod }, uloga).length, `${uloga} ${korak}${ishod}`).toBeLessThanOrEqual(185)
        }
    })
  it('gost nema rečenicu po ulozi', () => expect(poUloziZa({ korak: 1, n: 0, ishod: 'A' }, 'guest')).toBe(''))
})
