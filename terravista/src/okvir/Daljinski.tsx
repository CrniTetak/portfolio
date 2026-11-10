// DALJINSKI na ekranu (UX 1.3, UI 8): krst sa četiri strelice i OK, levo „Nazad“, desno „Početna“. Nema jačine, kanala ni brojeva.
// Klik MIŠEM ne uzima DOM fokus (mousedown se poništava), pa tastatura i dalje upravlja televizorom (PLAN B5.3).
// Prikaz pritiska 120 ms i kad se pritisne odgovarajući taster na tastaturi.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTvMotor } from '../tv-navigacija/fokus'
import { komandaIzTastera, type Komanda } from '../tv-navigacija/komande'
import { TRAJANJE_PRITISKA_MS } from './mere'
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, House } from './Ikone'

export function Daljinski({ kompaktan = false, uspravan = false }: { kompaktan?: boolean; uspravan?: boolean }) {
  const { komanda } = useTvMotor()
  const [pritisnuta, setPritisnuta] = useState<Komanda | null>(null)
  const tajmer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const prikazi = (k: Komanda) => {
      setPritisnuta(k)
      window.clearTimeout(tajmer.current)
      tajmer.current = window.setTimeout(() => setPritisnuta(null), TRAJANJE_PRITISKA_MS)
    }
    const naTaster = (e: KeyboardEvent) => {
      const k = komandaIzTastera(e)
      if (k) prikazi(k)
    }
    document.addEventListener('keydown', naTaster)
    return () => {
      document.removeEventListener('keydown', naTaster)
      window.clearTimeout(tajmer.current)
    }
  }, [])

  const dugme = (k: Komanda, oznaka: string, sadrzaj: ReactNode, klasa = '') => (
    <button
      type="button"
      className={`dg ${klasa} ${pritisnuta === k ? 'dg--pritisnut' : ''}`}
      aria-label={oznaka}
      data-daljinski={k}
      onClick={() => {
        setPritisnuta(k)
        window.clearTimeout(tajmer.current)
        tajmer.current = window.setTimeout(() => setPritisnuta(null), TRAJANJE_PRITISKA_MS)
        komanda(k)
      }}
    >
      {sadrzaj}
    </button>
  )

  return (
    <div className={`daljinski ${kompaktan ? 'daljinski--kompaktan' : ''} ${uspravan ? 'daljinski--uspravan' : ''}`} role="group" aria-label="Daljinski na ekranu">
      {dugme(
        'nazad',
        'Nazad',
        <>
          <ArrowLeft className="ic" aria-hidden="true" />
          <span className="dg-rec">Nazad</span>
        </>,
        'dg--tekst',
      )}
      <div className="krst">
        <span />
        {dugme('gore', 'Strelica gore', <ChevronUp className="ic" aria-hidden="true" />)}
        <span />
        {dugme('levo', 'Strelica levo', <ChevronLeft className="ic" aria-hidden="true" />)}
        {dugme('ok', 'OK', 'OK', 'dg--ok')}
        {dugme('desno', 'Strelica desno', <ChevronRight className="ic" aria-hidden="true" />)}
        <span />
        {dugme('dole', 'Strelica dole', <ChevronDown className="ic" aria-hidden="true" />)}
        <span />
      </div>
      {dugme(
        'pocetna',
        'Početna',
        <>
          <House className="ic" aria-hidden="true" />
          <span className="dg-rec">Početna</span>
        </>,
        'dg--tekst',
      )}
    </div>
  )
}

/** Mali „Nazad“ i „Početna“ za televizor preko celog ekrana na telefonu (bez daljinskog): svaki TV ekran ima put nazad dodirom. */
export function MiniDaljinski() {
  const { komanda } = useTvMotor()
  return (
    <div className="mini-daljinski" role="group" aria-label="Nazad i Početna">
      <button type="button" className="dg dg--tekst" onClick={() => komanda('nazad')}>
        <ArrowLeft className="ic" aria-hidden="true" />
        Nazad
      </button>
      <button type="button" className="dg dg--tekst" onClick={() => komanda('pocetna')}>
        <House className="ic" aria-hidden="true" />
        Početna
      </button>
    </div>
  )
}
