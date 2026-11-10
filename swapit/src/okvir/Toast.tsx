// Diskretna poruka „Simulirana radnja — ništa nije poslato ni naplaćeno“ (UI 5.11): bela kartica sa levom linijom u boji stanja.
// Čita se i čitačem ekrana (aria-live); traje ~7 s i pauzira se dok su miš ili fokus iznad nje.
import { Info, X } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'

export function Toast() {
  const { toast, pauzirajToast, zatvoriToast } = useDemo()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center px-4 pb-44 md:pb-52" aria-live="polite" role="status" data-toast-regija>
      {toast && (
        <div key={toast.kljuc} className="toast pointer-events-auto" data-toast onMouseEnter={() => pauzirajToast(true)} onMouseLeave={() => pauzirajToast(false)} onFocus={() => pauzirajToast(true)} onBlur={() => pauzirajToast(false)}>
          <Info size={18} strokeWidth={1.75} className="shrink-0 text-blue" aria-hidden="true" />
          <span>{toast.tekst}</span>
          <button type="button" className="toast-zatvori" aria-label="Zatvori poruku" onClick={zatvoriToast}>
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
