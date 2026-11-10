import { describe, expect, it } from 'vitest'
import { pozicija } from '../logika/opcije'
import { stanjeOpcije } from '../logika/opcije'
import { fazaRezervacije } from '../logika/rezervacije'
import { adresaZaPrimaoca, adresaZaUlogu, zahteviDelte } from './izvedeno'
import { reducer } from './reducer'
import { BRIEF_SCENARIO, pocetnoStanje, SCENARIO_TERMIN } from './scenario'
import { SKOKOVI, stanjeZaSkok } from './skokovi-za-testove'
import type { Akcija } from './akcije'
import type { Stanje, Uloga } from './tipovi'

const kao = (s: Stanje, uloga: Uloga) => reducer(s, { tip: 'PROMENI_ULOGU', uloga })
const adresaNivo = (s: Stanje, uloga: Uloga, lokacijaId = 'industrijski-loft') => adresaZaUlogu(kao(s, uloga), lokacijaId).nivo

/** Ceo scenario "ručno", radnju po radnju, uz proveru na svakom koraku. */
describe('ceo scenario (10 koraka iz UX-a)', () => {
  it('prolazi od početka do otvorene adrese bez greške', () => {
    let s = pocetnoStanje()
    const korak = (a: Akcija) => {
      const novo = reducer(s, a)
      expect(novo).not.toBe(s) // radnja nije odbijena
      s = novo
    }
    const adresaZatvorena = () => {
      for (const u of ['produkcija', 'partner'] as const) expect(adresaNivo(s, u)).toBe('zona')
      expect(adresaZaPrimaoca(s, 'industrijski-loft').nivo).toBe('zona')
    }

    // 1–2: početak, brief
    adresaZatvorena()
    korak({ tip: 'POSALJI_BRIEF', brief: BRIEF_SCENARIO })
    const brief = s.briefovi.at(-1)!
    expect(brief.izborId).toBeNull()

    // 3: admin šalje izbor
    korak({ tip: 'ADMIN_POSALJI_IZBOR', briefId: brief.id })
    const izbor = s.izbori.at(-1)!
    expect(izbor.lokacijaIds).toEqual(['industrijski-loft', 'brutalisticka-hala', 'foto-studio'])
    adresaZatvorena()

    // 5: deljenje i glasanje primaoca
    korak({ tip: 'GLASAJ', izborId: izbor.id, lokacijaId: 'industrijski-loft', ime: 'Marko', sud: 'da', komentar: 'Odlično' })
    expect(s.glasovi).toHaveLength(1)

    // 6: opcije — loft prva, hala DRUGA (Sigma drži halu)
    korak({ tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN })
    korak({ tip: 'TRAZI_OPCIJU', lokacijaId: 'brutalisticka-hala', termin: SCENARIO_TERMIN })
    const loft = s.opcije.find((o) => o.lokacijaId === 'industrijski-loft')!
    const hala = s.opcije.find((o) => o.lokacijaId === 'brutalisticka-hala' && o.produkcijaId === 'delta')!
    expect(pozicija(s.opcije, loft, s.sati)).toBe(1)
    expect(pozicija(s.opcije, hala, s.sati)).toBe(2)

    // osporavanje: loft dobija 24 h
    korak({ tip: 'SIMULIRAJ_DRUGU_PRODUKCIJU', lokacijaId: 'industrijski-loft' })
    const osporena = s.opcije.find((o) => o.id === loft.id)!
    expect(stanjeOpcije(osporena, s.sati)).toBe('osporena')
    expect(osporena.osporavanje?.rok).toBe(24)

    // 7: Delta potvrđuje (zahtev), Sigma je već tražila isti termin
    korak({ tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN, razred: 'do30', prekovremeniSati: 0 })
    const zahtev = zahteviDelte(s)[0]
    expect(zahtev.osnovicaCenti).toBe(90000)
    expect(s.opcije.find((o) => o.id === loft.id)?.stanje).toBe('pretvorena')
    const sigmaLoft = s.zahtevi.find((z) => z.produkcijaId === 'sigma' && z.lokacijaId === 'industrijski-loft')!
    expect(sigmaLoft).toBeDefined()

    // vlasnik odbija rezervni zahtev (studio), ne dira termin lofta
    korak({ tip: 'ODBIJ_ZAHTEV', zahtevId: 'z-sigma-studio', razlog: 'Nije pogodno' })

    // 7 (nastavak): odobrenje, pa pokušaj da se isti termin odobri po drugi put
    korak({ tip: 'ODOBRI_ZAHTEV', zahtevId: zahtev.id })
    const drugiPut = reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: sigmaLoft.id })
    expect(drugiPut).toBe(s) // Sigmin zahtev je već automatski odbijen (termin je potvrđen produkciji sa prvom opcijom)
    expect(s.zahtevi.find((z) => z.id === sigmaLoft.id)?.razlog).toBe('Termin je potvrđen produkciji sa prvom opcijom')
    adresaZatvorena() // predračun postoji, ali uplata nije potvrđena

    // 8: predračun
    const predracun = s.predracuni[0]
    expect(predracun.naknadaCenti).toBe(13500)
    expect(predracun.ukupnoPara).toBe(1579500)
    expect(predracun.kurs).toBe(117)
    expect(fazaRezervacije(s.zahtevi.find((z) => z.id === zahtev.id)!, predracun, s.sati)).toBe('ceka-uplatu')

    // 9: admin potvrđuje uplatu
    korak({ tip: 'POTVRDI_UPLATU', predracunId: predracun.id })

    // 10: adresa otvorena samo produkciji koja je platila (i adminu, i vlasniku)
    expect(adresaNivo(s, 'produkcija')).toBe('sve')
    expect(adresaNivo(s, 'partner')).toBe('zona')
    expect(adresaZaPrimaoca(s, 'industrijski-loft').nivo).toBe('zona')
    expect(adresaNivo(s, 'produkcija', 'brutalisticka-hala')).toBe('zona')
  })

  it('uplata se ne može potvrditi pre odobrenja vlasnika', () => {
    let s = pocetnoStanje()
    s = reducer(s, { tip: 'POTVRDI_UPLATU', predracunId: 'p-ne-postoji' })
    expect(s.predracuni).toHaveLength(0)
  })
})

describe('"Skoči na…" daje isto stanje kao ručno klikanje', () => {
  it('svaki skok se završava na ispravnom mestu', () => {
    for (const k of SKOKOVI) {
      const { stanje, ruta } = stanjeZaSkok(k.id, false)
      expect(ruta).not.toContain('undefined')
      expect(stanje.uloga).toBe(k.uloga)
    }
  })
  it('skok na "Uplata potvrđena" == ručni put', () => {
    const skok = stanjeZaSkok('uplata', false).stanje
    let s = pocetnoStanje()
    const ruka: Akcija[] = [
      { tip: 'POSALJI_BRIEF', brief: BRIEF_SCENARIO },
      { tip: 'ADMIN_POSALJI_IZBOR', briefId: 'b-1' } /* prvi novi ID je b-1 */,
      { tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN },
      { tip: 'TRAZI_OPCIJU', lokacijaId: 'brutalisticka-hala', termin: SCENARIO_TERMIN },
      { tip: 'SIMULIRAJ_DRUGU_PRODUKCIJU', lokacijaId: 'industrijski-loft' },
      { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN, razred: 'do30', prekovremeniSati: 0 },
    ]
    for (const a of ruka) s = reducer(s, a)
    s = reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: zahteviDelte(s)[0].id })
    s = reducer(s, { tip: 'POTVRDI_UPLATU', predracunId: s.predracuni[0].id })
    expect(skok).toEqual({ ...s, uloga: 'produkcija' })
  })
  it('na svakom koraku pre "Uplata potvrđena" produkcija ne dobija adresu; posle toga dobija', () => {
    for (const k of SKOKOVI) {
      const { stanje } = stanjeZaSkok(k.id, false)
      const nivo = adresaZaUlogu({ ...stanje, uloga: 'produkcija' }, 'industrijski-loft').nivo
      expect(nivo).toBe(k.id === 'uplata' ? 'sve' : 'zona')
    }
  })
  it('skok pamti samo sakrivenost trake Demo', () => {
    expect(stanjeZaSkok('pocetak', true).stanje.demoSakriven).toBe(true)
  })
})

describe('simulirano vreme i rokovi u stanju', () => {
  it('kad Sigmina opcija na hali istekne, Delta postaje prva', () => {
    let s = stanjeZaSkok('opcija', false).stanje
    const hala = s.opcije.find((o) => o.lokacijaId === 'brutalisticka-hala' && o.produkcijaId === 'delta')!
    expect(pozicija(s.opcije, hala, s.sati)).toBe(2)
    s = reducer(s, { tip: 'PREMOTAJ', sati: 66 }) // Sigmina opcija ističe na 66 h
    expect(pozicija(s.opcije, hala, s.sati)).toBe(1)
    s = reducer(s, { tip: 'PREMOTAJ', sati: 6 }) // Deltina (postavljena na 0 h) ističe tačno na 72 h
    expect(pozicija(s.opcije, hala, s.sati)).toBeNull()
  })
  it('zahtev vlasnika ističe posle 48 h i tada se ne može odobriti', () => {
    let s = stanjeZaSkok('zahtev', false).stanje
    const z = zahteviDelte(s)[0]
    s = reducer(s, { tip: 'PREMOTAJ', sati: 48 })
    expect(reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: z.id })).toBe(s)
  })
  it('vreme ne ide unazad', () => {
    const s = pocetnoStanje()
    expect(reducer(s, { tip: 'PREMOTAJ', sati: -5 })).toBe(s)
  })
  it('link izbora ističe po izabranom trajanju i tada se ne glasa', () => {
    let s = stanjeZaSkok('izbor', false).stanje
    const izbor = s.izbori.at(-1)!
    s = reducer(s, { tip: 'AZURIRAJ_IZBOR', izborId: izbor.id, trajanje: 24 })
    s = reducer(s, { tip: 'PREMOTAJ', sati: 24 })
    const posle = reducer(s, { tip: 'GLASAJ', izborId: izbor.id, lokacijaId: 'industrijski-loft', ime: 'Marko', sud: 'da', komentar: '' })
    expect(posle).toBe(s)
  })
})

describe('izviđanje', () => {
  it('adresa imenovanoj osobi tek posle potvrde i 24 h pre izviđanja', async () => {
    const { adresaZaImenovanu } = await import('./izvedeno')
    let s = pocetnoStanje()
    s = reducer(s, { tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: 'industrijski-loft', kada: 49, osoba: 'Ana P.', brojLjudi: 2 })
    const id = s.izvidjanja[0].id
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('zona')
    s = reducer(s, { tip: 'POTVRDI_IZVIDJANJE', id })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('zona')
    s = reducer(s, { tip: 'PREMOTAJ', sati: 25 })
    const r = adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.')
    expect(r.nivo).toBe('adresa')
    expect(r.kontaktOsoba).toBe('Nasetu')
    // ostali članovi ekipe i dalje samo zona
    expect(adresaZaUlogu(s, 'industrijski-loft').nivo).toBe('zona')
  })
})
