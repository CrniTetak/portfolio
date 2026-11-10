// P8 „Priča zajednice“ i P9 „Objavi u pričama“ (UX 6.3). Priče su obaveštenja zajednice, ne prodaja za novac. P8: ceo ekran, slika, kratak tekst,
// autor, Dalje / Nazad između priča, zatvaranje. P9: unapred napisana priča; obavezna kvačica „Ne reklamiram i ne tražim novac“ nije unapred štiklirana.
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { useJednom } from '../../demo/useJednom'
import { Ilustracija } from '../../komponente/Ilustracija'
import { Kvacica } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Veza, useLink } from '../../komponente/Veza'
import { useEkran } from '../../okvir/kontekst'
import { KUCA } from '../../pravila/rute'
import { PRICA_NAPOMENA, PRICA_NOVA_TEKST, PRICA_SATI } from '../../scenario/slobodno'
import { objaviPricu } from '../../tokovi/operacije'
import { broj } from '../../scenario/format'
import { PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'
import { storije } from './storije'

export function P8() {
  const { parametri, ugao } = useEkran()
  const { tokovi } = useStanjePrice()
  const navigate = useNavigate()
  const l = useLink()
  const sve = storije(tokovi)
  const i = sve.findIndex((p) => p.id === parametri.prica)
  if (i < 0) return <NemaStranice />
  const p = sve[i]
  const ide = (j: number) => {
    navigate(l('P8', { prica: sve[j].id }))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica ekran-uzak stog prica-ekran" data-ekran-sadrzaj="P8" data-prica={p.id}>
      <div className="naslov-reda">
        <p className="pomocni-tekst" data-brojac-prica>
          Priča {broj(i + 1)} od {broj(sve.length)}
        </p>
        <Veza ekran={KUCA[ugao]} className="ikona-dugme" ariaLabel="Zatvori priču">
          <X size={22} strokeWidth={1.75} aria-hidden />
        </Veza>
      </div>
      <div className="prica-slika" aria-hidden>
        <Ilustracija ikonica={p.ikonica} velicina={96} />
      </div>
      <h1>{p.naslov}</h1>
      <p data-prica-tekst>{p.tekst}</p>
      <p className="pomocni-tekst" data-prica-autor>
        Autor: <b>{p.autor}</b>
      </p>
      <Obavestenje>{PRICA_NAPOMENA}</Obavestenje>
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-linija" disabled={i === 0} onClick={() => ide(i - 1)}>
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Nazad
        </button>
        <button type="button" className="dugme dugme-linija" disabled={i === sve.length - 1} onClick={() => ide(i + 1)}>
          Dalje <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
        </button>
        <Veza ekran={KUCA[ugao]} className="dugme dugme-zeleno">
          Zatvori
        </Veza>
      </div>
    </section>
  )
}

export function P9() {
  const navigate = useNavigate()
  const demo = useDemo()
  const { ugao } = useEkran()
  const { ja, promeni, tokovi } = useStanjePrice()
  const [ne, setNe] = useSaglasnost('p9_ne_reklamiram')
  const jednom = useJednom()
  const l = useLink()
  const puno = tokovi.price.length >= 3
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="P9">
      <h1>Objavi u pričama</h1>
      <div className="grupa-polja">
        <span className="polje-oznaka">Slika</span>
        <div className="prica-slika" aria-hidden>
          <Ilustracija ikonica="apple" velicina={72} />
        </div>
        <span className="pomocni-tekst">Slika je izabrana za demo.</span>
      </div>
      <PrikaznoPolje oznaka="Tekst priče" vrednost={PRICA_NOVA_TEKST} napomena />
      <p className="pomocni-tekst" data-trajanje>
        Priča traje {broj(PRICA_SATI)} sata.
      </p>
      <Kvacica obavezna checked={ne} onChange={setNe} dataKljuc="p9_ne_reklamiram" oznaka="Ne reklamiram i ne tražim novac" />
      {puno && <Obavestenje stanje="upozorenje" id="p9-razlog-puno">U demou možeš da objaviš nekoliko priča. „Restart demo“ vraća sve na početak.</Obavestenje>}
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          aria-disabled={!ne || puno || !ja || undefined}
          aria-describedby={!ja ? 'p9-razlog-ja' : puno ? 'p9-razlog-puno' : !ne ? 'p9-razlog-kvacica' : undefined}
          onClick={() =>
            jednom(() => {
              if (ja) promeni((t) => objaviPricu(t, ja, PRICA_NOVA_TEKST))
              setNe(false) // V3: saglasnost važi za jednu objavu
              demo.obavesti(PORUKE.simulacija)
              navigate(l('P1'))
              window.scrollTo(0, 0)
            })
          }
        >
          Objavi
        </button>
        {!ja ? (
          <span id="p9-razlog-ja" className="razlog-neaktivno">
            Priče objavljuju građani i firme (Gledaj kao Ana).
          </span>
        ) : (
          !ne && (
            <span id="p9-razlog-kvacica" className="razlog-neaktivno">
              Označi obavezna polja
            </span>
          )
        )}
        <Veza ekran={KUCA[ugao]} className="dugme dugme-tekst">
          Odustani
        </Veza>
      </div>
    </section>
  )
}
