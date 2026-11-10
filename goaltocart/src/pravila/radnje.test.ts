// B7.3 — pravilo 1.6: tabela "dugme x pozicija x uloga -> aktivno / razlog" za sve radnje.
import { describe, expect, it } from 'vitest'
import { putanja, radnjeKoraka } from '../prica/koraci'
import { izgradiStanje, redniBroj, sledecaRadnja } from '../prica/reducer'
import { ULOGE } from '../prica/tipovi'
import type { Grana, Pozicija } from '../prica/tipovi'
import { jeUradjeno, naRedu, stanjeRadnje } from './radnje'
import { stanjeEkrana } from './stanjeEkrana'
import { fazaKoraka, statusRate, tackeIgraca, odobrenjeDepozita, odobrenjeUstupanja, aktivnost, daniKasnjenja } from './izvedeno'

/** Sve dostižne pozicije jedne grane (po redu priče). */
function sviPoloZaji(grana: Grana): Pozicija[] {
  const lista: Pozicija[] = []
  for (let k = 1; k <= 9; k++) {
    const n = radnjeKoraka(k, grana).length
    for (let o = 0; o <= n; o++) lista.push({ korak: k, odradjeno: o, grana })
  }
  return lista
}

describe('pravilo 1.6: tačno jedna radnja je aktivna i to samo za izvođača', () => {
  for (const grana of ['approved', 'rejected'] as const) {
    it(`grana ${grana}: za svaku poziciju i ulogu`, () => {
      const lista = putanja(grana)
      for (const poz of sviPoloZaji(grana)) {
        const sl = sledecaRadnja(poz)
        for (const r of lista) {
          for (const uloga of ULOGE) {
            const st = stanjeRadnje(r.id, uloga, poz, r.odobrava)
            const oznaka = `${grana} ${poz.korak}/${poz.odradjeno} ${r.id} kao ${uloga}`
            if (st.aktivno) {
              // aktivno SAMO ako je to sledeća radnja i gledalac je izvođač (ili vidi "Simulate" dugme)
              expect(sl?.id, oznaka).toBe(r.id)
              if (r.uloga === 'sustav') expect(r.simulira?.some((s) => s.uloga === uloga), oznaka).toBe(true)
              else expect(r.uloga, oznaka).toBe(uloga)
            } else {
              expect(st.razlog, `${oznaka}: neaktivno dugme mora da ima razlog`).toBeTruthy()
            }
          }
        }
      }
    })
  }

  it('razlozi: "Done", "Available at step N", "Waiting for ..."', () => {
    const p1: Pozicija = { korak: 1, odradjeno: 0, grana: 'approved' }
    expect(stanjeRadnje('o1', 'selling', p1)).toMatchObject({ aktivno: true })
    expect(stanjeRadnje('o2', 'buying', p1)).toMatchObject({ aktivno: false, razlog: 'Waiting for the selling club' })
    expect(stanjeRadnje('g1', 'selling', p1)).toMatchObject({ aktivno: false, razlog: 'Available at step 4' })
    expect(stanjeRadnje('o1', 'selling', { korak: 1, odradjeno: 1, grana: 'approved' })).toMatchObject({ aktivno: false, razlog: 'Done' })
    expect(stanjeRadnje('o3', 'selling', { korak: 1, odradjeno: 1, grana: 'approved' })).toMatchObject({ aktivno: false, razlog: 'Waiting for the buying club' })
    expect(stanjeRadnje('o1', 'selling', { korak: 3, odradjeno: 0, grana: 'approved' })).toMatchObject({ aktivno: false, razlog: 'Done' })
  })

  it('korak 4: potpisi redom prodavac, kupac, igrač, agent', () => {
    const poz = (o: number): Pozicija => ({ korak: 4, odradjeno: o, grana: 'approved' })
    expect(stanjeRadnje('g1', 'selling', poz(0)).aktivno).toBe(true)
    expect(stanjeRadnje('g2', 'buying', poz(0))).toMatchObject({ aktivno: false, razlog: 'Waiting for the selling club' })
    expect(stanjeRadnje('g2', 'buying', poz(1)).aktivno).toBe(true)
    expect(stanjeRadnje('g3', 'player', poz(2)).aktivno).toBe(true)
    expect(stanjeRadnje('g4', 'agent', poz(3)).aktivno).toBe(true)
    expect(stanjeRadnje('g4', 'agent', poz(4))).toMatchObject({ aktivno: false, razlog: 'Done' })
  })

  it('odobrenja: dugme je aktivno samo kad je "Act as" prava uloga u klubu', () => {
    const poz: Pozicija = { korak: 5, odradjeno: 1, grana: 'approved' }
    expect(stanjeRadnje('e2', 'buying', poz, 'finance').aktivno).toBe(true)
    expect(stanjeRadnje('e2', 'buying', poz, 'legal')).toMatchObject({ aktivno: false, razlog: 'Switch “Act as” to Finance' })
    expect(stanjeRadnje('e2', 'buying', poz, 'sporting').aktivno).toBe(false)
    expect(stanjeRadnje('e2', 'buying', poz)).toMatchObject({ aktivno: false })
    const poz2: Pozicija = { korak: 5, odradjeno: 2, grana: 'approved' }
    expect(stanjeRadnje('e3', 'buying', poz2, 'legal').aktivno).toBe(true)
    expect(stanjeRadnje('e3', 'buying', poz2, 'finance').aktivno).toBe(false)
  })

  it('"sustav" radnje: dugme "Simulate" samo za uloge koje ga prikazuju', () => {
    const p5: Pozicija = { korak: 5, odradjeno: 3, grana: 'approved' }
    expect(stanjeRadnje('e4', 'buying', p5).aktivno).toBe(true)
    expect(stanjeRadnje('e4', 'selling', p5)).toMatchObject({ aktivno: false, razlog: 'Waiting for the escrow partner' })
    expect(naRedu(p5)).toBe('sustav')
  })

  it('jeUradjeno prati redosled priče', () => {
    const poz: Pozicija = { korak: 4, odradjeno: 2, grana: 'approved' }
    expect(jeUradjeno('o3', poz)).toBe(true)
    expect(jeUradjeno('g1', poz)).toBe(true)
    expect(jeUradjeno('g2', poz)).toBe(true)
    expect(jeUradjeno('g3', poz)).toBe(false)
    expect(redniBroj(poz)).toBe(3 + 2 + 1 + 2)
  })
})

describe('stanje ekrana prema priči', () => {
  it('ekran budućeg koraka je "nije-pocelo", tekući "u-toku", prošli "zavrseno"', () => {
    expect(stanjeEkrana('S6', 'selling', { korak: 1, odradjeno: 0, grana: 'approved' })).toBe('nije-pocelo')
    expect(stanjeEkrana('S6', 'selling', { korak: 4, odradjeno: 0, grana: 'approved' })).toBe('u-toku')
    expect(stanjeEkrana('S6', 'selling', { korak: 4, odradjeno: 4, grana: 'approved' })).toBe('zavrseno')
    expect(stanjeEkrana('S6', 'selling', { korak: 6, odradjeno: 0, grana: 'approved' })).toBe('zavrseno')
    expect(stanjeEkrana('S1', 'selling', { korak: 1, odradjeno: 0, grana: 'approved' })).toBe('uvek')
    expect(stanjeEkrana('P5', 'player', { korak: 2, odradjeno: 0, grana: 'approved' })).toBe('nije-pocelo')
  })
})

describe('izvedene vrednosti', () => {
  it('faze koraka', () => {
    const p: Pozicija = { korak: 4, odradjeno: 1, grana: 'approved' }
    expect([3, 4, 5].map((k) => fazaKoraka(p, k))).toEqual(['zavrsen', 'tekuci', 'buduci'])
    expect(fazaKoraka({ korak: 4, odradjeno: 4, grana: 'approved' }, 4)).toBe('zavrsen')
  })
  it('status rata kroz priču', () => {
    const iz = (k: number, o: number): Pozicija => ({ korak: k, odradjeno: o, grana: 'approved' })
    expect(statusRate(1, iz(5, 0))).toBe('scheduled')
    expect(statusRate(1, iz(5, 4))).toBe('secured')
    expect(statusRate(1, iz(7, 1))).toBe('paid')
    expect(statusRate(2, iz(8, 0))).toBe('scheduled')
    expect(statusRate(2, iz(8, 5))).toBe('assigned')
    expect(statusRate(2, iz(8, 8))).toBe('paid-financier')
    expect(statusRate(3, iz(8, 8))).toBe('assigned')
    expect(statusRate(3, iz(9, 0))).toBe('overdue')
    expect(daniKasnjenja(iz(9, 0))).toBe(14)
    expect(daniKasnjenja(iz(9, 1))).toBe(28)
    expect(daniKasnjenja(iz(8, 8))).toBeNull()
  })
  it('odobrenja 0 -> 1 -> 2 od 2', () => {
    const iz5 = (o: number): Pozicija => ({ korak: 5, odradjeno: o, grana: 'approved' })
    expect(odobrenjeDepozita(iz5(0))).toMatchObject({ vidljivo: false, odobreno: 0 })
    expect(odobrenjeDepozita(iz5(1))).toMatchObject({ vidljivo: true, odobreno: 0, zavrseno: false })
    expect(odobrenjeDepozita(iz5(2))).toMatchObject({ odobreno: 1 })
    expect(odobrenjeDepozita(iz5(3))).toMatchObject({ odobreno: 2, zavrseno: true })
    const iz8 = (o: number): Pozicija => ({ korak: 8, odradjeno: o, grana: 'approved' })
    expect(odobrenjeUstupanja(iz8(2)).vidljivo).toBe(false)
    expect(odobrenjeUstupanja(iz8(3))).toMatchObject({ vidljivo: true, odobreno: 0 })
    expect(odobrenjeUstupanja(iz8(5))).toMatchObject({ odobreno: 2, zavrseno: true })
  })
  it('aktivnost: najnoviji prvi, najviše 5, poštuje ko sme da vidi događaj', () => {
    const poz = izgradiStanje({ korak: 8, odradjeno: 8, grana: 'approved' })
    const a = aktivnost(poz, 'buying')
    expect(a.length).toBeLessThanOrEqual(5)
    // kupac ne vidi finansiranje prodavca
    expect(a.some((e) => /financier|receivable|Meridian|Financing/i.test(e.tekst))).toBe(false)
    const s = aktivnost(poz, 'selling')
    expect(s.some((e) => /Receivable|Financing|Offer/i.test(e.tekst))).toBe(true)
  })
})

describe('igrač i agent: preslikavanje 9 koraka na 6 tačaka (UX P1)', () => {
  const stanja = (korak: number, odradjeno: number, grana: Grana = 'approved') => tackeIgraca({ korak, odradjeno, grana }).map((t) => t.stanje)
  it('korak 1 početno: tačka 1 je aktivna, ostale čekaju', () => {
    expect(stanja(1, 0)).toEqual(['now', 'todo', 'todo', 'todo', 'todo', 'todo'])
  })
  it('korak 1 završno: tačka 1 je završena', () => {
    expect(stanja(1, 3)).toEqual(['done', 'todo', 'todo', 'todo', 'todo', 'todo'])
  })
  it('koraci 3 i 4 dele tačku 3 (aktivna od 3, završena po kraju 4)', () => {
    expect(stanja(3, 0)[2]).toBe('now')
    expect(stanja(3, 1)[2]).toBe('now') // korak 3 završen, tačka 3 još nije
    expect(stanja(4, 2)[2]).toBe('now')
    expect(stanja(4, 4)[2]).toBe('done')
  })
  it('koraci 5 i 6 dele tačku 4; 7 i 8 tačku 5; 9 je tačka 6', () => {
    expect(stanja(5, 0)[3]).toBe('now')
    expect(stanja(6, 1)[3]).toBe('now')
    expect(stanja(6, 2)[3]).toBe('done')
    expect(stanja(7, 0)[4]).toBe('now')
    expect(stanja(8, 3)[4]).toBe('now')
    expect(stanja(8, 8)[4]).toBe('done')
    expect(stanja(9, 0)[5]).toBe('now')
  })
  it('rata 3 kasni u koraku 9, pa poslednja tačka nikad nije "done" u grani Approved', () => {
    expect(stanja(9, 1)[5]).toBe('now')
  })
  it('grana Rejected: tačka 4 "Not completed", tačke 5 i 6 "Not applicable"', () => {
    expect(stanja(6, 2, 'rejected')[3]).toBe('nije-zavrseno')
    expect(stanja(7, 0, 'rejected').slice(4)).toEqual(['ne-vazi', 'ne-vazi'])
    expect(stanja(9, 1, 'rejected').slice(3)).toEqual(['nije-zavrseno', 'ne-vazi', 'ne-vazi'])
  })
  it('tačke su uvek 6 i imaju oznake', () => {
    const t = tackeIgraca({ korak: 4, odradjeno: 0, grana: 'approved' })
    expect(t.map((x) => x.oznaka)).toEqual(['Offer agreed', 'Contract & medical', 'Checks & signing', 'Funds & registration', 'Your payments', 'Final payment'])
  })
})
