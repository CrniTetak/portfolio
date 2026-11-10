// D1 „Dostava — poručivanje“, D2 „Dostava — pregled i naknada“, D3 „Praćenje pošiljke“ (UX 6.11). Korak 7: Ana plaća dostavu bicikla.
// Kurir preuzima i isporučuje stvar, ne prenosi novac. Naknada je ilustrativna („nije cenovnik“); plaćanje je lažno (Z3, Z4).
import { Truck } from 'lucide-react'
import { BICIKL_ID } from '../../scenario/svet'
import { useState } from 'react'
import { jeSlobodnaDostava, useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Kvacica, Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { OvoRadi } from '../../komponente/OvoRadi'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { demoDatum, danUNedelji } from '../../scenario/datumi'
import { datum, din, kg } from '../../scenario/format'
import { MALA_POSILJKA_KG } from '../../scenario/prica'
import { KURIR, REF_POSILJKA } from '../../scenario/strane'
import { ANA_ID, CENE, MARKO_ID, oglasPoId } from '../../scenario/svet'
import { REF_POSILJKA_SLOBODNA } from '../../scenario/strane'
import { useDemo } from '../../demo/DemoProvider'
import { useLocation } from 'react-router'
import { D1Slobodno, D2Slobodno, D3Slobodno } from './SlobodnaDostava'

const BICIKL = BICIKL_ID
const TERMINI = ['Prepodne', 'Popodne'] as const

/** S8: dostavu bicikla poručuje Ana; ostali uglovi vide poruku sa „Gledaj kao Ana“ umesto praznog ekrana. */
const JeAna = ({ naslov }: { naslov: string }) => <OvoRadi ko="ana" naslov={naslov} opis="Dostavu bicikla poručuje i plaća Ana." nazad={{ ekran: 'X8', naziv: 'Nazad na dogovor' }} />

function D1Prica() {
  const l = useLink()
  const { ugao } = useEkran()
  const { korak } = useStanjePrice()
  // S11: bicikl je velika pošiljka — veličina je zaključana na „Velika“ (naknada za veliku)
  const velicina = 'velika' as const
  const [termin, setTermin] = useState<string>(TERMINI[0])
  if (ugao !== 'ana') return <JeAna naslov="Dostava — poručivanje" />
  if (korak < 7) return <JosNijePocelo naslov="Dostava — poručivanje" opis="Kad se dogovorite u razgovoru, Ana poručuje kurira za bicikl." korak={7} />
  const oglas = oglasPoId(BICIKL)!
  const dan = demoDatum(7, true)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D1">
      <h1>Dostava — poručivanje</h1>
      <Obavestenje>Kurir preuzima i isporučuje stvar; ne prenosi novac.</Obavestenje>
      <div className="grupa-polja">
        <span className="polje-oznaka">Razmena</span>
        <div className="stavka">
          <MalaStvar stvar={{ naslov: oglas.naslov, vrsta: oglas.vrsta, oglas: oglas.id }} />
          <span className="pomocni-tekst">{MARKO_ID} → {ANA_ID}</span>
        </div>
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Veličina pošiljke</span>
        <Pilule
          oznaka="Veličina pošiljke"
          vrednost={velicina}
          onChange={() => undefined}
          onemoguceno={['mala']}
          opcije={[
            { v: 'mala', naziv: `Mala (do ${kg(MALA_POSILJKA_KG)})` },
            { v: 'velika', naziv: 'Velika' },
          ]}
        />
        <p className="pomocni-tekst">
          Bicikl je velika pošiljka, pa je veličina zaključana. Naknada: <b className="num">{din(CENE.dostavaVelika)}</b> sa PDV-om <Znacka vrsta="ilustrativno" />
        </p>
      </div>
      <p className="pomocni-tekst">Preuzimanje i isporuka: adresu vidi samo kurir.</p>
      <Padajuce
        oznaka="Termin"
        vrednost={termin}
        onChange={setTermin}
        opcije={[...TERMINI]}
      />
      <p className="pomocni-tekst">
        Dan: {danUNedelji(dan)}, {datum(dan)}
      </p>
      <p>
        <Truck size={16} strokeWidth={1.75} aria-hidden className="mr-1 inline" />
        Kurir: <b>{KURIR}</b> (izmišljeno)
      </p>
      <div className="red-dugmad">
        <RadnjaDugme id="7.d1" nakon={l('D2')} poruka={false} pregled={l('D2')}>
          Nastavi
        </RadnjaDugme>
      </div>
    </section>
  )
}

function D2Prica() {
  const l = useLink()
  const { ugao } = useEkran()
  const { korak } = useStanjePrice()
  const [uslovi, setUslovi] = useSaglasnost('d2_uslovi')
  if (ugao !== 'ana') return <JeAna naslov="Dostava — pregled i naknada" />
  if (korak < 7) return <JosNijePocelo naslov="Dostava — pregled i naknada" opis="Pregled i naknada za kurira prikazuju se posle poručivanja." korak={7} />
  const oglas = oglasPoId(BICIKL)!
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D2">
      <h1>Dostava — pregled i naknada</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <MalaStvar stvar={{ naslov: oglas.naslov, vrsta: oglas.vrsta, oglas: oglas.id }} />
          <p className="pomocni-tekst">
            Kurir: {KURIR} (izmišljeno) · velika pošiljka · {danUNedelji(demoDatum(7, true))}, {datum(demoDatum(7, true))}
          </p>
        </div>
      </div>
      <p>
        Naknada: <b className="num iznos-veliki">{din(CENE.dostavaVelika)}</b> sa PDV-om
      </p>
      <Znacka vrsta="ilustrativno" />
      <p className="pomocni-tekst" data-ko-prima-naknadu>
        Naknadu prima platforma za uslugu kurirske službe; ne ide drugom korisniku.
      </p>
      <Kvacica obavezna checked={uslovi} onChange={setUslovi} dataKljuc="d2_uslovi" oznaka="Prihvatam uslove dostave" />
      <div className="red-dugmad">
        <RadnjaDugme id="7.d2" nakon={l('Z3', { svrha: 'dostava', ref: REF_POSILJKA })} poruka={false} blokirano={uslovi ? undefined : 'Označi obavezna polja'}>
          Plati dostavu
        </RadnjaDugme>
        <Veza ekran="D1" className="dugme dugme-tekst">
          Nazad
        </Veza>
      </div>
      <p className="pomocni-tekst">Demo — ništa se ne naplaćuje.</p>
    </section>
  )
}

const FAZE_POSILJKE = ['Naručeno', 'Preuzeto', 'U vožnji', 'Isporučeno']

function D3Prica() {
  const { ugao } = useEkran()
  const { uradjeno, korak } = useStanjePrice()
  if (ugao !== 'ana' && ugao !== 'marko') return <JeAna naslov="Praćenje pošiljke" />
  if (!uradjeno('7.z4')) return <JosNijePocelo naslov="Praćenje pošiljke" opis="Posle plaćanja dostave ovde se prati pošiljka bicikla." korak={7} />
  // u koraku 7 pošiljka je naručena; u koraku 8 stiže i potvrđuje se prijem
  const tekuca = korak >= 8 ? 3 : 0
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D3">
      <h1>Praćenje pošiljke</h1>
      <p>
        Pošiljka <b>{REF_POSILJKA}</b> · {KURIR} (izmišljeno)
      </p>
      <ol className="posiljka" aria-label="Faze pošiljke" data-posiljka>
        {FAZE_POSILJKE.map((f, i) => (
          <li key={f} data-stanje={i < tekuca ? 'gotovo' : i === tekuca ? 'tekuce' : 'buduce'} aria-current={i === tekuca ? 'step' : undefined}>
            {f}
            <span className="sr-only">{i < tekuca ? ' — urađeno' : i === tekuca ? ' — trenutno' : ' — još nije'}</span>
          </li>
        ))}
      </ol>
      <div className="red-dugmad">
        <Veza ekran="X9" parametri={{ razmena: 'lanac' }} className="dugme dugme-zeleno">
          Potvrdi prijem
        </Veza>
        <Veza ekran="S5" className="dugme dugme-linija">
          Prijavi problem
        </Veza>
      </div>
    </section>
  )
}

// Dostava bicikla iz priče (korak 7) je vezana za radnje priče. Slobodni tok: režim „Slobodno klikanje“, ili dostava za razmenu iz linka (?razmena=…).
function useSlobodnaDostava(): boolean {
  const demo = useDemo()
  const { search } = useLocation()
  return jeSlobodnaDostava(demo.rezim, search)
}

export function D1() {
  return useSlobodnaDostava() ? <D1Slobodno /> : <D1Prica />
}
export function D2() {
  return useSlobodnaDostava() ? <D2Slobodno /> : <D2Prica />
}
export function D3() {
  const { parametri } = useEkran()
  return parametri.posiljka === REF_POSILJKA_SLOBODNA ? <D3Slobodno /> : <D3Prica />
}
