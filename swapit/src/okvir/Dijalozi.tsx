// Dijalozi (UI 5.15): „Vratiti demo na korak 1?“ (Da / Odustani) i meni ≡ na telefonu. Esc zatvara, fokus ostaje unutra.
import { useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { link } from '../pravila/rute'
import { POCETNA_POZICIJA } from '../prica/reducer'
import { useEkran } from './kontekst'
import { useFocusTrap } from './useFocusTrap'
import { MeniTelefon } from './MeniTelefon'

export function Dijalog({ naslov, onZatvori, children }: { naslov: string; onZatvori: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // fokus, Esc, Tab u krug, inertna pozadina i povratak fokusa: jedna implementacija (kao panel priče)
  useFocusTrap(ref, true, onZatvori)
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" data-dijalog>
      <button type="button" tabIndex={-1} aria-hidden="true" className="skrim absolute inset-0" onClick={onZatvori} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={naslov} className="dijalog-kartica">
        <h2 className="mb-3">{naslov}</h2>
        {children}
      </div>
    </div>
  )
}

export function Dijalozi() {
  const demo = useDemo()
  const { ugao } = useEkran()
  const navigate = useNavigate()

  if (demo.meniOtvoren) return <MeniTelefon />

  if (demo.dijalogRestart)
    return (
      <Dijalog naslov="Vratiti demo na korak 1?" onZatvori={() => demo.otvoriRestart(false)}>
        <p className="mb-4">Tvoje mesto u priči i sve što si probao slobodno biće obrisano. Ugao, režim i tema ostaju.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="dugme dugme-zeleno"
            onClick={() => {
              demo.otvoriRestart(false)
              demo.restart()
              navigate(link(demo.ekranZaPoz(POCETNA_POZICIJA, ugao), ugao))
              window.scrollTo(0, 0)
            }}
          >
            Da
          </button>
          <button type="button" className="dugme dugme-linija" data-prvi-fokus onClick={() => demo.otvoriRestart(false)}>
            Odustani
          </button>
        </div>
      </Dijalog>
    )
  return null
}
