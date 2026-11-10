// Oznake stanja rezervacije i opcije (ikonica + tekst) — jedno mesto da svi ekrani govore isto.
import type { FazaRezervacije } from '../logika/rezervacije'
import type { PrikazStanjaOpcije } from '../logika/opcije'
import { Oznaka } from './osnovno'

export function OznakaFaze({ faza, velika = false }: { faza: FazaRezervacije; velika?: boolean }) {
  switch (faza) {
    case 'ceka-vlasnika': return <Oznaka vrsta="ceka-vlasnika" velika={velika}>Čeka vlasnika</Oznaka>
    case 'istekao': return <Oznaka vrsta="istekla" velika={velika}>Zahtev je istekao</Oznaka>
    case 'odbijen': return <Oznaka vrsta="odbijeno" velika={velika}>Odbijeno</Oznaka>
    case 'ceka-uplatu': return <Oznaka vrsta="ceka-uplatu" velika={velika}>Odobreno — čeka naknadu</Oznaka>
    case 'placeno': return <Oznaka vrsta="placeno" velika={velika}>Naknada plaćena — adresa otvorena</Oznaka>
    case 'otkazao-vlasnik': return <Oznaka vrsta="odbijeno" velika={velika}>Otkazao vlasnik</Oznaka>
  }
}

export function OznakaOpcije({ stanje, pozicija }: { stanje: PrikazStanjaOpcije; pozicija: number | null }) {
  const mesto = pozicija === 1 ? 'Prva' : pozicija === 2 ? 'Druga' : pozicija ? `${pozicija}.` : ''
  switch (stanje) {
    case 'aktivna': return <Oznaka vrsta="aktivna">{mesto} opcija</Oznaka>
    case 'osporena': return <Oznaka vrsta="osporena">{mesto} opcija osporena</Oznaka>
    case 'istekla': return <Oznaka vrsta="istekla">Istekla</Oznaka>
    case 'otpustena': return <Oznaka vrsta="istekla">Otpuštena</Oznaka>
    case 'pretvorena': return <Oznaka vrsta="ceka-vlasnika">Pretvorena u zahtev</Oznaka>
  }
}
