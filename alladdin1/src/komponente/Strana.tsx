// Omotač svakog ekrana: širina, naslov, oznake data-ekran / data-stanje (za probe u pregledaču).
import type { ReactNode } from 'react'
import { TriangleAlert, Undo2 } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { useEkran } from '../okvir/kontekst'
import { usePrica } from '../okvir/prica'
import { RUTA_PO_ID } from '../pravila/rute'
import { NapomenaPopunjeno } from './PrikaznoPolje'

/** Ekrani grupe i putnika/savetnika koji prate grupu: u ishodu B i C (od koraka 7) na njima stoji traka sa vezom nazad na glavni put (UX 3.4). */
const EKRANI_GRUPE = ['G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'T3', 'T4', 'T6', 'T9', 'V1', 'V2', 'V3', 'V4']

function TrakaGrane() {
  const { id } = useEkran()
  const demo = useDemo()
  const p = usePrica()
  if (!EKRANI_GRUPE.includes(id) || demo.poz.korak < 7 || demo.poz.ishod === 'A') return null
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-btn border border-gold-800 bg-bg-1 px-4 py-2" role="status" data-traka-grane>
      <span className="flex items-center gap-2 text-warn">
        <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
        {demo.poz.ishod === 'B' ? 'What-if: smaller block' : 'What-if: cancelled'}
      </span>
      <button type="button" className="btn-link-mini inline-flex items-center gap-1" onClick={p.glavnaPrica}>
        <Undo2 size={14} aria-hidden="true" />
        Switch to main path (group filled)
      </button>
    </div>
  )
}

export function Strana({ naslov, podnaslov, stanje = '', children, akcije, popunjeno = false }: { naslov?: string; podnaslov?: ReactNode; stanje?: string; children: ReactNode; akcije?: ReactNode; popunjeno?: boolean }) {
  const { id } = useEkran()
  return (
    <NapomenaPopunjeno.Provider value={popunjeno ? 'napomena-popunjeno' : null}>
    <div className="wrap flex flex-col gap-6 py-6 md:py-10" data-ekran={id} data-stanje={stanje}>
      {(naslov || akcije) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            {naslov && <h1 className="naslov-ekrana">{naslov}</h1>}
            {podnaslov && <p className="text-ink-2">{podnaslov}</p>}
          </div>
          {akcije}
        </div>
      )}
      <TrakaGrane />
      {popunjeno && (
        <p className="polje-pomoc" id="napomena-popunjeno">
          Pre-filled for the demo
        </p>
      )}
      {children}
    </div>
    </NapomenaPopunjeno.Provider>
  )
}

/** Naslov ekrana iz registra (za ekrane koji ga ne zadaju sami). */
export const naslovEkrana = (id: string) => RUTA_PO_ID[id]?.naslov ?? id

/** Dvokolonski raspored 1,35 : 1 na računaru; na telefonu jedna kolona (leva prva). */
export function Dve({ levo, desno }: { levo: ReactNode; desno: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">{levo}</div>
      <div className="flex min-w-0 flex-col gap-6">{desno}</div>
    </div>
  )
}

export function Potvrda({ naslov, children, ikona }: { naslov: string; children?: ReactNode; ikona?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {ikona}
      <h1 className="naslov-ekrana">{naslov}</h1>
      {children}
    </div>
  )
}
