// „IZGUBIO SI SE?“ (UX 3.5, UI 8): samo u slobodnom režimu, posle ~45 s bez ijedne radnje (tastatura, klik, dodir), JEDNOM po ekranu,
// lako se zatvara; nudi „Nazad na priču“. Vreme je u podaci/podesavanja.ts (e2e ga skraćuje promenljivom postavljenom pre učitavanja).
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { vremePodsetnika } from '../podaci/svet'
import { X } from './Ikone'
import { useDemo } from './stanje'

export function IzgubioSe() {
  const d = useDemo()
  const lokacija = useLocation()
  const [vidi, setVidi] = useState(false)
  const prikazano = useRef(new Set<string>())
  // ekran = televizor + (neosnovni) telefon, bez upita uređaja
  const ekran = `${lokacija.pathname}|${d.telPutanja}`
  const slobodno = d.rezim === 'slobodno'

  useEffect(() => {
    setVidi(false)
    if (!slobodno || prikazano.current.has(ekran)) return
    let tajmer = 0
    const naMiru = () => {
      window.clearTimeout(tajmer)
      if (prikazano.current.has(ekran)) return // već je prikazano na ovom ekranu: ne ponavlja se
      tajmer = window.setTimeout(() => {
        prikazano.current.add(ekran) // jednom po ekranu
        setVidi(true)
      }, vremePodsetnika())
    }
    const naRadnju = (e: Event) => {
      // radnja na ekranu zatvara podsetnik (osim klika na njegova sopstvena dugmad)
      if ((e.target as Element | null)?.closest?.('[data-izgubio-se]')) return
      setVidi(false)
      naMiru()
    }
    const dogadjaji = ['keydown', 'mousedown', 'touchstart', 'click'] as const
    for (const e of dogadjaji) document.addEventListener(e, naRadnju, { passive: true })
    naMiru()
    return () => {
      window.clearTimeout(tajmer)
      for (const e of dogadjaji) document.removeEventListener(e, naRadnju)
    }
  }, [ekran, slobodno])

  if (!vidi || !slobodno) return null
  return (
    <div className="izgubio-se" role="status" data-izgubio-se>
      <span>Izgubio si se? Vrati se u priču</span>
      <button
        type="button"
        onClick={() => {
          setVidi(false)
          d.postaviRezim('vodjena')
          d.nazadNaPricu()
        }}
      >
        Nazad na priču
      </button>
      <button type="button" className="izgubio-x" aria-label="Zatvori" onClick={() => setVidi(false)}>
        <X className="ic" aria-hidden="true" />
      </button>
    </div>
  )
}
