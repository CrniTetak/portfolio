// Zvezdice ocene: ukrasne (UI 5.15), a ocena stoji i kao broj / tekst za čitače ekrana. Ocena je ceo broj 1–5.
import { Star } from 'lucide-react'

export function Zvezdice({ ocena, velicina = 16 }: { ocena: number; velicina?: number }) {
  return (
    <span className="zvezdice" role="img" aria-label={`Ocena ${ocena} od 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={velicina} strokeWidth={1.75} data-prazna={i > ocena ? '1' : undefined} aria-hidden />
      ))}
    </span>
  )
}
