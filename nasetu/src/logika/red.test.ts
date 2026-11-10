// A2 — Prednost prve opcije: četiri slučaja iz zahteva + granični slučajevi (pravilo je u logika/red.ts, ne u ekranima).
import { describe, expect, it } from 'vitest'
import { novaOpcija } from './opcije'
import { mozeLiOdobriti, noviZahtev } from './rezervacije'
import { pokreniOsporavanje, prednostZahteva, redZaTermin, RAZLOG_AUTO_ODBIJANJA, zahteviZaAutoOdbijanje } from './red'
import type { Opcija, Termin, Zahtev } from './tipovi'

const T: Termin = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }
const LOFT = 'industrijski-loft'

const zahtev = (id: string, produkcijaId: string, sada: number, termin: Termin = T, lokacijaId = LOFT, opcijaId: string | null = null): Zahtev =>
  noviZahtev({ id, lokacijaId, produkcijaId, briefId: null, termin, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada, opcijaId })

/** Delta drži prvu opciju (osporenu 24 h), Sigma je druga i šalje zahtev — stanje odmah posle "druga produkcija želi isti termin". */
function posleOsporavanja() {
  const delta = novaOpcija('o-delta', LOFT, 'delta', T, 0)
  const sigma = novaOpcija('o-sigma', LOFT, 'sigma', T, 0)
  const opcije = pokreniOsporavanje([delta, sigma], [], LOFT, T, 'sigma', 0, 24)
  return { opcije, zS: zahtev('z-sigma', 'sigma', 0) }
}

describe('slučaj 1: druga produkcija ne može da bude odobrena dok je prva opcija živa', () => {
  it('"Odobri" je zaključano uz razlog sa preostalim satima', () => {
    const { opcije, zS } = posleOsporavanja()
    const o = mozeLiOdobriti(zS, [zS], [], 0, opcije)
    expect(o.moze).toBe(false)
    expect(o.razlog).toBe('Čeka se odluka prve opcije (Produkcija Delta), još 24 h')
  })
  it('broj sati se smanjuje kako vreme prolazi (isti broj kao odbrojavanje)', () => {
    const { opcije, zS } = posleOsporavanja()
    expect(mozeLiOdobriti(zS, [zS], [], 10, opcije).razlog).toBe('Čeka se odluka prve opcije (Produkcija Delta), još 14 h')
  })
  it('tačno na granici: na 23 h zaključano, na 24 h otključano', () => {
    const { opcije, zS } = posleOsporavanja()
    expect(mozeLiOdobriti(zS, [zS], [], 23, opcije).moze).toBe(false)
    expect(mozeLiOdobriti(zS, [zS], [], 24, opcije).moze).toBe(true)
  })
})

describe('slučaj 2: zahtev druge produkcije pokreće osporavanje prve opcije', () => {
  it('prva opcija dobija rok sada + 24 h', () => {
    const { opcije } = posleOsporavanja()
    expect(opcije.find((o) => o.id === 'o-delta')?.osporavanje).toEqual({ od: 'sigma', rok: 24 })
  })
  it('osporavanje koje je već pokrenuto se ne pomera', () => {
    const { opcije } = posleOsporavanja()
    const kasnije = pokreniOsporavanje(opcije, [], LOFT, T, 'sigma', 10, 24)
    expect(kasnije).toBe(opcije)
    expect(kasnije.find((o) => o.id === 'o-delta')?.osporavanje?.rok).toBe(24)
  })
  it('prva produkcija ne osporava samu sebe', () => {
    const delta = novaOpcija('o-delta', LOFT, 'delta', T, 0)
    const opcije = [delta]
    expect(pokreniOsporavanje(opcije, [], LOFT, T, 'delta', 0, 24)).toBe(opcije)
  })
  it('opcija na drugoj lokaciji ili za termin koji se ne preklapa ne utiče', () => {
    const delta = novaOpcija('o-delta', 'brutalisticka-hala', 'delta', T, 0)
    expect(pokreniOsporavanje([delta], [], LOFT, T, 'sigma', 0, 24)[0].osporavanje).toBeNull()
    const drugiDan: Termin = { priprema: [], snimanje: ['2026-12-20'] }
    const d2 = novaOpcija('o-d2', LOFT, 'delta', drugiDan, 0)
    expect(pokreniOsporavanje([d2], [], LOFT, T, 'sigma', 0, 24)[0].osporavanje).toBeNull()
  })
})

describe('slučaj 3: prva potvrdi → vlasnik odobri prvu → zahtev druge se automatski odbija', () => {
  // Delta je potvrdila: njena opcija je "pretvorena" u zahtev
  const posleDeltinogZahteva = () => {
    const { opcije, zS } = posleOsporavanja()
    const pretvorene: Opcija[] = opcije.map((o) => (o.id === 'o-delta' ? { ...o, stanje: 'pretvorena' as const } : o))
    return { opcije: pretvorene, zS, zD: zahtev('z-delta', 'delta', 1, T, LOFT, 'o-delta') }
  }
  it('Sigma ostaje druga i kad se Deltina opcija pretvori u zahtev (nasleđuje mesto u redu)', () => {
    const { opcije, zS, zD } = posleDeltinogZahteva()
    const red = redZaTermin(opcije, [zD, zS], LOFT, T, 1)
    expect(red.map((u) => u.produkcijaId)).toEqual(['delta', 'sigma'])
    const o = mozeLiOdobriti(zS, [zD, zS], [], 1, opcije)
    expect(o.moze).toBe(false)
    expect(o.razlog).toBe('Prednost ima zahtev Produkcija Delta (prva opcija) — prvo odlučite o njemu (rok još 48 h)')
  })
  it('Delta (prva) može da se odobri', () => {
    const { opcije, zS, zD } = posleDeltinogZahteva()
    expect(mozeLiOdobriti(zD, [zD, zS], [], 1, opcije).moze).toBe(true)
  })
  it('posle odobrenja Delte, zahtev Sigme se odbija sa tačnim razlogom', () => {
    const { zS, zD } = posleDeltinogZahteva()
    const odobren = { ...zD, stanje: 'odobren' as const }
    const odbijaju = zahteviZaAutoOdbijanje(odobren, [odobren, zS], 1)
    expect(odbijaju.map((z) => z.id)).toEqual(['z-sigma'])
    expect(RAZLOG_AUTO_ODBIJANJA).toBe('Termin je potvrđen produkciji sa prvom opcijom')
  })
  it('zahtev na drugoj lokaciji ili za drugi termin se ne dira', () => {
    const { zD } = posleDeltinogZahteva()
    const drugaLok = zahtev('z-x', 'sigma', 0, T, 'foto-studio')
    const drugiDan = zahtev('z-y', 'sigma', 0, { priprema: [], snimanje: ['2026-12-20'] })
    expect(zahteviZaAutoOdbijanje({ ...zD, stanje: 'odobren' }, [zD, drugaLok, drugiDan], 1)).toEqual([])
  })
})

describe('slučaj 4: prva odustane ili istekne → druga postaje prva', () => {
  it('a) prva odustane (opcija otpuštena): zahtev druge može da se odobri', () => {
    const { opcije, zS } = posleOsporavanja()
    const otpustena = opcije.map((o) => (o.id === 'o-delta' ? { ...o, stanje: 'otpustena' as const } : o))
    expect(mozeLiOdobriti(zS, [zS], [], 1, otpustena).moze).toBe(true)
  })
  it('b) prođe 24 h bez potvrde: opcija prve je istekla, druga može', () => {
    const { opcije, zS } = posleOsporavanja()
    expect(mozeLiOdobriti(zS, [zS], [], 24, opcije).moze).toBe(true)
  })
  it('prva je poslala zahtev pa ga je vlasnik odbio: gubi mesto, druga je prva', () => {
    const { opcije, zS } = posleOsporavanja()
    const pretvorene = opcije.map((o) => (o.id === 'o-delta' ? { ...o, stanje: 'pretvorena' as const } : o))
    const zD = { ...zahtev('z-delta', 'delta', 1), stanje: 'odbijen' as const }
    expect(mozeLiOdobriti(zS, [zD, zS], [], 2, pretvorene).moze).toBe(true)
  })
  it('prva je poslala zahtev pa je on istekao (48 h): druga je prva', () => {
    const { opcije, zS } = posleOsporavanja()
    const pretvorene = opcije.map((o) => (o.id === 'o-delta' ? { ...o, stanje: 'pretvorena' as const } : o))
    const zD = zahtev('z-delta', 'delta', 1, T, LOFT, 'o-delta') // rok 49
    const zS2 = zahtev('z-sigma', 'sigma', 40) // Sigmin zahtev još važi i na 49 h
    expect(mozeLiOdobriti(zS2, [zD, zS2], [], 48, pretvorene).moze).toBe(false)
    expect(mozeLiOdobriti(zS2, [zD, zS2], [], 49, pretvorene).moze).toBe(true)
    expect(zS).toBeDefined()
  })
})

describe('zahtev nasleđuje mesto SAMO od svoje opcije (veza po ID-u)', () => {
  it('Delta opcija → zahtev odbijen; Sigma staje u red; Delta nova opcija + zahtev → Delta je DRUGA', () => {
    const staraDelta = { ...novaOpcija('o-delta-1', LOFT, 'delta', T, 0), stanje: 'pretvorena' as const }
    const zDOdbijen = { ...zahtev('z-d1', 'delta', 0, T, LOFT, 'o-delta-1'), stanje: 'odbijen' as const }
    const sigma = novaOpcija('o-sigma', LOFT, 'sigma', T, 5)
    // nova Deltina opcija i novi zahtev posle Sigme
    const novaDelta = novaOpcija('o-delta-2', LOFT, 'delta', T, 10)
    const pretvorena = { ...novaDelta, stanje: 'pretvorena' as const }
    const zD2 = zahtev('z-d2', 'delta', 10, T, LOFT, 'o-delta-2')
    const red = redZaTermin([staraDelta, sigma, pretvorena], [zDOdbijen, zD2], LOFT, T, 10)
    expect(red.map((u) => u.produkcijaId)).toEqual(['sigma', 'delta'])
    expect(red[1].mesto).toBe(10)
  })
})

describe('ostali granični slučajevi reda', () => {
  it('zahtev bez opcije, a tuđa opcija živa: nije prvi i pokreće osporavanje', () => {
    const delta = novaOpcija('o-delta', LOFT, 'delta', T, 0)
    const zS = zahtev('z-sigma', 'sigma', 1)
    expect(prednostZahteva(zS, [delta], [zS], 1).moze).toBe(false)
    const ospor = pokreniOsporavanje([delta], [zS], LOFT, T, 'sigma', 1, 24)
    expect(ospor[0].osporavanje).toEqual({ od: 'sigma', rok: 25 })
  })
  it('dva zahteva bez opcija: prvi poslat ima prednost', () => {
    const z1 = zahtev('z1', 'delta', 0)
    const z2 = zahtev('z2', 'sigma', 5)
    expect(prednostZahteva(z1, [], [z1, z2], 6).moze).toBe(true)
    expect(prednostZahteva(z2, [], [z1, z2], 6).moze).toBe(false)
  })
  it('hala: Sigma drži prvu opciju od početka, Delta je druga; posle 24 h bez odgovora Delta je prva', () => {
    const HALA = 'brutalisticka-hala'
    const sigma = { ...novaOpcija('o-sigma-hala', HALA, 'sigma', T, -6) }
    const delta = novaOpcija('o-delta-hala', HALA, 'delta', T, 0)
    const zD = zahtev('z-delta-hala', 'delta', 1, T, HALA)
    const opcije = pokreniOsporavanje([sigma, delta], [], HALA, T, 'delta', 1, 24)
    expect(opcije.find((o) => o.id === 'o-sigma-hala')?.osporavanje?.rok).toBe(25)
    expect(mozeLiOdobriti(zD, [zD], [], 1, opcije).moze).toBe(false)
    expect(mozeLiOdobriti(zD, [zD], [], 25, opcije).moze).toBe(true)
  })
})
