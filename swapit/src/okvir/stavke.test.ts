import { describe, expect, it } from 'vitest'
import { RUTA_PO_ID } from '../pravila/rute'
import { DESNA_TRAKA, IKONSKA_TRAKA, MENI_PROFILA, OSTALO_U_MENIJU, ZAGLAVLJE_IKONE } from './stavke'

describe('stavke okvira vode na postojeće ekrane', () => {
  const sve = { ZAGLAVLJE_IKONE, DESNA_TRAKA, IKONSKA_TRAKA, MENI_PROFILA, OSTALO_U_MENIJU }
  for (const [ime, lista] of Object.entries(sve))
    it(ime, () => {
      expect(lista.length).toBeGreaterThan(2)
      for (const s of lista) {
        expect(RUTA_PO_ID[s.ekran], `${ime}: ${s.naziv} → ${s.ekran}`).toBeDefined()
        expect(s.naziv.length).toBeGreaterThan(2)
      }
    })
  it('ikonska traka telefona ima osam stavki (Figma)', () => expect(IKONSKA_TRAKA.length).toBe(8))
})
