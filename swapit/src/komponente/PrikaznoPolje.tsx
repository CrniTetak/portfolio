// Izgleda kao polje (UI 5.9), a tekst je unapred popunjen: ništa se ne kuca, pa ni pravi podatak ne može da se upiše (PLAN B7).
// Namerno NEMA <input>, name ni autocomplete (brava u pravila/brave.ts). Za čitač ekrana: grupa sa oznakom i napomenom „Popunjeno za demo“.
// N6: napomena „Popunjeno za demo“ stoji JEDNOM po ekranu (na prvom polju, `napomena`), i to IZNAD polja.
import { useId } from 'react'

export function PrikaznoPolje({ oznaka, vrednost, lozinka = false, napomena = false }: { oznaka: string; vrednost: string; lozinka?: boolean; napomena?: boolean }) {
  const id = useId()
  return (
    <div className="grupa-polja" role="group" aria-labelledby={id} aria-describedby={napomena ? id + '-n' : undefined}>
      {napomena && (
        <span className="polje-pomoc" id={id + '-n'} data-popunjeno-demo>
          Ništa se ne kuca; polja su popunjena za demo
        </span>
      )}
      <span className="polje-oznaka" id={id}>
        {oznaka}
      </span>
      <div className={`polje-prikaz${lozinka ? ' polje-lozinka' : ''}`} data-prikazno-polje>
        {lozinka ? (
          <>
            <span aria-hidden="true">••••••••••</span>
            <span className="sr-only">Skriveno za demo</span>
          </>
        ) : (
          vrednost
        )}
      </div>
    </div>
  )
}
