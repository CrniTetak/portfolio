// TRAKA PRIČE (UX 3.3, UI 8): jedini fiksni sloj dole.
//  - široko: dva reda (korak + kartica + „Pokaži mi“; Nazad, Dalje, devet tačaka, „Gledaj kao“, režim, „?“, Restart);
//  - usko: samo pločica koraka + glavna akcija; ostalo je u meniju „≡“ (pravilo: dole najviše JEDAN fiksni sloj).
// Dugmad trake ne uzimaju DOM fokus mišem (mousedown se poništava), da tastatura ostane na televizoru (PLAN B5.3).
import { useState } from 'react'
import { zemlja } from '../podaci/svet'
import { sastavi } from '../pravila/ekrani'
import { KORACI, BROJ_KORAKA, karticaTekst, korak, type Ugao } from '../prica/koraci'
import { UPIT_SIROKO } from './mere'
import { useMedia } from './useMedia'
import { IzgubioSe } from './IzgubioSe'
import { PrekidacUredjaja } from './PrekidacUredjaja'
import { useDemo } from './stanje'
import { useToast } from './Toast'
import { ArrowLeft, ChevronLeft, ChevronRight, CircleHelp, Menu, RotateCcw } from './Ikone'

const UGLOVI: { id: Ugao; naziv: string }[] = [
  { id: 'gledalac', naziv: 'Gledalac' },
  { id: 'kanal', naziv: 'Vlasnica kanala' },
  { id: 'platforma', naziv: 'Platforma' },
]

function SegmentUgla() {
  const { ugao, postaviUgao } = useDemo()
  return (
    <span className="segment" role="group" aria-label="Gledaj kao">
      {UGLOVI.map((u) => (
        <button key={u.id} type="button" aria-pressed={ugao === u.id} onClick={() => postaviUgao(u.id)}>
          {u.naziv}
        </button>
      ))}
    </span>
  )
}

function SegmentRezima() {
  const { rezim, postaviRezim } = useDemo()
  return (
    <span className="segment" role="group" aria-label="Režim">
      <button type="button" aria-pressed={rezim === 'vodjena'} onClick={() => postaviRezim('vodjena')}>
        Vođena
      </button>
      <button type="button" aria-pressed={rezim === 'slobodno'} onClick={() => postaviRezim('slobodno')}>
        Slobodno
      </button>
    </span>
  )
}

function SegmentGrane() {
  const d = useDemo()
  if (d.korak !== 6) return null
  return (
    <span className="segment" role="group" aria-label="Račva: Grčka ili Srbija">
      {(['grcka', 'srbija'] as const).map((g) => (
        <button key={g} type="button" aria-pressed={d.grana === g} onClick={() => d.postaviGranu(g)}>
          {zemlja(g === 'grcka' ? 'GR' : 'RS').naziv}
        </button>
      ))}
    </span>
  )
}

export function TrakaPrice() {
  const siroko = useMedia(UPIT_SIROKO)
  return siroko ? <TrakaSiroka /> : <TrakaUska />
}

function Napustio() {
  const d = useDemo()
  if (!d.napustio) return null
  return (
    <div className="traka-napustio" role="status">
      <span>Napustio si ekran priče</span>
      <button type="button" className="dugme-trake" onClick={d.nazadNaPricu}>
        Nazad na priču
      </button>
    </div>
  )
}

/** Dugme iz poruke (npr. „Idi na korak 4“) u traci priče dok poruka traje; dostupno klikom i Tab-om. */
function PorukaDugme() {
  const { akcija, sakrij, pauziraj } = useToast()
  if (!akcija) return null
  return (
    <button
      type="button"
      className="dugme-trake dugme-trake--glavno traka-poruka-dugme"
      onFocus={() => pauziraj(true)}
      onBlur={() => pauziraj(false)}
      onMouseEnter={() => pauziraj(true)}
      onMouseLeave={() => pauziraj(false)}
      onClick={() => {
        sakrij()
        akcija.onClick()
      }}
    >
      {akcija.tekst}
    </button>
  )
}

function TrakaSiroka() {
  const d = useDemo()
  const k = korak(d.korak)
  return (
    <footer className={`traka traka--siroka ${d.rezim === 'slobodno' ? 'traka--slobodno' : ''}`} aria-label="Traka priče" data-traka>
      <IzgubioSe />
      <Napustio />
      <PorukaDugme />
      <div className="traka-red traka-red--kartica">
        <span className="traka-korak" aria-live="polite">
          Korak {d.korak} od {BROJ_KORAKA} · {k.naslov}
        </span>
        <span className="traka-kartica">{karticaTekst(d.korak)}</span>
        <SegmentGrane />
        <button type="button" className="dugme-trake dugme-trake--glavno" onClick={d.pokaziMi}>
          Pokaži mi
        </button>
      </div>
      <div className="traka-red">
        <button type="button" className="dugme-trake" onClick={d.nazad} disabled={d.korak === 1}>
          <ChevronLeft className="ic" aria-hidden="true" />
          Nazad
        </button>
        <button type="button" className="dugme-trake dugme-trake--glavno" onClick={d.dalje} disabled={d.korak === BROJ_KORAKA}>
          {d.korak === BROJ_KORAKA ? 'Kraj priče' : 'Dalje'}
          <ChevronRight className="ic" aria-hidden="true" />
        </button>
        <div className="tacke" role="group" aria-label="Koraci priče">
          {KORACI.map((x) => (
            <button
              key={x.broj}
              type="button"
              className={`tacka ${x.broj === d.korak ? 'tacka--trenutna' : x.broj < d.korak ? 'tacka--prosla' : ''}`}
              aria-label={`Korak ${x.broj}: ${x.naslov}${x.broj === d.korak ? ', trenutni' : ''}`}
              aria-current={x.broj === d.korak ? 'step' : undefined}
             
              onClick={() => d.idiNaKorak(x.broj)}
            >
              {x.broj}
            </button>
          ))}
        </div>
        <span className="razmak" />
        <span className="oznaka-traka">Gledaj kao:</span>
        <SegmentUgla />
        <SegmentRezima />
        <button type="button" className="dugme-trake" aria-label="Uputstvo: kako se upravlja" onClick={d.otvoriPomoc}>
          <CircleHelp className="ic" aria-hidden="true" />
        </button>
        <button type="button" className="dugme-trake" onClick={d.otvoriRestart}>
          <RotateCcw className="ic" aria-hidden="true" />
          Restart demo
        </button>
      </div>
    </footer>
  )
}

function TrakaUska() {
  const d = useDemo()
  const k = korak(d.korak)
  const [ceo, setCeo] = useState(false)
  const telefon = (putanja: string) => d.otvoriNaTelefonu(putanja, true)
  return (
    <footer className="traka traka--usko" aria-label="Traka priče" data-traka>
      <IzgubioSe />
      <PorukaDugme />
      {d.menuTelefona && (
        <div className="meni-telefona" role="group" aria-label="Meni demoa">
          <PrekidacUredjaja />
          <span className="oznaka-traka">Gledaj kao:</span>
          <SegmentUgla />
          <SegmentRezima />
          <SegmentGrane />
          <span className="oznaka-traka">Telefon:</span>
          <span className="segment">
            <button type="button" onClick={() => telefon(sastavi('P8'))}>
              Pretplate
            </button>
            <button type="button" onClick={() => telefon(sastavi('P6'))}>
              Paketi
            </button>
            <button type="button" onClick={() => telefon(sastavi('P14'))}>
              Nalog
            </button>
          </span>
          <button type="button" className="dugme-trake" onClick={d.otvoriPomoc}>
            <CircleHelp className="ic" aria-hidden="true" />
            Kako se upravlja
          </button>
          <button type="button" className="dugme-trake" onClick={d.otvoriRestart}>
            <RotateCcw className="ic" aria-hidden="true" />
            Restart demo
          </button>
          <button type="button" className="dugme-trake" onClick={d.pokaziMi}>
            Pokaži mi
          </button>
        </div>
      )}
      {d.rezim === 'vodjena' && (
        // kartica priče kao jedan red teksta; dodir otvara ceo tekst
        <button type="button" className={`traka-kartica-red ${ceo ? 'traka-kartica-red--ceo' : ''}`} aria-expanded={ceo} onClick={() => setCeo(!ceo)}>
          {karticaTekst(d.korak)}
        </button>
      )}
      <div className="traka-red">
        <button type="button" className="dugme-trake" aria-label="Nazad" onClick={d.nazad} disabled={d.korak === 1}>
          <ArrowLeft className="ic" aria-hidden="true" />
        </button>
        <span className="plocica-koraka" aria-live="polite">
          {d.napustio ? 'Napustio si ekran priče' : `Korak ${d.korak} od ${BROJ_KORAKA}`}
          <small>{d.napustio ? `Korak ${d.korak}: ${k.naslov}` : k.naslov}</small>
        </span>
        <SegmentGrane />
        {d.napustio ? (
          <button type="button" className="dugme-trake dugme-trake--glavno" onClick={d.nazadNaPricu}>
            Nazad na priču
          </button>
        ) : (
          <button type="button" className="dugme-trake dugme-trake--glavno" onClick={d.dalje} disabled={d.korak === BROJ_KORAKA}>
            {d.korak === BROJ_KORAKA ? 'Kraj' : 'Dalje'}
          </button>
        )}
        <button type="button" className="dugme-trake" aria-label="Meni demoa" aria-expanded={d.menuTelefona} onClick={() => d.prebaciMeni(!d.menuTelefona)}>
          <Menu className="ic" aria-hidden="true" />
        </button>
      </div>
    </footer>
  )
}
