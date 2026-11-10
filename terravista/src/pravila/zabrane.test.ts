import { describe, expect, it } from 'vitest'
import { KAKO_SE_UPRAVLJA, NEDOSTUPNO, OZNAKA_DEMOA, POCETNI_EKRAN_PORUKA, JEZIK_PORUKA, SIMULIRANA_RADNJA, CENA_ZAVISI_OD_ZEMLJE, SA_PDV } from '../podaci/stalni-tekstovi'
import { KORACI, karticaTekst } from '../prica/koraci'
import { nadjiZabranjeno, netacnaRecenicaONedostupnosti } from './zabrane'

describe('zabranjeni izrazi (PLAN B6.5)', () => {
  it('hvata zakone, uredbe, presude, paragrafe, partnere, monopol, ekskluzivnost', () => {
    expect(nadjiZabranjeno('Po zakonu moraš da otkažeš')).toContain('zakon')
    expect(nadjiZabranjeno('Uredba o prenosivosti')).toContain('uredba')
    expect(nadjiZabranjeno('Presuda je jasna')).toContain('presuda')
    expect(nadjiZabranjeno('§ 312k')).toContain('§')
    expect(nadjiZabranjeno('prema BGB')).toContain('BGB')
    expect(nadjiZabranjeno('Plaćanje je sigurno')).toContain('sigurno (uz plaćanje)')
    expect(nadjiZabranjeno('Naš partner')).toContain('partner')
    expect(nadjiZabranjeno('Zabranjeno u Srbiji')).toContain('zabranjeno')
    expect(nadjiZabranjeno('cilj je monopol')).toContain('monopol')
    expect(nadjiZabranjeno('ekskluzivno pravo')).toContain('ekskluzivno')
    expect(nadjiZabranjeno('Garancija kvaliteta')).toContain('garancija')
    expect(nadjiZabranjeno('zvanični partner'.replace('partner', ''))).toContain('zvanično')
    expect(nadjiZabranjeno('ovlašćeni distributer')).toContain('ovlašćeno')
  })
  it('oznaka demoa („nisu partneri“) i rečenica o nedostupnosti su dozvoljene na svom mestu', () => {
    expect(nadjiZabranjeno(OZNAKA_DEMOA)).toEqual([])
    expect(nadjiZabranjeno(NEDOSTUPNO)).toEqual([])
  })
  it('rečenica o nedostupnosti mora biti TAČNO ona dozvoljena', () => {
    expect(netacnaRecenicaONedostupnosti(NEDOSTUPNO)).toBe(false)
    expect(netacnaRecenicaONedostupnosti('Kanal nije dostupan jer prava drži neko drugi.')).toBe(true)
    expect(netacnaRecenicaONedostupnosti('Prava za Srbiju drži druga firma.')).toBe(true)
  })
  it('nijedan stalni tekst ni kartica priče ne sadrži zabranjen izraz', () => {
    const tekstovi = [
      SIMULIRANA_RADNJA, POCETNI_EKRAN_PORUKA, JEZIK_PORUKA, CENA_ZAVISI_OD_ZEMLJE, SA_PDV, ...KAKO_SE_UPRAVLJA,
      ...KORACI.map((k) => karticaTekst(k.broj)),
    ]
    for (const t of tekstovi) {
      expect(nadjiZabranjeno(t), t).toEqual([])
      expect(netacnaRecenicaONedostupnosti(t), t).toBe(false)
    }
  })
})
