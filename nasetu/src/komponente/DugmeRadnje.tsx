// Dugme jedne radnje iz vođene priče (plan dorade 3, odeljak 4).
//  - VOĐENO: aktivno je samo ako je radnja SLEDEĆA u priči i gledalac je u ulozi koja je izvodi; inače je ugašeno uz razlog
//    („Gotovo", „Dostupno u koraku N", „Čeka se: Vlasnik", „Radi Nasetu tim (simulirano)"). Klik šalje radnju kroz priču (izvedi).
//  - SLOBODNO: radi kao običan klik (onKlik sa ekrana), a priča to sama prepozna kao sledeći korak ili kao odstupanje.
//  - TELEFON + VOĐENO: aktivno glavno dugme se prebacuje (portal) u jedini fiksni sloj pri dnu, uz pločicu koraka.
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { useDock } from '../okvir/DockKontekst'
import { useRadnja, useStanje } from '../stanje/StanjeProvider'
import type { Stanje } from '../stanje/tipovi'
import { klasaDugmeta } from './osnovno'

type Varijanta = Parameters<typeof klasaDugmeta>[0]

interface Props {
  /** id radnje iz prica/koraci.ts */
  id: string
  children?: ReactNode
  varijanta?: Varijanta
  ikona?: LucideIcon
  className?: string
  /** pravilo domena kaže ne (npr. termin zauzet): dugme je ugašeno, a ovde je razlog */
  disabled?: boolean
  zasto?: string | null
  /** SLOBODNI režim: šta se desi na klik (ekran sam sastavlja radnju iz svojih polja). Bez ovoga ide izvedi(id). */
  slobodno?: () => void
  /** u OBA režima, umesto izvedi (npr. prozor za potvrdu); ekran posle sam zove izvedi/salji */
  preKlik?: () => void
  /** posle uspešno izvedene radnje priče (npr. odlazak na ekran rezultata) */
  naIzvedeno?: (novo: Stanje) => void
  /** pokaži razlog ispod ugašenog dugmeta */
  pokaziRazlog?: boolean
  /** glavno dugme ekrana: na telefonu u vođenom režimu prelazi u traku pri dnu */
  primarno?: boolean
  type?: 'button' | 'submit'
}

export function DugmeRadnje({
  id, children, varijanta = 'primarno', ikona: Ikona, className = '', disabled = false, zasto, slobodno, preKlik, naIzvedeno,
  pokaziRazlog = true, primarno = false, type = 'button',
}: Props) {
  const { vodjeno, telefon, izvedi } = useStanje()
  const st = useRadnja(id)
  const dock = useDock()
  const aktivnoPrice = st.aktivno
  const ugaseno = disabled || !aktivnoPrice
  // razlog iz pravila domena (npr. Čeka se odluka prve opcije) ima prednost nad opštim razlogom priče
  const razlog = disabled && zasto ? zasto : !aktivnoPrice ? st.razlog : zasto
  const uDock = telefon && vodjeno && !ugaseno && primarno && !!dock.slot

  useEffect(() => {
    if (!uDock) return
    dock.registruj(1)
    return () => dock.registruj(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uDock])

  const klik = () => {
    if (ugaseno) return
    if (!vodjeno && type === 'submit') return // u slobodnom režimu obrazac sam obrađuje slanje
    if (preKlik) { preKlik(); return }
    if (!vodjeno && slobodno) { slobodno(); return }
    const novo = izvedi(id)
    if (novo) naIzvedeno?.(novo)
  }

  // u traci pri dnu dugme ima mere iz GoalToCart-a (.pr-dockbtn), a ne obično Nasetu dugme
  const klasa = uDock ? 'pr-dockbtn pr-btn-light' : `${klasaDugmeta(varijanta)} ${className}`
  const dugme = (
    <span className={uDock ? 'contents' : 'inline-flex flex-col gap-1'}>
      <button
        type={vodjeno || ugaseno ? 'button' : type} data-radnja={id} data-aktivno={ugaseno ? 'ne' : 'da'}
        aria-disabled={ugaseno ? true : undefined} aria-describedby={ugaseno && razlog && pokaziRazlog ? `razlog-${id}` : undefined}
        onClick={klik} className={klasa}
      >
        {Ikona && !uDock && <Ikona size={18} aria-hidden />}
        {children ?? st.radnja?.tekst ?? id}
      </button>
      {pokaziRazlog && ugaseno && razlog && !uDock && <span className="text-sm text-sek" id={`razlog-${id}`} role="note">{razlog}</span>}
    </span>
  )
  return uDock && dock.slot ? createPortal(dugme, dock.slot) : dugme
}
