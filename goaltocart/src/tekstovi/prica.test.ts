// Kartica priče: nijedna rečenica se ne ponavlja dvaput, a finansijer dobija isti tekst u obe grane.
import { describe, expect, it } from 'vitest'
import type { Uloga } from '../prica/tipovi'
import { poUloziZa, pricaZa } from './prica'

const ULOGE: Uloga[] = ['selling', 'buying', 'player', 'agent', 'financier']
const rečenice = (t: string) => t.split(/(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter(Boolean)

describe('kartica priče', () => {
  it('nema iste rečenice dvaput (osnovni tekst + tekst po ulozi)', () => {
    for (const grana of ['approved', 'rejected'] as const)
      for (let k = 1; k <= 9; k++)
        for (const u of ULOGE) {
          const r = rečenice(`${pricaZa(k, grana, u)} ${poUloziZa(k, grana, u)}`)
          expect(new Set(r).size, `${grana} ${k} ${u}: ${r.join(' | ')}`).toBe(r.length)
        }
  })

  it('finansijer: tekst je identičan u obe grane za iste korake', () => {
    for (let k = 1; k <= 9; k++) {
      expect(pricaZa(k, 'rejected', 'financier'), `korak ${k}`).toBe(pricaZa(k, 'approved', 'financier'))
      expect(poUloziZa(k, 'rejected', 'financier'), `korak ${k}`).toBe(poUloziZa(k, 'approved', 'financier'))
    }
  })

  it('finansijer na koracima 1-7 čita "Your part starts at step 8."', () => {
    for (let k = 1; k <= 7; k++) expect(poUloziZa(k, 'approved', 'financier')).toBe('Your part starts at step 8.')
  })
})
