// Kartica oglasa (UI 5.3, UX 6): korisničko ime, slika, naziv, „Beograd · vrsta“, značke (Građanin / Firma uvek prva), dugme razmene i zvezda.
// Cela kartica vodi na O1 (razvučen link preko naslova); dugme razmene i zvezda su zasebne kontrole iznad linka.
import { ArrowRightLeft, Coins, Gift, Star } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { useEkran } from '../okvir/kontekst'
import { link } from '../pravila/rute'
import { KATEGORIJA_JABUCICA, FIRMA_PO_ID, type Oglas } from '../scenario/svet'
import { Jabucica } from './Logo'
import { SlikaOglasa } from './SlikaOglasa'
import { Znacka } from './Znacka'

const VRSTA_TEKST = { roba: 'roba', usluga: 'usluga', ideja: 'ideja' } as const

export function imeVlasnika(o: Oglas): string {
  return o.firma ? (FIRMA_PO_ID[o.vlasnik]?.naziv ?? o.vlasnik) : o.vlasnik
}

export function KarticaOglasa({ oglas, plava = false, prva = false, ka = 'O1' }: { oglas: Oglas; plava?: boolean; prva?: boolean; ka?: 'O1' | 'J2' }) {
  const { ugao } = useEkran()
  const demo = useDemo()
  const omiljeno = demo.tokovi.omiljeno.includes(oglas.id)
  const mesto = oglas.grad === 'Beograd' ? 'Beograd' : oglas.grad
  const jePoklon = oglas.nacin === 'poklon'
  const jePoeni = oglas.nacin === 'poeni' && !!oglas.poeni
  const smeRazmenu = ugao === 'ana' || ugao === 'marko'
  const sopstvena = oglas.kat === KATEGORIJA_JABUCICA
  // S2: javna aukcija je plaćena usluga vlasnika oglasa, pa nosi pravnu oznaku „Javna aukcija · plaćeno“ u prvom redu (kao „Istaknuto · plaćeno“)
  const nacin = oglas.nacin === 'poeni' && oglas.poeni ? <Znacka vrsta="poeni" vrednost={oglas.poeni} /> : jePoklon ? <Znacka vrsta="poklon" /> : null
  return (
    <article className={`ko${oglas.istaknuto ? ' ko-istaknuto' : ''}${plava ? ' ko-plava' : ''}`} data-oglas={oglas.id} data-vrsta={oglas.vrsta} aria-label={oglas.naslov}>
      <div className="ko-korisnik">
        <span>{imeVlasnika(oglas)}</span>
      </div>
      <div className="ko-slika">
        <SlikaOglasa oglas={oglas} prva={prva} />
      </div>
      {/* V1 (PRAVNO): „Građanin / Firma“ i „Istaknuto · plaćeno“ se NIKAD ne izbacuju. Oznaka načina je treća, u manjem redu.
          Značke su ispod slike (ne preko nje), pa se prelamaju bez odsecanja. */}
      <div className="ko-pojas" data-pojas>
        <div className="ko-pravne">
          <Znacka vrsta={oglas.firma ? 'firma' : 'gradjanin'} />
          {oglas.istaknuto && <Znacka vrsta="istaknuto" />}
          {oglas.aukcija && <Znacka vrsta="aukcija" />}
        </div>
        {(nacin || sopstvena) && (
          <div className="ko-nacin">
            {nacin}
            {/* S12: jabučica ima kratak vidljiv tekst (ne samo ikonu), pa se zna šta znači */}
            {sopstvena && (
              <span className="znacka znacka-poklon" data-sopstvena-proizvodnja>
                <span aria-hidden="true" className="inline-flex"><Jabucica velicina={14} /></span> Sopstvena proizvodnja
              </span>
            )}
          </div>
        )}
      </div>
      <a className="ko-naslov" href={`#${link(ka, ugao, { oglas: oglas.id })}`}>
        {oglas.naslov}
      </a>
      <div className="ko-mesto">
        {mesto} · {VRSTA_TEKST[oglas.vrsta]}
      </div>
      <div className="ko-dno">
        {smeRazmenu ? (
          <a className="ko-razmena" href={`#${link(jePoklon ? 'W5' : jePoeni ? 'W2' : 'X1', ugao, { oglas: oglas.id })}`} aria-label={jePoklon ? `Zatraži poklon: ${oglas.naslov}` : jePoeni ? `Uzmi za poene: ${oglas.naslov}` : `Ponudi razmenu za: ${oglas.naslov}`}>
            {jePoklon ? <Gift size={18} strokeWidth={1.75} aria-hidden /> : jePoeni ? <Coins size={18} strokeWidth={1.75} aria-hidden /> : <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden />}
          </a>
        ) : (
          <span />
        )}
        <button type="button" className="ko-zvezda" aria-pressed={omiljeno} aria-label={`Omiljeno: ${oglas.naslov}`} onClick={() => demo.prebaciOmiljeno(oglas.id)}>
          <Star size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </article>
  )
}
