// V4 — Zahtev za izviđanje (vlasnik): potvrda ili odbijanje.
import { Check, X } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { Dugme, Kartica, Naslov, Oznaka, Stranica } from '../../komponente/osnovno'
import { formatVreme } from '../../logika/vreme'
import { nazivAktera } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { akterTrenutni } from '../../stanje/izvedeno'
import { PrebaciPrikaz } from './PrebaciPrikaz'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Izvidjanje() {
  const { id = '' } = useParams()
  const { stanje, salji } = useStanje()
  const i = stanje.izvidjanja.find((x) => x.id === id)
  const l = nadjiLokaciju(i?.lokacijaId ?? '')
  if (!i || !l) return <Navigate to="/vlasnik" replace />
  if (l.vlasnikId !== akterTrenutni(stanje)) return <PrebaciPrikaz vlasnikId={l.vlasnikId} />

  return (
    <Stranica uzak>
      <Naslov>Zahtev za izviđanje — {l.naziv}</Naslov>
      <Kartica className="mb-6 p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-sek">Produkcija</dt><dd className="font-medium">{nazivAktera(i.produkcijaId)}</dd>
          <dt className="text-sek">Termin</dt><dd className="font-medium">{formatVreme(i.kada)}</dd>
          <dt className="text-sek">Osoba</dt><dd className="font-medium">{i.osoba}</dd>
          <dt className="text-sek">Broj ljudi</dt><dd className="font-medium">{i.brojLjudi}</dd>
        </dl>
        <p className="mt-3 text-sm text-sek">Adresu dan ranije dobija samo imenovana osoba; vaš kontakt ostaje skriven.</p>
      </Kartica>
      {i.stanje === 'ceka' ? (
        <div className="flex flex-wrap gap-3">
          <Dugme vanPrice ikona={Check} onClick={() => salji({ tip: 'POTVRDI_IZVIDJANJE', id: i.id })}>Potvrdi izviđanje</Dugme>
          <Dugme vanPrice varijanta="opasno" ikona={X} onClick={() => salji({ tip: 'ODBIJ_IZVIDJANJE', id: i.id })}>Odbij</Dugme>
        </div>
      ) : i.stanje === 'potvrdjeno' ? <Oznaka vrsta="aktivna" velika>Potvrđeno</Oznaka> : <Oznaka vrsta="odbijeno" velika>Odbijeno</Oznaka>}
      <p className="mt-6"><Link to="/vlasnik" className="font-semibold text-akcent hover:underline">← Nazad na tablu</Link></p>
    </Stranica>
  )
}
