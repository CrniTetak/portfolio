// KPI kartica table firme i moderacije (UI 5.12): mala oznaka, veliki broj, opis. Boja nikad nije jedini nosilac značenja.
import type { ReactNode } from 'react'

export function Kpi({ oznaka, vrednost, opis, id }: { oznaka: string; vrednost: ReactNode; opis?: ReactNode; id?: string }) {
  return (
    <div className="kpi" data-kpi={id}>
      <span className="kpi-oznaka">{oznaka}</span>
      <span className="kpi-broj" data-kpi-broj>
        {vrednost}
      </span>
      {opis && <span className="kpi-opis">{opis}</span>}
    </div>
  )
}

export function KpiMreza({ oznaka, tri = false, children }: { oznaka: string; tri?: boolean; children: ReactNode }) {
  return (
    <section className={`kpi-mreza${tri ? ' kpi-mreza-3' : ''}`} aria-label={oznaka}>
      {children}
    </section>
  )
}
