// Svaka ruta iz registra ima komponentu ekrana (nema više rezervnog ekrana "Coming soon").
import { describe, expect, it } from 'vitest'
import { RUTE } from '../pravila/rute'
import { EKRANI } from './index'

describe('registar ekrana', () => {
  it('svih 65 ruta ima komponentu i označeno je kao izgrađeno', () => {
    expect(RUTE.length).toBe(65)
    for (const r of RUTE) {
      expect(EKRANI[r.id], r.id).toBeDefined()
      expect(r.izgradjen, r.id).toBe(true)
    }
  })
})
