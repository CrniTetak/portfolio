// Diskretna poruka "Simulated action — nothing was sent or charged" (UI 7.13): tamna pilula sa zlatnom linijom; čita se i čitačem ekrana (aria-live).
import { Info } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'

export function Toast() {
  const { toast, pauzirajToast } = useDemo()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center px-4 pb-44 md:pb-52" aria-live="polite" role="status" data-toast-regija>
      {toast && (
        <div key={toast.kljuc} className="pointer-events-auto flex max-w-md items-center gap-2 rounded-pill border border-gold-600 bg-bg-1 px-4 py-2.5 text-[14px] shadow-xl" data-toast onMouseEnter={() => pauzirajToast(true)} onMouseLeave={() => pauzirajToast(false)} onFocus={() => pauzirajToast(true)} onBlur={() => pauzirajToast(false)}>
          <Info size={16} strokeWidth={1.75} className="shrink-0 text-gold-500" aria-hidden="true" />
          {toast.tekst}
        </div>
      )}
    </div>
  )
}
