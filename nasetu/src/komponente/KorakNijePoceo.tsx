// Prazno stanje za ekran čiji objekat (izbor, zahtev, predračun…) u vođenoj priči još ne postoji (plan dorade 3, D18).
// U slobodnom režimu isti slučaj vodi na polaznu stranu, kao i do sada.
import { Hourglass } from 'lucide-react'
import { Navigate } from 'react-router'
import { useStanje } from '../stanje/StanjeProvider'
import { Dugme, PraznoStanje, Stranica } from './osnovno'

export function KorakNijePoceo({ korak }: { korak: number }) {
  const { prikaziMi } = useStanje()
  return (
    <Stranica uzak>
      <PraznoStanje ikona={Hourglass} naslov="Još nije počelo" tekst={`Ovo nastaje u koraku ${korak} priče. Dok priča ne stigne dotle, ovde još nema ničega.`}>
        <Dugme onClick={prikaziMi}>Prikaži mi ekran ovog koraka</Dugme>
      </PraznoStanje>
    </Stranica>
  )
}

/** Objekat sa ovim ID-jem ne postoji: u vođenom režimu poruka „Još nije počelo", u slobodnom preusmerenje. */
export function NedostajeObjekat({ korak, ka }: { korak: number; ka: string }) {
  const { vodjeno } = useStanje()
  return vodjeno ? <KorakNijePoceo korak={korak} /> : <Navigate to={ka} replace />
}
