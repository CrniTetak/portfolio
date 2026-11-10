// Navigacija po ulozi: u zaglavlju (računar i tablet; horizontalno na vrhu), donja (telefon, slobodni
// režim, ikonica iznad naziva) i meni „≡" (telefon, vođeni režim).
import { Building2, FileText, Heart, Layers, LayoutDashboard, House, MoreHorizontal, Plus, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { NAZIV_ULOGE } from '../podaci/akteri'
import { izborTrenutni } from '../stanje/izvedeno'
import { useStanje } from '../stanje/StanjeProvider'
import type { Uloga } from '../stanje/tipovi'
import { useFocusTrap } from './useFocusTrap'

export interface StavkaNav { do: string; naziv: string; ikona: LucideIcon; tacno?: boolean }

export const NAVIGACIJA: Record<Uloga, StavkaNav[]> = {
  produkcija: [
    { do: '/pocetna', naziv: 'Početna', ikona: House, tacno: true }, { do: '/lokacije', naziv: 'Lokacije', ikona: Building2 },
    { do: '/produkcija', naziv: 'Moja tabla', ikona: LayoutDashboard, tacno: true }, { do: '/primeri', naziv: 'Primeri', ikona: FileText },
  ],
  vlasnik: [
    { do: '/vlasnik', naziv: 'Moja tabla', ikona: LayoutDashboard, tacno: true }, { do: '/vlasnik/nova-lokacija', naziv: 'Dodaj lokaciju', ikona: Plus },
    { do: '/lokacije', naziv: 'Katalog', ikona: Building2 },
  ],
  partner: [{ do: '/partner', naziv: 'Moji izbori', ikona: Layers, tacno: true }, { do: '/lokacije', naziv: 'Lokacije', ikona: Building2 }],
  admin: [
    { do: '/admin', naziv: 'Pregled', ikona: LayoutDashboard, tacno: true }, { do: '/lokacije', naziv: 'Lokacije', ikona: Building2 },
    { do: '/primeri', naziv: 'Primeri', ikona: FileText },
  ],
}

/** Stavka „Izbor (N)" (kao korpa): vidljiva Produkciji i Partneru kad izbor ima lokacija. Vraća stavku ili null. */
export function useStavkaIzbora(): (StavkaNav & { broj: number }) | null {
  const { stanje } = useStanje()
  const izbor = izborTrenutni(stanje)
  const n = izbor?.lokacijaIds.length ?? 0
  if (!izbor || n === 0 || (stanje.uloga !== 'produkcija' && stanje.uloga !== 'partner')) return null
  return { do: `/izbor/${izbor.id}/deljenje`, naziv: 'Izbor', ikona: Heart, broj: n }
}

/** Značka „Izbor (N)": broj se na trenutak istakne ambra bojom kad poraste (bez pokreta, pa važi i za smanjeno kretanje). */
export function IzborStavka({ klasa = '' }: { klasa?: string }) {
  const stavka = useStavkaIzbora()
  const n = stavka?.broj ?? 0
  const prethodno = useRef(n)
  const [istaknuto, setIstaknuto] = useState(false)
  useEffect(() => {
    const poraslo = n > prethodno.current
    prethodno.current = n
    if (!poraslo) return
    setIstaknuto(true)
    const t = setTimeout(() => setIstaknuto(false), 1800)
    return () => clearTimeout(t)
  }, [n])
  if (!stavka) return null
  return (
    <>
      <NavLink
        to={stavka.do} aria-label={`Izbor (${n})`}
        className={({ isActive }) => `flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[15px] font-semibold ${klasa} ${isActive ? 'border-mastilo text-mastilo' : 'border-linija-j text-mastilo hover:bg-traka'}`}
      >
        <Heart size={18} aria-hidden />
        <span className="max-sm:hidden">Izbor</span>
        <span className={`min-w-5 rounded-full px-1.5 text-center text-[13px] font-bold text-white transition-colors ${istaknuto ? 'bg-prototip-ivica' : 'bg-akcent'}`}>{n}</span>
      </NavLink>
      <span className="sr-only" role="status" aria-live="polite">U izboru: {n}</span>
    </>
  )
}

/** Donja navigacija (telefon, slobodni režim): ikonica iznad naziva; do 4 stavke, a ako ih je više, poslednja je „Više". */
export function DonjaNavigacija() {
  const { stanje, setMeni, meni } = useStanje()
  const izbor = useStavkaIzbora()
  const stavke: StavkaNav[] = [...NAVIGACIJA[stanje.uloga], ...(izbor ? [{ do: izbor.do, naziv: `Izbor (${izbor.broj})`, ikona: izbor.ikona }] : [])]
  const vise = stavke.length > 4
  const glavne = vise ? stavke.slice(0, 3) : stavke
  return (
    <nav className="pr-bottomnav" aria-label="Glavna navigacija" style={{ gridTemplateColumns: `repeat(${glavne.length + (vise ? 1 : 0)}, 1fr)` }}>
      {glavne.map((s) => (
        <NavLink key={s.do} to={s.do} end={s.tacno}><s.ikona size={20} aria-hidden />{s.naziv}</NavLink>
      ))}
      {vise && (
        <button type="button" onClick={() => setMeni(!meni)} aria-expanded={meni} aria-haspopup="dialog">
          <MoreHorizontal size={20} aria-hidden />Više
        </button>
      )}
    </nav>
  )
}

/** Meni preko ekrana (telefon): cela navigacija uloge + početni ekran. */
export function Meni() {
  const { stanje, meni, setMeni } = useStanje()
  const izbor = useStavkaIzbora()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, meni, () => setMeni(false))
  if (!meni) return null
  const stavke = [...NAVIGACIJA[stanje.uloga], ...(izbor ? [{ do: izbor.do, naziv: `Izbor (${izbor.broj})`, ikona: izbor.ikona }] : []), { do: '/pravno', naziv: 'Pravne strane (nacrt)', ikona: FileText }]
  const klasa = 'flex min-h-11 items-center gap-3 rounded-dugme px-3 text-base text-mastilo hover:bg-traka'
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Meni" data-meni="da">
      <div className="absolute inset-0 bg-mastilo/60" onClick={() => setMeni(false)} aria-hidden />
      <div ref={ref} tabIndex={-1} className="absolute inset-x-0 top-0 max-h-[85dvh] overflow-y-auto rounded-b-kartica bg-white p-4 shadow-plutajuce">
        <div className="mb-2 flex items-center justify-between">
          <b className="text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">{NAZIV_ULOGE[stanje.uloga]}</b>
          <button type="button" data-prvi-fokus aria-label="Zatvori meni" onClick={() => setMeni(false)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-traka"><X size={20} /></button>
        </div>
        <nav aria-label="Meni navigacija" className="flex flex-col">
          {stavke.map((s) => (
            <NavLink key={s.do} to={s.do} end={'tacno' in s ? s.tacno : false} onClick={() => setMeni(false)}
              className={({ isActive }) => `${klasa} ${isActive ? 'font-semibold text-akcent' : ''}`}><s.ikona size={18} aria-hidden />{s.naziv}</NavLink>
          ))}
          <Link to="/" onClick={() => setMeni(false)} className={`${klasa} border-t border-linija text-sek`}>Početni ekran (izbor uloge i načina)</Link>
        </nav>
      </div>
    </div>
  )
}
