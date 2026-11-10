// Radnje iz prica/koraci.ts moraju da se slažu sa ćelijama tabele 4.0 (pravila/matrica.ts):
// ekran na kom radnja stoji mora postojati u ćeliji te uloge za taj korak, inače bi se ekran radnje i "Show me" razilazili.
import { describe, expect, it } from 'vitest'
import { putanja } from '../prica/koraci'
import { celija } from './matrica'
import { meta } from './rute'

describe('koraci.ts i matrica.ts se slažu', () => {
  for (const grana of ['approved', 'rejected'] as const) {
    it(`grana ${grana}: ekran svake radnje postoji u ćeliji njenog izvođača za taj korak`, () => {
      for (const r of putanja(grana)) {
        if (r.uloga !== 'sustav') {
          expect(celija(r.korak, r.uloga, grana).ekrani, `${r.id} (${r.uloga}) na ${r.ekran}, korak ${r.korak}`).toContain(r.ekran)
          expect(meta(r.ekran).uloga, `${r.id}: ekran ${r.ekran} pripada drugoj ulozi`).toBe(r.uloga)
        }
        for (const s of r.simulira ?? []) {
          expect(celija(r.korak, s.uloga, grana).ekrani, `${r.id}: dugme "Simulate" za ${s.uloga} na ${s.ekran}, korak ${r.korak}`).toContain(s.ekran)
        }
      }
    })
  }
})
