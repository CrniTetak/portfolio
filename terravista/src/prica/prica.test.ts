// Testovi priče (PLAN B8.1): ceo put 1/početno → 9, radnju po radnju, za Grčku i Srbiju; za SVAKU poziciju Dalje/Nazad/skok =
// ručno klikanje; reducer odbija preranu radnju i prihvata prvu radnju sledećeg koraka (B4.6.6); pretplate, zemlja, kvačica; čuvanje.
import { describe, expect, it } from 'vitest'
import type { Grana } from '../podaci/svet'
import { razresi } from '../pravila/ekrani'
import { POCETNO_SACUVANO, proveri, sacuvaj, ucitaj } from './cuvanje'
import { BROJ_KORAKA_PRICE, definicija, duzina, stanjeZa, type RadnjaId } from './matrica'
import { dalje, nazad, odradjena, POCETAK, pretplatePozicije, primeniRadnju, razumemStiklirano, sledecaRadnja, skok, zemljaPozicije, type Pozicija } from './navigacija'

const GRANE: Grana[] = ['grcka', 'srbija']

describe('matrica', () => {
  it('9 koraka; svaki ima (broj radnji + 1) stanja; broj radnji po koracima iz plana', () => {
    for (const g of GRANE) {
      for (let k = 1; k <= BROJ_KORAKA_PRICE; k++) {
        const d = definicija(k, g)
        expect(d.stanja).toHaveLength(d.radnje.length + 1)
      }
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => duzina(k, g))).toEqual([1, 3, 1, 7, 6, g === 'grcka' ? 1 : 2, 4, 0, 0])
    }
  })
  it('svako stanje ima ekran televizora i ekran telefona koji postoje u registru (i parametre)', () => {
    for (const g of GRANE)
      for (let k = 1; k <= BROJ_KORAKA_PRICE; k++)
        for (let p = 0; p <= duzina(k, g); p++) {
          const st = stanjeZa(k, p, g)
          const tv = st.tv.startsWith('/tv') ? razresi('tv', st.tv) : razresi('strana', st.tv)
          expect(tv, `TV ${k}/${p}: ${st.tv}`).not.toBeNull()
          expect(razresi('tel', st.tel), `tel ${k}/${p}: ${st.tel}`).not.toBeNull()
        }
  })
  it('početna stanja koraka iz plana (UX 3.2)', () => {
    const tv = (k: number, g: Grana = 'grcka') => razresi('tv', stanjeZa(k, 0, g).tv)?.ekran.id
    expect([1, 2, 3, 4, 5, 6, 7].map((k) => tv(k))).toEqual(['T1', 'T2', 'T5', 'T8', 'T15', 'T25', 'T19'])
    const kraj = (k: number, g: Grana = 'grcka') => razresi('tv', stanjeZa(k, duzina(k, g), g).tv)?.ekran.id
    expect([1, 2, 3, 4, 5].map((k) => kraj(k))).toEqual(['T2', 'T9', 'T8', 'T14', 'T16'])
    expect(kraj(6, 'grcka')).toBe('T26')
    expect(kraj(6, 'srbija')).toBe('T12')
  })
  it('svaka radnja počinje na ekranu iz matrice (stanje pre nje) i vodi na stanje posle nje', () => {
    for (const g of GRANE)
      for (let k = 1; k <= BROJ_KORAKA_PRICE; k++) {
        const d = definicija(k, g)
        d.radnje.forEach((_, i) => {
          expect(d.stanja[i], `${k}/${i}`).toBeDefined()
          expect(d.stanja[i + 1], `${k}/${i + 1}`).toBeDefined()
        })
      }
  })
})

/** Sve pozicije priče redom (kako ih „Dalje“ obilazi). */
function obidji(g: Grana): Pozicija[] {
  const sve: Pozicija[] = []
  let p: Pozicija | null = POCETAK
  while (p) {
    sve.push(p)
    p = dalje(p, g)
  }
  return sve
}

describe('skok = isto što se vidi pri ručnom klikanju (ne samo (korak, p))', () => {
  // Prikazuje se: ekran televizora, ekran telefona, početni izbor, pretplate, kvačica i zemlja — sve su funkcije pozicije i grane.
  // Zato skok na korak mora da pokaže isto što i „Dalje“ do tog koraka, a ručno odigrane radnje isto što i matrica za novu poziciju.
  const prikaz = (poz: Pozicija, g: Grana) => ({
    stanje: stanjeZa(poz.korak, poz.p, g),
    pretplate: pretplatePozicije(poz, g),
    kvacica: razumemStiklirano(poz, g),
    zemlja: zemljaPozicije(poz, g),
  })
  for (const g of GRANE) {
    it(`grana ${g}: skok(k) prikazuje isto što i Dalje do početka koraka k`, () => {
      for (const poz of obidji(g).filter((x) => x.p === 0)) expect(prikaz(skok(poz.korak), g)).toEqual(prikaz(poz, g))
    })
    it(`grana ${g}: posle svake ručne radnje prikaz je isti kao matrica za novu poziciju, a posle sledećeg Dalje isti kao skok`, () => {
      for (const { poz } of klikaj(g)) {
        expect(prikaz(poz, g).stanje).toEqual(stanjeZa(poz.korak, poz.p, g))
        const sledeci = dalje(poz, g)
        if (sledeci && sledeci.p === 0) expect(prikaz(sledeci, g)).toEqual(prikaz(skok(sledeci.korak), g))
      }
    })
  }
})

describe('Dalje, Nazad, skok', () => {
  it('Dalje: početno → završno → početno sledećeg; na koraku 9 nema dalje', () => {
    for (const g of GRANE) {
      const sve = obidji(g)
      const korakaSaRadnjama = [1, 2, 3, 4, 5, 6, 7].length
      // 7 koraka sa radnjama daju po 2 pozicije (početno + završno), koraci 8 i 9 po jednu
      expect(sve).toHaveLength(korakaSaRadnjama * 2 + 2)
      expect(sve[sve.length - 1]).toEqual({ korak: 9, p: 0 })
      expect(dalje({ korak: 9, p: 0 }, g)).toBeNull()
    }
  })
  it('Nazad: odmaklo → početno tog koraka; početno → početno prethodnog; na početku nema nazad', () => {
    expect(nazad({ korak: 4, p: 5 })).toEqual({ korak: 4, p: 0 })
    expect(nazad({ korak: 4, p: 0 })).toEqual({ korak: 3, p: 0 })
    expect(nazad({ korak: 1, p: 0 })).toBeNull()
    expect(nazad({ korak: 9, p: 0 })).toEqual({ korak: 8, p: 0 })
  })
  it('skok i „Pokaži mi“ vode na POČETNO stanje koraka (van opsega se zadržava u opsegu)', () => {
    expect(skok(5)).toEqual({ korak: 5, p: 0 })
    expect(skok(0)).toEqual({ korak: 1, p: 0 })
    expect(skok(12)).toEqual({ korak: 9, p: 0 })
  })
})

/** „Ručno klikanje“: radnje redom kroz reducer; vraća sve pozicije posle svake radnje. */
function klikaj(g: Grana): { radnja: RadnjaId; poz: Pozicija }[] {
  const put: { radnja: RadnjaId; poz: Pozicija }[] = []
  let poz: Pozicija = POCETAK
  for (let guard = 0; guard < 200; guard++) {
    const r = sledecaRadnja(poz, g)
    if (r === undefined) {
      const n = dalje(poz, g)
      if (!n) break
      poz = n // korak je završen: „Dalje“ vodi na početak sledećeg koraka
      continue
    }
    const ishod = primeniRadnju(poz, r, g)
    expect(ishod.tip).toBe('primenjena')
    if (ishod.tip !== 'primenjena') break
    poz = ishod.poz
    put.push({ radnja: r, poz })
  }
  return put
}

describe('ručno klikanje celog puta = matrica', () => {
  for (const g of GRANE) {
    it(`grana ${g}: 24 radnje u koracima 1–7 (Grčka 18, Srbija 19) i završno stanje svakog koraka`, () => {
      const put = klikaj(g)
      expect(put).toHaveLength(g === 'grcka' ? 1 + 3 + 1 + 7 + 6 + 1 + 4 : 1 + 3 + 1 + 7 + 6 + 2 + 4)
      // Posle poslednje radnje svakog koraka pozicija je „završno“ tog koraka
      for (let k = 1; k <= 7; k++) {
        const poslednja = [...put].reverse().find((x) => x.poz.korak === k)!
        expect(poslednja.poz.p).toBe(duzina(k, g))
      }
    })
    it(`grana ${g}: Dalje daje ISTE završne pozicije kao klikanje radnji`, () => {
      const sveDalje = obidji(g)
      for (const { poz } of klikaj(g)) {
        if (poz.p === duzina(poz.korak, g)) expect(sveDalje.some((x) => x.korak === poz.korak && x.p === poz.p)).toBe(true)
      }
    })
  }
})

describe('reducer radnji (PLAN B4.6.6)', () => {
  it('prerana radnja se odbija: „U priči ovo dolazi u koraku N“', () => {
    expect(primeniRadnju({ korak: 2, p: 0 }, 'plati', 'grcka')).toEqual({ tip: 'ceka', korak: 4 })
    expect(primeniRadnju({ korak: 4, p: 0 }, 'izaberi-grcku', 'grcka')).toEqual({ tip: 'ceka', korak: 6 })
    expect(primeniRadnju({ korak: 2, p: 0 }, 'nastavi-program', 'grcka')).toEqual({ tip: 'ceka', korak: 2 })
  })
  it('prva radnja sledećeg koraka se prihvata kad je trenutni završen', () => {
    expect(primeniRadnju({ korak: 2, p: 3 }, 'otvori-kanal-price', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 3, p: 1 } })
    expect(primeniRadnju({ korak: 2, p: 2 }, 'otvori-kanal-price', 'grcka').tip).toBe('ceka') // trenutni nije završen
  })
  it('razumem / na-placanje / plati / vrati-na-tv važe i u koraku 4 i u koraku 5', () => {
    expect(primeniRadnju({ korak: 4, p: 3 }, 'razumem', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 4, p: 4 } })
    expect(primeniRadnju({ korak: 5, p: 2 }, 'razumem', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 5, p: 3 } })
    expect(primeniRadnju({ korak: 4, p: 7 }, 'plati', 'grcka').tip).toBe('nije') // „plati“ iz ovog koraka je već odrađena
  })
  it('radnja koja je već prošla ili nije u priči je „nije“ (dugme radi kao u slobodnom klikanju)', () => {
    expect(primeniRadnju({ korak: 3, p: 1 }, 'pocni', 'grcka').tip).toBe('nije')
    expect(primeniRadnju({ korak: 8, p: 0 }, 'pretplati', 'grcka').tip).toBe('nije')
  })
  it('ponovno štikliranje „Razumem“ u 4/4 nije „prerana radnja“ (nema poruke o koraku 5)', () => {
    expect(primeniRadnju({ korak: 4, p: 4 }, 'razumem', 'grcka').tip).toBe('nije')
  })
  it('korak 7 radi u bilo kom redosledu: otkaz ugovora i „jetzt kündigen“ i pre „U redu“', () => {
    expect(primeniRadnju({ korak: 7, p: 1 }, 'otkazi-ugovore', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 7, p: 3 } })
    expect(primeniRadnju({ korak: 7, p: 1 }, 'jetzt-kundigen', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 7, p: 4 } })
    expect(primeniRadnju({ korak: 7, p: 2 }, 'jetzt-kundigen', 'grcka')).toEqual({ tip: 'primenjena', poz: { korak: 7, p: 4 } })
    expect(primeniRadnju({ korak: 7, p: 0 }, 'jetzt-kundigen', 'grcka').tip).toBe('ceka')
  })
  it('grane: izaberi-srbiju je radnja samo na grani Srbija', () => {
    expect(primeniRadnju({ korak: 6, p: 0 }, 'izaberi-srbiju', 'srbija').tip).toBe('primenjena')
    expect(primeniRadnju({ korak: 6, p: 0 }, 'izaberi-grcku', 'srbija').tip).toBe('nije')
  })
})

describe('izvedeno stanje: pretplate, kvačica, zemlja', () => {
  it('Doma TV od plaćanja u koraku 4 do otkaza u koraku 7; Paket Srbija od plaćanja u 5 do „jetzt kündigen“', () => {
    const a = (korak: number, p: number) => pretplatePozicije({ korak, p }, 'grcka')
    expect(a(3, 1)).toEqual({ kanal: false, paket: false })
    expect(a(4, 5)).toEqual({ kanal: false, paket: false })
    expect(a(4, 6)).toEqual({ kanal: true, paket: false })
    expect(a(5, 0)).toEqual({ kanal: true, paket: false })
    expect(a(5, 5)).toEqual({ kanal: true, paket: true })
    expect(a(6, 1)).toEqual({ kanal: true, paket: true })
    expect(a(7, 0)).toEqual({ kanal: true, paket: true })
    expect(a(7, 1)).toEqual({ kanal: false, paket: true })
    expect(a(7, 3)).toEqual({ kanal: false, paket: true })
    expect(a(7, 4)).toEqual({ kanal: false, paket: false })
    expect(a(9, 0)).toEqual({ kanal: false, paket: false })
  })
  it('kvačica „Razumem“ NIJE štiklirana na početku P3; Dalje i skok je vidljivo štikliraju za taj korak', () => {
    const r = (korak: number, p: number) => razumemStiklirano({ korak, p }, 'grcka')
    expect(r(4, 3)).toBe(false)
    expect(r(4, 4)).toBe(true)
    expect(r(4, 7)).toBe(true)
    expect(r(5, 2)).toBe(false)
    expect(r(5, 3)).toBe(true)
    expect(r(3, 1)).toBe(false)
    expect(odradjena({ korak: 4, p: 4 }, 4, 'razumem', 'grcka')).toBe(true)
  })
  it('zemlja: 1–5 Nemačka, 6 Grčka/Srbija, 7–9 Nemačka', () => {
    for (const k of [1, 2, 3, 4, 5, 7, 8, 9]) for (const g of GRANE) expect(zemljaPozicije({ korak: k, p: 0 }, g)).toBe('DE')
    expect(zemljaPozicije({ korak: 6, p: 0 }, 'grcka')).toBe('DE') // porodica tek bira
    expect(zemljaPozicije({ korak: 6, p: 1 }, 'grcka')).toBe('GR')
    expect(zemljaPozicije({ korak: 6, p: 1 }, 'srbija')).toBe('RS')
  })
})

describe('čuvanje (sessionStorage)', () => {
  const skladiste = (v: string | null) => ({ getItem: () => v })
  it('ispravan zapis se učitava', () => {
    const z = { ...POCETNO_SACUVANO, korak: 4, p: 5, grana: 'srbija' as const }
    expect(ucitaj(skladiste(JSON.stringify(z)))).toEqual(z)
  })
  it('stara verzija, neispravan zapis, korak 0 ili 10, nepostojeći pod-korak → početak', () => {
    const dobar = { ...POCETNO_SACUVANO }
    for (const lose of [null, 'nije json', '{}', JSON.stringify({ ...dobar, verzija: 0 }), JSON.stringify({ ...dobar, korak: 0 }), JSON.stringify({ ...dobar, korak: 10 }), JSON.stringify({ ...dobar, korak: 2, p: 9 }), JSON.stringify({ ...dobar, grana: 'nemacka' }), JSON.stringify({ ...dobar, rezim: 'x' }), JSON.stringify({ ...dobar, korak: 1.5 })]) {
      expect(ucitaj(skladiste(lose))).toEqual(POCETNO_SACUVANO)
    }
    expect(proveri(null)).toBeNull()
  })
  it('p važi prema grani (pod-korak 2 u koraku 6 postoji samo za Srbiju)', () => {
    expect(proveri({ ...POCETNO_SACUVANO, korak: 6, p: 2, grana: 'srbija' })).not.toBeNull()
    expect(proveri({ ...POCETNO_SACUVANO, korak: 6, p: 2, grana: 'grcka' })).toBeNull()
  })
  it('blokirano skladište (SecurityError pri samom pristupu) ne ruši učitavanje ni čuvanje', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })
    try {
      expect(ucitaj()).toEqual(POCETNO_SACUVANO)
      expect(() => sacuvaj(POCETNO_SACUVANO)).not.toThrow()
    } finally {
      if (original) Object.defineProperty(globalThis, 'sessionStorage', original)
      else delete (globalThis as { sessionStorage?: unknown }).sessionStorage
    }
  })
  it('čuvanje ne puca bez skladišta niti kad skladište baci grešku', () => {
    expect(() => sacuvaj(POCETNO_SACUVANO, null)).not.toThrow()
    expect(() => sacuvaj(POCETNO_SACUVANO, { setItem: () => { throw new Error('pun') } })).not.toThrow()
  })
})
