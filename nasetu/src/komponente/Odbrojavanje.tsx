// Odbrojavanje roka (UI 4.10): tekst je glavni, traka je samo dopuna.
import { Clock } from 'lucide-react'
import { istekao, preostaloSati } from '../logika/vreme'

interface Props {
  /** trenutak isteka (simulirani sati) */
  rok: number
  sada: number
  /** ukupno trajanje roka u satima (za traku) */
  ukupno: number
  /** npr. "Važi još", "Odgovorite u roku", "Link ističe za" */
  prefiks?: string
  istekloTekst?: string
}

export function Odbrojavanje({ rok, sada, ukupno, prefiks = 'Važi još', istekloTekst = 'Istekao' }: Props) {
  if (istekao(rok, sada)) {
    return <p className="flex items-center gap-1.5 text-sek"><Clock size={16} aria-hidden /> <b>{istekloTekst}</b></p>
  }
  const ostalo = preostaloSati(rok, sada)
  const udeo = Math.max(0, Math.min(1, ostalo / ukupno))
  // poslednjih 25% ambra, ispod 10% crveno
  const boja = udeo < 0.1 ? 'bg-opasno' : udeo <= 0.25 ? 'bg-prototip-ivica' : 'bg-akcent'
  return (
    <div className="cifre">
      <p className="flex flex-wrap items-center gap-x-1.5"><Clock size={16} aria-hidden /> {prefiks} <b className="whitespace-nowrap text-xl">{ostalo} h</b> <span className="text-sm text-prig">(simulirano vreme)</span></p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-linija" aria-hidden>
        <div className={`h-full ${boja}`} style={{ width: `${udeo * 100}%` }} />
      </div>
    </div>
  )
}
