// Kartica (UI 7.4), pločica KPI (7.7), prazno stanje (7.14), oznaka stanja (7.9), traka tačaka (7.11), traka partnera 18+ (7.10), red organizatora, iznos, inicijali.
import type { ReactNode } from 'react'
import { Check, Clock, Info, Lock, TriangleAlert } from 'lucide-react'
import { ORGANIZATOR_PUTOVANJA } from '../scenario/strane'

export function Kartica({ naslov, children, tiha = false, className = '' }: { naslov?: string; children: ReactNode; tiha?: boolean; className?: string }) {
  return (
    <section className={`card${tiha ? ' card-quiet' : ''} ${className}`}>
      {naslov && <h2 className="naslov-kartice">{naslov}</h2>}
      {children}
    </section>
  )
}

export function KpiPlocica({ oznaka, vrednost, opis, traka }: { oznaka: string; vrednost: ReactNode; opis?: ReactNode; traka?: number }) {
  return (
    <div className="card flex flex-col gap-1" data-kpi={oznaka}>
      <span className="polje-oznaka">{oznaka}</span>
      <span className="num font-display text-[28px] leading-9 font-semibold whitespace-nowrap text-gold-400 sm:text-[32px] sm:leading-10 lg:text-[28px] lg:leading-9 xl:text-[36px] xl:leading-11">{vrednost}</span>
      {opis && <span className="text-[13px] leading-[18px] text-ink-2">{opis}</span>}
      {traka !== undefined && (
        <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-bg-3" aria-hidden="true">
          <span className={`block h-full bg-gold-500 traka-${Math.min(100, Math.max(0, Math.round(traka / 5) * 5))}`} />
        </span>
      )}
    </div>
  )
}

export function PraznoStanje({ naslov = 'Not started yet', children }: { naslov?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-gold-800 p-6 text-center" data-prazno>
      <Clock size={22} strokeWidth={1.75} className="text-gold-500" aria-hidden="true" />
      <p className="font-display text-[22px] leading-7 font-semibold">{naslov}</p>
      <p className="max-w-xl text-ink-2">{children}</p>
    </div>
  )
}

type Vrsta = 'ok' | 'warn' | 'err' | 'info' | 'neu'
const IKONE = { ok: Check, warn: Clock, err: TriangleAlert, info: Info, neu: Lock }
const KLASE: Record<Vrsta, string> = { ok: 'stanje stanje-ok', warn: 'stanje stanje-warn', err: 'stanje stanje-err', info: 'stanje stanje-info', neu: 'stanje stanje-neu' }
/** Oznaka stanja: UVEK ikona + reč (boja nikad nije jedini nosilac značenja). */
export function OznakaStanja({ vrsta, children }: { vrsta: Vrsta; children: ReactNode }) {
  const Ikona = IKONE[vrsta]
  return (
    <span className={KLASE[vrsta]}>
      <Ikona size={14} strokeWidth={1.75} aria-hidden="true" />
      {children}
    </span>
  )
}

/** Traka tačaka (G7 ima 6, priča 9, ponuda 3). `tekuca` je 0-bazirana, prošle su označene. */
export function TrakaTacaka({ nazivi, tekuca, className = '' }: { nazivi: string[]; tekuca: number; className?: string }) {
  return (
    <ol className={`flex items-start justify-between gap-1 ${className}`} aria-label="Progress">
      {nazivi.map((n, i) => {
        const gotovo = i < tekuca
        const tekuce = i === tekuca
        return (
          <li key={n} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center" aria-current={tekuce ? 'step' : undefined}>
            <span
              className={`grid h-6.5 w-6.5 place-items-center rounded-full border text-[12px] font-semibold ${
                gotovo ? 'border-gold-500 bg-gold-500 text-on-gold' : tekuce ? 'border-gold-400 bg-bg-0 text-gold-300 ring-4 ring-gold-400/20' : 'border-gold-800 text-ink-3'
              }`}
            >
              {gotovo ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`text-[12.5px] leading-4 ${tekuce ? 'font-semibold text-gold-300' : gotovo ? 'text-ink-2' : 'text-ink-3'}`}>{n}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Traka partnera sa 18+ (UI 7.10): na SVAKOM ekranu sa kazino sadržajem. */
export function TrakaPartnera18({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-btn border-l-[3px] border-gold-500 bg-gold-500/6 p-3" data-partner18>
      <span className="zeton18 h-[26px]! w-[26px]! text-[12px]!" aria-hidden="true">
        18+
      </span>
      <p className="text-[13.5px] leading-5 text-ink-2">{children ?? 'Offered by the partner casino under its own licence and terms. 18+.'}</p>
    </div>
  )
}

/** Red organizatora putovanja na ekranima sa cenom (UX 0). */
export function RedOrganizatora() {
  return (
    <p className="text-[13px] leading-[18px] text-ink-3" data-organizator>
      Organizer: {ORGANIZATOR_PUTOVANJA} · Not an offer
    </p>
  )
}

/** Iznos je uvek već formatiran kroz scenario/format.ts; ova komponenta samo dodaje tabularne cifre. */
export function Iznos({ children, naslovni = false }: { children: ReactNode; naslovni?: boolean }) {
  return <span className={`num ${naslovni ? 'text-gold-400' : ''}`}>{children}</span>
}

/** Krug sa inicijalima u zlatu (umesto portreta bez proverljive licence, odluka A3.3). */
export function Inicijali({ tekst, velicina = 56 }: { tekst: string; velicina?: number }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-gold-600 bg-bg-2 font-display font-semibold text-gold-400 ${velicina >= 56 ? 'h-14 w-14 text-[22px]' : 'h-9 w-9 text-[14px]'}`}
      aria-hidden="true"
    >
      {tekst}
    </span>
  )
}
