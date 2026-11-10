// Pravilo UX 3.1: dugme radnje je aktivno samo ako je radnja sledeća i ugao je izvodi; inače je neaktivno sa razlogom.
import { describe, expect, it } from 'vitest'
import { sveRadnje } from '../prica/koraci'
import { POCETNO } from '../demo/cuvanje'
import { poIzvedi } from '../demo/logika'
import { UGLOVI, type Grana, type Poz } from '../prica/tipovi'
import { svePozicije } from '../scenario/pomocno'
import { statusRadnje } from './radnje'

const P = (korak: number, n: number, grana: Grana = 'lanac'): Poz => ({ korak, n, grana })

describe('statusRadnje', () => {
  it('aktivno samo kad je radnja sledeća i gledalac je u pravom uglu', () => {
    expect(statusRadnje(P(1, 0), 'ana', '1.r2')).toEqual({ aktivno: true })
    expect(statusRadnje(P(1, 0), 'ana', '1.r3').aktivno).toBe(false)
    expect(statusRadnje(P(1, 0), 'ana', '1.r3').razlog).toMatch(/^Prvo:/)
  })
  it('van koraka: „Dostupno u koraku N“ i „Urađeno“', () => {
    expect(statusRadnje(P(2, 0), 'ana', '4.x2').razlog).toBe('Dostupno u koraku 4')
    expect(statusRadnje(P(6, 0), 'ana', '4.x2').razlog).toBe('Urađeno')
    expect(statusRadnje(P(4, 2), 'ana', '4.x1').razlog).toBe('Urađeno')
  })
  it('tuđa radnja: „Gledaj kao …“ sa ponudom promene ugla', () => {
    const s = statusRadnje(P(1, 0), 'marko', '1.r2')
    expect(s.aktivno).toBe(false)
    expect(s.razlog).toBe('Gledaj kao Ana')
    expect(s.prebaci).toBe('ana')
    expect(statusRadnje(P(6, 0), 'prodavnica', '6.ana').aktivno).toBe(false)
  })
  it('Marko kod prihvatanja lanca: Anino prihvatanje se odigra samo, pa je njegovo dugme aktivno', () => {
    expect(statusRadnje(P(6, 0), 'marko', '6.marko').aktivno).toBe(true)
  })
  it('radnja iz račve nije deo glavnog toka', () => {
    expect(statusRadnje(P(6, 0, 'lanac'), 'ana', '6R.uzmi').aktivno).toBe(false)
    expect(statusRadnje(P(6, 0, 'poeni'), 'ana', '6R.uzmi').aktivno).toBe(true)
  })
  // V10: bez tautologije — „aktivno“ se proverava prema onome što dugme STVARNO radi: poziva poIzvedi (kao DemoProvider.izvedi), a to ide kroz reducer
  it('dugme koje statusRadnje kaže da je aktivno STVARNO pomera priču, a neaktivno ne menja ništa (svaka pozicija, ugao, radnja)', () => {
    for (const poz of svePozicije())
      for (const r of sveRadnje(poz.grana))
        for (const u of UGLOVI) {
          const status = statusRadnje(poz, u, r.id)
          const posle = poIzvedi({ ...POCETNO, poz }, r.id, u)
          const kontekst = `${poz.korak}/${poz.n} ${u} ${r.id}`
          if (status.aktivno) {
            expect(posle, kontekst).not.toBeNull()
            expect(posle!.poz.korak * 100 + posle!.poz.n, kontekst).toBeGreaterThan(poz.korak * 100 + poz.n)
          } else expect(posle, kontekst).toBeNull()
        }
  })
  it('predlog „Gledaj kao …“ je tačan: iz tog ugla ista radnja prolazi kroz reducer', () => {
    let proverenih = 0
    for (const poz of svePozicije())
      for (const r of sveRadnje(poz.grana))
        for (const u of UGLOVI) {
          const status = statusRadnje(poz, u, r.id)
          if (!status.prebaci || !/^Gledaj kao/.test(status.razlog ?? '')) continue
          proverenih++
          expect(poIzvedi({ ...POCETNO, poz }, r.id, status.prebaci), `${poz.korak}/${poz.n} ${u} ${r.id} → ${status.prebaci}`).not.toBeNull()
        }
    expect(proverenih).toBeGreaterThan(20)
  })
  it('radnje van koraka i van ugla su uvek neaktivne', () => {
    for (const poz of svePozicije())
      for (const r of sveRadnje(poz.grana)) {
        if (r.korak !== poz.korak) for (const u of UGLOVI) expect(statusRadnje(poz, u, r.id).aktivno, `${poz.korak}/${poz.n} ${u} ${r.id}`).toBe(false)
      }
  })
})
