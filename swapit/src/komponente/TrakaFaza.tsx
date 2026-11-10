// Traka faza razmene (UI 5.15): urađeno = kvačica, tekuće = prsten, buduće = prazno. Uvek tekst uz tačku (boja nije jedini nosilac).
import { Check } from 'lucide-react'

export function TrakaFaza({ faze, tekuca }: { faze: string[]; tekuca: number }) {
  return (
    <ol className="traka-faza" aria-label="Faze razmene" data-traka-faza>
      {faze.map((f, i) => {
        const stanje = i < tekuca ? 'gotovo' : i === tekuca ? 'tekuce' : 'buduce'
        return (
          <li key={f} data-stanje={stanje} aria-current={stanje === 'tekuce' ? 'step' : undefined}>
            <span className="tacka" aria-hidden>
              {stanje === 'gotovo' && <Check size={14} strokeWidth={3} />}
            </span>
            {f}
            <span className="sr-only">{stanje === 'gotovo' ? ' — urađeno' : stanje === 'tekuce' ? ' — trenutno' : ' — još nije'}</span>
          </li>
        )
      })}
    </ol>
  )
}
