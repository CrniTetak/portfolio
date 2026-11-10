// DIJALOG „Vratiti demo na korak 1?“ (UX 3.4): Da / Odustani iste veličine; podrazumevano je „Odustani“; Esc i Backspace zatvaraju; fokus ostaje u dijalogu.
import { useEffect, useRef } from 'react'
import { useDemo } from './stanje'

export function DijalogRestarta() {
  const { restartDijalog, zatvoriRestart, potvrdiRestart } = useDemo()
  const ne = useRef<HTMLButtonElement>(null)
  const da = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!restartDijalog) return
    const otvorio = document.activeElement as HTMLElement | null // dugme koje je otvorilo dijalog
    ne.current?.focus() // podrazumevani izbor je „Odustani“
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        e.stopPropagation()
        zatvoriRestart()
      } else if (e.key === 'Tab') {
        // fokus ostaje u dijalogu
        e.preventDefault()
        ;(document.activeElement === da.current ? ne.current : da.current)?.focus()
      }
    }
    const naFokus = (e: FocusEvent) => {
      const t = e.target as Element | null
      if (!t?.closest?.('.dijalog')) ne.current?.focus()
    }
    // klik u prazno (van dugmadi) ne sme da odnese fokus iz dijaloga
    const naMis = () => window.setTimeout(() => !document.activeElement?.closest('.dijalog') && ne.current?.focus(), 0)
    document.addEventListener('keydown', naTaster, true)
    document.addEventListener('focusin', naFokus)
    document.addEventListener('mouseup', naMis)
    return () => {
      document.removeEventListener('keydown', naTaster, true)
      document.removeEventListener('focusin', naFokus)
      document.removeEventListener('mouseup', naMis)
      otvorio?.focus?.() // po zatvaranju fokus se vraća tamo odakle je dijalog otvoren
    }
  }, [restartDijalog, zatvoriRestart])

  if (!restartDijalog) return null
  return (
    <div className="dijalog-pozadina" onMouseDown={(e) => e.target === e.currentTarget && zatvoriRestart()}>
      <div className="dijalog" role="dialog" aria-modal="true" aria-labelledby="dijalog-naslov" aria-describedby="dijalog-opis">
        <h2 id="dijalog-naslov">Vratiti demo na korak 1?</h2>
        <div id="dijalog-opis">Briše se sve što si probao u slobodnom klikanju.</div>
        <div className="dijalog-dugmad">
          <button ref={da} type="button" className="dijalog-da" onClick={potvrdiRestart}>
            Da
          </button>
          <button ref={ne} type="button" className="dijalog-ne" onClick={zatvoriRestart}>
            Odustani
          </button>
        </div>
      </div>
    </div>
  )
}
