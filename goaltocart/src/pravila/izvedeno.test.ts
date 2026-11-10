// odbijeno() i fazaPovracaja(): jedina provera "registracija odbijena", kroz sve (korak, odrađeno) u obe grane.
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/reducer'
import type { Grana, Pozicija } from '../prica/tipovi'
import { fazaPovracaja, odbijeno } from './izvedeno'

const sve = (grana: Grana): Pozicija[] => {
  const lista: Pozicija[] = []
  for (let korak = 1; korak <= 9; korak++) {
    const n = brojRadnji({ korak, grana })
    for (let odradjeno = 0; odradjeno <= n; odradjeno++) lista.push({ korak, odradjeno, grana })
  }
  return lista
}

describe('odbijeno() i fazaPovracaja()', () => {
  it('u grani Approved nikad nije odbijeno i faza je "nije"', () => {
    for (const p of sve('approved')) {
      expect(odbijeno(p), JSON.stringify(p)).toBe(false)
      expect(fazaPovracaja(p), JSON.stringify(p)).toBe('nije')
    }
  })

  it('u grani Rejected: odbijeno tek od 6/završno (kad su oba kluba uneli paket), svuda posle toga', () => {
    for (const p of sve('rejected')) {
      const ocekivano = p.korak > 6 || (p.korak === 6 && p.odradjeno === brojRadnji({ korak: 6, grana: 'rejected' }))
      expect(odbijeno(p), JSON.stringify(p)).toBe(ocekivano)
    }
  })

  it('faza povraćaja prati korak: 6 odbijeno, 7 pokrenut pa vraćen, 8 vraćen, 9 potvrđen pa arhiviran', () => {
    const rej = (korak: number, odradjeno: number): Pozicija => ({ korak, odradjeno, grana: 'rejected' })
    const n6 = brojRadnji({ korak: 6, grana: 'rejected' })
    expect(fazaPovracaja(rej(6, 0))).toBe('nije')
    expect(fazaPovracaja(rej(6, n6))).toBe('odbijeno')
    expect(fazaPovracaja(rej(7, 0))).toBe('pokrenut')
    expect(fazaPovracaja(rej(7, brojRadnji({ korak: 7, grana: 'rejected' })))).toBe('vracen')
    expect(fazaPovracaja(rej(8, 0))).toBe('vracen')
    expect(fazaPovracaja(rej(9, 0))).toBe('potvrdjen')
    expect(fazaPovracaja(rej(9, brojRadnji({ korak: 9, grana: 'rejected' })))).toBe('arhiviran')
  })

  it('faza je "nije" tačno kad nije odbijeno', () => {
    for (const p of sve('rejected')) expect(fazaPovracaja(p) === 'nije', JSON.stringify(p)).toBe(!odbijeno(p))
  })
})
