// Izgleda kao polje (UI 7.3), a tekst je (odluka A3.2): ništa se ne kuca, pa ni pravi podatak ne može da se upiše.
// Namerno NEMA ulaznog elementa, name ni autocomplete (brave u pravila/brave.ts). Za čitač ekrana: grupa sa oznakom; napomena "Pre-filled for the demo" je vezana kroz aria-describedby.
import { createContext, useContext, useId } from 'react'

/** Id napomene "Pre-filled for the demo" koju ekran (Strana) prikazuje jednom, uz formu; polja je pominju kroz aria-describedby. */
export const NapomenaPopunjeno = createContext<string | null>(null)

export function PrikaznoPolje({ oznaka, vrednost, napomena = false }: { oznaka: string; vrednost: string; napomena?: boolean }) {
  const id = useId()
  const stranicna = useContext(NapomenaPopunjeno)
  const opis = napomena ? id + '-n' : stranicna
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-labelledby={id} aria-describedby={opis ?? undefined}>
      <span className="polje-oznaka" id={id}>
        {oznaka}
      </span>
      <div className="polje">{vrednost}</div>
      {napomena && (
        <span className="polje-pomoc" id={id + '-n'}>
          Pre-filled for the demo
        </span>
      )}
    </div>
  )
}
