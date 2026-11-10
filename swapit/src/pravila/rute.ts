// REGISTAR SVIH 84 EKRANA (UX.md 5): ruta, ko sme da ga vidi, da li ima cenu.
// Link ima oblik #/<ugao>/<putanja>; U1, U2, U3 i S4 nemaju ugao u linku (pravni tekstovi i uvod). Ugao i KONTEKST ekrana
// (id oglasa, razmene, svrhe plaćanja…) su u linku; pozicija priče, grana, režim, tema i tokovi su u sessionStorage (demo/cuvanje.ts).
// Putanja je šablon: „oglas/:oglas“ ima parametar „oglas“; ako link ne nosi parametar, uzima se podrazumevan primer (kontekst).
import { REF_POSILJKA } from '../scenario/strane'
import { UGLOVI, type EkranId, type Ugao } from '../prica/tipovi'

export type Ruta = {
  id: EkranId
  /** Šablon putanje posle ugla (npr. „oglas/:oglas“). Za U1–U3 i S4 ceo link. */
  put: string
  naslov: string
  uglovi: Ugao[]
  /** Link bez ugla (uvod, ulaz, o demou, pravni tekstovi). */
  bezUgla: boolean
  /** Ekran prikazuje iznos pretplate, akcije, reklame, dostave ili plaćanja (nosi oznaku „ilustrativno“ i „sa PDV-om“). */
  cena: boolean
  /** Ekran je izgrađen. Posle talasa 3 je izgrađen svih 84 ekrana (nijedan nije kostur); polje ostaje da bi test mogao da to proveri. */
  izgradjen: boolean
}

const SVI: Ugao[] = UGLOVI
const GRAD: Ugao[] = ['ana', 'marko']
const GRAD_FIRMA: Ugao[] = ['ana', 'marko', 'prodavnica']
const FIRMA: Ugao[] = ['prodavnica']
const MOD: Ugao[] = ['moderacija']

type Opc = { cena?: boolean; bezUgla?: boolean }
const e = (id: string, put: string, naslov: string, uglovi: Ugao[], o: Opc = {}): Ruta => ({ id, put, naslov, uglovi, bezUgla: !!o.bezUgla, cena: !!o.cena, izgradjen: true })

/** Podrazumevan kontekst (parametar linka) kad ekran nema svoj: primeri iz priče. */
export const KONTEKST: Record<string, string> = {
  oglas: 'markov-bicikl',
  ponuda: 'ana-ps2',
  razmena: 'lanac',
  razgovor: 'lanac',
  svrha: 'dostava',
  ref: REF_POSILJKA,
  posiljka: REF_POSILJKA,
  korisnik: 'marko_voz77',
  kat: 'knjige',
  prica: 'jabuke',
  firma: 'zupcanik',
  akcija: 'staro-za-novo',
  prijava: 'sljivovica',
  tekst: 'uslovi',
}

/** Podrazumevan kontekst za pojedinačne ekrane (ima prednost nad KONTEKST): npr. zahtev za poklon u priči je za Anin PlayStation 2. */
export const KONTEKST_EKRANA: Record<string, Record<string, string>> = {
  W5: { oglas: 'ana-ps2' },
  // isticanje: Anin oglas; javna aukcija: „MTB bicikl STORM“; prijava oglasa: tuđ oglas koji se sme prijaviti
  Z1: { oglas: 'ana-ps2' },
  J2: { oglas: 'mtb-bicikl-storm' },
  J3: { oglas: 'ana-ps2' },
  J4: { oglas: 'mtb-bicikl-storm' },
  O5: { oglas: 'romani-ive-andrica-komplet' },
  X4: { oglas: 'markov-bicikl' },
}

export const RUTE: Ruta[] = [
  // uvod i ulaz (3)
  e('U1', '', 'Šta je ovo', SVI, { bezUgla: true }),
  e('U2', 'ulaz', 'Uđi u demo', SVI, { bezUgla: true }),
  e('U3', 'o-demou', 'O ovom demou', SVI, { bezUgla: true }),
  // registracija i nalog (5)
  e('R1', 'prijava', 'Prijava', SVI),
  e('R2', 'nalog/korak-1', 'Napravi nalog (korak 1 od 3)', SVI),
  e('R3', 'nalog/korak-2', 'Grad i punoletstvo (korak 2 od 3)', SVI),
  e('R4', 'nalog/korak-3', 'Potvrda telefona (korak 3 od 3)', SVI),
  e('R5', 'zaboravljena-lozinka', 'Zaboravljena lozinka', SVI),
  // početna, pretraga, mapa, priče (10)
  e('P1', 'pocetna', 'Početna', SVI),
  e('P2', 'prikaz', 'Prikaz i jezik', SVI),
  e('P3', 'kategorije', 'Kategorije', SVI),
  e('P4', 'pretraga/filteri', 'Pretraga i filteri', SVI),
  e('P5', 'pretraga', 'Rezultati pretrage', SVI),
  e('P6', 'mapa', 'Mapa', SVI),
  e('P7', 'kategorija/:kat', 'Kategorija „Vidi sve“', SVI),
  e('P8', 'prica/:prica', 'Priča zajednice', SVI),
  e('P9', 'objavi-u-pricama', 'Objavi u pričama', GRAD_FIRMA),
  e('P10', 'kako-redjamo', 'Kako ređamo oglase', SVI),
  // oglas (6)
  e('O1', 'oglas/:oglas', 'Oglas', SVI),
  e('O2', 'novi-oglas/1', 'Novi oglas, 1 od 2', GRAD_FIRMA),
  e('O3', 'novi-oglas/2', 'Novi oglas, 2 od 2', GRAD_FIRMA),
  e('O4', 'novi-oglas/objavljen', 'Oglas objavljen', GRAD_FIRMA),
  e('O5', 'prijavi/:oglas', 'Prijavi oglas ili korisnika', GRAD_FIRMA),
  e('O6', 'moji-oglasi', 'Moji oglasi', GRAD_FIRMA),
  // razmena (13)
  e('X1', 'ponuda/:oglas/izaberi', 'Izaberi šta nudiš', GRAD),
  e('X2', 'ponuda/:oglas/pregled', 'Tvoja ponuda', GRAD),
  e('X3', 'ponuda/:oglas/poslata', 'Ponuda poslata', GRAD),
  e('X4', 'primljene/:oglas', 'Primljene ponude', GRAD),
  e('X5', 'primljene/:oglas/:ponuda', 'Detalj primljene ponude', GRAD),
  e('X6', 'primljene/:oglas/:ponuda/odbij', 'Odbij ponudu', GRAD),
  e('X7', 'primljene/:oglas/:ponuda/prihvacena', 'Ponuda prihvaćena', GRAD),
  e('X8', 'dogovor/:razmena', 'Dogovor i primopredaja', GRAD),
  e('X9', 'primopredaja/:razmena', 'Potvrdi primopredaju', GRAD),
  e('X10', 'razmena/:razmena/obavljena', 'Razmena obavljena', GRAD),
  e('X11', 'razmena/:razmena/ocena', 'Oceni razmenu', GRAD),
  e('X12', 'moje-razmene', 'Moje razmene i ponude', GRAD_FIRMA),
  e('X13', 'lanac', 'Lanac razmene — predlog', GRAD),
  // poruke (2)
  e('C1', 'poruke', 'Poruke', GRAD_FIRMA),
  e('C2', 'poruke/:razgovor', 'Razgovor', GRAD_FIRMA),
  // poeni, lista želja, omiljeno (6)
  e('W1', 'poeni', 'Moji poeni', GRAD),
  e('W2', 'poeni/nedovoljno/:oglas', 'Nedovoljno poena', GRAD),
  e('W3', 'lista-zelja', 'Lista želja', GRAD),
  e('W4', 'poklapanje', 'Poklapanje', GRAD),
  e('W5', 'poklon/:oglas', 'Zatraži poklon', GRAD),
  e('W6', 'omiljeno', 'Omiljeno', GRAD_FIRMA),
  // javna aukcija (4)
  e('J1', 'aukcije', 'Javne aukcije', SVI),
  e('J2', 'aukcija/:oglas', 'Aukcija', SVI),
  e('J3', 'aukcija/:oglas/pokreni', 'Pokreni aukciju', GRAD),
  e('J4', 'aukcija/:oglas/ponude', 'Izaberi ponudu', GRAD),
  // plaćene usluge platforme — lažni prikaz (4)
  e('Z1', 'isticanje/:oglas', 'Isticanje oglasa', GRAD_FIRMA, { cena: true }),
  e('Z2', 'paketi-aukcija', 'Paketi aukcija', GRAD_FIRMA, { cena: true }),
  e('Z3', 'placanje/:svrha/:ref', 'Plaćanje (demo)', GRAD_FIRMA, { cena: true }),
  e('Z4', 'placanje/:svrha/:ref/potvrdjeno', 'Plaćanje potvrđeno', GRAD_FIRMA, { cena: true }),
  // profil (4)
  e('N1', 'profil/:korisnik', 'Profil korisnika', SVI),
  e('N2', 'moj-profil', 'Moj profil', GRAD_FIRMA),
  e('N3', 'podesavanja', 'Podešavanja naloga', GRAD_FIRMA),
  e('N4', 'profil/:korisnik/recenzije', 'Sve recenzije', SVI),
  // dostava (3)
  e('D1', 'dostava', 'Dostava — poručivanje', GRAD_FIRMA, { cena: true }),
  e('D2', 'dostava/pregled', 'Dostava — pregled i naknada', GRAD_FIRMA, { cena: true }),
  e('D3', 'dostava/prati/:posiljka', 'Praćenje pošiljke', GRAD_FIRMA, { cena: true }),
  // podrška i pravila (5); S4 je bez ugla (pravni tekstovi)
  e('S1', 'podrska', 'Podrška', SVI),
  e('S2', 'pravila', 'Pravila zajednice i zabranjene stvari', SVI),
  e('S3', 'kako-radi', 'Kako radi SWAPIT', SVI),
  e('S4', 'pravno/:tekst', 'Pravni tekstovi', SVI, { bezUgla: true }),
  e('S5', 'prijavi-problem', 'Prijavi problem', GRAD_FIRMA),
  // poslovna strana (9)
  e('F1', 'poslovni/planovi', 'Poslovni nalog — planovi', GRAD_FIRMA, { cena: true }),
  e('F2', 'poslovni/otvaranje', 'Otvaranje poslovnog naloga', GRAD_FIRMA, { cena: true }),
  e('F3', 'tabla', 'Tabla firme', FIRMA, { cena: true }),
  e('F4', 'firma/:firma', 'Javni profil firme', SVI),
  e('F5', 'poslovni/uredi', 'Uredi profil firme', FIRMA),
  e('F6', 'poslovni/rezultati', 'Pregled rezultata', FIRMA, { cena: true }),
  e('F7', 'servisi', 'Servisi i zanatlije', SVI),
  e('F8', 'poslovni/pretplata', 'Pretplata (upravljanje)', FIRMA, { cena: true }),
  e('F9', 'poslovni/reklama', 'Reklama „Sponzorisano“', FIRMA, { cena: true }),
  // akcija „staro za novo“ (6)
  e('A1', 'akcija/:akcija', 'Stranica akcije', SVI, { cena: true }),
  e('A2', 'akcija/:akcija/prijava', 'Prijava za akciju', GRAD, { cena: true }),
  e('A3', 'akcija/:akcija/potvrda', 'Prijava potvrđena', GRAD),
  e('A4', 'akcije', 'Tabla akcija', FIRMA, { cena: true }),
  e('A5', 'akcije/nova', 'Nova akcija', FIRMA, { cena: true }),
  e('A6', 'akcija/:akcija/prijave', 'Prijave na akciji', FIRMA, { cena: true }),
  // moderacija (4)
  e('V1', 'moderacija', 'Tabla moderacije', MOD),
  e('V2', 'prijava/:prijava', 'Pregled prijave', MOD),
  e('V3', 'prijava/:prijava/odluka', 'Odluka i obrazloženje', MOD),
  e('V4', 'prijava/:prijava/obavestenje', 'Obaveštenje korisniku o odluci', SVI),
]

export const RUTA_PO_ID: Record<string, Ruta> = Object.fromEntries(RUTE.map((r) => [r.id, r]))

/** Kuća ugla posle ulaza u demo (UX 1.1). */
export const KUCA: Record<Ugao, EkranId> = { ana: 'P1', marko: 'P1', prodavnica: 'F3', moderacija: 'V1' }

/** Ugao u linku za ekrane koji ga nemaju (U1–U3, S4): poslednji viđeni, a u početku Ana. */
export const PODRAZUMEVANI_UGAO: Ugao = 'ana'

export const jeUgao = (x: string): x is Ugao => (UGLOVI as string[]).includes(x)

/** Popunjava šablon: parametri iz `parametri`, a ako ih nema, podrazumevan kontekst. */
function popuni(sablon: string, parametri: Record<string, string> = {}): string {
  return sablon
    .split('/')
    .map((seg) => (seg.startsWith(':') ? encodeURIComponent(parametri[seg.slice(1)] ?? KONTEKST[seg.slice(1)] ?? 'primer') : seg))
    .join('/')
}

/** Link za ekran u datom uglu (bez #). Upit (npr. pretraga) ide kao treći argument. */
export function link(id: EkranId, ugao: Ugao, parametri: Record<string, string> = {}, upit?: Record<string, string>): string {
  const r = RUTA_PO_ID[id]
  if (!r) throw new Error(`Nepoznat ekran: ${id}`)
  const put = popuni(r.put, { ...KONTEKST_EKRANA[id], ...parametri })
  const osnova = r.bezUgla ? `/${put}` : `/${ugao}/${put}`
  const q = upit && Object.keys(upit).length ? '?' + Object.entries(upit).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : ''
  return (osnova === '/' ? '/' : osnova.replace(/\/$/, '')) + q
}

export type Razreseno = { id: EkranId; ugao: Ugao | null; parametri: Record<string, string> }

/** Poklapa segmente linka sa šablonom; vraća parametre ili null. Broj literala odlučuje kad se dva šablona poklope. */
function poklopi(segmenti: string[], sablon: string): { parametri: Record<string, string>; literala: number } | null {
  const s = sablon === '' ? [] : sablon.split('/')
  if (s.length !== segmenti.length) return null
  const parametri: Record<string, string> = {}
  let literala = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i].startsWith(':')) {
      try {
        parametri[s[i].slice(1)] = decodeURIComponent(segmenti[i])
      } catch {
        return null
      }
    } else if (s[i] === segmenti[i]) literala++
    else return null
  }
  return { parametri, literala }
}

/** Iz linka (bez #, bez upita) izvlači ekran, ugao i parametre; null ako ruta ne postoji. */
export function razresi(putanja: string): Razreseno | null {
  const segmenti = putanja.split('/').filter(Boolean)
  const nadji = (sablonSegmenti: string[], bezUgla: boolean, ugao: Ugao | null): Razreseno | null => {
    let najbolja: (Razreseno & { literala: number }) | null = null
    for (const r of RUTE) {
      if (r.bezUgla !== bezUgla) continue
      const m = poklopi(sablonSegmenti, r.put)
      if (m && (!najbolja || m.literala > najbolja.literala)) najbolja = { id: r.id, ugao, parametri: m.parametri, literala: m.literala }
    }
    return najbolja && { id: najbolja.id, ugao: najbolja.ugao, parametri: najbolja.parametri }
  }
  if (segmenti.length === 0) return nadji([], true, null)
  const bezUgla = nadji(segmenti, true, null)
  if (bezUgla) return bezUgla
  if (!jeUgao(segmenti[0])) return null
  return nadji(segmenti.slice(1), false, segmenti[0])
}
