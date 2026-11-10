// ZBIRNIK EKRANA: koji ekran (id iz registra) crta koja komponenta. Ono što nije izgrađeno dobija okvir „Uskoro“.
// Novi ekran = nova komponenta ovde + upis u registar (pravila/ekrani.ts).
import { useEffect, useRef, type ComponentType } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { U1Uvod, U2Ulaz } from './uvod/Uvod'
import { U3ODemou } from './uvod/U3'
import { M1Platforma, V1Tabla } from './uvod/Table'
import { T4Emisija, T6Zanr, T7Zemlja, T11Unazad, T17Pretraga, T18Rezultati, T21Podesavanja, T22Jezik, T23Titlovi, T24Roditeljska, T28Nalog, T29Pomoc, T30Odgovor, T31Reklame } from './tv/TvOstalo'
import { P6Paketi, P7Paket, P11Uredjaji, P12Racuni, P13Racun, P14Nalog, P15Jezik, P16Pomoc, P17Uslovi } from './tel/TelEkrani2'
import { P1Pocetna, P2Prijava, P3Narudzba, P4Placanje, P5Aktivno, P8Pretplate, P9Otkaz, P10Otkazano } from './tel/TelEkrani'
import { T2Pocetna } from './tv/T2Pocetna'
import { T1Pokretanje, T8Kanal, T9Gledanje, T10Reklama, T12Nedostupno } from './tv/TvKanal'
import { T13Qr, T14Otkljucano, T15Paketi, T16Paket, T19Pretplate, T20Otkazano, T25Zemlja, T26Grcka, T27Srbija } from './tv/TvPretplata'
import { T3Vodic } from './tv/T3Vodic'
import { T5Kanali } from './tv/T5Kanali'
import { razresi, sastavi, type Parametri } from '../pravila/ekrani'
import { dostupan, imaKanal, imaPaket, imaReklamu, imaEmisiju, imaUpit, imaRacun, kanal, kanaliZaUpit, emisijeZaUpit } from '../podaci/svet'
import { imaPitanje } from '../tekstovi/pomoc'
import { useDemo } from '../okvir/stanje'
import { stanjeZa } from '../prica/matrica'
import { NASLOV_STRANICE } from '../podaci/stalni-tekstovi'
import { useToast } from '../okvir/Toast'
import { TvEkran } from '../tv-navigacija/fokus'

const TV_EKRANI: Record<string, ComponentType<{ parametri: Parametri }>> = {
  T1: T1Pokretanje,
  T4: T4Emisija,
  T6: T6Zanr,
  T7: T7Zemlja,
  T11: T11Unazad,
  T17: T17Pretraga,
  T18: T18Rezultati,
  T21: T21Podesavanja,
  T22: T22Jezik,
  T23: T23Titlovi,
  T24: T24Roditeljska,
  T28: T28Nalog,
  T29: T29Pomoc,
  T30: T30Odgovor,
  T31: T31Reklame,
  T2: T2Pocetna,
  T3: T3Vodic,
  T5: T5Kanali,
  T8: T8Kanal,
  T9: T9Gledanje,
  T10: T10Reklama,
  T12: T12Nedostupno,
  T13: T13Qr,
  T14: T14Otkljucano,
  T15: T15Paketi,
  T16: T16Paket,
  T19: T19Pretplate,
  T20: T20Otkazano,
  T25: T25Zemlja,
  T26: T26Grcka,
  T27: T27Srbija,
}

/** Parametar iz adrese mora da postoji u podacima (kanal, paket, emisija, reklama); inače se ekran ne crta (vraća se na T2 uz poruku). */
function parametriIspravni(id: string, p: Parametri): boolean {
  switch (id) {
    case 'T4':
      return imaEmisiju(p.id)
    case 'T8':
    case 'T9':
    case 'T11':
    case 'T12':
      return imaKanal(p.id)
    case 'T10':
      return imaReklamu(p.id)
    case 'T13':
      // kupuje se kanal po izboru ili paket; besplatni kanal i kanal u paketu se ne kupuju pojedinačno
      return imaPaket(p.proizvod) || (imaKanal(p.proizvod) && kanal(p.proizvod).deo === 'po-izboru')
    case 'T14':
      return imaKanal(p.id)
    case 'T16':
      return imaPaket(p.id)
    case 'T18':
      return imaUpit(p.upit)
    case 'T30':
      return imaPitanje(p.pitanje)
    case 'T20':
      return imaKanal(p.id) || imaPaket(p.id)
    default:
      return true
  }
}

/**
 * Ekrani koji zavise od stanja preusmeravaju na pravi ekran (ne ugrađuju tuđu komponentu): T12 za kanal koji je dostupan → T8;
 * T9/T11/T14 za kanal koji nije dostupan u zemlji → T12, a za kanal bez pretplate → T8.
 */
function preusmeri(id: string, p: Parametri, zemlja: Parameters<typeof dostupan>[1], jePretplacen: (kanalId: string, paketId?: string) => boolean): string | null {
  if (!['T9', 'T11', 'T12', 'T14'].includes(id)) return null
  const k = kanal(p.id)
  if (id === 'T12') return dostupan(k, zemlja) ? sastavi('T8', { id: k.id }) : null
  if (!dostupan(k, zemlja)) return sastavi('T12', { id: k.id })
  const placen = id === 'T14' || k.deo !== 'besplatni'
  return placen && !jePretplacen(k.id, k.paket) ? sastavi('T8', { id: k.id }) : null
}

/** Početni izbor tamo gde id elementa ne postoji uvek (zavisi od podataka): T18 = prva kartica rezultata, T9 = „Od početka“ ako ima prava, inače „Info“. */
function pocetniDinamicki(id: string, p: Parametri): string | undefined {
  if (id === 'T18') {
    const k = kanaliZaUpit(p.upit)[0]
    if (k) return `rezultat-kanal-${k.id}`
    const e = emisijeZaUpit(p.upit)[0]
    return e ? `rezultat-emisija-${e.id}` : 'rezultat-nazad'
  }
  if (id === 'T9') return kanal(p.id).gledanjeUnazad ? 'plejer-od-pocetka' : 'plejer-info'
  return undefined
}

/** Ekran televizora za trenutni link. Nepoznata ruta → T2 uz kratku poruku (nikad prazan ekran). */
export function TvSadrzajEkrana() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { pokazi } = useToast()
  const r0 = razresi('tv', pathname)
  const { pozicija, grana, zemlja, jePretplacenKanal } = useDemo()
  const r = r0 && parametriIspravni(r0.ekran.id, r0.parametri) ? r0 : null
  // preusmeravanje se odlučuje JEDNOM, pri ulasku na adresu: kad priča promeni stanje (npr. povratak iz Srbije), ekran koji se tek napušta ne sme da pregazi novu navigaciju
  const odluka = useRef<{ putanja: string; cilj: string | null } | null>(null)
  if (!odluka.current || odluka.current.putanja !== pathname) odluka.current = { putanja: pathname, cilj: r ? preusmeri(r.ekran.id, r.parametri, zemlja, jePretplacenKanal) : null }
  const cilj = odluka.current.cilj

  useEffect(() => {
    if (cilj) navigate({ pathname: cilj, search }, { replace: true })
    else if (r) document.title = `${r.ekran.naslov} — ${NASLOV_STRANICE}`
    else {
      navigate({ pathname: sastavi('T2'), search }, { replace: true })
      pokazi('Taj ekran ne postoji. Vraćam te na početni ekran.')
    }
  }, [r, cilj, navigate, pokazi, search])

  if (!r || cilj) return null
  const Komponenta = TV_EKRANI[r.ekran.id]!
  const kljucEkrana = `${r.ekran.id}:${Object.values(r.parametri).join('/')}`
  // Početni izbor: ako je ovo ekran trenutne pozicije priče, iz matrice; inače iz registra.
  const st = stanjeZa(pozicija.korak, pozicija.p, grana)
  const izPrice = st.tv === pathname ? st.fokus : undefined
  const dinamicki = pocetniDinamicki(r.ekran.id, r.parametri)
  // Ekran priče se iznova prikazuje pri svakoj promeni pozicije koja zadaje početni izbor (Dalje, skok, radnja), čak i kad je ruta ista.
  const kljuc = izPrice ? `${kljucEkrana}|${pozicija.korak}.${pozicija.p}` : kljucEkrana
  return (
    <TvEkran key={kljuc} kljuc={kljuc} pocetni={izPrice ?? dinamicki ?? r.ekran.pocetniFokus ?? undefined}>
      <Komponenta parametri={r.parametri} />
    </TvEkran>
  )
}

const TEL_EKRANI: Record<string, ComponentType<{ parametri: Parametri }>> = {
  P1: P1Pocetna,
  P6: P6Paketi,
  P7: P7Paket,
  P11: P11Uredjaji,
  P12: P12Racuni,
  P13: P13Racun,
  P14: P14Nalog,
  P15: P15Jezik,
  P16: P16Pomoc,
  P17: P17Uslovi,
  P2: P2Prijava,
  P3: P3Narudzba,
  P4: P4Placanje,
  P5: P5Aktivno,
  P8: P8Pretplate,
  P9: P9Otkaz,
  P10: P10Otkazano,
}

/** Ekran telefona za vrednost upita `tel` (npr. /pocetna). Nepoznato ili neispravan parametar → P1. Ključ prati poziciju priče (kvačice i izbori se iznova čitaju). */
export function TelSadrzajEkrana() {
  const [sp] = useSearchParams()
  const { pozicija } = useDemo()
  const putanja = sp.get('tel') ?? sastavi('P1')
  let r = razresi('tel', putanja)
  // proizvod koji se kupuje: paket ili kanal po izboru (isto što prihvata T13); besplatni kanal i kanal u paketu se ne kupuju
  const kupovni = (id: string) => imaPaket(id) || (imaKanal(id) && kanal(id).deo === 'po-izboru')
  const proizvodIspravan = (p: Parametri) => !('proizvod' in p) || kupovni(p.proizvod)
  const idIspravan = (p: Parametri, ekranId: string) => {
    if (!('id' in p)) return true
    if (ekranId === 'P7') return imaPaket(p.id) // stranica paketa: samo paket
    if (ekranId === 'P10') return p.id.split('+').every(kupovni)
    return true
  }
  if (!r || !proizvodIspravan(r.parametri) || !idIspravan(r.parametri, r.ekran.id) || (r.ekran.id === 'P13' && !imaRacun(r.parametri.id))) r = razresi('tel', sastavi('P1'))!
  const Komponenta = TEL_EKRANI[r.ekran.id]!
  return <Komponenta key={`${r.ekran.id}:${pozicija.korak}:${pozicija.p}:${putanja}`} parametri={r.parametri} />
}

/** Uvodni ekrani i table (celom stranom, bez televizora i telefona). */
export function StranaSadrzaj() {
  const { pathname } = useLocation()
  const r = razresi('strana', pathname) ?? razresi('strana', sastavi('U1'))!
  useEffect(() => {
    document.title = `${r.ekran.naslov} — ${NASLOV_STRANICE}`
  }, [r])
  if (r.ekran.id === 'U1') return <U1Uvod />
  if (r.ekran.id === 'U2') return <U2Ulaz />
  if (r.ekran.id === 'U3') return <U3ODemou />
  if (r.ekran.id === 'V1') return <V1Tabla />
  return <M1Platforma />
}
