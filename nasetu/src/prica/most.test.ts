import { describe, expect, it } from 'vitest'
import { reducer } from '../stanje/reducer'
import { RADNJE_SCENARIJA as R, pocetnoStanje, SCENARIO_TERMIN } from '../stanje/scenario'
import type { Akcija } from '../stanje/akcije'
import { izgradiSvet, izgradiUsluge } from './izgradi'
import { putanja, PUTANJA_OTKAZ } from './koraci'
import { cuvarOdbija, jednako, jeAkcijaPrikaza, primeni } from './most'
import { POSTAVKE } from './pomocno-za-testove'
import { jeVazecaPozicija } from './pozicija'
import type { Pozicija } from './tipovi'

const SLOBODNO = { ...POSTAVKE, rezim: 'slobodno' as const }
const na = (p: Pozicija, post = POSTAVKE) => izgradiSvet(p, post)

describe('most: sve radnje priče se poklapaju sa svojim napravi', () => {
  it('jednako() ignoriše redosled ključeva i domacin:false', () => {
    const a: Akcija = { tip: 'POSALJI_ZAHTEV', lokacijaId: 'x', termin: SCENARIO_TERMIN, razred: 'do30', prekovremeniSati: 0 }
    const b: Akcija = { prekovremeniSati: 0, razred: 'do30', termin: SCENARIO_TERMIN, lokacijaId: 'x', tip: 'POSALJI_ZAHTEV', domacin: false }
    expect(jednako(a, b)).toBe(true)
    expect(jednako(a, { ...b, domacin: true } as Akcija)).toBe(false)
  })

  it('svaka radnja u svom koraku, u vođenom režimu, prolazi (sama sebi je sledeća)', () => {
    for (const r of PUTANJA_OTKAZ) {
      const idx = putanja('otkaz').filter((x) => x.korak === r.korak).indexOf(r)
      const p: Pozicija = { korak: r.korak, odradjeno: idx, grana: r.korak === 9 ? 'otkaz' : 'vazi' }
      const s = na(p)
      expect(primeni(s, r.napravi(s)), r.id).not.toBe(s)
    }
  })
})

describe('čuvar vođenog režima', () => {
  const s = na({ korak: 3, odradjeno: 1, grana: 'vazi' })

  it('odbija akcije van priče (a pravila bi ih dozvolila) i javlja to', () => {
    const akcije: Akcija[] = [
      { tip: 'PREMOTAJ', sati: 24 },
      { tip: 'DODAJ_U_IZBOR', lokacijaId: 'foto-studio' },
      { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-30' },
      { tip: 'ODOBRI_NALOG', nalogId: 'n-firma' },
      { tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN }, // sledeća radnja je tek u koraku 5
    ]
    for (const a of akcije) {
      expect(primeni(s, a), a.tip).toBe(s)
    }
    expect(cuvarOdbija(s, { tip: 'PREMOTAJ', sati: 24 })).toBe(true)
  })

  it('propušta akcije prikaza (uloga, prikaz vlasnika, sakrij traku), osim Admina', () => {
    expect(jeAkcijaPrikaza({ tip: 'PROMENI_ULOGU', uloga: 'vlasnik' })).toBe(true)
    expect(primeni(s, { tip: 'PROMENI_ULOGU', uloga: 'vlasnik' }).uloga).toBe('vlasnik')
    expect(primeni(s, { tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: 'fizicko' })).toBe(s) // u vođenoj priči prikaz je uvek pravno lice
    expect(primeni(s, { tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: 'pravno' }).prikazVlasnika).toBe('pravno')
    expect(primeni(s, { tip: 'SAKRIJ_DEMO', sakriven: true }).demoSakriven).toBe(true)
    expect(primeni(s, { tip: 'PROMENI_ULOGU', uloga: 'admin' })).toBe(s)
  })

  it('izbor poslat dva puta ne prolazi (druga radnja nije sledeća)', () => {
    const posle = na({ korak: 3, odradjeno: 1, grana: 'vazi' })
    expect(primeni(posle, R.izbor(posle))).toBe(posle)
  })
})

describe('slobodni režim', () => {
  const pocetak = na({ korak: 2, odradjeno: 0, grana: 'vazi' }, SLOBODNO)

  it('radnja priče pomera poziciju, bez odstupanja', () => {
    const s = primeni(pocetak, R.brief())
    expect(s.prica).toMatchObject({ korak: 2, odradjeno: 1, odstupljeno: false })
    // sledeća radnja iz SLEDEĆEG koraka takođe pomera priču (slobodno klikanje kroz priču)
    const s2 = primeni(s, R.izbor(s))
    expect(s2.prica).toMatchObject({ korak: 3, odradjeno: 1, odstupljeno: false })
    expect(jeVazecaPozicija(s2.prica)).toBe(true)
  })

  it('akcija van priče koja stvarno menja svet postavlja odstupanje', () => {
    const s = primeni(pocetak, { tip: 'PREMOTAJ', sati: 72 })
    expect(s.prica.odstupljeno).toBe(true)
    expect(s.sati).toBe(72)
    const s2 = primeni(pocetak, { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-30' })
    expect(s2.prica.odstupljeno).toBe(true)
  })

  it('akcija bez stvarne promene ne postavlja odstupanje', () => {
    const s = na({ korak: 3, odradjeno: 1, grana: 'vazi' }, SLOBODNO)
    const izb = s.izbori.at(-1)!
    expect(primeni(s, { tip: 'UKLONI_IZ_IZBORA', izborId: izb.id, lokacijaId: 'stan-sedamdesete' })).toBe(s)
    expect(primeni(s, { tip: 'AZURIRAJ_IZBOR', izborId: izb.id, naziv: izb.naziv })).toBe(s)
    expect(primeni(s, { tip: 'OTPUSTI_OPCIJU', opcijaId: 'o-nema' })).toBe(s)
    expect(primeni(s, { tip: 'PREMOTAJ', sati: 0 })).toBe(s)
  })

  it('stvarna promena izbora jeste odstupanje; Vrati na korak vraća izgradiSvet', () => {
    const s = na({ korak: 3, odradjeno: 1, grana: 'vazi' }, SLOBODNO)
    const izb = s.izbori.at(-1)!
    const s2 = primeni(s, { tip: 'AZURIRAJ_IZBOR', izborId: izb.id, naziv: 'Drugi naziv' })
    expect(s2.prica.odstupljeno).toBe(true)
    const vracen = izgradiSvet({ korak: 3, odradjeno: 1, grana: 'vazi' }, { ...SLOBODNO })
    expect(vracen).toEqual(s)
  })

  it('otkazivanje posle uplate vodi u granu „otkaz" na koraku 9', () => {
    const s = na({ korak: 9, odradjeno: 0, grana: 'vazi' }, SLOBODNO)
    const posle = primeni(s, R.otkazi(s))
    expect(posle.prica).toMatchObject({ korak: 9, odradjeno: 1, grana: 'otkaz', odstupljeno: false })
  })

  it('Predračun sa uslugama gradi isto stanje kao nekad (18.135,00 RSD) i označava odstupanje', () => {
    const s = izgradiUsluge(SLOBODNO)
    expect(s.prica.odstupljeno).toBe(true)
    const p = s.predracuni.find((x) => x.vrsta === 'naknada')!
    expect(p.ukupnoPara).toBe(1813500)
  })

  it('domenski reducer sam ostaje nepromenjen: isti ishod kao reducer()', () => {
    const s = pocetnoStanje()
    const a: Akcija = { tip: 'PREMOTAJ', sati: 5 }
    const slobodno = { ...s, prica: { ...s.prica, rezim: 'slobodno' as const } }
    expect(primeni(slobodno, a).sati).toBe(reducer(slobodno, a).sati)
  })
})

describe('isti glas / komentar ponovo (ispravke posle kontrole)', () => {
  it('GLASAJ i KOMENTARISI sa istim sadržajem ne menjaju stanje (nema lažnog odstupanja)', () => {
    const s = na({ korak: 4, odradjeno: 1, grana: 'vazi' }, SLOBODNO)
    const g = R.glas(s)
    expect(primeni(s, g)).toBe(s)
    expect(primeni(s, { tip: 'KOMENTARISI', izborId: s.izbori.at(-1)!.id, lokacijaId: 'industrijski-loft', ime: 'Marko', komentar: 'Svetlo je odlično za kadar.' })).toBe(s)
    expect(primeni(s, { ...(g as Extract<Akcija, { tip: 'GLASAJ' }>), komentar: 'Drugi komentar' }).prica.odstupljeno).toBe(true)
  })
})
