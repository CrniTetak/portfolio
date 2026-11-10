// Z3 „Plaćanje (demo)“ i Z4 „Plaćanje potvrđeno“ (UX 6.9, UI 5.14): LAŽNI prikaz. Nema polja za karticu: „Demo kartica •••• 0000“ je tekst.
// Isti ekran služi svim svrhama (isticanje, paket aukcija, pretplata, akcija, reklama, dostava). Radnje priče postoje za dostavu (korak 7) i
// akciju (korak 9); u slobodnom režimu i za ostale svrhe plaćanje menja stanje slobodnih tokova (tokovi/operacije.ts).
// V-3: firma plaća kao poslovni korisnik — bez potrošačkog prava na odustanak i bez kvačice „Želim da usluga počne odmah“.
import { Check, CreditCard } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useJednom } from '../../demo/useJednom'
import { jeSlobodnaDostava, useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { Kvacica } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { OvoRadi } from '../../komponente/OvoRadi'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { din } from '../../scenario/format'
import { AKCIJA_REKLAMA_UKLJUCENA, POSLOVNI_USLOVI_TEKST, POTROSACKO_ODUSTANAK_TEKST } from '../../scenario/poslovno'
import { KARTICA_DEMO, KURIR, PRUZALAC_USLUGE, REF_PLACANJE, REF_POSILJKA, REF_POSILJKA_SLOBODNA } from '../../scenario/strane'
import { CENE, DANI_ISTICANJA, PAKETI_AUKCIJA, PODRAZUMEVANI_PAKET_AUKCIJA, PODRAZUMEVANO_ISTICANJE_DANA, jeRezervisan, nadjiOglas } from '../../scenario/svet'
import { ODREDISTA_REKLAME } from '../../scenario/slobodno'
import { izmeniPoslovno, istakniOglas, kupiPaket, naruciDostavu } from '../../tokovi/operacije'
import type { Tokovi } from '../../tokovi/tokovi'
import { PORUKE, PREDMET_PRICE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'
import type { EkranId, Ugao } from '../../prica/tipovi'

type Kljuc = 'dostava' | 'isticanje' | 'paket' | 'pretplata' | 'akcija' | 'reklama'
const KLJUCEVI: Kljuc[] = ['dostava', 'isticanje', 'paket', 'pretplata', 'akcija', 'reklama']
const jeKljuc = (x: string): x is Kljuc => (KLJUCEVI as string[]).includes(x)

/** Koje svrhe plaća firma kao poslovni korisnik (i kad ih otvori građanin, pretplata je poslovni nalog). */
const POSLOVNE: Kljuc[] = ['akcija', 'pretplata', 'reklama']

const KORAK_PRICE: Partial<Record<Kljuc, number>> = { dostava: 7, akcija: 9 }
const RADNJE_PRICE: Partial<Record<Kljuc, { z3: string; z4: string }>> = { dostava: { z3: '7.z3', z4: '7.z4' }, akcija: { z3: '9.z3', z4: '9.z4' } }

type Cena = { naslov: string; kupljeno: string; iznos: number; ilustrativno: boolean }

function cenaZa(svrha: Kljuc, ref: string, q: URLSearchParams): Cena {
  switch (svrha) {
    case 'dostava':
      return { naslov: 'Dostava', kupljeno: 'Dostava: kurir', iznos: q.get('velicina') === 'mala' ? CENE.dostavaMala : CENE.dostavaVelika, ilustrativno: true }
    case 'isticanje': {
      const dana = Number(q.get('dana'))
      const ok = (DANI_ISTICANJA as readonly number[]).includes(dana) ? (dana as keyof typeof CENE.isticanje) : PODRAZUMEVANO_ISTICANJE_DANA
      return { naslov: 'Isticanje oglasa', kupljeno: 'Isticanje oglasa', iznos: CENE.isticanje[ok], ilustrativno: false }
    }
    case 'paket': {
      const n = Number(ref)
      const ok = (PAKETI_AUKCIJA as readonly number[]).includes(n) ? (n as keyof typeof CENE.paketiAukcija) : PODRAZUMEVANI_PAKET_AUKCIJA
      return { naslov: 'Paket javnih aukcija', kupljeno: 'Paket javnih aukcija', iznos: CENE.paketiAukcija[ok], ilustrativno: false }
    }
    case 'pretplata':
      return { naslov: 'Poslovni nalog — pretplata', kupljeno: 'Poslovni nalog', iznos: ref === 'majstor' ? CENE.pretplataMajstor : CENE.pretplataRadnja, ilustrativno: true }
    case 'akcija':
      return { naslov: 'Akcija „staro za novo“', kupljeno: 'Akcija „staro za novo“', iznos: CENE.akcijaStaroZaNovo, ilustrativno: true }
    case 'reklama':
      return { naslov: 'Reklama „Sponzorisano“', kupljeno: 'Reklama „Sponzorisano“', iznos: CENE.reklama7Dana, ilustrativno: true }
  }
}

/** N-7: „Odustani“ vraća na ekran odakle se došlo (A5, F9, D2, Z1, Z2, F2). */
function odakle(svrha: Kljuc, ref: string): { ekran: EkranId; parametri?: Record<string, string> } {
  switch (svrha) {
    case 'dostava':
      return { ekran: 'D2' }
    case 'isticanje':
      return { ekran: 'Z1', parametri: { oglas: ref } }
    case 'paket':
      return { ekran: 'Z2' }
    case 'pretplata':
      return { ekran: 'F2' }
    case 'akcija':
      return { ekran: 'A5' }
    case 'reklama':
      return { ekran: 'F9' }
  }
}

/** Kuda vodi „Nastavi“ posle plaćanja. */
function kuda(svrha: Kljuc, ugao: Ugao, ref: string): { ekran: EkranId; parametri?: Record<string, string>; ugao?: Ugao } {
  switch (svrha) {
    case 'dostava':
      return { ekran: 'D3', parametri: { posiljka: ref } }
    case 'isticanje':
      return { ekran: 'O6' }
    case 'paket':
      return { ekran: 'J3' }
    case 'pretplata':
      return ugao === 'prodavnica' ? { ekran: 'F3' } : { ekran: 'F3', ugao: 'prodavnica' }
    case 'akcija':
      return { ekran: 'A1', parametri: { akcija: 'staro-za-novo' } }
    case 'reklama':
      return { ekran: 'F3' }
  }
}

/** Promena stanja slobodnih tokova koju svrha izaziva posle plaćanja. */
function primeniPlacanje(t: Tokovi, svrha: Kljuc, ref: string, q: URLSearchParams, ugao: Ugao): Tokovi {
  switch (svrha) {
    case 'isticanje': {
      const dana = Number(q.get('dana'))
      return istakniOglas(t, ref, (DANI_ISTICANJA as readonly number[]).includes(dana) ? (dana as 3 | 7 | 14) : PODRAZUMEVANO_ISTICANJE_DANA)
    }
    case 'paket':
      return kupiPaket(t, (PAKETI_AUKCIJA as readonly number[]).includes(Number(ref)) ? Number(ref) : PODRAZUMEVANI_PAKET_AUKCIJA)
    case 'pretplata':
      return ugao === 'prodavnica' ? izmeniPoslovno(t, { plan: ref === 'majstor' ? 'Majstor' : 'Radnja', otkazana: false }) : izmeniPoslovno(t, { nalog: true })
    case 'akcija':
      return izmeniPoslovno(t, { akcija: true })
    case 'reklama':
      return izmeniPoslovno(t, { reklama: ODREDISTA_REKLAME.some((o) => o.v === ref) ? (ref as 'profil' | 'akcija') : 'profil' })
    case 'dostava':
      return naruciDostavu(t, q.get('razmena') ?? 'primer', q.get('velicina') === 'mala' ? 'mala' : 'velika', q.get('termin') === '1' ? 1 : 0)
  }
}

export function Z3() {
  const l = useLink()
  const navigate = useNavigate()
  const demo = useDemo()
  const { parametri, ugao } = useEkran()
  const { korak, s, tokovi, slobodno, ja, promeni } = useStanjePrice()
  const q = new URLSearchParams(useLocation().search)
  const kljuc = parametri.svrha
  // V1: dostava se u Z3 odlučuje istim pravilom kao u D1/D2; V3: slobodna dostava ima svoj ključ kvačice (priča ima svoj)
  const slobodnaPl = slobodno || (kljuc === 'dostava' && jeSlobodnaDostava(demo.rezim, q.toString()))
  const kljucOdmah = jeKljuc(kljuc) ? `z3_odmah_${kljuc}${kljuc === 'dostava' && slobodnaPl ? '_slobodno' : ''}` : 'z3_odmah_x'
  const [odmah, setOdmah] = useSaglasnost(kljucOdmah)
  const jednom = useJednom()
  if (!jeKljuc(kljuc)) return <NemaStranice />
  const ref = parametri.ref
  // akcija i reklama su poslovne usluge: građanin ih ne plaća
  if ((kljuc === 'akcija' || kljuc === 'reklama') && ugao !== 'prodavnica') return <OvoRadi ko="prodavnica" naslov="Plaćanje (demo)" opis="Akciju i reklamu plaća firma sa svog poslovnog naloga." nazad={{ ekran: 'P1', naziv: 'Nazad na početnu' }} />
  const izPrice = !slobodnaPl && RADNJE_PRICE[kljuc]
  if (izPrice && korak < (KORAK_PRICE[kljuc] ?? 1)) return <JosNijePocelo naslov="Plaćanje (demo)" opis="Plaćanje se otvara kad priča stigne do ovog dela. Sve je lažni prikaz, ništa se ne naplaćuje." korak={KORAK_PRICE[kljuc] ?? 1} />
  const cena = cenaZa(kljuc, ref, q)
  const poslovno = ugao === 'prodavnica' || POSLOVNE.includes(kljuc)
  const upit = Object.fromEntries(q.entries())
  const dalje = link4(l, kljuc, ref, upit)
  const nazad = odakle(kljuc, ref)
  const oglas = kljuc === 'isticanje' ? nadjiOglas(s, ref, tokovi) : undefined
  // isticanje: samo svoj oglas koji nije na javnoj aukciji
  const losOglas = kljuc === 'isticanje' && (!oglas || oglas.vlasnik !== ja || oglas.aukcija || jeRezervisan(oglas))
  const plati = () => jednom(() => {
    demo.obavesti(PORUKE.simulacija)
    if (!izPrice) {
      promeni((t) => primeniPlacanje(t, kljuc, ref, q, ugao))
      // V3: saglasnost važi za JEDNU kupovinu — posle uspeha se briše, pa je sledeća kupovina opet neštiklirana
      setOdmah(false)
      if (kljuc === 'dostava') demo.postaviSaglasnost('d2_uslovi_slobodno', false)
      if (kljuc === 'pretplata') demo.postaviSaglasnost('f2_saglasnost', false)
    }
    navigate(dalje)
    window.scrollTo(0, 0)
  })
  const potrebnaSaglasnost = !poslovno
  const blokirano = potrebnaSaglasnost && !odmah ? 'Označi obavezna polja' : losOglas ? (oglas && jeRezervisan(oglas) ? PREDMET_PRICE : 'Izaberi svoj oglas koji nije na aukciji') : undefined
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="Z3" data-svrha={kljuc} data-poslovno={poslovno ? '1' : undefined}>
      <h1>Plaćanje (demo)</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <h2>{cena.naslov}</h2>
          {oglas && <p className="pomocni-tekst">Oglas: {oglas.naslov}</p>}
          <p className="iznos-veliki" data-iznos>
            {din(cena.iznos)} <span className="pomocni-tekst">sa PDV-om</span>
          </p>
          {cena.ilustrativno && <Znacka vrsta="ilustrativno" />}
        </div>
      </div>
      <p>
        Pružalac usluge: <b>{PRUZALAC_USLUGE}</b>
        {kljuc === 'dostava' && (
          <>
            , dostavu izvršava <b>{KURIR}</b> (izmišljen)
          </>
        )}
      </p>
      {kljuc === 'akcija' && (
        <p data-reklama-ukljucena>
          <b>{AKCIJA_REKLAMA_UKLJUCENA}</b>
        </p>
      )}
      <div className="demo-kartica" data-demo-kartica>
        <CreditCard size={22} strokeWidth={1.75} aria-hidden /> {KARTICA_DEMO}
      </div>
      {poslovno ? (
        <Obavestenje>
          <span data-poslovni-uslovi>{POSLOVNI_USLOVI_TEKST}</span>
        </Obavestenje>
      ) : (
        <>
          <Obavestenje>
            <b>Pravo na odustanak (nacrt):</b> {POTROSACKO_ODUSTANAK_TEKST}
          </Obavestenje>
          <Kvacica obavezna checked={odmah} onChange={setOdmah} dataKljuc={kljucOdmah} oznaka="Želim da usluga počne odmah" />
        </>
      )}
      <p className="pomocni-tekst">Demo — ništa se ne naplaćuje.</p>
      <div className="red-dugmad">
        {izPrice ? (
          <RadnjaDugme id={RADNJE_PRICE[kljuc]!.z3} nakon={dalje} poruka={false} blokirano={blokirano}>
            Plati {din(cena.iznos)} (demo)
          </RadnjaDugme>
        ) : (
          <>
            <button type="button" className="dugme dugme-zeleno" aria-disabled={(!!blokirano) || undefined} onClick={plati}>
              Plati {din(cena.iznos)} (demo)
            </button>
            {blokirano && <span className="razlog-neaktivno">{blokirano}</span>}
          </>
        )}
        <Veza ekran={nazad.ekran} parametri={nazad.parametri} className="dugme dugme-tekst">
          Odustani
        </Veza>
      </div>
    </section>
  )
}

/** Link ka Z4 sa istim upitom (dani, razmena, veličina…) da potvrda zna šta je plaćeno. */
function link4(l: ReturnType<typeof useLink>, kljuc: Kljuc, ref: string, upit: Record<string, string>): string {
  const osnova = l('Z4', { svrha: kljuc, ref })
  const q = new URLSearchParams(upit).toString()
  return q ? `${osnova}?${q}` : osnova
}

export function Z4() {
  const l = useLink()
  const demo = useDemo()
  const navigate = useNavigate()
  const idi = useIdi()
  const { parametri, ugao } = useEkran()
  const { uradjeno, slobodno: slobodnoRezim } = useStanjePrice()
  const q = new URLSearchParams(useLocation().search)
  const kljuc = parametri.svrha
  if (!jeKljuc(kljuc)) return <NemaStranice />
  const slobodno = slobodnoRezim || (kljuc === 'dostava' && jeSlobodnaDostava(demo.rezim, q.toString()))
  const ref = parametri.ref
  if ((kljuc === 'akcija' || kljuc === 'reklama') && ugao !== 'prodavnica') return <OvoRadi ko="prodavnica" naslov="Plaćanje potvrđeno" opis="Akciju i reklamu plaća firma sa svog poslovnog naloga." nazad={{ ekran: 'P1', naziv: 'Nazad na početnu' }} />
  const radnje = !slobodno ? RADNJE_PRICE[kljuc] : undefined
  if (radnje && !uradjeno(radnje.z3)) return <JosNijePocelo naslov="Plaćanje potvrđeno" opis="Potvrda se prikazuje kad se plaćanje završi (lažni prikaz)." korak={KORAK_PRICE[kljuc] ?? 7} />
  const cena = cenaZa(kljuc, ref, q)
  const odrediste = kuda(kljuc, ugao, ref)
  const putanja = l(odrediste.ekran, odrediste.parametri, odrediste.ugao)
  const poslovnoGradjanin = kljuc === 'pretplata' && ugao !== 'prodavnica'
  const nastavi = () => {
    if (odrediste.ugao && odrediste.ugao !== ugao) idi(odrediste.ekran, odrediste.ugao, odrediste.parametri)
    else {
      navigate(putanja)
      window.scrollTo(0, 0)
    }
  }
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="Z4" data-svrha={kljuc}>
      <div className="text-center">
        <span className="velika-kvacica" aria-hidden>
          <Check size={40} strokeWidth={2.5} />
        </span>
        <h1 className="mt-3">Plaćanje potvrđeno (demo)</h1>
      </div>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <p className="pomocni-tekst">Kupljeno</p>
          <h2>{cena.kupljeno}</h2>
          <p className="num">{din(cena.iznos)} sa PDV-om</p>
          {cena.ilustrativno && <Znacka vrsta="ilustrativno" />}
        </div>
      </div>
      <p className="pomocni-tekst" data-referenca>
        Referenca plaćanja: <b>{REF_PLACANJE}</b>
        {kljuc === 'dostava' && (
          <>
            {' '}
            · Pošiljka: <b>{ref === REF_POSILJKA ? REF_POSILJKA : REF_POSILJKA_SLOBODNA}</b>
          </>
        )}
      </p>
      {poslovnoGradjanin && <Obavestenje stanje="uspeh">Poslovni nalog je otvoren (demo). Tablu firme vidiš kad gledaš kao Prodavnica.</Obavestenje>}
      <p className="pomocni-tekst">Demo — ništa nije naplaćeno.</p>
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-linija" onClick={() => demo.obavesti(PORUKE.simulacija)}>
          Račun (demo)
        </button>
        {radnje ? (
          <RadnjaDugme id={radnje.z4} nakon={putanja} poruka={false} pregled={putanja}>
            Nastavi
          </RadnjaDugme>
        ) : (
          <button type="button" className="dugme dugme-zeleno" onClick={nastavi}>
            {poslovnoGradjanin ? 'Gledaj kao Prodavnica' : 'Nastavi'}
          </button>
        )}
      </div>
    </section>
  )
}
