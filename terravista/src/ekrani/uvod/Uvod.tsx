// U1 Šta je ovo, U2 Uđi u demo (talas 1). Obični ekrani celom stranom (bez televizora); linkovi počinju sa #.
import { useState } from 'react'
import { ZnakTerraVista } from '../../komponente/tv/ZnakTerraVista'
import { JEZIK_PORUKA } from '../../podaci/stalni-tekstovi'
import { lik } from '../../podaci/svet'
import { useDemo, type Rezim } from '../../okvir/stanje'
import { BROJ_KORAKA, type Ugao } from '../../prica/koraci'
import { sastavi } from '../../pravila/ekrani'

function Jezik() {
  const [poruka, setPoruka] = useState('')
  const jezici = ['Srpski', 'Nemački', 'Engleski']
  return (
    <div className="uvod-jezik">
      <div className="segment" role="group" aria-label="Jezik">
        {jezici.map((j, i) => (
          <button key={j} type="button" aria-pressed={i === 0} onClick={() => setPoruka(i === 0 ? '' : JEZIK_PORUKA)}>
            {j}
          </button>
        ))}
      </div>
      <p className="meta" role="status">
        {poruka}
      </p>
    </div>
  )
}

export function U1Uvod() {
  return (
    <div className="strana strana--uvod" data-ekran="U1">
      <div className="strana-sadrzaj">
        <ZnakTerraVista klasa="strana-znak" />
        <h1>TerraVista — televizija bez ugovora</h1>
        <p>Besplatni kanali, kanali koje sam biraš i paketi za dijasporu, uz otkaz bilo kad.</p>
        <ol className="uvod-koraci">
          <li>Gledaj besplatno</li>
          <li>Izaberi šta plaćaš</li>
          <li>Otkaži kad hoćeš</li>
        </ol>
        <div className="uvod-blok">
          <strong>Šta je ovo?</strong>
          <p>Ovo je klikabilni demo. Svi podaci su izmišljeni, ništa se ne čuva, ne šalje i ne naplaćuje.</p>
        </div>
        <div className="uvod-blok">
          <strong>Od čega platforma živi</strong>
          <p>Od reklama na besplatnim kanalima, kanala po izboru i paketa za dijasporu.</p>
        </div>
        <a className="strana-veza" href={`#${sastavi('U2')}`}>
          Pogledaj demo
        </a>
        <a className="uvod-manja" href={`#${sastavi('U3')}`}>
          Šta demo jeste, a šta nije
        </a>
        <Jezik />
      </div>
    </div>
  )
}

export function U2Ulaz() {
  const d = useDemo()
  const [rezim, setRezim] = useState<Rezim>('vodjena')
  const [ugao, setUgao] = useState<Ugao>('gledalac')
  const rezimi: { id: Rezim; naziv: string; opis: string }[] = [
    { id: 'vodjena', naziv: 'Vođena priča (preporučeno)', opis: `Jedna porodica, ${BROJ_KORAKA} koraka, 5 minuta` },
    { id: 'slobodno', naziv: 'Slobodno klikanje', opis: 'Sam biraš put' },
  ]
  const uglovi: { id: Ugao; naziv: string; opis: string }[] = [
    { id: 'gledalac', naziv: 'Gledalac', opis: `Porodica ${lik('ana').prezime} gleda televiziju` },
    { id: 'kanal', naziv: 'Vlasnica kanala', opis: lik('vesna').ime },
    { id: 'platforma', naziv: 'Platforma', opis: 'Tim platforme' },
  ]
  return (
    <div className="strana strana--uvod" data-ekran="U2">
      <div className="strana-sadrzaj">
        <h1>Uđi u demo</h1>
        <div className="uvod-izbor" role="group" aria-label="Režim">
          {rezimi.map((r) => (
            <button key={r.id} type="button" className="uvod-kartica" aria-pressed={rezim === r.id} onClick={() => setRezim(r.id)}>
              <strong>{r.naziv}</strong>
              <span>{r.opis}</span>
            </button>
          ))}
        </div>
        <div className="uvod-izbor" role="group" aria-label="Ugao">
          {uglovi.map((u) => (
            <button key={u.id} type="button" className="uvod-kartica" aria-pressed={ugao === u.id} onClick={() => setUgao(u.id)}>
              <strong>{u.naziv}</strong>
              <span>{u.opis}</span>
            </button>
          ))}
        </div>
        <button type="button" className="strana-veza" onClick={() => d.uđiUDemo(rezim, ugao)}>
          Uđi u demo
        </button>
        <p className="meta">Bez lozinke. Svi podaci su izmišljeni. Ništa se ne čuva.</p>
        <Jezik />
        <p className="meta">Najbolje na laptopu; na telefonu okreni telefon vodoravno za televizor.</p>
      </div>
    </div>
  )
}
