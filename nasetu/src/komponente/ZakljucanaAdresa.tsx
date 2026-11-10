// "Zaključana adresa" (UI 4.9). Prikazuje isključivo ono što je vratila logika/adresa.ts:
// zaključano stanje NIKAD ne sadrži pravi tekst adrese (samo zamućene tačkice).
import { FileText, Lock, LockOpen, Phone } from 'lucide-react'
import { Link } from 'react-router'
import type { PrikazAdrese } from '../logika/adresa'
import { TEKST_ZASTITNI_PERIOD } from '../logika/dokumenti'
import { Oznaka } from './osnovno'

interface Props {
  prikaz: PrikazAdrese
  /** animacija otključavanja (kratka; gasi se kod "smanjeno kretanje") */
  animiraj?: boolean
  /** link ka dokumentima (samo kad je otvoreno sa kontaktom) */
  dokumenti?: boolean
  /** napomena o zaštitnom periodu (B3): samo produkciji kad je adresa otvorena */
  zastitniPeriod?: boolean
}

export function ZakljucanaAdresa({ prikaz, animiraj = false, dokumenti = false, zastitniPeriod = false }: Props) {
  const otvoreno = prikaz.nivo !== 'zona'
  if (!otvoreno) {
    return (
      <div className="rounded-kartica border border-akcent bg-akcent-s p-5">
        <div className="flex items-start gap-3">
          <Lock size={22} className="mt-0.5 shrink-0 text-akcent" aria-hidden />
          <div>
            <p className="font-semibold">{prikaz.zona}</p>
            <p className="select-none blur-[5px]" aria-hidden>Ulica ••••••• ••, ••. sprat</p>
            <span className="sr-only">Tačna adresa je skrivena.</span>
          </div>
        </div>
        <p className="mt-2 text-sm font-semibold text-mastilo">{prikaz.razlog}</p>
      </div>
    )
  }
  return (
    <div role="status" className={`rounded-kartica border border-uspeh bg-[#F0FDF4] p-5 ${animiraj ? "anim-sjaj" : ""}`}>
      <div className="flex items-start gap-3">
        <LockOpen size={22} className={`mt-0.5 shrink-0 text-uspeh ${animiraj ? 'anim-otkljucaj' : ''}`} aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">{prikaz.zona}</p>
          <p className="text-lg font-semibold">{prikaz.adresa} <span className="text-sm font-normal text-sek">(izmišljeno)</span></p>
          {prikaz.kontaktOsoba && (
            <div className="mt-1 text-sm">
              <p>Kontakt: <b>{prikaz.kontaktOsoba}</b></p>
              <p className="flex items-center gap-1.5"><Phone size={14} aria-hidden /> <span className="cifre">{prikaz.telefon}</span></p>
            </div>
          )}
          {prikaz.pristup && <p className="mt-1 text-sm text-sek">Pristup: {prikaz.pristup}</p>}
        </div>
      </div>
      {zastitniPeriod && <p className="mt-3 text-sm text-sek">{TEKST_ZASTITNI_PERIOD}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Oznaka vrsta="placeno">{prikaz.nivo === 'sve' ? 'Adresa i kontakt otvoreni' : 'Adresa otvorena (samo imenovanoj osobi)'}</Oznaka>
        {dokumenti && <Link to="/primeri" className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-akcent hover:underline"><FileText size={16} aria-hidden /> Dokumenti (primeri)</Link>}
      </div>
    </div>
  )
}
