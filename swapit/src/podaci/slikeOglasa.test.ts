// DORADA PK6 i S12: slika je vezana za id oglasa (ne za mesto u listi), a fotografija kategorije ide samo uz robu koja joj odgovara.
import { describe, expect, it } from 'vitest'
import { OGLASI_BEOGRAD } from '../scenario/oglasi'
import { FOTOGRAFIJE } from './fotografije'
import { IKONICA_PO_OGLASU, SLIKA_PO_OGLASU, slikaOglasa } from './slikeOglasa'

const oglas = (id: string) => OGLASI_BEOGRAD.find((o) => o.id === id)
const ID_FOTO = new Set(FOTOGRAFIJE.map((f) => f.id))

describe('slika oglasa po stabilnom ključu', () => {
  it('svaki ključ je postojeći oglas, a fotografija postoji', () => {
    for (const [oid, foto] of Object.entries(SLIKA_PO_OGLASU)) {
      expect(oglas(oid), oid).toBeDefined()
      expect(ID_FOTO.has(foto), foto).toBe(true)
    }
  })
  it('fotografija kategorije se daje samo oglasu iz te kategorije', () => {
    for (const [oid, foto] of Object.entries(SLIKA_PO_OGLASU)) expect(`kat-${oglas(oid)!.kat}`, `${oid} → ${foto}`).toBe(foto)
  })
  it('jabuke samo uz jabuke; krompir, kupus, šargarepa… nemaju fotografiju jabuka', () => {
    for (const o of OGLASI_BEOGRAD.filter((x) => x.kat === 'sveze-voce-i-povrce')) {
      const foto = slikaOglasa(o.id)
      if (foto === 'kat-sveze-voce-i-povrce') expect(o.naslov.toLowerCase(), o.naslov).toContain('jabuk')
    }
    for (const id of ['krompir-20-kg', 'kupus-10-glavica', 'sargarepa-5-kg', 'grozdje-5-kg', 'paradajz-iz-baste', 'kruska-abate-fetel-5-kg']) expect(slikaOglasa(id), id).not.toBe('kat-sveze-voce-i-povrce') // svako ima sopstvenu sliku ili ilustraciju, nikad jabuke
  })
  it('ilustracije voća i povrća se razlikuju po proizvodu (krompir ≠ jabuka)', () => {
    const ikone = Object.values(IKONICA_PO_OGLASU)
    expect(IKONICA_PO_OGLASU['krompir-20-kg']).not.toBe('apple')
    expect(new Set(ikone).size).toBeGreaterThanOrEqual(5)
    for (const id of Object.keys(IKONICA_PO_OGLASU)) expect(oglas(id), id).toBeDefined()
  })
  it('slika ne zavisi od redosleda: ista fotografija bez obzira na mesto oglasa u listi', () => {
    expect(slikaOglasa('monitor-24-inca')).toBe('kat-it-oprema')
    expect(slikaOglasa('usisivac')).toBeNull() // nema fotografije: ilustracija
    expect(slikaOglasa('markov-bicikl')).toBeNull() // T4-3: dečji bicikl 20 inča nema odgovarajuću fotografiju (bila je bicikl za odrasle) — ilustracija
    expect(slikaOglasa('nepostojeci-oglas')).toBeNull()
  })
})
