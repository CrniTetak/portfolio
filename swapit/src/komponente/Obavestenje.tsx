// Obaveštenje u stranici (UI 5.11): info, uspeh, upozorenje, greška; leva linija u boji stanja, uvek ikona + tekst.
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

type Stanje = 'info' | 'uspeh' | 'upozorenje' | 'greska'
const KLASA: Record<Stanje, string> = { info: '', uspeh: ' obavestenje-uspeh', upozorenje: ' obavestenje-upozorenje', greska: ' obavestenje-greska' }

export function Obavestenje({ stanje = 'info', children, uloga, id }: { stanje?: Stanje; children: ReactNode; uloga?: 'status' | 'alert'; id?: string }) {
  const ikona = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const
  return (
    <div id={id} className={`obavestenje${KLASA[stanje]}`} role={uloga} data-obavestenje={stanje}>
      {stanje === 'uspeh' ? <CircleCheck {...ikona} /> : stanje === 'upozorenje' ? <TriangleAlert {...ikona} /> : stanje === 'greska' ? <CircleAlert {...ikona} /> : <Info {...ikona} />}
      <div>{children}</div>
    </div>
  )
}
