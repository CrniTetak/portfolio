// Talas 2: Prodavnica, Moderacija, korak 9 i račva „za poene“ (6R–8R), radnju po radnju kroz isti reducer kroz koji idu dugmad na ekranima.
import { describe, expect, it } from 'vitest'
import { AKCIJA, ZUPCANIK } from '../scenario/tabla'
import { CENE } from '../scenario/cene'
import { PREGLEDI_PO_NEDELJAMA, PREGLEDI_PO_OGLASIMA, PRIJAVE_AKCIJE, PRIJAVE_NA_CEKANJU } from '../scenario/poslovno'
import { svePozicije } from '../scenario/pomocno'
import { KORISNICI, KORISNIK_PO_ID, istorijaPoena, svet } from '../scenario/svet'
import { brojRadnji } from './koraci'
import { izvedi, mozeRadnja } from './reducer'
import { saglasnostiZa } from './saglasnosti'
import type { Poz, Ugao } from './tipovi'

const korak = (k: number, grana: Poz['grana'] = 'lanac'): Poz => ({ korak: k, n: 0, grana })
const redom = (p: Poz, ugao: Ugao, ids: string[]): Poz => ids.reduce((q, id) => izvedi(q, id, ugao), p)

describe('Prodavnica, korak 9', () => {
  it('A5 → Z3 → Z4 → A1 → A4 → A6 redom, svaka radnja tek kad je na redu', () => {
    let p = korak(9)
    expect(mozeRadnja(p, '9.z3', 'prodavnica')).toBe(false)
    expect(mozeRadnja(p, '9.objavi', 'ana')).toBe(false)
    p = redom(p, 'prodavnica', ['9.objavi', '9.z3', '9.z4', '9.a1', '9.a4', '9.primi'])
    expect(p).toEqual({ korak: 9, n: 6, grana: 'lanac' })
  })
  it('V-3: plaćanje akcije je poslovno — nema potrošačke kvačice „Želim da usluga počne odmah“ ni u jednom koraku', () => {
    for (const n of [0, 1, 2, 3, 6]) expect(saglasnostiZa({ korak: 9, n, grana: 'lanac' })).not.toContain('z3_odmah_akcija')
  })
  it('Ana i Marko nemaju radnji u koraku 9', () => {
    for (const u of ['ana', 'marko'] as const) for (const id of ['9.objavi', '9.z3', '9.primi']) expect(mozeRadnja(korak(9), id, u)).toBe(false)
  })
  it('akcija: 12 prijava = 5 + 4 + 3, zbirovi pregleda se slažu sa tablom firme', () => {
    const po = (s: string) => PRIJAVE_AKCIJE.filter((x) => x.status === s).length
    expect([po('primljeno'), po('ceka'), po('odbijeno')]).toEqual([AKCIJA.primljeno, AKCIJA.cekaProcenu, AKCIJA.odbijeno])
    expect(PRIJAVE_AKCIJE[0].status).toBe('ceka')
    expect(PREGLEDI_PO_NEDELJAMA.reduce((z, n) => z + n.pregledi, 0)).toBe(ZUPCANIK.pregledi30Dana)
    expect(PREGLEDI_PO_OGLASIMA.reduce((z, n) => z + n, 0)).toBe(ZUPCANIK.pregledi30Dana)
    expect(PREGLEDI_PO_OGLASIMA).toHaveLength(svet(korak(1)).zupcanik.oglasa)
    expect(svet({ korak: 9, n: 6, grana: 'lanac' }).akcija!.izdatiPopusti).toBe((AKCIJA.primljeno + 1) * CENE.popustPoStaromBiciklu)
  })
})

describe('Moderacija, korak 5', () => {
  it('V2 → V3: Markove radnje se odigraju same, pa moderacija uklanja oglas', () => {
    let p = korak(5)
    expect(mozeRadnja(p, '5.v3', 'moderacija')).toBe(false) // prvo V2
    p = redom(p, 'moderacija', ['5.v2', '5.v3'])
    expect(p).toEqual({ korak: 5, n: 5, grana: 'lanac' })
    expect(svet(p).moderacija).toMatchObject({ naCekanju: 2, uklonjeno: 10 })
  })
  it('na čekanju su dve prijave od početka, a „šljivovica“ je treća', () => {
    expect(PRIJAVE_NA_CEKANJU).toHaveLength(2)
    expect(svet(korak(4)).moderacija.naCekanju).toBe(PRIJAVE_NA_CEKANJU.length + 1)
  })
})

describe('račva „za poene“, 6R–8R', () => {
  it('Ana klik po klik: poeni 20 → 70 → 20, a Marko 35 → 85 (UX 7.5)', () => {
    let p = korak(6, 'poeni')
    expect(svet(p).korisnici.ana_zvz84.poeni).toBe(20)
    p = redom(p, 'ana', ['6R.uzmi', '6R.pokloni'])
    expect(p).toEqual({ korak: 6, n: 2, grana: 'poeni' })
    p = korak(7, 'poeni')
    p = izvedi(p, '7R.uredi', 'ana')
    expect(p.n).toBe(2) // Jovanin zahtev za poklon stiže sam
    // N-1: Ana potvrđuje poklon, Jovana (sama) potvrđuje prijem, i TEK TADA SWAPIT dodeljuje poene
    expect(svet(p).korisnici.ana_zvz84.poeni).toBe(20)
    p = izvedi(p, '7R.potvrdi', 'ana')
    expect(p).toEqual({ korak: 7, n: 4, grana: 'poeni' })
    expect(svet(p).korisnici).toMatchObject({ ana_zvz84: { poeni: 70, razmene: 1 }, marko_voz77: { poeni: 35 }, jovana_vra91: { poeni: 60 } })
    p = korak(8, 'poeni')
    p = izvedi(p, '8R.uzmi', 'ana')
    // N-1: Ana je potrošila poene, a Marku SWAPIT dodeljuje poene tek kad Ana potvrdi prijem
    expect(svet(p).korisnici).toMatchObject({ ana_zvz84: { poeni: 20 }, marko_voz77: { poeni: 35 } })
    p = izvedi(p, '8R.pot.ana', 'ana')
    expect(svet(p).korisnici.marko_voz77.poeni).toBe(85)
    expect(p.n).toBe(3) // Markova potvrda je sledeća, a Ana je u koraku sama
    // PK2-7: poeni Ane i Marka na kraju 8R (UX 7.5)
    p = redom(p, 'ana', ['8R.x10', '8R.x11'])
    expect(svet(p).korisnici).toMatchObject({ ana_zvz84: { poeni: 20, razmene: 2 }, marko_voz77: { poeni: 85, razmene: 19 }, jovana_vra91: { poeni: 60 } })
    expect(p.n).toBe(brojRadnji(8, 'poeni'))
  })
  it('Marko u 8R: Anino uzimanje i potvrda se odigraju same', () => {
    const p = izvedi(korak(8, 'poeni'), '8R.pot.marko', 'marko')
    expect(p.n).toBe(3)
    expect(svet(p).korisnici).toMatchObject({ ana_zvz84: { poeni: 20 }, marko_voz77: { poeni: 85 } })
  })
  it('istorija poena uvek daje tačno stanje poena (za svakog korisnika, uključujući Jovanu)', () => {
    for (const poz of svePozicije())
      for (const id of ['ana_zvz84', 'marko_voz77', 'jovana_vra91']) {
        const zbir = istorijaPoena(poz, id).reduce((z, x) => z + x.iznos, 0)
        expect(zbir, `${id} @ ${poz.korak}.${poz.n} ${poz.grana}`).toBe(svet(poz).korisnici[id].poeni)
      }
  })
  it('Ana ne može da potvrdi poklon pre izmene oglasa, a Marko ne može da potvrdi poklon uopšte', () => {
    expect(mozeRadnja(korak(7, 'poeni'), '7R.potvrdi', 'ana')).toBe(false)
    expect(mozeRadnja({ korak: 7, n: 2, grana: 'poeni' }, '7R.potvrdi', 'marko')).toBe(false)
  })
})

describe('N-1: poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku', () => {
  const korisnici = KORISNICI.map((k) => k.id)
  it('opisi u istoriji poena nikad ne sadrže korisničko ime kao izvor ni primaoca poena', () => {
    for (const poz of svePozicije())
      for (const id of ['ana_zvz84', 'marko_voz77', 'jovana_vra91'])
        for (const st of istorijaPoena(poz, id)) {
          for (const ime of korisnici) expect(st.opis.includes(ime), `${poz.korak}.${poz.n} ${id}: „${st.opis}“ sadrži ${ime}`).toBe(false)
          expect(/(od|za) korisnik/i.test(st.opis), st.opis).toBe(false)
        }
  })
  it('Ana: dodela tek posle potvrđenog prijema, potrošnja odmah; Marko: dodela tek kad Ana potvrdi prijem', () => {
    const ana = (p: Poz) => istorijaPoena(p, 'ana_zvz84').map((x) => x.opis)
    expect(ana(korak(7, 'poeni')).some((o) => o.startsWith('SWAPIT ti je dodelio ') && o.endsWith('za poklon (PlayStation 2) — primalac je potvrdio prijem.'))).toBe(false)
    expect(ana({ korak: 7, n: 4, grana: 'poeni' }).some((o) => o.startsWith('SWAPIT ti je dodelio ') && o.endsWith('za poklon (PlayStation 2) — primalac je potvrdio prijem.'))).toBe(true)
    expect(ana({ korak: 8, n: 1, grana: 'poeni' }).some((o) => /^Potrošeno .* poena: Dečji bicikl 20 inča$/.test(o))).toBe(true)
    const marko = (p: Poz) => istorijaPoena(p, 'marko_voz77').map((x) => x.opis)
    expect(marko({ korak: 8, n: 1, grana: 'poeni' }).some((o) => o.includes('za predatu stvar — primalac je potvrdio prijem.'))).toBe(false)
    expect(marko({ korak: 8, n: 2, grana: 'poeni' }).some((o) => o.startsWith('SWAPIT ti je dodelio ') && o.endsWith(' za predatu stvar — primalac je potvrdio prijem.'))).toBe(true)
  })
  it('„Poeni iz ranijih razmena“ nose raniji datum od početka demoa', () => {
    const stavka = istorijaPoena(korak(1), 'marko_voz77').find((x) => x.opis === 'Poeni iz ranijih razmena')!
    expect(stavka.datum.m * 100 + stavka.datum.d).toBeLessThan(1019)
  })
})

describe('PK2: izvori podataka se slažu', () => {
  it('korisnici iz prijava na akciju i prijava na čekanju postoje u podacima', () => {
    for (const p of PRIJAVE_AKCIJE) expect(KORISNIK_PO_ID[p.korisnik], p.korisnik).toBeDefined()
    for (const p of PRIJAVE_NA_CEKANJU) expect(KORISNIK_PO_ID[p.korisnik], p.korisnik).toBeDefined()
  })
  it('V1: „na čekanju“ je broj redova sa stanjem na čekanju ili u pregledu (3 dok odluka o šljivovici nije poslata, zatim 2)', () => {
    expect(svet(korak(4)).moderacija.naCekanju).toBe(3)
    expect(svet({ korak: 5, n: 4, grana: 'lanac' }).moderacija.naCekanju).toBe(3)
    expect(svet({ korak: 5, n: 5, grana: 'lanac' }).moderacija.naCekanju).toBe(2)
  })
})
